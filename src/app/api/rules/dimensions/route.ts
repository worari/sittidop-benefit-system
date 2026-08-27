import { NextRequest, NextResponse } from "next/server";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { DimensionType } from "@/core/domain/entities/BenefitRule";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

const VALID_TYPES: DimensionType[] = ["MISSION_TYPE", "PERSONNEL_CATEGORY", "LOSS_TYPE"];

// GET /api/rules/dimensions?type=MISSION_TYPE|PERSONNEL_CATEGORY|LOSS_TYPE
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") as DimensionType | null;

        if (type && !VALID_TYPES.includes(type)) {
            return NextResponse.json(
                { success: false, error: `ประเภทมิติไม่ถูกต้อง ต้องเป็น ${VALID_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        const options = militaryRuleRepository.getDimensionOptions(type ?? undefined);
        return NextResponse.json({ success: true, data: options, total: options.length });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch dimension options" },
            { status: 500 }
        );
    }
}

// POST /api/rules/dimensions  { label, type }
export async function POST(req: NextRequest) {
    try {
        const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
        if (!auth.authorized) return auth.response!;

        const body = await req.json();
        if (!body.label || !body.type) {
            return NextResponse.json(
                { success: false, error: "Missing required fields (label, type)" },
                { status: 400 }
            );
        }
        if (!VALID_TYPES.includes(body.type as DimensionType)) {
            return NextResponse.json(
                { success: false, error: `ประเภทมิติไม่ถูกต้อง ต้องเป็น ${VALID_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        const created = militaryRuleRepository.createDimensionOption({
            id: body.id,
            label: String(body.label),
            type: body.type as DimensionType,
        });

        await AuditLogger.log({
            action: "CREATE",
            resource: "DimensionOption",
            resourceId: created.id,
            details: { id: created.id, label: created.label, type: created.type },
            user: auth.user,
            req,
        });

        return NextResponse.json({ success: true, data: created });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create dimension option" },
            { status: 400 }
        );
    }
}

// PUT /api/rules/dimensions?id=xxx  { label }
export async function PUT(req: NextRequest) {
    try {
        const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
        if (!auth.authorized) return auth.response!;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ success: false, error: "Missing required query param (id)" }, { status: 400 });
        }

        const body = await req.json();
        const updated = militaryRuleRepository.updateDimensionOption(id, { label: body.label });

        await AuditLogger.log({
            action: "UPDATE",
            resource: "DimensionOption",
            resourceId: updated.id,
            details: { id: updated.id, label: updated.label, type: updated.type },
            user: auth.user,
            req,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update dimension option" },
            { status: 400 }
        );
    }
}

// DELETE /api/rules/dimensions?id=xxx&cascade=true
// cascade=true also strips the option id from every rule's conditions arrays.
export async function DELETE(req: NextRequest) {
    try {
        const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN], req);
        if (!auth.authorized) return auth.response!;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ success: false, error: "Missing required query param (id)" }, { status: 400 });
        }
        const cascade = searchParams.get("cascade") === "true";

        const result = militaryRuleRepository.deleteDimensionOption(id, cascade);

        await AuditLogger.log({
            action: "DELETE",
            resource: "DimensionOption",
            resourceId: id,
            details: { id, cascade, affectedRules: result.affectedRules },
            user: auth.user,
            req,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message:
                result.affectedRules > 0
                    ? `ลบสำเร็จ และปรับปรุงกฎเกณฑ์ที่เกี่ยวข้อง ${result.affectedRules} รายการ`
                    : "ลบสำเร็จ",
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete dimension option" },
            { status: 400 }
        );
    }
}
