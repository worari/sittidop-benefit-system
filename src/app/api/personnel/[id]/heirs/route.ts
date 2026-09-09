import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { HeirValidation } from "@/core/validation/HeirValidation";
import { HeirFormState } from "@/core/validation/HeirValidation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personnel = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { heirs: true, spouse: true, children: true },
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
        heirs: personnel.heirs,
        familySnapshot: {
          spouse: personnel.spouse,
          children: personnel.children,
        },
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

    if (!Array.isArray(body.heirs)) {
      return NextResponse.json({ success: false, error: "Heirs must be an array" }, { status: 400 });
    }

    // Validate heirs using HeirValidation
    const validationResult = HeirValidation.validateAllHeirs(body.heirs as HeirFormState[]);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.errors.join(", ") },
        { status: 400 }
      );
    }

    // Sanitize heirs data
    const sanitizedHeirs = body.heirs.map((heir: any) => HeirValidation.sanitizeHeir(heir as HeirFormState));

    await prisma.$transaction(async (tx) => {
      await tx.heir.deleteMany({ where: { personnelId: id } });
      if (sanitizedHeirs.length > 0) {
        await tx.heir.createMany({
          data: sanitizedHeirs.map((heir: any) => ({
            personnelId: id,
            nationalId: heir.nationalId || "",
            title: heir.title || "",
            firstName: heir.firstName || "",
            lastName: heir.lastName || "",
            dateOfBirth: heir.dateOfBirth ? new Date(heir.dateOfBirth) : null,
            age: heir.age !== undefined ? Number(heir.age) : null,
            relationship: [
              "SPOUSE_LEGAL",
              "SPOUSE_DE_FACTO",
              "CHILD_LEGITIMATE",
              "CHILD_ADOPTED",
              "FATHER",
              "MOTHER",
              "OTHER_HEIR",
            ].includes(heir.relationship)
              ? heir.relationship
              : "OTHER_HEIR",
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
    });

    const updated = await prisma.militaryPersonnel.findUnique({
      where: { id },
      include: { heirs: true },
    });

    await AuditLogger.log({
      action: "UPDATE",
      resource: "MilitaryPersonnelHeirs",
      resourceId: existing.militaryId,
      details: {
        heirsCount: body.heirs.length,
        totalPercentage: body.heirs.reduce((sum: number, h: any) => sum + (Number(h.allocationPercentage) || 0), 0),
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
        heirs: updated!.heirs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
