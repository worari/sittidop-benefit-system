import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

const DEFAULT_UNITS = [
  "ร.19 พัน.1 / ฉก.นราธิวาส (พล.ร.9)",
  "พล.ร.9 กองทัพภาคที่ 4",
  "หน่วยเฉพาะกิจยะลา (ฉก.ยะลา)",
  "กรมทหารราบที่ 23",
  "กองพลทหารราบที่ 5",
  "กองพลทหารราบที่ 15",
  "หน่วยบัญชาการสงครามพิเศษ (นสศ.)",
  "ศูนย์การทหารราบ (ศร.)",
  "กรมบัญชาการ ทบ.",
];

// GET /api/military/units -> distinct military units read from the database
export async function GET() {
    try {
        let units: string[] = [];

        try {
            const normalUnits = await prisma.militaryPersonnel.findMany({
                where: { normalUnit: { not: "" } },
                select: { normalUnit: true },
                distinct: ["normalUnit"],
                take: 200,
            });
            const fieldUnits = await prisma.militaryPersonnel.findMany({
                where: { fieldUnit: { not: null } },
                select: { fieldUnit: true },
                distinct: ["fieldUnit"],
                take: 100,
            });

            const seen = new Set<string>();
            for (const u of normalUnits) {
                const val = u.normalUnit.trim();
                if (val && !seen.has(val)) {
                    seen.add(val);
                    units.push(val);
                }
            }
            for (const u of fieldUnits) {
                const val = (u.fieldUnit ?? "").trim();
                if (val && !seen.has(val)) {
                    seen.add(val);
                    units.push(val);
                }
            }
        } catch {
            units = [];
        }

        // Fallback to default list when the database has no unit records yet
        if (units.length === 0) {
            units = DEFAULT_UNITS;
        }

        return NextResponse.json({ success: true, data: units, total: units.length });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch units" },
            { status: 500 }
        );
    }
}
