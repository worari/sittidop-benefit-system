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
    conscriptionBatch: record.conscriptionBatch !== undefined && record.conscriptionBatch !== null ? Number(record.conscriptionBatch) : null,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personnel = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { spouse: true, children: true, heirs: true },
    });

    if (!personnel) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: normalizePersonnelRecord(personnel) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await req.json();

    const cleanMilitaryId = body.militaryId ? String(body.militaryId).trim() : undefined;
    const cleanCitizenId = body.citizenId ? String(body.citizenId).trim() : undefined;
    const cleanFirstName = body.firstName ? String(body.firstName).trim() : undefined;
    const cleanLastName = body.lastName ? String(body.lastName).trim() : undefined;

    // 1. ตรวจสอบเลขประจำตัวทหารซ้ำ (ยกเว้นตนเอง)
    if (cleanMilitaryId) {
      const existingMil = await prisma.militaryPersonnel.findFirst({
        where: { militaryId: cleanMilitaryId, NOT: { id } },
        select: { id: true, rankAbbr: true, firstName: true, lastName: true },
      });
      if (existingMil) {
        return NextResponse.json(
          {
            success: false,
            error: `เลขประจำตัวทหารนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง (เลขทหาร: ${cleanMilitaryId} เป็นของ ${existingMil.rankAbbr} ${existingMil.firstName} ${existingMil.lastName})`,
          },
          { status: 400 }
        );
      }
    }

    // 2. ตรวจสอบเลขบัตรประจำตัวประชาชนซ้ำ (ยกเว้นตนเอง)
    if (cleanCitizenId) {
      const existingCit = await prisma.militaryPersonnel.findFirst({
        where: { citizenId: cleanCitizenId, NOT: { id } },
        select: { id: true, rankAbbr: true, firstName: true, lastName: true },
      });
      if (existingCit) {
        return NextResponse.json(
          {
            success: false,
            error: `เลขบัตรประจำตัวประชาชนนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง (เลขบัตร: ${cleanCitizenId} เป็นของ ${existingCit.rankAbbr} ${existingCit.firstName} ${existingCit.lastName})`,
          },
          { status: 400 }
        );
      }
    }

    // 3. ป้องกันชื่อ-นามสกุลซ้ำซ้อน (ยกเว้นตนเอง)
    if (cleanFirstName && cleanLastName) {
      const existingName = await prisma.militaryPersonnel.findFirst({
        where: {
          firstName: { equals: cleanFirstName, mode: "insensitive" },
          lastName: { equals: cleanLastName, mode: "insensitive" },
          NOT: { id },
        },
        select: { id: true, militaryId: true, rankAbbr: true, firstName: true, lastName: true },
      });
      if (existingName) {
        return NextResponse.json(
          {
            success: false,
            error: `พบข้อมูลกำลังพลชื่อ-นามสกุล '${cleanFirstName} ${cleanLastName}' (เลขทหาร ${existingName.militaryId}) ในระบบแล้ว กรุณาตรวจสอบเพื่อป้องกันชื่อซ้ำซ้อน`,
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      militaryId: body.militaryId,
      citizenId: body.citizenId,
      rank: body.rank,
      rankAbbr: body.rankAbbr,
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      age: body.age !== undefined ? Number(body.age) : undefined,
      maritalStatus: body.maritalStatus,
      religion: body.religion,
      educationLevel: body.educationLevel,
      phone: body.phone,
      profilePhotoUrl: body.profilePhotoUrl,
      conscriptionBatch: body.conscriptionBatch !== undefined ? (body.conscriptionBatch !== null ? Number(body.conscriptionBatch) : null) : undefined,
      militaryBranch: body.militaryBranch,
      abbreviatedPosition: body.abbreviatedPosition,
      fullPosition: body.fullPosition ?? body.fieldPosition ?? null,
      normalUnit: body.normalUnit,
      fieldPosition: body.fieldPosition,
      fieldUnit: body.fieldUnit,
      fieldDutyOrderNo: body.fieldDutyOrderNo,
      fieldDutyOrderDate: body.fieldDutyOrderDate ? new Date(body.fieldDutyOrderDate) : undefined,
      fieldDutyOrderIssuer: body.fieldDutyOrderIssuer,
      missionCategory: body.missionCategory,
      salary: body.salary !== undefined ? Number(body.salary) : undefined,
      salaryLevel: body.salaryLevel,
      salaryStep: body.salaryStep !== undefined ? Number(body.salaryStep) : undefined,
      compensation: body.compensation,
      compensationLevel: body.compensationLevel,
      compensationAmount: body.compensationAmount !== undefined ? Number(body.compensationAmount) : undefined,
      additionalPay: body.additionalPay !== undefined ? Number(body.additionalPay) : undefined,
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
      incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
      serviceYearsNormal: body.serviceYearsNormal !== undefined ? Number(body.serviceYearsNormal) : undefined,
      serviceMonthsNormal: body.serviceMonthsNormal !== undefined ? Number(body.serviceMonthsNormal) : undefined,
      serviceDaysNormal: body.serviceDaysNormal !== undefined ? Number(body.serviceDaysNormal) : undefined,
      serviceYearsMultiplier: body.serviceYearsMultiplier !== undefined ? Number(body.serviceYearsMultiplier) : undefined,
      serviceMonthsMultiplier: body.serviceMonthsMultiplier !== undefined ? Number(body.serviceMonthsMultiplier) : undefined,
      serviceDaysMultiplier: body.serviceDaysMultiplier !== undefined ? Number(body.serviceDaysMultiplier) : undefined,
      totalServiceYears: body.totalServiceYears !== undefined ? Number(body.totalServiceYears) : undefined,
      totalServiceMonths: body.totalServiceMonths !== undefined ? Number(body.totalServiceMonths) : undefined,
      totalServiceDays: body.totalServiceDays !== undefined ? Number(body.totalServiceDays) : undefined,
      missionType: body.missionType,
      actionType: body.actionType,
      incidentType: body.incidentType,
      lossType: body.lossType,
      hospitalAdmissionDate: body.hospitalAdmissionDate ? new Date(body.hospitalAdmissionDate) : undefined,
      hospitalDischargeDate: body.hospitalDischargeDate ? new Date(body.hospitalDischargeDate) : undefined,
      specialPensionType: body.specialPensionType,
      specialPensionTier: body.specialPensionTier !== undefined ? Number(body.specialPensionTier) : undefined,
      promotionSteps: body.promotionSteps !== undefined ? Number(body.promotionSteps) : undefined,
      promotedRank: body.promotedRank,
      promotedRankAbbr: body.promotedRankAbbr,
      promotedSalary: body.promotedSalary !== undefined ? Number(body.promotedSalary) : undefined,
      familyRecordsJson: body.familyRecords ? JSON.stringify(body.familyRecords) : undefined,
      documentAttachmentJson: body.documentAttachments ? JSON.stringify(body.documentAttachments) : undefined,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null || updateData[key] === "") {
        delete updateData[key];
      }
    });

    // Run in a transaction if relations are present
    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.militaryPersonnel.update({
          where: { id },
          data: updateData,
        });
      }

      // 1. Update/Upsert Spouse
      if (body.spouse !== undefined) {
        if (body.spouse === null) {
          await tx.spouse.deleteMany({ where: { personnelId: id } });
        } else {
          const spouseData = {
            nationalId: body.spouse.nationalId || "",
            title: body.spouse.title || "",
            firstName: body.spouse.firstName || "",
            lastName: body.spouse.lastName || "",
            dateOfBirth: body.spouse.dateOfBirth ? new Date(body.spouse.dateOfBirth) : null,
            age: body.spouse.age !== undefined ? Number(body.spouse.age) : null,
            maritalStatus: body.spouse.maritalStatus || null,
            isAlive: body.spouse.isAlive ?? true,
            isLegallyMarried: body.spouse.isLegallyMarried ?? true,
            marriageCertNumber: body.spouse.marriageCertNumber || null,
            phone: body.spouse.phone || null,
            address: body.spouse.address || null,
            educationLevel: body.spouse.educationLevel || null,
            bankName: body.spouse.bankName || null,
            bankAccountNumber: body.spouse.bankAccountNumber || null,
            hasPensionRights: body.spouse.hasPensionRights ?? true,
            allocationPercentage: Number(body.spouse.allocationPercentage ?? 50),
          };
          await tx.spouse.upsert({
            where: { personnelId: id },
            create: { ...spouseData, personnelId: id },
            update: spouseData,
          });
        }
      }

      // 2. Update/Replace Children
      if (body.children !== undefined && Array.isArray(body.children)) {
        await tx.child.deleteMany({ where: { personnelId: id } });
        if (body.children.length > 0) {
          await tx.child.createMany({
            data: body.children.map((child: any) => ({
              personnelId: id,
              nationalId: child.nationalId || "",
              title: child.title || "",
              firstName: child.firstName || "",
              lastName: child.lastName || "",
              dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : new Date(),
              age: Number(child.age ?? 0),
              isAlive: child.isAlive ?? true,
              isStudying: child.isStudying ?? true,
              educationLevel: child.educationLevel || null,
              phone: child.phone || null,
              address: child.address || null,
              scholarshipEligible: child.scholarshipEligible ?? true,
              annualScholarship: Number(child.annualScholarship ?? 15000),
              hasSuccessorRight: child.hasSuccessorRight ?? false,
              allocationPercentage: Number(child.allocationPercentage ?? 25),
            })),
          });
        }
      }

      // 3. Update/Replace Heirs
      if (body.heirs !== undefined && Array.isArray(body.heirs)) {
        await tx.heir.deleteMany({ where: { personnelId: id } });
        if (body.heirs.length > 0) {
          await tx.heir.createMany({
            data: body.heirs.map((heir: any) => ({
              personnelId: id,
              nationalId: heir.nationalId || "",
              title: heir.title || "",
              firstName: heir.firstName || "",
              lastName: heir.lastName || "",
              dateOfBirth: heir.dateOfBirth ? new Date(heir.dateOfBirth) : null,
              age: heir.age !== undefined ? Number(heir.age) : null,
              relationship: heir.relationship || "OTHER_HEIR",
              phone: heir.phone || null,
              address: heir.address || null,
              educationLevel: heir.educationLevel || null,
              isAlive: heir.isAlive ?? true,
              bankName: heir.bankName || null,
              bankAccountNumber: heir.bankAccountNumber || null,
              allocationPercentage: Number(heir.allocationPercentage ?? 0),
              calculatedAmount: Number(heir.calculatedAmount ?? 0),
              isDesignatedSuccessor: heir.isDesignatedSuccessor ?? false,
              documentsVerified: heir.documentsVerified ?? false,
            })),
          });
        }
      }
    });

    const updated = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { spouse: true, children: true, heirs: true },
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Personnel not found after update" }, { status: 404 });
    }

    await AuditLogger.log({
      action: "UPDATE",
      resource: "MilitaryPersonnel",
      resourceId: updated.militaryId,
      details: {
        rank: updated.rank,
        promotedRank: updated.promotedRank,
        lossType: updated.lossType,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, data: normalizePersonnelRecord(updated) });
  } catch (error: any) {
    if (error?.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : String(error.meta?.target || "");
      if (target.includes("militaryId")) {
        return NextResponse.json(
          { success: false, error: "เลขประจำตัวทหารนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง" },
          { status: 400 }
        );
      }
      if (target.includes("citizenId")) {
        return NextResponse.json(
          { success: false, error: "เลขบัตรประจำตัวประชาชนนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "ข้อมูลนี้มีอยู่ในระบบแล้ว (ข้อมูลซ้ำซ้อน)" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF], req);
    if (!auth.authorized) return auth.response!;

    const { id } = await params;

    const existing = await prisma.militaryPersonnel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    await prisma.militaryPersonnel.delete({ where: { id } });

    await AuditLogger.log({
      action: "DELETE",
      resource: "MilitaryPersonnel",
      resourceId: id,
      details: { deletedAt: new Date().toISOString() },
      user: auth.user,
      req,
    });

    return NextResponse.json({ success: true, message: "Personnel deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
