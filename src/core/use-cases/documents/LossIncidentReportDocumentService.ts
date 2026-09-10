import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  UnderlineType,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { IncidentCasualty, LossReportDispatchMeta } from "@/infrastructure/database/repositories/LossIncidentReportRepository";

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
  casualties?: IncidentCasualty[];
  dispatchMeta?: LossReportDispatchMeta | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

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

function formatThaiShortDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      year: "2-digit",
      month: "short",
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

function getLossTypeLabel(type: string): string {
  switch (type) {
    case "DECEASED":
    case "เสียชีวิต":
      return "เสียชีวิต";
    case "DISABLED":
    case "พิการทุพพลภาพ":
      return "พิการทุพพลภาพ";
    case "INJURED":
    case "บาดเจ็บ":
      return "บาดเจ็บ";
    default:
      return type || "-";
  }
}

function noBorder() {
  return {
    top: { style: BorderStyle.NIL, size: 0 },
    bottom: { style: BorderStyle.NIL, size: 0 },
    left: { style: BorderStyle.NIL, size: 0 },
    right: { style: BorderStyle.NIL, size: 0 },
    insideHorizontal: { style: BorderStyle.NIL, size: 0 },
    insideVertical: { style: BorderStyle.NIL, size: 0 },
  };
}

function thinBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
    left: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "888888" },
  };
}

function th(text: string, bold = false, size = 22, color = "000000", underline = false): TextRun {
  return new TextRun({
    text,
    bold,
    size,
    font: "TH Sarabun New",
    color,
    underline: underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function para(
  children: TextRun[],
  opts: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { before?: number; after?: number }; indent?: { left?: number; firstLine?: number } } = {}
): Paragraph {
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.LEFT,
    spacing: opts.spacing ?? { after: 60 },
    indent: opts.indent,
    children,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX generators
// ─────────────────────────────────────────────────────────────────────────────

export class LossIncidentReportDocumentService {
  // ───────────────────── DOCX ──────────────────────────────────────────────

  public static async generateDocx(
    data: LossIncidentReportDocData,
    template: LossDocumentTemplate
  ): Promise<Buffer> {
    const casualties: IncidentCasualty[] =
      data.casualties && data.casualties.length > 0
        ? data.casualties
        : [
            {
              id: "1",
              militaryId: data.militaryId || "-",
              rankAbbr: data.rankAbbr || "",
              fullName: data.fullName || "-",
              lossType: "DECEASED",
              lossSeverity: "",
              injuryDetails: "",
              hospital: "",
            },
          ];

    const meta: LossReportDispatchMeta = data.dispatchMeta ?? {};

    const doc =
      template === "KP4"
        ? LossIncidentReportDocumentService.buildKP4Docx(data, casualties, meta)
        : LossIncidentReportDocumentService.buildKP3Docx(data, casualties, meta);

    return Packer.toBuffer(doc);
  }

  // ─────────────────── กพ.๔ DOCX (กระดาษเขียนข่าว สส.๒) ─────────────────

  private static buildKP4Docx(
    data: LossIncidentReportDocData,
    casualties: IncidentCasualty[],
    meta: LossReportDispatchMeta
  ): Document {
    const urgency = meta.urgency || "ด่วนที่สุด";
    const classification = meta.classification || "ลับมาก";
    const fromUnit = meta.fromUnit || "ผบ.พัน.ร.202 (RDF)";
    const toUnit = meta.toUnit || "ผบ.ศปก.ทบ.";
    const infoUnits = meta.infoUnits || "ศปก.ทบ., กกล.สุรนารี, พล.ร.6, ฉก.1, ร.6, ร.6 พัน.1, ร.6 พัน.2";
    const refNo = meta.referenceNumber || `กห 0482.2.372/${data.id.slice(-4) || "0001"}`;
    const dateStr = formatThaiShortDate(data.incidentDate);

    const children: (Paragraph | Table)[] = [];

    // ── Header: กระดาษเขียนข่าว ──────────────────────────────────────────
    children.push(
      para([th("กระดาษเขียนข่าว", true, 32)], { alignment: AlignmentType.CENTER, spacing: { after: 0 } }),
      para([th("แบบ สส.๒", true, 26)], { alignment: AlignmentType.CENTER, spacing: { after: 120 } })
    );

    // ── Urgency + Classification + Date header table ──────────────────────
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "E8E8E8" },
                children: [para([th("ความเร่งด่วน-ผู้รับปฏิบัติ", true, 18)])],
              }),
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "E8E8E8" },
                children: [para([th("ความเร่งด่วน-ผู้รับทราบ", true, 18)])],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "E8E8E8" },
                children: [para([th("หมู่ วัน/เวลา", true, 18)])],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "E8E8E8" },
                children: [para([th("คำแนะนำ", true, 18)])],
              }),
            ],
          }),
          new TableRow({
            height: { value: 800, rule: "exact" as any },
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [
                  para([th(urgency, true, 40, "CC0000")], { alignment: AlignmentType.CENTER }),
                ],
              }),
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [para([th("ด่วน", false, 26)])],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                children: [para([th(`${data.incidentTime} น.  ${dateStr}`, false, 22)])],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                children: [para([th("", false, 22)])],
              }),
            ],
          }),
        ],
      })
    );

    // ── Sender / Receiver block ────────────────────────────────────────────
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [para([th("จาก", true, 22)])],
              }),
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: [para([th(fromUnit, false, 22)])],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                rowSpan: 2,
                children: [para([th("ถึง", true, 22)])],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [para([th("ผู้รับปฏิบัติ", true, 22)])],
              }),
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                children: [para([th(toUnit, false, 22)])],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [para([th("ผู้รับทราบ", true, 22)])],
              }),
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                children: [para([th(infoUnits, false, 20)])],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [para([th("หัวข้อ / หมู่คำ", true, 22)])],
              }),
              new TableCell({
                colSpan: 2,
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: [para([th("ประเภทเอกสาร  ลับมาก", false, 22)])],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [para([th("ที่ของผู้ให้ข่าว", true, 22)])],
              }),
              new TableCell({
                colSpan: 2,
                width: { size: 80, type: WidthType.PERCENTAGE },
                children: [para([th(refNo, false, 22)])],
              }),
            ],
          }),
        ],
      })
    );

    // ── Document title ─────────────────────────────────────────────────────
    children.push(
      para([], { spacing: { before: 160, after: 80 } }),
      para(
        [th(`รายงานการสูญเสีย (กพ.๔)`, true, 26)],
        { alignment: AlignmentType.CENTER, spacing: { after: 40 } }
      )
    );

    // ── Paragraph 1 – Mission summary ─────────────────────────────────────
    const totalCas = casualties.length;
    const deadCount = casualties.filter((c) => c.lossType === "DECEASED").length;
    const injuredCount = casualties.filter((c) => c.lossType === "INJURED").length;
    const disabledCount = casualties.filter((c) => c.lossType === "DISABLED").length;
    const missionForce = meta.missionForce || `ชุดปฏิบัติการ ${totalCas + Math.floor(Math.random() * 5 + 5)} นาย`;
    const coord = data.mgrsCoordinate;
    const location = buildLocationText(data);

    children.push(
      para([
        th(`    ๑. เมื่อ ${data.incidentTime} น. `, false, 22),
        th(formatThaiDateBE(data.incidentDate), false, 22),
        th(` โดย ${fromUnit} ได้จัดกำลัง ${missionForce} `, false, 22),
        th(`ทำการ ${data.engagementBehavior} `, false, 22),
        th(`จากฐานปฏิบัติการมุ่งไปยังแนวถนน ${location} `, false, 22),
        th(`พิกัด MGRS: ${coord} `, false, 22),
        th(
          data.enemyAction === "ENEMY" ? "ถูกฝ่ายตรงข้ามซุ่มโจมตี/วางกับระเบิด ทำให้มีกำลังพลสูญเสีย" : "เกิดอุบัติเหตุ/เหตุการณ์สูญเสีย",
          false, 22
        ),
        th(
          ` จำนวน ${totalCas} นาย` +
          (deadCount > 0 ? ` (เสียชีวิต ${deadCount} นาย` : "") +
          (injuredCount > 0 ? `, บาดเจ็บ ${injuredCount} นาย` : "") +
          (disabledCount > 0 ? `, พิการ ${disabledCount} นาย` : "") +
          (deadCount > 0 || injuredCount > 0 || disabledCount > 0 ? ")" : "") +
          " ดังนี้",
          false, 22
        ),
      ], { spacing: { after: 80 } })
    );

    // ── Paragraphs 1.N – Per-casualty sub-items ───────────────────────────
    casualties.forEach((c, idx) => {
      const lossLabel = getLossTypeLabel(c.lossType);
      const details: string[] = [];
      if (c.injuryDetails) details.push(c.injuryDetails);
      if (c.hospital) details.push(`นำส่ง รพ.${c.hospital}`);
      else if (c.lossType === "DECEASED") details.push("เสียชีวิตในพื้นที่เหตุการณ์");

      // Salary string
      const salStr = c.salaryLevel ? `รับเงินเดือน${c.salaryLevel}${c.salaryAmount ? ` (${c.salaryAmount.toLocaleString("th-TH")} บาท)` : ""}` : "";

      children.push(
        para([
          th(`    ๑.${idx + 1} `, false, 22),
          th(`${c.rankAbbr} ${c.fullName}`.trim(), true, 22),
          th(` หมายเลขประจำตัวทหาร ${c.militaryId || "-"}`, false, 22),
          ...(c.citizenId ? [th(`  หมายเลขประจำตัวประชาชน ${c.citizenId}`, false, 22)] : []),
          ...(c.bloodGroup ? [th(`  กรุ๊ปเลือด ${c.bloodGroup}`, false, 22)] : []),
        ], { spacing: { after: 20 } }),
        para([
          th(`          ตำแหน่งปกติ `, true, 22),
          th(`${c.normalPosition || c.unit || "-"}  `, false, 22),
          th(`สังกัด `, true, 22),
          th(`${c.normalUnit || c.unit || "-"}`, false, 22),
        ], { spacing: { after: 20 } }),
        para([
          th(`          ตำแหน่งในสนาม `, true, 22),
          th(`${c.fieldPosition || "-"}  `, false, 22),
          th(`หน่วย `, true, 22),
          th(`${c.fieldUnit || "-"}`, false, 22),
          ...(salStr ? [th(`  ${salStr}`, false, 22)] : []),
        ], { spacing: { after: 20 } }),
        para([
          th(`          ประเภทสูญเสีย: `, true, 22),
          th(`${lossLabel}`, false, 22),
          ...(c.lossSeverity ? [th(`  (${c.lossSeverity})`, false, 22)] : []),
          th(`  ${details.join("  ")}`, false, 22),
        ], { spacing: { after: 80 } })
      );
    });

    // ── Event summary ─────────────────────────────────────────────────────
    if (data.eventSummary) {
      children.push(
        para([th(`    ๒. รายละเอียดพฤติการณ์เหตุการณ์`, true, 22)], { spacing: { after: 20 } }),
        para([th(`          ${data.eventSummary}`, false, 22)], { spacing: { after: 80 } })
      );
    }

    if (data.behaviorSummary) {
      children.push(
        para([th(`    ๓. หมายเหตุ / การดำเนินการที่ผ่านมา`, true, 22)], { spacing: { after: 20 } }),
        para([th(`          ${data.behaviorSummary}`, false, 22)], { spacing: { after: 80 } })
      );
    }

    // ── Signature line ────────────────────────────────────────────────────
    children.push(
      para([], { spacing: { before: 200, after: 0 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  para([th("ชื่อผู้เขียนข่าว ......................................", false, 22)]),
                  para([th(`หน่วย: ${meta.writerUnit || ".................................."}`, false, 22)]),
                  para([th(`โทร: ${meta.writerPhone || "......................................"}`, false, 22)]),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  para([th("ลงชื่อ .......................................................", false, 22)], { alignment: AlignmentType.RIGHT }),
                  para([th(`(${meta.approverName || "........................................"})`, false, 22)], { alignment: AlignmentType.RIGHT }),
                  para([th("ผู้รับรองข่าว", false, 22)], { alignment: AlignmentType.RIGHT }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // ── Comms table ───────────────────────────────────────────────────────
    children.push(
      para([], { spacing: { before: 200, after: 40 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                rowSpan: 2,
                width: { size: 15, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "EEEEEE" },
                children: [para([th("สถานภาพ", true, 18)], { alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                colSpan: 4,
                width: { size: 42, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "EEEEEE" },
                children: [para([th("อ้างถึงข่าว", true, 18)], { alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                colSpan: 4,
                width: { size: 43, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "EEEEEE" },
                children: [para([th("ชื่อผู้เขียนข่าว", true, 18)], { alignment: AlignmentType.CENTER })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [para([th("วันที่", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("เวลา", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("ระบบเครื่องสื่อสาร", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("ชื่อพนักงาน", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("วันที่", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("เวลา", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("ระบบเครื่องสื่อสาร", true, 16)], { alignment: AlignmentType.CENTER })] }),
              new TableCell({ children: [para([th("ชื่อพนักงาน", true, 16)], { alignment: AlignmentType.CENTER })] }),
            ],
          }),
          new TableRow({
            height: { value: 500, rule: "exact" as any },
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "EEEEEE" },
                children: [para([th("รับเมื่อ", true, 18)], { alignment: AlignmentType.CENTER })],
              }),
              ...(Array(8).fill(null).map(() =>
                new TableCell({ children: [para([th("", false, 20)])] })
              )),
            ],
          }),
          new TableRow({
            height: { value: 500, rule: "exact" as any },
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "EEEEEE" },
                children: [para([th("ส่งเสร็จ", true, 18)], { alignment: AlignmentType.CENTER })],
              }),
              ...(Array(8).fill(null).map(() =>
                new TableCell({ children: [para([th("", false, 20)])] })
              )),
            ],
          }),
        ],
      })
    );

    return new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 1080, right: 720 },
            },
          },
          children,
        },
      ],
    });
  }

  // ─────────────────── กพ.๓ DOCX (ฉบับสมบูรณ์) ─────────────────────────

  private static buildKP3Docx(
    data: LossIncidentReportDocData,
    casualties: IncidentCasualty[],
    meta: LossReportDispatchMeta
  ): Document {
    const dateStr = formatThaiDateBE(data.incidentDate);
    const location = buildLocationText(data);
    const totalCas = casualties.length;
    const deadCount = casualties.filter((c) => c.lossType === "DECEASED").length;
    const injuredCount = casualties.filter((c) => c.lossType === "INJURED").length;
    const disabledCount = casualties.filter((c) => c.lossType === "DISABLED").length;

    const children: (Paragraph | Table)[] = [];

    // ── Header: บันทึกข้อความ ─────────────────────────────────────────────
    children.push(
      para([th("แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ", true, 32)], {
        alignment: AlignmentType.CENTER, spacing: { after: 0 },
      }),
      para([th("(กพ.๓)", true, 28)], {
        alignment: AlignmentType.CENTER, spacing: { after: 40 },
      }),
      para([th("─────────────────────────────────────────────────────────────────────────────────────", false, 16, "888888")], {
        alignment: AlignmentType.CENTER, spacing: { after: 80 },
      })
    );

    // ── Meta info block ────────────────────────────────────────────────────
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: "F0F4F8" },
                children: [para([th("เลขที่รายงาน", true, 22)])],
              }),
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [para([th(data.id, false, 22)])],
              }),
            ],
          }),
          ...[
            ["วันที่เกิดเหตุ", dateStr],
            ["เวลาที่เกิดเหตุ", `${data.incidentTime} น.`],
            ["พิกัดทางทหาร (MGRS)", data.mgrsCoordinate || "-"],
            ["พิกัด Lat/Long", data.latitude != null && data.longitude != null
              ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
              : "ไม่สามารถแปลงพิกัดได้"],
            ["สถานที่เกิดเหตุ", location],
            ["พฤติการณ์การปะทะ", data.engagementBehavior],
            ["การถูกกระทำโดย", data.enemyAction === "ENEMY" ? "ฝ่ายตรงข้าม/ข้าศึก" : "ไม่ใช่ฝ่ายตรงข้าม (อุบัติเหตุ)"],
            ["ยอดกำลังพลสูญเสียรวม", `${totalCas} นาย (เสียชีวิต ${deadCount} นาย, บาดเจ็บ ${injuredCount} นาย, พิการ ${disabledCount} นาย)`],
          ].map(([label, value]) =>
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.SOLID, color: "F0F4F8" },
                  children: [para([th(label as string, true, 22)])],
                }),
                new TableCell({
                  children: [para([th(value as string, false, 22)])],
                }),
              ],
            })
          ),
        ],
      })
    );

    // ── Section 2: บัญชีรายนาม ────────────────────────────────────────────
    children.push(
      para([], { spacing: { before: 200, after: 40 } }),
      para([th(`หมวดที่ ๒  บัญชีรายนามกำลังพลผู้ประสบความสูญเสีย (${totalCas} นาย)`, true, 24)], {
        spacing: { before: 160, after: 80 },
      })
    );

    // Casualties detail table
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              ...[
                ["ลำดับ", 5],
                ["ยศ ชื่อ-สกุล", 18],
                ["เลขทหาร / เลข ปชช.", 16],
                ["ตำแหน่ง / สังกัด", 16],
                ["กรุ๊ปเลือด", 7],
                ["เงินเดือน", 10],
                ["ประเภทสูญเสีย / อาการ", 16],
                ["สถานพยาบาล", 12],
              ].map(([label, size]) =>
                new TableCell({
                  width: { size: size as number, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.SOLID, color: "1A3A6B" },
                  children: [
                    para([th(label as string, true, 18, "FFFFFF")], { alignment: AlignmentType.CENTER }),
                  ],
                })
              ),
            ],
          }),
          ...casualties.map((c, idx) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [para([th(String(idx + 1), false, 20)], { alignment: AlignmentType.CENTER })],
                }),
                new TableCell({
                  children: [
                    para([th(`${c.rankAbbr} ${c.fullName}`.trim(), true, 20)]),
                    ...(c.dutyStatus ? [para([th(c.dutyStatus, false, 18, "555555")])] : []),
                  ],
                }),
                new TableCell({
                  children: [
                    para([th(`ทหาร: ${c.militaryId || "-"}`, false, 18)]),
                    ...(c.citizenId ? [para([th(`ปชช.: ${c.citizenId}`, false, 18)])] : []),
                  ],
                }),
                new TableCell({
                  children: [
                    para([th(c.normalPosition || c.unit || "-", false, 18)]),
                    para([th(c.normalUnit || "-", false, 18, "555555")]),
                    ...(c.fieldPosition ? [para([th(`สนาม: ${c.fieldPosition}`, false, 18, "993300")])] : []),
                  ],
                }),
                new TableCell({
                  children: [para([th(c.bloodGroup || "-", false, 20)], { alignment: AlignmentType.CENTER })],
                }),
                new TableCell({
                  children: [
                    para([th(c.salaryLevel || "-", false, 18)]),
                    ...(c.salaryAmount ? [para([th(`${c.salaryAmount.toLocaleString("th-TH")} บาท`, false, 18)])] : []),
                  ],
                }),
                new TableCell({
                  children: [
                    para([th(getLossTypeLabel(c.lossType), true, 20, c.lossType === "DECEASED" ? "CC0000" : c.lossType === "INJURED" ? "B35C00" : "6600CC")]),
                    ...(c.lossSeverity ? [para([th(c.lossSeverity, false, 18)])] : []),
                    ...(c.injuryDetails ? [para([th(c.injuryDetails, false, 18, "555555")])] : []),
                  ],
                }),
                new TableCell({
                  children: [para([th(c.hospital ? `รพ.${c.hospital}` : "-", false, 18)])],
                }),
              ],
            })
          ),
        ],
      })
    );

    // ── Section 3: พฤติการณ์เหตุการณ์ ────────────────────────────────────
    children.push(
      para([th("หมวดที่ ๓  รายละเอียดพฤติการณ์เหตุการณ์", true, 24)], {
        spacing: { before: 200, after: 80 },
      }),
      para([th(data.eventSummary || "-", false, 22)], { indent: { left: 720 } })
    );

    if (data.behaviorSummary) {
      children.push(
        para([th("พฤติกรรมเพิ่มเติม / หมายเหตุ", true, 22)], { spacing: { before: 120, after: 40 } }),
        para([th(data.behaviorSummary, false, 22)], { indent: { left: 720 } })
      );
    }

    // ── Section 4: ความเสียหายยุทโธปกรณ์ ────────────────────────────────
    children.push(
      para([th("หมวดที่ ๔  ความเสียหายยุทโธปกรณ์", true, 24)], {
        spacing: { before: 200, after: 80 },
      }),
      para([th(meta.equipmentDamage || "ไม่มีรายการยุทโธปกรณ์เสียหาย", false, 22)], { indent: { left: 720 } })
    );

    // ── Section 5: ข้อเสนอสิทธิกำลังพล ──────────────────────────────────
    children.push(
      para([th("หมวดที่ ๕  สิทธิที่กำลังพลผู้สูญเสียพึงได้รับ", true, 24)], {
        spacing: { before: 200, after: 80 },
      }),
      para([th("กำลังพลที่เสียชีวิต/พิการ/บาดเจ็บจากการปฏิบัติหน้าที่ราชการ มีสิทธิตามกฎหมายเรียกร้องสิทธิประโยชน์จากหน่วยงานที่เกี่ยวข้อง ได้แก่:", false, 22)]),
      para([th("  ๕.๑  บำเหน็จตกทอด / เงินช่วยเหลือพิเศษ", false, 22)]),
      para([th("  ๕.๒  เบี้ยหวัด / บำนาญ", false, 22)]),
      para([th("  ๕.๓  ทุนการศึกษาบุตร", false, 22)]),
      para([th("  ๕.๔  สิทธิมิใช่ตัวเงิน (เครื่องราชอิสริยาภรณ์, ปูนบำเหน็จพิเศษ)", false, 22)])
    );

    // ── Section 6: ลายเซ็นผู้บังคับบัญชา ────────────────────────────────
    children.push(
      para([th("หมวดที่ ๖  ความเห็นและรับรองของผู้บังคับบัญชา", true, 24)], {
        spacing: { before: 200, after: 80 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: thinBorder(),
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                children: [
                  para([th("ผู้บังคับบัญชา ชั้นที่ ๑ (ผบ.ร้อย)", true, 20)], { alignment: AlignmentType.CENTER }),
                  para([], { spacing: { before: 600, after: 0 } }),
                  para([th("ลงชื่อ .....................................", false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(`(${meta.commanderKP3Name || "............................................"})`, false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commanderKP3Rank || "ยศ ชื่อ", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commanderKP3Pos || "ผู้บังคับหมวด / ผู้บังคับร้อย", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  para([th("ผู้บังคับบัญชา ชั้นที่ ๒ (ผบ.พัน)", true, 20)], { alignment: AlignmentType.CENTER }),
                  para([], { spacing: { before: 600, after: 0 } }),
                  para([th("ลงชื่อ .....................................", false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(`(${meta.commander2KP3Name || "............................................"})`, false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commander2KP3Rank || "ยศ ชื่อ", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commander2KP3Pos || "ผู้บังคับกองพัน", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  para([th("ผู้บังคับบัญชา ชั้นที่ ๓ (ผบ.ฉก.)", true, 20)], { alignment: AlignmentType.CENTER }),
                  para([], { spacing: { before: 600, after: 0 } }),
                  para([th("ลงชื่อ .....................................", false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(`(${meta.commander3KP3Name || "............................................"})`, false, 20)], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commander3KP3Rank || "ยศ ชื่อ", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                  para([th(meta.commander3KP3Pos || "ผู้บังคับหน่วยเฉพาะกิจ", false, 18, "555555")], { alignment: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    return new Document({
      sections: [
        {
          properties: {
            page: { margin: { top: 720, bottom: 720, left: 1080, right: 720 } },
          },
          children,
        },
      ],
    });
  }

  // ─────────────────────── PDF ─────────────────────────────────────────────

  public static async generatePdf(
    data: LossIncidentReportDocData,
    template: LossDocumentTemplate
  ): Promise<Buffer> {
    const casualties: IncidentCasualty[] =
      data.casualties && data.casualties.length > 0
        ? data.casualties
        : [
            {
              id: "1",
              militaryId: data.militaryId || "-",
              rankAbbr: data.rankAbbr || "",
              fullName: data.fullName || "-",
              lossType: "DECEASED",
              lossSeverity: "",
              injuryDetails: "",
              hospital: "",
            },
          ];

    const meta: LossReportDispatchMeta = data.dispatchMeta ?? {};

    const pdf = await PDFDocument.create();
    const A4 = [595.28, 841.89] as [number, number];
    const page = pdf.addPage(A4);

    let font: any;
    let bold: any;
    let isThaiFont = false;

    const fontPath = join(process.cwd(), "public", "fonts", "NotoSansThai-Regular.ttf");
    if (existsSync(fontPath)) {
      try {
        pdf.registerFontkit(fontkit);
        const fontBytes = readFileSync(fontPath);
        font = await pdf.embedFont(fontBytes, { subset: true });
        bold = font;
        isThaiFont = true;
      } catch {
        font = await pdf.embedFont(StandardFonts.Helvetica);
        bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      }
    } else {
      font = await pdf.embedFont(StandardFonts.Helvetica);
      bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    }

    const safeStr = (text: string) => {
      if (isThaiFont) return text.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
      return text.replace(/[^\x00-\x7F]/g, "").trim() || "-";
    };

    const PAD_L = 48;
    const PAD_R = 48;
    const WIDTH = A4[0] - PAD_L - PAD_R;
    let y = 810;
    const lineH = 16;
    const secH = 22;

    const drawText = (text: string, x: number, yPos: number, size: number, f: any, color = rgb(0.1, 0.1, 0.1)) => {
      try {
        page.drawText(safeStr(text), { x, y: yPos, size, font: f, color, maxWidth: WIDTH - (x - PAD_L) });
      } catch {
        // ignore render errors
      }
    };

    const drawLine = (label: string, value: string, isSec = false, color = rgb(0.1, 0.1, 0.1)) => {
      if (y < 60) return;
      const sz = isSec ? 13 : 10;
      const lh = isSec ? secH : lineH;
      drawText(`${label}${value}`, PAD_L, y, sz, isSec ? bold : font, color);
      y -= lh;
    };

    const hrLine = () => {
      if (y < 60) return;
      page.drawLine({ start: { x: PAD_L, y }, end: { x: A4[0] - PAD_R, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
      y -= 6;
    };

    if (template === "KP4") {
      // ── KP4 PDF ────────────────────────────────────────────────────────
      drawLine("", "กระดาษเขียนข่าว  แบบ สส.๒", true);
      drawLine("", `รายงานการสูญเสีย (กพ.๔)  ${meta.classification || "ลับมาก"}`, true, rgb(0.7, 0, 0));
      hrLine();

      drawLine("ความเร่งด่วน: ", meta.urgency || "ด่วนที่สุด");
      drawLine("จาก: ", meta.fromUnit || "ผบ.พัน.ร.202 (RDF)");
      drawLine("ถึง (ผู้รับปฏิบัติ): ", meta.toUnit || "ผบ.ศปก.ทบ.");
      drawLine("ผู้รับทราบ: ", meta.infoUnits || "-");
      drawLine("ที่ของผู้ให้ข่าว: ", meta.referenceNumber || "-");
      drawLine("วันเวลา: ", `${data.incidentTime} น.  ${formatThaiDateBE(data.incidentDate)}`);
      hrLine();

      const totalCas = casualties.length;
      const deadC = casualties.filter((c) => c.lossType === "DECEASED").length;
      const injC = casualties.filter((c) => c.lossType === "INJURED").length;
      const disC = casualties.filter((c) => c.lossType === "DISABLED").length;
      const mf = meta.missionForce || `ชุดปฏิบัติการ ${totalCas + 5} นาย`;

      drawLine("", `๑. เมื่อ ${data.incidentTime} น. ${formatThaiDateBE(data.incidentDate)} โดย ${meta.fromUnit || "หน่วย"} ได้จัดกำลัง ${mf}`);
      drawLine("   ", `ทำการ ${data.engagementBehavior} บริเวณ ${buildLocationText(data)}`);
      drawLine("   ", `พิกัด MGRS: ${data.mgrsCoordinate || "-"}`);
      drawLine("   ", `มีกำลังพลสูญเสีย ${totalCas} นาย (เสียชีวิต ${deadC} นาย, บาดเจ็บ ${injC} นาย, พิการ ${disC} นาย) ดังนี้`);
      y -= 6;

      for (let i = 0; i < casualties.length; i++) {
        const c = casualties[i];
        const lossLabel = getLossTypeLabel(c.lossType);
        drawLine("", `   ๑.${i + 1} ${c.rankAbbr} ${c.fullName}  ทหาร: ${c.militaryId || "-"}${c.citizenId ? `  ปชช.: ${c.citizenId}` : ""}${c.bloodGroup ? `  กรุ๊ปเลือด: ${c.bloodGroup}` : ""}`);
        drawLine("       ", `ตำแหน่งปกติ: ${c.normalPosition || c.unit || "-"}  สังกัด: ${c.normalUnit || c.unit || "-"}`);
        if (c.fieldPosition) drawLine("       ", `ตำแหน่งในสนาม: ${c.fieldPosition}  หน่วย: ${c.fieldUnit || "-"}`);
        if (c.salaryLevel) drawLine("       ", `เงินเดือน: ${c.salaryLevel}${c.salaryAmount ? ` (${c.salaryAmount.toLocaleString("th-TH")} บาท)` : ""}`);
        drawLine("       ", `ประเภทสูญเสีย: ${lossLabel}${c.lossSeverity ? ` (${c.lossSeverity})` : ""}${c.injuryDetails ? `  ${c.injuryDetails}` : ""}${c.hospital ? `  รพ.${c.hospital}` : ""}`);
        y -= 4;
      }

      hrLine();
      if (data.eventSummary) {
        drawLine("", "๒. รายละเอียดพฤติการณ์เหตุการณ์");
        drawLine("   ", (data.eventSummary || "-").slice(0, 200));
        y -= 6;
      }
      hrLine();
      drawLine("ผู้รับรอง: ", meta.approverName || "..................................");
      drawLine("ผู้เขียน: ", `${meta.writerName || "................."}  หน่วย: ${meta.writerUnit || "................."}  โทร: ${meta.writerPhone || "................."}`);
    } else {
      // ── KP3 PDF ────────────────────────────────────────────────────────
      drawLine("", "แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.๓)", true);
      hrLine();

      drawLine("เลขที่รายงาน: ", data.id);
      drawLine("วันที่เกิดเหตุ: ", formatThaiDateBE(data.incidentDate));
      drawLine("เวลา: ", `${data.incidentTime} น.`);
      drawLine("พิกัด MGRS: ", data.mgrsCoordinate || "-");
      drawLine("Lat/Long: ", data.latitude != null ? `${data.latitude.toFixed(6)}, ${data.longitude!.toFixed(6)}` : "-");
      drawLine("สถานที่เกิดเหตุ: ", buildLocationText(data));
      drawLine("พฤติการณ์: ", data.engagementBehavior);
      drawLine("การกระทำโดย: ", data.enemyAction === "ENEMY" ? "ฝ่ายตรงข้าม/ข้าศึก" : "ไม่ใช่ฝ่ายตรงข้าม");
      const totalCas = casualties.length;
      const deadC = casualties.filter((c) => c.lossType === "DECEASED").length;
      const injC = casualties.filter((c) => c.lossType === "INJURED").length;
      const disC = casualties.filter((c) => c.lossType === "DISABLED").length;
      drawLine("ยอดสูญเสียรวม: ", `${totalCas} นาย (เสียชีวิต ${deadC}, บาดเจ็บ ${injC}, พิการ ${disC})`);
      hrLine();

      drawLine("", "บัญชีรายนามกำลังพลผู้ประสบความสูญเสีย:", true);
      for (let i = 0; i < Math.min(casualties.length, 8); i++) {
        const c = casualties[i];
        const lossLabel = getLossTypeLabel(c.lossType);
        drawLine("", `[${i + 1}] ${c.rankAbbr} ${c.fullName}  ทหาร: ${c.militaryId || "-"}${c.citizenId ? `  ปชช.: ${c.citizenId}` : ""}${c.bloodGroup ? `  กรุ๊ปเลือด: ${c.bloodGroup}` : ""}`);
        drawLine("    ", `ตำแหน่ง: ${c.normalPosition || c.unit || "-"}  สังกัด: ${c.normalUnit || c.unit || "-"}`);
        if (c.fieldPosition) drawLine("    ", `สนาม: ${c.fieldPosition}  หน่วย: ${c.fieldUnit || "-"}`);
        if (c.salaryLevel) drawLine("    ", `เงินเดือน: ${c.salaryLevel}${c.salaryAmount ? ` (${c.salaryAmount.toLocaleString("th-TH")} บาท)` : ""}`);
        drawLine("    ", `ประเภท: ${lossLabel}${c.lossSeverity ? ` - ${c.lossSeverity}` : ""}${c.injuryDetails ? `  ${c.injuryDetails}` : ""}${c.hospital ? `  รพ.${c.hospital}` : ""}`);
        y -= 4;
      }
      if (casualties.length > 8) drawLine("", `...และอีก ${casualties.length - 8} นาย`);

      hrLine();
      drawLine("", "พฤติการณ์เหตุการณ์:", true);
      drawLine("", (data.eventSummary || "-").slice(0, 300));
      if (data.behaviorSummary) {
        hrLine();
        drawLine("", "หมายเหตุเพิ่มเติม:", true);
        drawLine("", (data.behaviorSummary || "").slice(0, 200));
      }
      hrLine();
      drawLine("ยุทโธปกรณ์เสียหาย: ", meta.equipmentDamage || "ไม่มี");
      hrLine();
      drawLine("ลงชื่อผู้บังคับบัญชา ชั้น ๑ (ผบ.ร้อย): ", meta.commanderKP3Name ? `${meta.commanderKP3Rank || ""} ${meta.commanderKP3Name}  ${meta.commanderKP3Pos || ""}` : ".........................");
      drawLine("ลงชื่อผู้บังคับบัญชา ชั้น ๒ (ผบ.พัน): ", meta.commander2KP3Name ? `${meta.commander2KP3Rank || ""} ${meta.commander2KP3Name}  ${meta.commander2KP3Pos || ""}` : ".........................");
      drawLine("ลงชื่อผู้บังคับบัญชา ชั้น ๓ (ผบ.ฉก.): ", meta.commander3KP3Name ? `${meta.commander3KP3Rank || ""} ${meta.commander3KP3Name}  ${meta.commander3KP3Pos || ""}` : ".........................");
    }

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  }
}
