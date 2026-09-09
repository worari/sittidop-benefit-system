import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { FamilyValidation } from "@/core/validation/FamilyValidation";
import { SpouseFormState, ChildFormState } from "@/core/validation/FamilyValidation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personnel = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { spouse: true, children: true },
    });

    if (!personnel) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        personnelId: personnel.id,
        militaryId: personnel.militaryId,
        personnelName: `${personnel.rankAbbr} ${personnel.firstName} ${personnel.lastName}`,
        spouse: personnel.spouse,
        children: personnel.children,
      },
    });
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

    const existing = await prisma.militaryPersonnel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    // Validate family data using FamilyValidation
    const validationResult = FamilyValidation.validateAllFamily(body.spouse as SpouseFormState, body.children as ChildFormState[]);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.errors.join(", ") },
        { status: 400 }
      );
    }

    // Sanitize family data
    const sanitizedFamily = FamilyValidation.sanitizeFamily(body.spouse as SpouseFormState, body.children as ChildFormState[]);

    await prisma.$transaction(async (tx) => {
      // 1. Spouse
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

      // 2. Children
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
    });

    const updated = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { spouse: true, children: true },
    });

    await AuditLogger.log({
      action: "UPDATE",
      resource: "MilitaryPersonnelFamily",
      resourceId: existing.militaryId,
      details: {
        spouse: body.spouse ? `${body.spouse.firstName} ${body.spouse.lastName}` : "None",
        childrenCount: body.children?.length ?? 0,
      },
      user: auth.user,
      req,
    });

    return NextResponse.json({
      success: true,
      data: {
        personnelId: updated!.id,
        militaryId: updated!.militaryId,
        personnelName: `${updated!.rankAbbr} ${updated!.firstName} ${updated!.lastName}`,
        spouse: updated!.spouse,
        children: updated!.children,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
