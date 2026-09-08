import { NextRequest, NextResponse } from "next/server";
import { PrismaAuditLogRepository } from "@/infrastructure/database/repositories/PrismaAuditLogRepository";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.trim();
    const hash = req.nextUrl.searchParams.get("hash")?.trim();
    const origin = req.nextUrl.origin;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุ verification code" },
        { status: 400 }
      );
    }

    const auditRepo = new PrismaAuditLogRepository();
    const candidates = await auditRepo.findAll({ resource: "CalculatorEstimate", limit: 200 });

    const record = candidates.find((item) => {
      if (!item?.detailsJson) return false;
      if (item.action !== "EXPORT_PDF" && item.action !== "EXPORT_DOCX") return false;

      try {
        const parsed = JSON.parse(item.detailsJson);
        return parsed?.verificationCode === code;
      } catch {
        return false;
      }
    });

    if (!record?.detailsJson) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "ไม่พบข้อมูลเอกสารสำหรับ verification code นี้",
      });
    }

    let details: any = null;
    try {
      details = JSON.parse(record.detailsJson);
    } catch {
      details = null;
    }

    if (!details || details.verificationCode !== code) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "ไม่พบข้อมูลตรงกับ verification code",
      });
    }

    if (hash && details.verificationHash && hash !== details.verificationHash) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: "verification hash ไม่ตรงกับเอกสารต้นทาง",
        data: {
          code,
          expectedHash: details.verificationHash,
          evidenceUrl: `${origin}/api/calculator/verify?code=${encodeURIComponent(code)}&hash=${encodeURIComponent(details.verificationHash)}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        code,
        verificationHash: details.verificationHash || null,
        format: details.format || null,
        signedBy: details.signedBy || null,
        verifyUrl: details.verifyUrl || null,
        evidenceUrl: `${origin}/api/calculator/verify?code=${encodeURIComponent(code)}${details.verificationHash ? `&hash=${encodeURIComponent(details.verificationHash)}` : ""}`,
        militaryId: record.resourceId || null,
        timestamp: record.timestamp,
        action: record.action,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "verify failed" },
      { status: 500 }
    );
  }
}
