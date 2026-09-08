import { NextRequest, NextResponse } from "next/server";
import { CalculatorEstimateReportService, CalculatorEstimateExportPayload } from "@/core/use-cases/documents/CalculatorEstimateReportService";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const format = String(body?.format || "docx").toLowerCase();
    const payload = body?.payload as CalculatorEstimateExportPayload;

    if (!payload?.verification?.confirmed) {
      return NextResponse.json(
        { success: false, error: "กรุณาตรวจยืนยันเอกสารก่อนพิมพ์รายงาน" },
        { status: 400 }
      );
    }

    if (!payload?.verification?.signerName?.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุชื่อผู้ลงนามอิเล็กทรอนิกส์" },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    payload.verification.verifyBaseUrl = `${origin}/verify`;

    const fileBase = `Benefit_Estimation_${payload.personnel?.militaryId || "Unknown"}`;
    const verificationHash = CalculatorEstimateReportService.generateVerificationHash(payload);
    const verifyUrl = `${payload.verification.verifyBaseUrl}?code=${encodeURIComponent(payload.verification.verificationCode)}&hash=${encodeURIComponent(verificationHash)}`;

    if (format === "pdf") {
      const buffer = await CalculatorEstimateReportService.generatePdf(payload);

      await AuditLogger.logExportPdf("CalculatorEstimate", payload.personnel?.militaryId || "unknown", {
        format: "pdf",
        signedBy: payload.verification.signerName,
        verificationCode: payload.verification.verificationCode,
        verificationHash,
        verifyUrl,
      }, req);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${fileBase}.pdf\"`,
          "X-Verification-Code": payload.verification.verificationCode,
          "X-Verification-Hash": verificationHash,
          "X-Verify-Url": verifyUrl,
        },
      });
    }

    const buffer = await CalculatorEstimateReportService.generateDocx(payload);

    await AuditLogger.logExportDocx("CalculatorEstimate", payload.personnel?.militaryId || "unknown", {
      format: "docx",
      signedBy: payload.verification.signerName,
      verificationCode: payload.verification.verificationCode,
      verificationHash,
      verifyUrl,
    }, req);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=\"${fileBase}.docx\"`,
        "X-Verification-Code": payload.verification.verificationCode,
        "X-Verification-Hash": verificationHash,
        "X-Verify-Url": verifyUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to export estimation report" },
      { status: 500 }
    );
  }
}
