import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

const RANK_LABELS: Record<string, string> = {
  GENERAL: "พลเอก (พล.อ.)",
  LIEUTENANT_GENERAL: "พลโท (พล.ท.)",
  MAJOR_GENERAL: "พลตรี (พล.ต.)",
  COLONEL: "พันเอก (พ.อ.)",
  COLONEL_SPECIAL: "พันเอกพิเศษ (พ.อ.พิเศษ)",
  LIEUTENANT_COLONEL: "พันโท (พ.ท.)",
  MAJOR: "พันตรี (พ.ต.)",
  CAPTAIN: "ร้อยเอก (ร.อ.)",
  FIRST_LIEUTENANT: "ร้อยโท (ร.ท.)",
  SECOND_LIEUTENANT: "ร้อยตรี (ร.ต.)",
  MASTER_SERGEANT_1ST: "จ่าสิบเอก (จ.ส.อ.)",
  MASTER_SERGEANT_2ND: "จ่าสิบโท (จ.ส.ท.)",
  MASTER_SERGEANT_3RD: "จ่าสิบตรี (จ.ส.ต.)",
  SERGEANT: "สิบเอก (ส.อ.)",
  CORPORAL: "สิบโท (ส.ท.)",
  LANCE_CORPORAL: "สิบตรี (ส.ต.)",
  PRIVATE: "พลทหาร (พลฯ)",
  VOLUNTEER_RANGER: "อาสาสมัครทหารพราน (อส.)",
};

// GET /api/military/ranks -> list of MilitaryRank values read from the database enum
export async function GET() {
    try {
        let values: string[] = [];
        try {
            // Read the actual Postgres enum values from the database
            const rows = await prisma.$queryRaw<{ enum_values: string[] }[]>`
                SELECT enum_range(NULL::"MilitaryRank") AS enum_values
            `;
            const raw = rows?.[0]?.enum_values;
            if (Array.isArray(raw)) {
                values = raw;
            }
        } catch {
            // Fallback to the static enum order if DB query fails
            values = Object.keys(RANK_LABELS);
        }

        const ranks = values.map((value) => ({
            value,
            label: RANK_LABELS[value] ?? value,
        }));

        return NextResponse.json({ success: true, data: ranks, total: ranks.length });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch ranks" },
            { status: 500 }
        );
    }
}
