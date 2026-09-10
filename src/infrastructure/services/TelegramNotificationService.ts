import { prisma } from "@/infrastructure/database/prisma";
import { LossIncidentReportRecord, IncidentCasualty } from "@/infrastructure/database/repositories/LossIncidentReportRepository";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

// In-memory cache for fallback or fast access
let inMemoryConfig: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
  enabled: process.env.TELEGRAM_NOTIFY_ENABLED !== "false",
};

export class TelegramNotificationService {
  /**
   * Read current Telegram configuration from SystemSetting or env variables
   */
  static async getConfig(): Promise<TelegramConfig> {
    try {
      const settingModel = (prisma as any).systemSetting;
      if (settingModel?.findMany) {
        const settings = await settingModel.findMany({
          where: {
            key: { in: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_NOTIFY_ENABLED"] },
          },
        });

        const map: Record<string, string> = {};
        for (const s of settings) {
          map[s.key] = s.value;
        }

        const botToken = map["TELEGRAM_BOT_TOKEN"] ?? process.env.TELEGRAM_BOT_TOKEN ?? inMemoryConfig.botToken;
        const chatId = map["TELEGRAM_CHAT_ID"] ?? process.env.TELEGRAM_CHAT_ID ?? inMemoryConfig.chatId;
        const enabledStr = map["TELEGRAM_NOTIFY_ENABLED"] ?? (process.env.TELEGRAM_NOTIFY_ENABLED ?? (inMemoryConfig.enabled ? "true" : "false"));
        const enabled = enabledStr === "true" || enabledStr === "1";

        inMemoryConfig = { botToken, chatId, enabled };
        return inMemoryConfig;
      }
    } catch {
      // Fallback to in-memory / env
    }
    return inMemoryConfig;
  }

  /**
   * Save Telegram configuration to SystemSetting table
   */
  static async saveConfig(newConfig: Partial<TelegramConfig>): Promise<TelegramConfig> {
    const current = await this.getConfig();
    const updated: TelegramConfig = {
      botToken: newConfig.botToken !== undefined ? newConfig.botToken.trim() : current.botToken,
      chatId: newConfig.chatId !== undefined ? newConfig.chatId.trim() : current.chatId,
      enabled: newConfig.enabled !== undefined ? Boolean(newConfig.enabled) : current.enabled,
    };

    try {
      const settingModel = (prisma as any).systemSetting;
      if (settingModel?.upsert) {
        await Promise.all([
          settingModel.upsert({
            where: { key: "TELEGRAM_BOT_TOKEN" },
            update: { value: updated.botToken },
            create: { key: "TELEGRAM_BOT_TOKEN", value: updated.botToken, description: "Telegram Bot Token for Loss Incident Alerts" },
          }),
          settingModel.upsert({
            where: { key: "TELEGRAM_CHAT_ID" },
            update: { value: updated.chatId },
            create: { key: "TELEGRAM_CHAT_ID", value: updated.chatId, description: "Telegram Target Chat/Group ID" },
          }),
          settingModel.upsert({
            where: { key: "TELEGRAM_NOTIFY_ENABLED" },
            update: { value: updated.enabled ? "true" : "false" },
            create: { key: "TELEGRAM_NOTIFY_ENABLED", value: updated.enabled ? "true" : "false", description: "Enable Telegram notifications" },
          }),
        ]);
      }
    } catch {
      // Database write failed, retain in-memory
    }

    inMemoryConfig = updated;
    return updated;
  }

  /**
   * Escape HTML special characters for Telegram HTML parse mode
   */
  static escapeHtml(text: string | null | undefined): string {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Format Thai Buddhist date
   */
  static formatThaiDate(date: Date | string): string {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return String(date);
      const thMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
      ];
      const day = d.getDate();
      const month = thMonths[d.getMonth()];
      const year = d.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return String(date);
    }
  }

  /**
   * Build formatted message for a Loss Incident Report
   */
  static formatLossIncidentMessage(report: LossIncidentReportRecord, appUrl?: string): string {
    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const thaiDate = this.formatThaiDate(report.incidentDate);
    
    // Address format
    const locationParts = [
      report.village ? `ม.${report.village}` : null,
      report.houseNo ? `บ้านเลขที่ ${report.houseNo}` : null,
      report.road ? `ถ.${report.road}` : null,
      report.subdistrict ? `ต.${report.subdistrict}` : null,
      report.district ? `อ.${report.district}` : null,
      report.province ? `จ.${report.province}` : null,
    ].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(" ") : "ไม่ระบุพื้นที่";

    const casualties: IncidentCasualty[] = report.casualties || [];
    const casualtyLines = casualties.map((c, idx) => {
      let lossTag = "บาดเจ็บ";
      if (c.lossType === "DECEASED") lossTag = "🔴 เสียชีวิต";
      else if (c.lossType === "DISABLED") lossTag = "🟠 ทุพพลภาพ";
      else if (c.lossSeverity?.includes("สาหัส")) lossTag = "🟡 บาดเจ็บสาหัส";
      else lossTag = "🟢 บาดเจ็บ";

      const name = `${c.rankAbbr || ""} ${c.fullName || "-"}`.trim();
      const unit = c.unit || c.fieldUnit || c.normalUnit ? ` [${c.unit || c.fieldUnit || c.normalUnit}]` : "";
      const injury = c.injuryDetails ? ` (${c.injuryDetails})` : "";
      const hosp = c.hospital ? ` นำส่ง: รพ.${c.hospital}` : "";

      return `${idx + 1}. ${lossTag} <b>${this.escapeHtml(name)}</b> (ทบ. <code>${this.escapeHtml(c.militaryId || "-")}</code>)${this.escapeHtml(unit)}${this.escapeHtml(injury)}${this.escapeHtml(hosp)}`;
    });

    const casualtiesSection = casualtyLines.length > 0
      ? `\n👥 <b>กำลังพลประสบเหตุ (${casualties.length} นาย):</b>\n${casualtyLines.join("\n")}`
      : `\n👥 <b>กำลังพลหลัก:</b> ${this.escapeHtml(report.rankAbbr || "")} ${this.escapeHtml(report.fullName || "-")} (ทบ. <code>${this.escapeHtml(report.militaryId || "-")}</code>)`;

    const reporter = report.createdByUserName || "เจ้าหน้าที่ในระบบ";
    const viewUrl = `${baseUrl}/loss-reports`;

    return [
      `🚨 <b>[ด่วนที่สุด] รายงานการสูญเสียกำลังพล</b> 🚨`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 <b>วัน-เวลาเกิดเหตุ:</b> ${thaiDate} เวลา ${report.incidentTime || "00:00"} น.`,
      `📍 <b>พิกัด MGRS:</b> <code>${this.escapeHtml(report.mgrsCoordinate || "-")}</code>`,
      `🗺️ <b>สถานที่:</b> ${this.escapeHtml(locationStr)}`,
      `💥 <b>ลักษณะการปะทะ:</b> ${this.escapeHtml(report.engagementBehavior || "-")} (โดย: ${this.escapeHtml(report.enemyAction || "ENEMY")})`,
      `📝 <b>สรุปเหตุการณ์:</b> ${this.escapeHtml(report.eventSummary || "-")}`,
      casualtiesSection,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>ผู้บันทึกรายงาน:</b> ${this.escapeHtml(reporter)}`,
      `🕒 <b>เวลาบันทึก:</b> ${new Date().toLocaleString("th-TH")}`,
      `🔗 <a href="${viewUrl}">คลิกเปิดดูรายงานในระบบสิทธิกำลังพล ทบ.</a>`,
    ].join("\n");
  }

  /**
   * Send arbitrary message to Telegram Bot API
   */
  static async sendMessage(
    text: string,
    options?: { chatId?: string; botToken?: string }
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    const config = await this.getConfig();
    const token = options?.botToken || config.botToken;
    const chat = options?.chatId || config.chatId;

    if (!token || !chat) {
      return {
        success: false,
        error: "Telegram Bot Token หรือ Chat ID ยังไม่ได้ถูกกำหนดค่า",
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        return {
          success: false,
          error: data.description || `Telegram API error (${response.status})`,
        };
      }

      return {
        success: true,
        messageId: data.result?.message_id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ Telegram API",
      };
    }
  }

  /**
   * High-level method: Send loss incident alert
   */
  static async sendLossIncidentAlert(
    report: LossIncidentReportRecord,
    appUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return { success: false, error: "Telegram notification is disabled in settings" };
    }
    if (!config.botToken || !config.chatId) {
      return { success: false, error: "Telegram botToken or chatId not configured" };
    }

    const message = this.formatLossIncidentMessage(report, appUrl);
    return this.sendMessage(message, { botToken: config.botToken, chatId: config.chatId });
  }

  /**
   * Send test message to verify Telegram Bot configuration
   */
  static async sendTestMessage(
    chatId?: string,
    botToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    const timeNow = new Date().toLocaleString("th-TH");
    const testText = [
      `🔔 <b>[ทดสอบระบบแจ้งเตือน] ระบบสิทธิกำลังพล ทบ.</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ การเชื่อมต่อ Telegram Bot API สำเร็จสมบูรณ์!`,
      `🕒 <b>เวลาทดสอบ:</b> ${timeNow}`,
      `📌 <b>ระบบ:</b> กรมกำลังพลทหารบก (กพ.ทบ.)`,
      `การแจ้งเตือนเหตุการณ์สูญเสียกำลังพลพร้อมปฏิบัติงานแล้ว`,
    ].join("\n");

    return this.sendMessage(testText, { chatId, botToken });
  }
}
