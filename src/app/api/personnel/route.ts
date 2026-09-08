import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";

function normalizeDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizePersonnelRecord(record: any) {
  return {
    id: record.id,
    militaryId: record.militaryId,
    citizenId: record.citizenId,
    rank: record.rank,
    rankAbbr: record.rankAbbr,
    firstName: record.firstName,
    lastName: record.lastName,
    dateOfBirth: normalizeDate(record.dateOfBirth),
    age: Number(record.age ?? 0),
    maritalStatus: record.maritalStatus ?? "",
    religion: record.religion ?? "",
    educationLevel: record.educationLevel ?? "",
    phone: record.phone ?? "",
    profilePhotoUrl: record.profilePhotoUrl ?? "",
    militaryBranch: record.militaryBranch,
    abbreviatedPosition: record.abbreviatedPosition,
    normalUnit: record.normalUnit,
    fieldPosition: record.fieldPosition ?? "",
    fieldUnit: record.fieldUnit ?? "",
    fieldDutyOrderNo: record.fieldDutyOrderNo ?? "",
    fieldDutyOrderDate: normalizeDate(record.fieldDutyOrderDate),
    fieldDutyOrderIssuer: record.fieldDutyOrderIssuer ?? "",
    missionCategory: record.missionCategory ?? "",
    salary: Number(record.salary ?? 0),
    salaryLevel: record.salaryLevel,
    salaryStep: Number(record.salaryStep ?? 0),
    compensation: record.compensation ?? "",
    compensationLevel: record.compensationLevel ?? "",
    compensationAmount: Number(record.compensationAmount ?? 0),
    additionalPay: Number(record.additionalPay ?? 0),
    appointmentDate: normalizeDate(record.appointmentDate),
    incidentDate: normalizeDate(record.incidentDate),
    multiplierDate: normalizeDate(record.multiplierDate),
    serviceYearsNormal: Number(record.serviceYearsNormal ?? 0),
    serviceMonthsNormal: Number(record.serviceMonthsNormal ?? 0),
    serviceDaysNormal: Number(record.serviceDaysNormal ?? 0),
    serviceYearsMultiplier: Number(record.serviceYearsMultiplier ?? 0),
    serviceMonthsMultiplier: Number(record.serviceMonthsMultiplier ?? 0),
    serviceDaysMultiplier: Number(record.serviceDaysMultiplier ?? 0),
    totalServiceYears: Number(record.totalServiceYears ?? 0),
    totalServiceMonths: Number(record.totalServiceMonths ?? 0),
    totalServiceDays: Number(record.totalServiceDays ?? 0),
    missionType: record.missionType,
    actionType: record.actionType,
    incidentType: record.incidentType,
    incidentLocation: record.incidentLocation ?? "",
    lossType: record.lossType,
    hospitalAdmissionDate: normalizeDate(record.hospitalAdmissionDate),
    hospitalDischargeDate: normalizeDate(record.hospitalDischargeDate),
    specialPensionType: record.specialPensionType ?? "NORMAL_TIME",
    specialPensionTier: Number(record.specialPensionTier ?? 7),
    rankAppointmentTo: record.rankAppointmentTo ?? "",
    salaryLevelAdjustment: record.salaryLevelAdjustment ?? "",
    promotedRank: record.promotedRank ?? undefined,
    promotedRankAbbr: record.promotedRankAbbr ?? "",
    promotionSteps: Number(record.promotionSteps ?? record.specialPensionTier ?? 7),
    promotedSalary: Number(record.promotedSalary ?? 0),
    spouse: record.spouse
      ? {
          nationalId: record.spouse.nationalId,
          fullName: `${record.spouse.title || ""} ${record.spouse.firstName} ${record.spouse.lastName}`.trim(),
          isLegallyMarried: record.spouse.isLegallyMarried,
          hasPensionRights: record.spouse.hasPensionRights,
          allocationPercentage: Number(record.spouse.allocationPercentage ?? 0),
        }
      : undefined,
    children: (record.children ?? []).map((child: any) => ({
      nationalId: child.nationalId,
      fullName: `${child.title || ""} ${child.firstName} ${child.lastName}`.trim(),
      age: Number(child.age ?? 0),
      isStudying: child.isStudying,
      educationLevel: child.educationLevel ?? "",
      allocationPercentage: Number(child.allocationPercentage ?? 0),
    })),
    heirs: (record.heirs ?? []).map((heir: any) => ({
      nationalId: heir.nationalId,
      fullName: `${heir.title || ""} ${heir.firstName} ${heir.lastName}`.trim(),
      relationship: heir.relationship,
      allocationPercentage: Number(heir.allocationPercentage ?? 0),
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const branch = searchParams.get("branch");
    const lossType = searchParams.get("lossType");

    let rows = await prisma.militaryPersonnel.findMany({
      include: { spouse: true, children: true, heirs: true },
      orderBy: { createdAt: "desc" },
    });

    if (search) {
      rows = rows.filter((p) => {
        const haystack = [
          p.firstName,
          p.lastName,
          p.militaryId,
          p.citizenId,
          p.normalUnit,
          p.fieldUnit,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    if (branch) {
      rows = rows.filter((p) => p.militaryBranch === branch);
    }

    if (lossType) {
      rows = rows.filter((p) => p.lossType === lossType);
    }

    const data = rows.map(normalizePersonnelRecord);

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();

    if (!body.militaryId || !body.firstName || !body.lastName) {
      return NextResponse.json({ success: false, error: "Missing required personnel fields" }, { status: 400 });
    }

    const created = await prisma.militaryPersonnel.create({
      data: {
        militaryId: body.militaryId,
        citizenId: body.citizenId || `3100${Date.now().toString().slice(-9)}`,
        rank: body.rank || "LIEUTENANT_COLONEL",
        rankAbbr: body.rankAbbr || "พ.ท.",
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        age: body.age !== undefined ? Number(body.age) : null,
        maritalStatus: body.maritalStatus || null,
        religion: body.religion || null,
        educationLevel: body.educationLevel || null,
        phone: body.phone || null,
        profilePhotoUrl: body.profilePhotoUrl || null,
        militaryBranch: body.militaryBranch || "ROYAL_THAI_ARMY",
        abbreviatedPosition: body.abbreviatedPosition || "นายทหารยุทธการ",
        fullPosition: body.fullPosition || body.fieldPosition || null,
        normalUnit: body.normalUnit || "ไม่ระบุ",
        fieldPosition: body.fieldPosition || null,
        fieldUnit: body.fieldUnit || null,
        fieldDutyOrderNo: body.fieldDutyOrderNo || null,
        fieldDutyOrderDate: body.fieldDutyOrderDate ? new Date(body.fieldDutyOrderDate) : null,
        fieldDutyOrderIssuer: body.fieldDutyOrderIssuer || null,
        missionCategory: body.missionCategory || null,
        salary: Number(body.salary || 0),
        salaryLevel: body.salaryLevel || "น.3",
        salaryStep: Number(body.salaryStep || 0),
        compensation: body.compensation || null,
        compensationLevel: body.compensationLevel || null,
        compensationAmount: Number(body.compensationAmount || 0),
        additionalPay: Number(body.additionalPay || 0),
        appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : new Date(),
        incidentDate: body.incidentDate ? new Date(body.incidentDate) : null,
        serviceYearsNormal: Number(body.serviceYearsNormal || 0),
        serviceYearsMultiplier: Number(body.serviceYearsMultiplier || 0),
        totalServiceYears: Number(body.totalServiceYears || 0),
        missionType: body.missionType || "COUNTER_INSURGENCY",
        actionType: body.actionType || "DIRECT_COMBAT",
        incidentType: body.incidentType || "COMBAT_ENGAGEMENT",
        lossType: body.lossType || "KIA_COMBAT_DEATH",
        hospitalAdmissionDate: body.hospitalAdmissionDate ? new Date(body.hospitalAdmissionDate) : null,
        hospitalDischargeDate: body.hospitalDischargeDate ? new Date(body.hospitalDischargeDate) : null,
        specialPensionType: body.specialPensionType || "NORMAL_TIME",
        specialPensionTier: Number(body.specialPensionTier ?? body.promotionSteps ?? 7),
        promotionSteps: Number(body.promotionSteps ?? body.specialPensionTier ?? 7),
        promotedRank: body.promotedRank || null,
        promotedRankAbbr: body.promotedRankAbbr || null,
        promotedSalary: Number(body.promotedSalary ?? body.salary ?? 0),
        familyRecordsJson: body.familyRecords ? JSON.stringify(body.familyRecords) : null,
        documentAttachmentJson: body.documentAttachments ? JSON.stringify(body.documentAttachments) : null,
      },
      include: { spouse: true, children: true, heirs: true },
    });

    if (body.spouse) {
      await prisma.spouse.create({
        data: {
          personnelId: created.id,
          nationalId: body.spouse.nationalId || "",
          title: body.spouse.title || "",
          firstName: body.spouse.firstName || "",
          lastName: body.spouse.lastName || "",
          isLegallyMarried: body.spouse.isLegallyMarried ?? true,
          hasPensionRights: body.spouse.hasPensionRights ?? true,
          allocationPercentage: Number(body.spouse.allocationPercentage ?? 50),
        },
      });
    }

    if (Array.isArray(body.children) && body.children.length > 0) {
      await prisma.child.createMany({
        data: body.children.map((child: any) => ({
          personnelId: created.id,
          nationalId: child.nationalId || "",
          title: child.title || "",
          firstName: child.firstName || "",
          lastName: child.lastName || "",
          dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : new Date(),
          age: Number(child.age ?? 0),
          isStudying: child.isStudying ?? true,
          educationLevel: child.educationLevel || null,
          scholarshipEligible: child.scholarshipEligible ?? true,
          annualScholarship: Number(child.annualScholarship ?? 15000),
          hasSuccessorRight: child.hasSuccessorRight ?? false,
          allocationPercentage: Number(child.allocationPercentage ?? 25),
        })),
      });
    }

    if (Array.isArray(body.heirs) && body.heirs.length > 0) {
      await prisma.heir.createMany({
        data: body.heirs.map((heir: any) => ({
          personnelId: created.id,
          nationalId: heir.nationalId || "",
          title: heir.title || "",
          firstName: heir.firstName || "",
          lastName: heir.lastName || "",
          relationship: heir.relationship || "OTHER_HEIR",
          phone: heir.phone || null,
          address: heir.address || null,
          bankName: heir.bankName || null,
          bankAccountNumber: heir.bankAccountNumber || null,
          allocationPercentage: Number(heir.allocationPercentage ?? 0),
          calculatedAmount: Number(heir.calculatedAmount ?? 0),
          isDesignatedSuccessor: heir.isDesignatedSuccessor ?? false,
          documentsVerified: heir.documentsVerified ?? false,
        })),
      });
    }

    const fresh = await prisma.militaryPersonnel.findUnique({
      where: { id: created.id },
      include: { spouse: true, children: true, heirs: true },
    });

    await AuditLogger.log({
      action: "CREATE",
      resource: "MilitaryPersonnel",
      resourceId: created.militaryId,
      details: {
        militaryId: created.militaryId,
        name: `${created.rankAbbr} ${created.firstName} ${created.lastName}`,
        lossType: created.lossType,
        salary: created.salary,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, data: normalizePersonnelRecord(fresh) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
