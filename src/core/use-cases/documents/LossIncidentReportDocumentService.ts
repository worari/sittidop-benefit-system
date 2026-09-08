import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type LossDocumentTemplate = "KP3" | "KP4";

export interface LossIncidentReportDocData {
  id: string;
  militaryId?: string | null;
  rankAbbr?: string | null;
  fullName?: string | null;
  incidentDate: Date;
  incidentTime: string;
  mgrsCoordinate: string;
  latitude?: number | null;
  longitude?: number | null;
  village?: string | null;
  houseNo?: string | null;
  road?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  eventSummary: string;
  behaviorSummary?: string | null;
  engagementBehavior: string;
  enemyAction: string;
}

function formatThaiDateBE(date: Date): string {
  try {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function buildLocationText(data: LossIncidentReportDocData): string {
  const parts = [
    data.village ? `หมู่บ้าน ${data.village}` : null,
    data.houseNo ? `เลขที่ ${data.houseNo}` : null,
    data.road ? `ถนน ${data.road}` : null,
    data.subdistrict ? `ต.${data.subdistrict}` : null,
    data.district ? `อ.${data.district}` : null,
    data.province ? `จ.${data.province}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "ไม่ระบุ";
}

export class LossIncidentReportDocumentService {
  public static async generateDocx(data: LossIncidentReportDocData, template: LossDocumentTemplate): Promise<Buffer> {
    const title = template === "KP3"
      ? "แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.3)"
      : "แบบรับรองรายละเอียดเหตุการณ์และผลการสูญเสีย (กพ.4)";

    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ["เลขประจำตัวทหาร", data.militaryId || "-"],
        ["ยศ ชื่อ-สกุล", `${data.rankAbbr || ""} ${data.fullName || "-"}`.trim()],
        ["วันเดือนปีที่เกิดเหตุ", formatThaiDateBE(data.incidentDate)],
        ["เวลาที่เกิดเหตุ", data.incidentTime || "-"],
        ["พิกัด MGRS", data.mgrsCoordinate || "-"],
        ["พิกัด Lat/Lon", data.latitude != null && data.longitude != null ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}` : "ไม่สามารถแปลงพิกัดได้"],
        ["สถานที่เกิดเหตุ", buildLocationText(data)],
        ["พฤติกรรม", data.engagementBehavior],
        ["การถูกกระทำโดย", data.enemyAction === "ENEMY" ? "ข้าศึก" : "ไม่มีข้าศึก"],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: String(label), bold: true, font: "TH Sarabun New" })] })],
              }),
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: String(value), font: "TH Sarabun New" })] })],
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
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: `เลขที่รายงาน: ${data.id}`,
                  size: 22,
                  font: "TH Sarabun New",
                }),
              ],
            }),
            metaTable,
            new Paragraph({ spacing: { before: 200, after: 60 }, children: [new TextRun({ text: "รายละเอียดเหตุการณ์ พฤติกรรมโดยย่อ", bold: true, size: 24, font: "TH Sarabun New" })] }),
            new Paragraph({ children: [new TextRun({ text: data.eventSummary || "-", size: 22, font: "TH Sarabun New" })] }),
            new Paragraph({ spacing: { before: 140, after: 60 }, children: [new TextRun({ text: "หมายเหตุเพิ่มเติม", bold: true, size: 24, font: "TH Sarabun New" })] }),
            new Paragraph({ children: [new TextRun({ text: data.behaviorSummary || "-", size: 22, font: "TH Sarabun New" })] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 360 }, children: [new TextRun({ text: "ลงชื่อ........................................................", font: "TH Sarabun New" })] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "ผู้รายงาน", font: "TH Sarabun New" })] }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  public static async generatePdf(data: LossIncidentReportDocData, template: LossDocumentTemplate): Promise<Buffer> {
    const title = template === "KP3"
      ? "KP3 Duty Loss Incident Report"
      : "KP4 Incident Verification Report";

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 805;
    const drawLine = (label: string, value: string, isTitle = false) => {
      page.drawText(`${label}${value}`, {
        x: 48,
        y,
        size: isTitle ? 16 : 11,
        font: isTitle ? bold : font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= isTitle ? 28 : 17;
    };

    drawLine("", title, true);
    drawLine("Report ID: ", data.id);
    drawLine("Military ID: ", data.militaryId || "-");
    drawLine("Rank/Name: ", `${data.rankAbbr || ""} ${data.fullName || "-"}`.trim());
    drawLine("Incident Date (BE): ", formatThaiDateBE(data.incidentDate));
    drawLine("Incident Time: ", data.incidentTime || "-");
    drawLine("MGRS: ", data.mgrsCoordinate || "-");
    drawLine(
      "Lat/Lon: ",
      data.latitude != null && data.longitude != null
        ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
        : "N/A"
    );
    drawLine("Location: ", buildLocationText(data));
    drawLine("Engagement: ", data.engagementBehavior);
    drawLine("Action By: ", data.enemyAction === "ENEMY" ? "Enemy" : "No Enemy");

    y -= 10;
    drawLine("Event Summary: ", "");

    const eventText = (data.eventSummary || "-").slice(0, 1400);
    const behaviorText = (data.behaviorSummary || "-").slice(0, 600);

    page.drawText(eventText, {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: 500,
      lineHeight: 14,
    });

    y -= 170;
    drawLine("Behavior Notes: ", "");
    page.drawText(behaviorText, {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: 500,
      lineHeight: 14,
    });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }
}
