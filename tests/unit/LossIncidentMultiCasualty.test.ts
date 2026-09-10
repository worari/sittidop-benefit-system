import { describe, it, expect, beforeEach } from "vitest";
import {
  LossIncidentReportRepository,
  IncidentCasualty,
  packCasualties,
  unpackCasualties,
} from "@/infrastructure/database/repositories/LossIncidentReportRepository";
import { LossIncidentReportDocumentService } from "@/core/use-cases/documents/LossIncidentReportDocumentService";

describe("LossIncidentMultiCasualty System", () => {
  let repo: LossIncidentReportRepository;

  beforeEach(() => {
    repo = new LossIncidentReportRepository();
  });

  it("should correctly pack and unpack casualties into notes/json payload", () => {
    const casualties: IncidentCasualty[] = [
      {
        id: "cas-1",
        personnelId: "p-01",
        militaryId: "1234567890",
        rankAbbr: "ส.อ.",
        fullName: "สมชาย ใจกล้า",
        lossType: "DECEASED",
        lossSeverity: "เสียชีวิตทันทีในสนามรบ",
        injuryDetails: "ถูกสะเก็ดระเบิดบริเวณหน้าอก",
        hospital: "รพ.ค่ายวชิราวุธ",
      },
      {
        id: "cas-2",
        personnelId: "p-02",
        militaryId: "2345678901",
        rankAbbr: "จ.ส.อ.",
        fullName: "ประสิทธิ์ รบเก่ง",
        lossType: "DISABLED",
        lossSeverity: "พิการทุพพลภาพขนาดหนัก",
        injuryDetails: "สูญเสียขาทั้งสองข้าง",
        hospital: "รพ.พระมงกุฎเกล้า",
      },
      {
        id: "cas-3",
        personnelId: "p-03",
        militaryId: "3456789012",
        rankAbbr: "ส.ต.",
        fullName: "วิชัย สู้ศึก",
        lossType: "INJURED",
        lossSeverity: "บาดเจ็บปานกลาง",
        injuryDetails: "ถูกกระสุนปืนที่ต้นแขนซ้าย",
        hospital: "รพ.ค่ายเสนาณรงค์",
      },
    ];

    const packed = packCasualties("หมายเหตุเพิ่มเติมในที่เกิดเหตุ", casualties);
    expect(typeof packed).toBe("string");

    const unpacked = unpackCasualties(packed);
    expect(unpacked.notes).toBe("หมายเหตุเพิ่มเติมในที่เกิดเหตุ");
    expect(unpacked.casualties).toHaveLength(3);
    expect(unpacked.casualties[0].fullName).toBe("สมชาย ใจกล้า");
    expect(unpacked.casualties[0].lossType).toBe("DECEASED");
    expect(unpacked.casualties[1].lossType).toBe("DISABLED");
    expect(unpacked.casualties[2].lossType).toBe("INJURED");
  });

  it("should handle plain text legacy notes gracefully without crashing", () => {
    const legacySummary = "ข้อความบันทึกแบบเก่าที่ไม่มี JSON";
    const unpacked = unpackCasualties(legacySummary);
    expect(unpacked.notes).toBe(legacySummary);
    expect(unpacked.casualties).toEqual([]);
  });

  it("should create, search, update and delete a multi-casualty incident report", async () => {
    const casualties: IncidentCasualty[] = [
      {
        id: "cas-101",
        personnelId: "pid-101",
        militaryId: "1111111111",
        rankAbbr: "ร.อ.",
        fullName: "วีรพงษ์ ภักดี",
        lossType: "DECEASED",
        lossSeverity: "เสียชีวิตทันทีในสนามรบ",
        injuryDetails: "ถูกซุ่มยิงเข้าที่ลำตัว",
      },
      {
        id: "cas-102",
        personnelId: "pid-102",
        militaryId: "2222222222",
        rankAbbr: "ส.ท.",
        fullName: "ธนวัฒน์ พิทักษ์",
        lossType: "INJURED",
        lossSeverity: "บาดเจ็บสาหัส (อาการวิกฤต)",
        injuryDetails: "ถูกสะเก็ดระเบิดเข้าที่ศีรษะและลำคอ",
        hospital: "รพ.ศูนย์ยะลา",
      },
    ];

    // 1. Create
    const created = await repo.create({
      incidentDate: new Date("2026-06-15T08:30:00Z"),
      incidentTime: "08:30",
      mgrsCoordinate: "47PNT99998888",
      latitude: 6.5,
      longitude: 101.2,
      province: "ยะลา",
      district: "บันนังสตา",
      subdistrict: "บาเจาะ",
      village: "บ้านบาเจาะ หมู่ 2",
      houseNo: null,
      road: "ทล.410",
      eventSummary: "ขณะปฏิบัติหน้าที่คุ้มครองครู คนร้ายได้ลอบจุดชนวนระเบิดแสวงเครื่อง",
      behaviorSummary: "ผลการตรวจสอบ EOD พบเป็นระเบิดถังแก๊ส 20 กก.",
      engagementBehavior: "ถูกลอบยิง/ลอบวางระเบิด",
      enemyAction: "ENEMY",
      createdByUserId: "tester",
      createdByUserName: "ผู้ทดสอบ",
      updatedByUserId: null,
      updatedByUserName: null,
      personnelId: casualties[0].personnelId ?? null,
      militaryId: casualties[0].militaryId ?? null,
      rankAbbr: casualties[0].rankAbbr ?? null,
      fullName: casualties[0].fullName ?? null,
      casualties,
    });

    expect(created.id).toBeDefined();
    expect(created.casualties).toHaveLength(2);
    expect(created.casualties[0].fullName).toBe("วีรพงษ์ ภักดี");
    expect(created.casualties[0].lossType).toBe("DECEASED");
    expect(created.casualties[1].fullName).toBe("ธนวัฒน์ พิทักษ์");
    expect(created.casualties[1].lossType).toBe("INJURED");

    // 2. Search by any casualty's name or militaryId
    const searchByName = await repo.findMany({ search: "ธนวัฒน์" });
    expect(searchByName.some((r) => r.id === created.id)).toBe(true);

    const searchByMilitaryId = await repo.findMany({ search: "2222222222" });
    expect(searchByMilitaryId.some((r) => r.id === created.id)).toBe(true);

    const searchByMGRS = await repo.findMany({ search: "47PNT99998888" });
    expect(searchByMGRS.some((r) => r.id === created.id)).toBe(true);

    // 3. Update (Add a 3rd casualty)
    const updatedCasualties: IncidentCasualty[] = [
      ...casualties,
      {
        id: "cas-103",
        personnelId: "pid-103",
        militaryId: "3333333333",
        rankAbbr: "พลฯ",
        fullName: "อนุชา รักษาชาติ",
        lossType: "DISABLED",
        lossSeverity: "พิการทุพพลภาพจนปลดประจำการ",
        injuryDetails: "แก้วหูทะลุและสูญเสียการได้ยินถาวร",
      },
    ];

    const updated = await repo.update(created.id, {
      casualties: updatedCasualties,
      eventSummary: "ขณะปฏิบัติหน้าที่คุ้มครองครู คนร้ายได้ลอบจุดชนวนระเบิดแสวงเครื่อง (มีผู้บาดเจ็บเพิ่ม 1 นาย)",
    });

    expect(updated).not.toBeNull();
    expect(updated?.casualties).toHaveLength(3);
    expect(updated?.casualties[2].fullName).toBe("อนุชา รักษาชาติ");
    expect(updated?.casualties[2].lossType).toBe("DISABLED");

    // 4. Delete
    const deleted = await repo.delete(created.id);
    expect(deleted?.id).toBe(created.id);

    const checkAfterDelete = await repo.findById(created.id);
    expect(checkAfterDelete).toBeNull();
  });

  it("should generate KP3 and KP4 DOCX and PDF documents with multi-casualty data without error", async () => {
    const docData = {
      id: "TEST-REP-001",
      incidentDate: new Date("2026-06-15"),
      incidentTime: "09:15",
      mgrsCoordinate: "47PNT12345678",
      latitude: 6.55,
      longitude: 101.28,
      province: "นราธิวาส",
      district: "เจาะไอร้อง",
      subdistrict: "จวบ",
      village: "บ้านจวบ",
      eventSummary: "ถูกซุ่มโจมตีขณะลาดตระเวนเดินเท้า",
      behaviorSummary: "นำส่ง รพ.เจาะไอร้อง ทันที",
      engagementBehavior: "การรบประชิด/ซุ่มโจมตี",
      enemyAction: "ENEMY",
      militaryId: "1234567890",
      rankAbbr: "ส.อ.",
      fullName: "สมชาย ผู้กล้า",
      casualties: [
        {
          id: "c-1",
          militaryId: "1234567890",
          rankAbbr: "ส.อ.",
          fullName: "สมชาย ผู้กล้า",
          lossType: "DECEASED" as const,
          lossSeverity: "เสียชีวิตทันทีในสนามรบ",
          injuryDetails: "ถูกซุ่มยิงบริเวณศีรษะ",
          hospital: "รพ.เจาะไอร้อง",
        },
        {
          id: "c-2",
          militaryId: "9876543210",
          rankAbbr: "ส.ท.",
          fullName: "สมเกียรติ ยืนยง",
          lossType: "INJURED" as const,
          lossSeverity: "บาดเจ็บปานกลาง",
          injuryDetails: "ถูกสะเก็ดระเบิดที่ขาขวา",
          hospital: "รพ.สุไหงโก-ลก",
        },
      ],
    };

    const docxKp3 = await LossIncidentReportDocumentService.generateDocx(docData, "KP3");
    expect(docxKp3).toBeInstanceOf(Buffer);
    expect(docxKp3.length).toBeGreaterThan(1000);

    const docxKp4 = await LossIncidentReportDocumentService.generateDocx(docData, "KP4");
    expect(docxKp4).toBeInstanceOf(Buffer);
    expect(docxKp4.length).toBeGreaterThan(1000);

    const pdfKp3 = await LossIncidentReportDocumentService.generatePdf(docData, "KP3");
    expect(pdfKp3).toBeInstanceOf(Buffer);
    expect(pdfKp3.length).toBeGreaterThan(500);

    const pdfKp4 = await LossIncidentReportDocumentService.generatePdf(docData, "KP4");
    expect(pdfKp4).toBeInstanceOf(Buffer);
    expect(pdfKp4.length).toBeGreaterThan(500);
  });
});
