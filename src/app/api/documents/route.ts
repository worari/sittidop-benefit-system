import { NextRequest, NextResponse } from "next/server";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET() {
  try {
    const docs = militaryStore.getDocuments();
    return NextResponse.json({ success: true, data: docs, total: docs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const created = militaryStore.createDocument({
      docNumber: body.docNumber || `กห-0201/${new Date().getFullYear() + 543}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: body.title || "หนังสือสรุปรายการประมาณการสิทธิกำลังพลและทายาท",
      personnelId: body.personnelId,
      personnelName: body.personnelName,
      rankWithAbbr: body.rankWithAbbr,
      unit: body.unit,
      lossType: body.lossType,
      totalLumpSum: Number(body.totalLumpSum) || 0,
      monthlyPension: Number(body.monthlyPension) || 0,
      annualScholarship: Number(body.annualScholarship) || 0,
      commandingOfficer: body.commandingOfficer || "พลโท สมโชค ชัยชนะ",
      officerPosition: body.officerPosition || "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)",
      issuedDate: body.issuedDate || "21 สิงหาคม 2569",
      qrVerifyCode: `VERIFY-MIL-${Date.now()}-SECURE`,
      status: body.status || "OFFICIAL_ISSUED",
    });

    await AuditLogger.log({
      action: "OFFICIAL_DOCUMENT_GENERATED",
      resource: "BenefitReport",
      resourceId: created.id,
      details: {
        docNumber: created.docNumber,
        personnelName: created.personnelName,
        totalLumpSum: created.totalLumpSum,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
