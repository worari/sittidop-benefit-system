import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/core/domain/value-objects/enums";
import { authorizeRoles } from "@/infrastructure/auth/rbac-guard";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";
import { LossIncidentReportRepository } from "@/infrastructure/database/repositories/LossIncidentReportRepository";
import {
  LossIncidentReportDocumentService,
  LossDocumentTemplate,
} from "@/core/use-cases/documents/LossIncidentReportDocumentService";

const lossReportRepo = new LossIncidentReportRepository();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRoles([Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR], req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const template = (searchParams.get("template") as LossDocumentTemplate) || "KP3";
    const format = (searchParams.get("format") || "docx").toLowerCase();

    const report = await lossReportRepo.findById(id);
    if (!report) {
      return NextResponse.json({ success: false, error: "ไม่พบรายงานการสูญเสียที่ระบุ" }, { status: 404 });
    }

    if (format === "pdf") {
      const pdfBuffer = await LossIncidentReportDocumentService.generatePdf(report, template);
      await AuditLogger.log({
        action: "EXPORT_PDF",
        resource: "LossIncidentReport",
        resourceId: report.id,
        details: { template, format, militaryId: report.militaryId },
        req,
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${template}_${report.militaryId || report.id}.pdf\"`,
        },
      });
    }

    const docBuffer = await LossIncidentReportDocumentService.generateDocx(report, template);

    await AuditLogger.log({
      action: "EXPORT_DOCX",
      resource: "LossIncidentReport",
      resourceId: report.id,
      details: { template, format: "docx", militaryId: report.militaryId },
      req,
    });

    return new NextResponse(new Uint8Array(docBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${template}_${report.militaryId || report.id}.docx\"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to export report" }, { status: 500 });
  }
}
