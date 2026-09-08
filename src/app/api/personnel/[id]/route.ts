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
      serviceYearsMultiplier: body.serviceYearsMultiplier !== undefined ? Number(body.serviceYearsMultiplier) : undefined,
      totalServiceYears: body.totalServiceYears !== undefined ? Number(body.totalServiceYears) : undefined,
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

    const updated = await prisma.militaryPersonnel.update({
      where: { id },
      data: updateData,
      include: { spouse: true, children: true, heirs: true },
    });

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
