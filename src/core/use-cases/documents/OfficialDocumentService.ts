import * as QRCode from "qrcode";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
} from "docx";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { formatCurrency } from "@/presentation/lib/utils";

export type DocumentTemplateType =
  | "BENEFIT_SUMMARY"
  | "BENEFIT_CERTIFICATE"
  | "HEIR_REPORT"
  | "CLAIM_FORM";

export interface DocumentExportOptions {
  template: DocumentTemplateType;
  personnel: MilitaryPersonnelRecord;
  docNumber?: string;
  issuedDate?: string;
  officerName?: string;
  officerPosition?: string;
  includeLogo?: boolean;
  includeQrCode?: boolean;
  includeSignature?: boolean;
}

export class OfficialDocumentService {
  /**
   * Generates a QR Code Data URL for digital e-verification
   */
  public static async generateQrCodeDataUrl(verifyCode: string): Promise<string> {
    const payload = `https://sittidop.mod.go.th/verify?code=${encodeURIComponent(
      verifyCode
    )}&timestamp=${Date.now()}`;
    return await QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  }

  /**
   * Generates Microsoft Word (.docx) document for any of the 4 templates
   */
  public static async generateDocx(options: DocumentExportOptions): Promise<Buffer> {
    const {
      template,
      personnel,
      docNumber = `กห-0201/2569-${Math.floor(1000 + Math.random() * 9000)}`,
      issuedDate = "21 สิงหาคม 2569",
      officerName = "พลโท สมโชค ชัยชนะ",
      officerPosition = "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)",
    } = options;

    const rules = militaryRuleRepository.getAllRules();
    const calculation = MilitaryRuleEngine.calculate(personnel, rules);

    const docChildren: (Paragraph | Table)[] = [];

    // Header Title
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "กระทรวงกลาโหม • กองทัพบก",
            bold: true,
            size: 28, // 14pt
            font: "TH Sarabun New",
          }),
        ],
      })
    );

    let docTitle = "หนังสือสรุปรายการประมาณการสิทธิกำลังพล 4 หมวด";
    if (template === "BENEFIT_CERTIFICATE") docTitle = "หนังสือรับรองสิทธิประโยชน์กำลังพลและทายาททางการ";
    if (template === "HEIR_REPORT") docTitle = "รายงานบัญชีการจัดสรรสิทธิประโยชน์ทายาทตามกฎหมาย";
    if (template === "CLAIM_FORM") docTitle = "แบบคำขอรับเงินสงเคราะห์และสิทธิประโยชน์กำลังพล";

    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: docTitle,
            bold: true,
            size: 32, // 16pt
            font: "TH Sarabun New",
          }),
        ],
      })
    );

    // Document Meta
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `เลขที่เอกสาร: ${docNumber}   |   วันที่ออกหนังสือ: ${issuedDate}`,
            size: 22,
            font: "TH Sarabun New",
          }),
        ],
      })
    );

    // Personnel Info Box
    docChildren.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `กำลังพลผู้รับสิทธิ: ${personnel.rankAbbr} ${personnel.firstName} ${personnel.lastName} (ID: ${personnel.militaryId})`,
            bold: true,
            size: 24,
            font: "TH Sarabun New",
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `สังกัด: ${personnel.normalUnit}   |   สังกัดสนาม: ${personnel.fieldUnit || "-"}   |   ความสูญเสีย: ${personnel.lossType}`,
            size: 22,
            font: "TH Sarabun New",
          }),
        ],
      })
    );

    // Content based on template
    if (template === "BENEFIT_SUMMARY" || template === "BENEFIT_CERTIFICATE") {
      // 4 Categories Table
      const tableRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "หมวดสิทธิประโยชน์", bold: true, font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "ลักษณะการจ่าย", bold: true, font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "ยอดเงินประมาณการ (บาท)", bold: true, font: "TH Sarabun New" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "หมวด 1: รับเงินครั้งเดียว (Lump Sum)", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "จ่ายครั้งเดียวแก่ทายาท", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(calculation.grandTotalLumpSum), font: "TH Sarabun New" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "หมวด 2: รับเงินรายเดือน (Monthly Pension)", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "จ่ายรายเดือนตลอดชีพ", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${formatCurrency(calculation.grandTotalMonthlyPension)} / เดือน`, font: "TH Sarabun New" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "หมวด 3: รับเงินรายปี (Annual Grants)", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "ทุนการศึกษาบุตรรายปี", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${formatCurrency(calculation.grandTotalAnnualScholarship)} / ปี`, font: "TH Sarabun New" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "หมวด 4: สิทธิมิใช่ตัวเงิน (Non-Monetary)", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "สิทธิบรรจุทายาท / รักษาพยาบาล", font: "TH Sarabun New" })] })],
            }),
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "มีสิทธิได้รับตามระเบียบ", font: "TH Sarabun New" })] })],
            }),
          ],
        }),
      ];

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    } else if (template === "HEIR_REPORT") {
      // Heir Distribution Table
      const heirRows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ชื่อ-สกุล ทายาท", bold: true, font: "TH Sarabun New" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ความสัมพันธ์", bold: true, font: "TH Sarabun New" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "สัดส่วน (%)", bold: true, font: "TH Sarabun New" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "เงินก้อนจัดสรร (บาท)", bold: true, font: "TH Sarabun New" })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "บำนาญรายเดือน (บาท)", bold: true, font: "TH Sarabun New" })] })] }),
          ],
        }),
        ...calculation.heirDistribution.map(
          (h) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.heirName, font: "TH Sarabun New" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.relationship, font: "TH Sarabun New" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${h.sharePercentage}%`, font: "TH Sarabun New" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(h.allocatedLumpSum), font: "TH Sarabun New" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(h.allocatedMonthlyPension), font: "TH Sarabun New" })] })] }),
              ],
            })
        ),
      ];

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: heirRows,
        })
      );
    } else if (template === "CLAIM_FORM") {
      // Claim Form Checklist
      docChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "เอกสารและหลักฐานประกอบการยื่นคำขอรับสิทธิประโยชน์:",
              bold: true,
              size: 24,
              font: "TH Sarabun New",
            }),
          ],
        })
      );

      const checklist = [
        "[  ] สำเนาใบมรณบัตร หรือหนังสือรับรองการบาดเจ็บ/ทุพพลภาพจากการปฏิบัติหน้าที่",
        "[  ] สำเนาทะเบียนบ้าน และสำเนาบัตรประจำตัวประชาชนของผู้รับสิทธิและทายาท",
        "[  ] สำเนาทะเบียนสมรส (กรณีคู่สมรสยื่นคำขอ)",
        "[  ] สำเนาสูติบัตรบุตรทุกคน และหนังสือรับรองสถานภาพการศึกษาจากสถานศึกษา",
        "[  ] สำเนาสมุดบัญชีเงินฝากธนาคารสำหรับรับโอนเงินสงเคราะห์",
      ];

      for (const item of checklist) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: item, size: 22, font: "TH Sarabun New" })],
          })
        );
      }
    }

    // Signature and e-Verification Section
    docChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `ลงชื่อ ...........................................................`,
            font: "TH Sarabun New",
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `(${officerName})`,
            bold: true,
            font: "TH Sarabun New",
          }),
        ],
      })
    );
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: officerPosition,
            font: "TH Sarabun New",
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
