import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import * as QRCode from "qrcode";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { MilitaryBenefitCalculationResult } from "@/core/domain/value-objects/military-types";
import { formatCurrency } from "@/presentation/lib/utils";

export interface CalculatorEstimateExportPayload {
  personnel: {
    militaryId: string;
    rankAbbr: string;
    firstName: string;
    lastName: string;
    normalUnit: string;
    fieldUnit?: string;
    salary: number;
    promotedSalary: number;
    specialPensionTier: number;
    promotedRankAbbr?: string;
    rankAppointmentTo?: string;
    salaryLevelAdjustment?: string;
    totalServiceYears: number;
    totalServiceMonths: number;
    totalServiceDays: number;
  };
  calculation: MilitaryBenefitCalculationResult;
  remarks?: string;
  verification: {
    confirmed: boolean;
    signerName: string;
    signerPosition?: string;
    signedAt: string;
    verificationCode: string;
    verifyBaseUrl?: string;
  };
}

function formatThaiDateBE(value: string) {
  try {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function safeText(value: string): string {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

export class CalculatorEstimateReportService {
  public static generateVerificationHash(data: CalculatorEstimateExportPayload): string {
    const source = {
      militaryId: data.personnel.militaryId,
      signedAt: data.verification.signedAt,
      signerName: data.verification.signerName,
      signerPosition: data.verification.signerPosition || "",
      verificationCode: data.verification.verificationCode,
      totals: {
        lumpSum: data.calculation.grandTotalLumpSum,
        monthly: data.calculation.grandTotalMonthlyPension,
        annual: data.calculation.grandTotalAnnualScholarship,
        nonMonetary: data.calculation.nonMonetaryRightsCount,
      },
    };

    return createHash("sha256").update(JSON.stringify(source)).digest("hex").toUpperCase();
  }

  private static async generateVerificationQrDataUrl(
    code: string,
    hash: string,
    signedAt: string,
    verifyUrl: string
  ): Promise<string> {
    const payload = JSON.stringify({
      type: "CALCULATOR_ESTIMATION_VERIFY",
      code,
      hash,
      signedAt,
      verifyUrl,
    });

    return QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#FFFFFF",
      },
    });
  }

  private static dataUrlToBuffer(dataUrl: string): Buffer {
    const base64 = dataUrl.split(",")[1] || "";
    return Buffer.from(base64, "base64");
  }

  private static getThaiFontBytes(): Buffer {
    const fontPath = join(process.cwd(), "public", "fonts", "NotoSansThai-Regular.ttf");
    return readFileSync(fontPath);
  }

  public static async generateDocx(data: CalculatorEstimateExportPayload): Promise<Buffer> {
    const title = "รายงานประมาณการสิทธิและสวัสดิการกำลังพล";
    const fullName = `${data.personnel.rankAbbr} ${data.personnel.firstName} ${data.personnel.lastName}`.trim();
    const monthlyIncomeAfterPromotion = data.personnel.promotedSalary;
    const verificationHash = this.generateVerificationHash(data);
    const verifyUrl = `${data.verification.verifyBaseUrl || "https://benefit.army.mod.go.th/verify"}?code=${encodeURIComponent(data.verification.verificationCode)}&hash=${encodeURIComponent(verificationHash)}`;
    const qrDataUrl = await this.generateVerificationQrDataUrl(
      data.verification.verificationCode,
      verificationHash,
      data.verification.signedAt,
      verifyUrl
    );
    const qrBuffer = this.dataUrlToBuffer(qrDataUrl);

    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ["เลขประจำตัวทหาร", data.personnel.militaryId],
        ["ยศ/ชื่อ-สกุล", fullName],
        ["หน่วยปกติ", data.personnel.normalUnit],
        ["หน่วยสนาม", data.personnel.fieldUnit || "-"],
        ["เงินเดือนเดิม", formatCurrency(data.personnel.salary)],
        ["จำนวนชั้นบำเหน็จพิเศษ", `${data.personnel.specialPensionTier} ชั้น`],
        ["ยศแต่งตั้ง/เลื่อนยศ", data.personnel.rankAppointmentTo || data.personnel.promotedRankAbbr || "-"],
        ["ระดับเงินเดือนใหม่", data.personnel.salaryLevelAdjustment || "-"],
        ["ยอดรับเงินเดือนใหม่", formatCurrency(monthlyIncomeAfterPromotion)],
        [
          "เวลาราชการรวม",
          `${data.personnel.totalServiceYears} ปี ${data.personnel.totalServiceMonths} เดือน ${data.personnel.totalServiceDays} วัน`,
        ],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: String(label), bold: true, font: "TH Sarabun New" })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: String(value), font: "TH Sarabun New" })],
                  }),
                ],
              }),
            ],
          })
      ),
    });

    const categoryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ["หมวด 1 รับเงินครั้งเดียว", formatCurrency(data.calculation.grandTotalLumpSum)],
        ["หมวด 2 รับเงินรายเดือน", `${formatCurrency(data.calculation.grandTotalMonthlyPension)} / เดือน`],
        ["หมวด 3 รับเงินรายปี", `${formatCurrency(data.calculation.grandTotalAnnualScholarship)} / ปี`],
        ["หมวด 4 สิทธิมิใช่ตัวเงิน", `${data.calculation.nonMonetaryRightsCount} สิทธิ`],
      ].map(
        ([name, amount]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: String(name), font: "TH Sarabun New" })] })],
              }),
              new TableCell({
                width: { size: 45, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: String(amount), font: "TH Sarabun New" })],
                  }),
                ],
              }),
            ],
          })
      ),
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: title, bold: true, size: 34, font: "TH Sarabun New" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: `ออกเอกสารเมื่อ ${formatThaiDateBE(data.verification.signedAt)} | Verify Code: ${data.verification.verificationCode}`,
                  size: 22,
                  font: "TH Sarabun New",
                }),
              ],
            }),
            summaryTable,
            new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: "สรุปผลประมาณการสิทธิ 4 หมวด", bold: true, font: "TH Sarabun New", size: 24 })] }),
            categoryTable,
            new Paragraph({
              spacing: { before: 160, after: 60 },
              children: [new TextRun({ text: "หมายเหตุเพิ่มเติม", bold: true, font: "TH Sarabun New", size: 24 })],
            }),
            new Paragraph({ children: [new TextRun({ text: data.remarks?.trim() || "-", font: "TH Sarabun New", size: 22 })] }),
            new Paragraph({
              spacing: { before: 180, after: 40 },
              children: [new TextRun({ text: "ตราประทับยืนยันเอกสารอิเล็กทรอนิกส์", bold: true, font: "TH Sarabun New", size: 24 })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 78, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: `ลงนามโดย: ${data.verification.signerName}`, bold: true, font: "TH Sarabun New", size: 20 })] }),
                        new Paragraph({ children: [new TextRun({ text: `ตำแหน่ง: ${data.verification.signerPosition || "ผู้จัดทำประมาณการสิทธิ"}`, font: "TH Sarabun New", size: 20 })] }),
                        new Paragraph({ children: [new TextRun({ text: `เวลาเซ็น: ${formatThaiDateBE(data.verification.signedAt)}`, font: "TH Sarabun New", size: 20 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Verification Code: ${data.verification.verificationCode}`, font: "TH Sarabun New", size: 20 })] }),
                        new Paragraph({ children: [new TextRun({ text: `Verification Hash (SHA-256): ${verificationHash}`, font: "TH Sarabun New", size: 18 })] }),
                        new Paragraph({ children: [new TextRun({ text: `URL ตรวจสอบ: ${verifyUrl}`, font: "TH Sarabun New", size: 18 })] }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 22, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new ImageRun({
                              type: "png",
                              data: Uint8Array.from(qrBuffer),
                              transformation: { width: 88, height: 88 },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 360 },
              children: [new TextRun({ text: "ลงนามลายเซ็นอิเล็กทรอนิกส์", bold: true, font: "TH Sarabun New" })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `(${data.verification.signerName})`, font: "TH Sarabun New" })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: data.verification.signerPosition || "ผู้จัดทำประมาณการสิทธิ", font: "TH Sarabun New" })],
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  public static async generatePdf(data: CalculatorEstimateExportPayload): Promise<Buffer> {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const page = pdf.addPage([595.28, 841.89]);
    const thaiFontBytes = this.getThaiFontBytes();
    const font = await pdf.embedFont(thaiFontBytes, { subset: true });
    const bold = font;
    const verificationHash = this.generateVerificationHash(data);
    const verifyUrl = `${data.verification.verifyBaseUrl || "https://benefit.army.mod.go.th/verify"}?code=${encodeURIComponent(data.verification.verificationCode)}&hash=${encodeURIComponent(verificationHash)}`;
    const qrDataUrl = await this.generateVerificationQrDataUrl(
      data.verification.verificationCode,
      verificationHash,
      data.verification.signedAt,
      verifyUrl
    );
    const qrImage = await pdf.embedPng(this.dataUrlToBuffer(qrDataUrl));

    const fullName = `${data.personnel.rankAbbr} ${data.personnel.firstName} ${data.personnel.lastName}`.trim();

    let y = 810;
    const drawLine = (label: string, value: string, isTitle = false) => {
      page.drawText(safeText(`${label}${value}`), {
        x: 40,
        y,
        size: isTitle ? 16 : 11,
        font: isTitle ? bold : font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= isTitle ? 26 : 15;
    };

    drawLine("", "รายงานประมาณการสิทธิและสวัสดิการกำลังพล", true);
    drawLine("วันลงนาม: ", formatThaiDateBE(data.verification.signedAt));
    drawLine("Verification Code: ", data.verification.verificationCode);
    drawLine("Military ID: ", data.personnel.militaryId);
    drawLine("ยศชื่อ: ", fullName);
    drawLine("เงินเดือนเดิม: ", formatCurrency(data.personnel.salary));
    drawLine("จำนวนชั้นบำเหน็จพิเศษ: ", `${data.personnel.specialPensionTier} ชั้น`);
    drawLine("ยศแต่งตั้ง/เลื่อนยศ: ", data.personnel.rankAppointmentTo || data.personnel.promotedRankAbbr || "-");
    drawLine("ระดับเงินเดือนใหม่: ", data.personnel.salaryLevelAdjustment || "-");
    drawLine("ยอดรับเงินเดือนใหม่: ", formatCurrency(data.personnel.promotedSalary));

    page.drawImage(qrImage, {
      x: 470,
      y: 690,
      width: 90,
      height: 90,
    });

    // Formal e-sign stamp block
    page.drawRectangle({
      x: 38,
      y: 500,
      width: 520,
      height: 130,
      borderWidth: 1,
      borderColor: rgb(0.15, 0.15, 0.15),
      color: rgb(0.98, 0.99, 1),
      opacity: 0.9,
    });
    page.drawText(safeText("ตราประทับยืนยันเอกสารอิเล็กทรอนิกส์"), {
      x: 48,
      y: 612,
      size: 12,
      font: bold,
      color: rgb(0.08, 0.18, 0.32),
    });
    page.drawText(safeText(`ผู้ลงนาม: ${data.verification.signerName}`), {
      x: 48,
      y: 594,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(safeText(`ตำแหน่ง: ${data.verification.signerPosition || "ผู้จัดทำประมาณการสิทธิ"}`), {
      x: 48,
      y: 579,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(safeText(`เวลาเซ็น: ${formatThaiDateBE(data.verification.signedAt)}`), {
      x: 48,
      y: 564,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(safeText(`Verification Code: ${data.verification.verificationCode}`), {
      x: 48,
      y: 549,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(safeText(`Hash: ${verificationHash.slice(0, 48)}...`), {
      x: 48,
      y: 534,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(safeText(`URL ตรวจสอบ: ${verifyUrl}`), {
      x: 48,
      y: 519,
      size: 9,
      font,
      color: rgb(0.08, 0.18, 0.32),
    });

    y -= 8;
    drawLine("สรุปผลประมาณการสิทธิ", "", true);
    drawLine("หมวด 1 รับเงินครั้งเดียว: ", formatCurrency(data.calculation.grandTotalLumpSum));
    drawLine("หมวด 2 รับเงินรายเดือน: ", `${formatCurrency(data.calculation.grandTotalMonthlyPension)} / เดือน`);
    drawLine("หมวด 3 รับเงินรายปี: ", `${formatCurrency(data.calculation.grandTotalAnnualScholarship)} / ปี`);
    drawLine("หมวด 4 สิทธิมิใช่ตัวเงิน: ", `${data.calculation.nonMonetaryRightsCount} สิทธิ`);

    y -= 8;
    drawLine("Verification Hash (SHA-256): ", verificationHash.slice(0, 32));
    drawLine("", verificationHash.slice(32));

    y -= 8;
    drawLine("หมายเหตุ: ", safeText(data.remarks?.trim() || "-"));

    y -= 35;
    drawLine("ลงนามอิเล็กทรอนิกส์โดย: ", safeText(data.verification.signerName));
    drawLine("ตำแหน่ง: ", safeText(data.verification.signerPosition || "ผู้จัดทำประมาณการสิทธิ"));

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }
}
