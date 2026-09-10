import { describe, it, expect } from "vitest";
import { TelegramNotificationService } from "@/infrastructure/services/TelegramNotificationService";
import { NotificationRepository } from "@/infrastructure/database/repositories/NotificationRepository";
import { LossIncidentReportRecord } from "@/infrastructure/database/repositories/LossIncidentReportRepository";

describe("TelegramNotificationService", () => {
  it("should correctly escape HTML special characters", () => {
    expect(TelegramNotificationService.escapeHtml("AT&T <test> & foo")).toBe("AT&amp;T &lt;test&gt; &amp; foo");
    expect(TelegramNotificationService.escapeHtml(null)).toBe("");
  });

  it("should format Thai Buddhist date accurately", () => {
    const d = new Date("2026-09-10T08:30:00Z");
    const thaiDate = TelegramNotificationService.formatThaiDate(d);
    expect(thaiDate).toContain("2569");
    expect(thaiDate).toContain("ก.ย.");
  });

  it("should format loss incident alert with casualties, MGRS, and military dispatch elements", () => {
    const mockReport: LossIncidentReportRecord = {
      id: "report-123",
      personnelId: "p-01",
      militaryId: "1234567890",
      rankAbbr: "ร.อ.",
      fullName: "สมชาย รักชาติ",
      incidentDate: new Date("2026-09-10T08:30:00Z"),
      incidentTime: "08:30",
      mgrsCoordinate: "47N QH 1234 5678",
      latitude: 6.5,
      longitude: 101.8,
      village: "3",
      houseNo: null,
      road: "สาย 42",
      subdistrict: "บาเจาะ",
      district: "บาเจาะ",
      province: "นราธิวาส",
      eventSummary: "คนร้ายลอบวางระเบิดแสวงเครื่องและซุ่มยิง ชป.จรยุทธ์ ขณะลาดตระเวน",
      behaviorSummary: null,
      engagementBehavior: "ปะทะ+ยิงต่อสู้",
      enemyAction: "ENEMY",
      createdByUserId: "user-1",
      createdByUserName: "จ.ส.อ. ประจำการ ทำดี",
      updatedByUserId: null,
      updatedByUserName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      casualties: [
        {
          id: "cas-1",
          militaryId: "1234567890",
          rankAbbr: "ร.อ.",
          fullName: "สมชาย รักชาติ",
          lossType: "DECEASED",
          lossSeverity: "เสียชีวิตทันทีในสนามรบ",
          injuryDetails: "ถูกสะเก็ดระเบิดเข้าบริเวณศีรษะ",
          hospital: "รพ.บาเจาะ",
          unit: "ร.19 พัน.1",
        },
        {
          id: "cas-2",
          militaryId: "9876543210",
          rankAbbr: "ส.อ.",
          fullName: "ยิ่งชีพ มั่นคง",
          lossType: "INJURED",
          lossSeverity: "บาดเจ็บสาหัส (อาการวิกฤต)",
          injuryDetails: "แน่นหน้าอกและมีแผลฉีกขาดที่ขาขวา",
          hospital: "รพ.นราธิวาสราชนครินทร์",
          unit: "ฉก.นราธิวาส",
        },
      ],
    };

    const message = TelegramNotificationService.formatLossIncidentMessage(mockReport, "http://test-server");

    expect(message).toContain("รายงานการสูญเสียกำลังพล");
    expect(message).toContain("47N QH 1234 5678");
    expect(message).toContain("ต.บาเจาะ อ.บาเจาะ จ.นราธิวาส");
    expect(message).toContain("ปะทะ+ยิงต่อสู้");
    expect(message).toContain("กำลังพลประสบเหตุ (2 นาย)");
    expect(message).toContain("🔴 เสียชีวิต");
    expect(message).toContain("ร.อ. สมชาย รักชาติ");
    expect(message).toContain("🟡 บาดเจ็บสาหัส");
    expect(message).toContain("ส.อ. ยิ่งชีพ มั่นคง");
    expect(message).toContain("จ.ส.อ. ประจำการ ทำดี");
    expect(message).toContain("http://test-server/loss-reports");
  });
});

describe("NotificationRepository", () => {
  const repo = new NotificationRepository();

  it("should create an in-system notification and query it", async () => {
    const created = await repo.create({
      title: "🚨 ทดสอบการแจ้งเตือนการสูญเสีย",
      message: "ทดสอบข้อความแจ้งเตือนกำลังพลประสบเหตุ",
      type: "LOSS_INCIDENT",
      link: "/loss-reports?id=test-123",
      metadata: { casualtiesCount: 2 },
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("🚨 ทดสอบการแจ้งเตือนการสูญเสีย");
    expect(created.isRead).toBe(false);

    const list = await repo.findMany({ limit: 10 });
    expect(list.some((n) => n.id === created.id)).toBe(true);

    const unreadCount = await repo.getUnreadCount();
    expect(unreadCount).toBeGreaterThan(0);
  });

  it("should mark notification as read", async () => {
    const created = await repo.create({
      title: "แจ้งเตือนสำหรับทดสอบ markAsRead",
      message: "รายละเอียดข้อความ",
      type: "INFO",
    });

    const initialUnread = await repo.getUnreadCount();
    const marked = await repo.markAsRead(created.id);
    expect(marked).toBe(true);

    const afterUnread = await repo.getUnreadCount();
    expect(afterUnread).toBe(initialUnread - 1);
  });

  it("should mark all notifications as read", async () => {
    await repo.create({ title: "Notif 1", message: "Msg 1" });
    await repo.create({ title: "Notif 2", message: "Msg 2" });

    const count = await repo.markAllAsRead();
    expect(count).toBeGreaterThanOrEqual(2);

    const unreadCount = await repo.getUnreadCount();
    expect(unreadCount).toBe(0);
  });
});
