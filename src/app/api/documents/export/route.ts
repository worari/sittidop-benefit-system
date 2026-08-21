import { NextRequest, NextResponse } from "next/server";
import { OfficialDocumentService, DocumentTemplateType } from "@/core/use-cases/documents/OfficialDocumentService";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const template = (searchParams.get("template") as DocumentTemplateType) || "BENEFIT_SUMMARY";
    const personnelId = searchParams.get("personnelId") || "mil-001";
    const format = searchParams.get("format") || "docx";
    const officerName = searchParams.get("officerName") || "พลโท สมโชค ชัยชนะ";
    const officerPosition = searchParams.get("officerPosition") || "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)";
    const issuedDate = searchParams.get("issuedDate") || "21 สิงหาคม 2569";

    const personnel = militaryStore.getPersonnelById(personnelId);
    if (!personnel) {
      return NextResponse.json({ success: false, error: "Personnel not found" }, { status: 404 });
    }

    const docBuffer = await OfficialDocumentService.generateDocx({
      template,
      personnel,
      officerName,
      officerPosition,
      issuedDate,
    });

    await AuditLogger.log({
      action: "DOCUMENT_EXPORTED",
      resource: "OfficialDocument",
      resourceId: personnel.id,
      details: { template, format, personnelName: `${personnel.rankAbbr} ${personnel.firstName}` },
    });

    const fileNames: Record<DocumentTemplateType, string> = {
      BENEFIT_SUMMARY: `Benefit_Summary_${personnel.militaryId}.docx`,
      BENEFIT_CERTIFICATE: `Benefit_Certificate_${personnel.militaryId}.docx`,
      HEIR_REPORT: `Heir_Report_${personnel.militaryId}.docx`,
      CLAIM_FORM: `Claim_Form_${personnel.militaryId}.docx`,
    };

    const fileName = fileNames[template] || "Official_Document.docx";

    return new NextResponse(new Uint8Array(docBuffer), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
