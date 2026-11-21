import { prisma } from "@/infrastructure/database/prisma";
import { LossIncidentReportRecord, IncidentCasualty } from "@/infrastructure/database/repositories/LossIncidentReportRepository";

export interface LineConfig {
  channelAccessToken: string;
  destinationId: string; // User ID (U...) or Group ID (C...)
  enabled: boolean;
  channelSecret?: string;
}

// In-memory config fallback for rapid access
let inMemoryLineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  destinationId: process.env.LINE_DESTINATION_ID || process.env.LINE_USER_ID || process.env.LINE_GROUP_ID || "",
  enabled: process.env.LINE_NOTIFY_ENABLED !== "false",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
};

export class LineNotificationService {
  /**
   * Retrieve LINE configuration from SystemSetting table or environment variables
   */
  static async getConfig(): Promise<LineConfig> {
    try {
      const settingModel = (prisma as any).systemSetting;
      if (settingModel?.findMany) {
        const settings = await settingModel.findMany({
          where: {
            key: {
              in: [
                "LINE_CHANNEL_ACCESS_TOKEN",
                "LINE_DESTINATION_ID",
                "LINE_NOTIFY_ENABLED",
                "LINE_CHANNEL_SECRET",
              ],
            },
          },
        });

        const map: Record<string, string> = {};
        for (const s of settings) {
          map[s.key] = s.value;
        }

        const channelAccessToken =
          map["LINE_CHANNEL_ACCESS_TOKEN"] ??
          process.env.LINE_CHANNEL_ACCESS_TOKEN ??
          inMemoryLineConfig.channelAccessToken;

        const destinationId =
          map["LINE_DESTINATION_ID"] ??
          process.env.LINE_DESTINATION_ID ??
          process.env.LINE_USER_ID ??
          process.env.LINE_GROUP_ID ??
          inMemoryLineConfig.destinationId;

        const enabledStr =
          map["LINE_NOTIFY_ENABLED"] ??
          (process.env.LINE_NOTIFY_ENABLED ?? (inMemoryLineConfig.enabled ? "true" : "false"));
        const enabled = enabledStr === "true" || enabledStr === "1";

        const channelSecret =
          map["LINE_CHANNEL_SECRET"] ??
          process.env.LINE_CHANNEL_SECRET ??
          inMemoryLineConfig.channelSecret;

        inMemoryLineConfig = {
          channelAccessToken,
          destinationId,
          enabled,
          channelSecret,
        };
        return inMemoryLineConfig;
      }
    } catch {
      // Database query failed, fallback to in-memory config
    }
    return inMemoryLineConfig;
  }

  /**
   * Save LINE configuration to SystemSetting table
   */
  static async saveConfig(newConfig: Partial<LineConfig>): Promise<LineConfig> {
    const current = await this.getConfig();
    const updated: LineConfig = {
      channelAccessToken:
        newConfig.channelAccessToken !== undefined
          ? newConfig.channelAccessToken.trim()
          : current.channelAccessToken,
      destinationId:
        newConfig.destinationId !== undefined
          ? newConfig.destinationId.trim()
          : current.destinationId,
      enabled: newConfig.enabled !== undefined ? Boolean(newConfig.enabled) : current.enabled,
      channelSecret:
        newConfig.channelSecret !== undefined
          ? newConfig.channelSecret.trim()
          : current.channelSecret,
    };

    try {
      const settingModel = (prisma as any).systemSetting;
      if (settingModel?.upsert) {
        await Promise.all([
          settingModel.upsert({
            where: { key: "LINE_CHANNEL_ACCESS_TOKEN" },
            update: { value: updated.channelAccessToken },
            create: {
              key: "LINE_CHANNEL_ACCESS_TOKEN",
              value: updated.channelAccessToken,
              description: "LINE Messaging API Channel Access Token for WeR-RTA alerts",
            },
          }),
          settingModel.upsert({
            where: { key: "LINE_DESTINATION_ID" },
            update: { value: updated.destinationId },
            create: {
              key: "LINE_DESTINATION_ID",
              value: updated.destinationId,
              description: "LINE Target User ID or Group ID for receiving WeR-RTA notifications",
            },
          }),
          settingModel.upsert({
            where: { key: "LINE_NOTIFY_ENABLED" },
            update: { value: updated.enabled ? "true" : "false" },
            create: {
              key: "LINE_NOTIFY_ENABLED",
              value: updated.enabled ? "true" : "false",
              description: "Enable LINE Messaging API notifications",
            },
          }),
        ]);
      }
    } catch {
      // Database write failed, retain in-memory
    }

    inMemoryLineConfig = updated;
    return updated;
  }

  /**
   * Format Thai Buddhist Date
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
   * Send arbitrary messages via LINE Messaging API push endpoint
   */
  static async sendPushMessage(
    messages: any[],
    options?: { destinationId?: string; channelAccessToken?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    const token = options?.channelAccessToken || config.channelAccessToken;
    const to = options?.destinationId || config.destinationId;

    if (!token) {
      return {
        success: false,
        error: "LINE Channel Access Token ยังไม่ได้ถูกกำหนดค่าในระบบ",
      };
    }

    if (!to) {
      return {
        success: false,
        error: "LINE Destination ID (User ID หรือ Group ID) ยังไม่ได้ถูกกำหนดค่า",
      };
    }

    try {
      const url = "https://api.line.me/v2/bot/message/push";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.message ||
          (errorData.details && errorData.details[0]?.message) ||
          `LINE Messaging API error HTTP ${response.status}`;
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE Messaging API",
      };
    }
  }

  /**
   * Build text alert for a Loss Incident Report (กพ.4 / กพ.3)
   */
  static formatLossIncidentText(report: LossIncidentReportRecord, appUrl?: string): string {
    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const thaiDate = this.formatThaiDate(report.incidentDate);

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

      return `${idx + 1}. ${lossTag} ${name} (ทบ. ${c.militaryId || "-"})${unit}${injury}${hosp}`;
    });

    const casualtiesSection =
      casualtyLines.length > 0
        ? `\n👥 กำลังพลประสบเหตุ (${casualties.length} นาย):\n${casualtyLines.join("\n")}`
        : `\n👥 กำลังพลหลัก: ${report.rankAbbr || ""} ${report.fullName || "-"} (ทบ. ${report.militaryId || "-"})`;

    const reporter = report.createdByUserName || "เจ้าหน้าที่ในระบบ";
    const viewUrl = `${baseUrl}/loss-reports?id=${report.id}`;

    return [
      `🚨 [ด่วนที่สุด] รายงานการสูญเสียกำลังพล 🚨`,
      `🎖️ ระบบ WeR-RTA : กรมกำลังพลทหารบก (กพ.ทบ.)`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📅 วัน-เวลาเกิดเหตุ: ${thaiDate} เวลา ${report.incidentTime || "00:00"} น.`,
      `📍 พิกัด MGRS: ${report.mgrsCoordinate || "-"}`,
      `🗺️ สถานที่: ${locationStr}`,
      `💥 ลักษณะการปะทะ: ${report.engagementBehavior || "-"} (โดย: ${report.enemyAction || "ENEMY"})`,
      `📝 สรุปเหตุการณ์: ${report.eventSummary || "-"}`,
      casualtiesSection,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 ผู้บันทึกรายงาน: ${reporter}`,
      `🕒 เวลาบันทึก: ${new Date().toLocaleString("th-TH")}`,
      `🔗 เปิดดูรายงาน: ${viewUrl}`,
    ].join("\n");
  }

  /**
   * Build Flex Message for Loss Incident Report
   */
  static buildLossIncidentFlexMessage(report: LossIncidentReportRecord, appUrl?: string): any {
    const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const thaiDate = this.formatThaiDate(report.incidentDate);
    const viewUrl = `${baseUrl}/loss-reports?id=${report.id}`;

    const casualties: IncidentCasualty[] = report.casualties || [];
    const deceasedCount = casualties.filter((c) => c.lossType === "DECEASED").length;
    const disabledCount = casualties.filter((c) => c.lossType === "DISABLED").length;
    const injuredCount = casualties.filter((c) => c.lossType === "INJURED").length;

    const casualtyItems = casualties.slice(0, 5).map((c) => {
      let badgeColor = "#10B981"; // green
      let lossText = "บาดเจ็บ";
      if (c.lossType === "DECEASED") {
        badgeColor = "#EF4444"; // red
        lossText = "เสียชีวิต";
      } else if (c.lossType === "DISABLED") {
        badgeColor = "#F59E0B"; // amber
        lossText = "ทุพพลภาพ";
      }

      return {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: `[${lossText}]`,
            size: "xs",
            color: badgeColor,
            weight: "bold",
            flex: 2,
          },
          {
            type: "text",
            text: `${c.rankAbbr || ""} ${c.fullName || "-"}`,
            size: "xs",
            color: "#FFFFFF",
            flex: 6,
            wrap: true,
          },
        ],
        margin: "sm",
      };
    });

    return {
      type: "flex",
      altText: `🚨 [ด่วนที่สุด] รายงานสูญเสียกำลังพล: ${report.rankAbbr || ""} ${report.fullName || "ทบ."} (${thaiDate})`,
      contents: {
        type: "bubble",
        size: "giga",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0d1526",
          contents: [
            {
              type: "text",
              text: "🎖️ ระบบ WeR-RTA กรมกำลังพลทหารบก",
              size: "xs",
              color: "#93C5FD",
              weight: "bold",
            },
            {
              type: "text",
              text: "🚨 [ด่วนที่สุด] รายงานการสูญเสียกำลังพล",
              size: "md",
              color: "#EF4444",
              weight: "bold",
              margin: "xs",
            },
            {
              type: "text",
              text: `รายงานด่วน กพ.๔ / กพ.๓ • ${thaiDate} ${report.incidentTime || ""} น.`,
              size: "xxs",
              color: "#CBD5E1",
              margin: "xs",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#162136",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "พิกัด MGRS:",
                  size: "xs",
                  color: "#94A3B8",
                  flex: 3,
                },
                {
                  type: "text",
                  text: report.mgrsCoordinate || "-",
                  size: "xs",
                  color: "#38BDF8",
                  weight: "bold",
                  flex: 7,
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "พื้นที่เกิดเหตุ:",
                  size: "xs",
                  color: "#94A3B8",
                  flex: 3,
                },
                {
                  type: "text",
                  text: [report.subdistrict, report.district, report.province].filter(Boolean).join(" ") || "ไม่ระบุ",
                  size: "xs",
                  color: "#E2E8F0",
                  flex: 7,
                  wrap: true,
                },
              ],
              margin: "xs",
            },
            {
              type: "separator",
              margin: "md",
              color: "#283b5c",
            },
            {
              type: "text",
              text: `👥 สรุปยอดผู้สูญเสีย (${casualties.length || 1} นาย):`,
              size: "xs",
              color: "#F8FAFC",
              weight: "bold",
              margin: "md",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `🔴 เสียชีวิต ${deceasedCount} นาย`,
                  size: "xxs",
                  color: "#FCA5A5",
                },
                {
                  type: "text",
                  text: `🟠 ทุพพลภาพ ${disabledCount} นาย`,
                  size: "xxs",
                  color: "#FCD34D",
                },
                {
                  type: "text",
                  text: `🟢 บาดเจ็บ ${injuredCount} นาย`,
                  size: "xxs",
                  color: "#86EFAC",
                },
              ],
              margin: "xs",
            },
            {
              type: "box",
              layout: "vertical",
              contents: casualtyItems.length > 0 ? casualtyItems : [
                {
                  type: "text",
                  text: `${report.rankAbbr || ""} ${report.fullName || "-"}`,
                  size: "xs",
                  color: "#FFFFFF",
                }
              ],
              margin: "sm",
            },
            {
              type: "separator",
              margin: "md",
              color: "#283b5c",
            },
            {
              type: "text",
              text: "📝 สรุปเหตุการณ์:",
              size: "xs",
              color: "#94A3B8",
              weight: "bold",
              margin: "md",
            },
            {
              type: "text",
              text: report.eventSummary || "-",
              size: "xxs",
              color: "#CBD5E1",
              wrap: true,
              maxLines: 4,
              margin: "xs",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0d1526",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#1877F2",
              height: "sm",
              action: {
                type: "uri",
                label: "🎖️ เปิดดูรายงานในระบบ WeR-RTA",
                uri: viewUrl,
              },
            },
          ],
        },
      },
    };
  }

  /**
   * High-level method: Send loss incident alert via LINE
   */
  static async sendLossIncidentAlert(
    report: LossIncidentReportRecord,
    appUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return { success: false, error: "LINE notification is disabled in settings" };
    }
    if (!config.channelAccessToken || !config.destinationId) {
      return { success: false, error: "LINE channelAccessToken or destinationId not configured" };
    }

    try {
      // First attempt with Flex Message
      const flexMessage = this.buildLossIncidentFlexMessage(report, appUrl);
      const res = await this.sendPushMessage([flexMessage]);
      if (res.success) return res;

      // If flex fails, fallback to formatted text
      const fallbackText = this.formatLossIncidentText(report, appUrl);
      return await this.sendPushMessage([{ type: "text", text: fallbackText }]);
    } catch (err: any) {
      const fallbackText = this.formatLossIncidentText(report, appUrl);
      return await this.sendPushMessage([{ type: "text", text: fallbackText }]);
    }
  }

  /**
   * Send benefit tracking status update alert via LINE
   */
  static async sendBenefitStatusAlert(params: {
    trackingNumber: string;
    recipientName: string;
    benefitName: string;
    benefitCategory?: string;
    status: string;
    amount?: number | null;
    officerNotes?: string | null;
    appUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const config = await this.getConfig();
    if (!config.enabled || !config.channelAccessToken || !config.destinationId) {
      return { success: false, error: "LINE not configured or disabled" };
    }

    const baseUrl = params.appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/tracking?number=${params.trackingNumber}`;

    let statusLabel = "ยื่นเสนอขอรับสิทธิแล้ว";
    let statusIcon = "📝";
    let statusColor = "#3B82F6";

    switch (params.status) {
      case "RECEIVED":
        statusLabel = "ปิดจบขั้นตอน (รับสิทธิสมบูรณ์)";
        statusIcon = "✅";
        statusColor = "#10B981";
        break;
      case "DISBURSED":
        statusLabel = "โอนเงิน / เบิกจ่ายสิทธิเรียบร้อยแล้ว";
        statusIcon = "💵";
        statusColor = "#059669";
        break;
      case "APPROVED":
        statusLabel = "อนุมัติสิทธิและงบประมาณแล้ว";
        statusIcon = "🎖️";
        statusColor = "#2563EB";
        break;
      case "UNDER_REVIEW":
        statusLabel = "อยู่ระหว่างการตรวจสอบเอกสารสิทธิ";
        statusIcon = "🔍";
        statusColor = "#F59E0B";
        break;
      case "REJECTED":
        statusLabel = "ไม่อนุมัติ / ส่งคืนแก้ไข";
        statusIcon = "❌";
        statusColor = "#EF4444";
        break;
    }

    const formattedAmount =
      params.amount !== undefined && params.amount !== null
        ? `${Number(params.amount).toLocaleString("th-TH")} บาท`
        : "-";

    const textMessage = [
      `${statusIcon} [แจ้งสถานะสิทธิกำลังพล ทบ.]`,
      `🎖️ ระบบ WeR-RTA กรมกำลังพลทหารบก`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔢 เลขที่ติดตาม: ${params.trackingNumber}`,
      `👤 ผู้รับสิทธิ: ${params.recipientName}`,
      `💰 รายการสิทธิ: ${params.benefitName}`,
      `💵 วงเงินสิทธิ: ${formattedAmount}`,
      `📊 สถานะปัจจุบัน: ${statusLabel}`,
      params.officerNotes ? `📌 บันทึกเจ้าหน้าที่: ${params.officerNotes}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🕒 เวลาอัปเดต: ${new Date().toLocaleString("th-TH")}`,
      `🔗 ติดตามสถานะ: ${trackingUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const flexBubble = {
      type: "flex",
      altText: `📋 แจ้งเตือนสถานะสิทธิกำลังพล: ${params.trackingNumber} (${statusLabel})`,
      contents: {
        type: "bubble",
        size: "mega",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0d1526",
          contents: [
            {
              type: "text",
              text: "🎖️ ระบบ WeR-RTA กรมกำลังพลทหารบก",
              size: "xs",
              color: "#93C5FD",
              weight: "bold",
            },
            {
              type: "text",
              text: `${statusIcon} อัปเดตสถานะสิทธิและสวัสดิการ`,
              size: "sm",
              color: statusColor,
              weight: "bold",
              margin: "xs",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#162136",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "เลขติดตาม:", size: "xs", color: "#94A3B8", flex: 3 },
                { type: "text", text: params.trackingNumber, size: "xs", color: "#38BDF8", weight: "bold", flex: 7 },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "ผู้รับสิทธิ:", size: "xs", color: "#94A3B8", flex: 3 },
                { type: "text", text: params.recipientName, size: "xs", color: "#F8FAFC", weight: "bold", flex: 7, wrap: true },
              ],
              margin: "xs",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "รายการสิทธิ:", size: "xs", color: "#94A3B8", flex: 3 },
                { type: "text", text: params.benefitName, size: "xs", color: "#E2E8F0", flex: 7, wrap: true },
              ],
              margin: "xs",
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "วงเงิน:", size: "xs", color: "#94A3B8", flex: 3 },
                { type: "text", text: formattedAmount, size: "xs", color: "#FBBF24", weight: "bold", flex: 7 },
              ],
              margin: "xs",
            },
            { type: "separator", margin: "md", color: "#283b5c" },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "สถานะ:", size: "xs", color: "#94A3B8", flex: 3 },
                { type: "text", text: statusLabel, size: "xs", color: statusColor, weight: "bold", flex: 7, wrap: true },
              ],
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#0d1526",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#1877F2",
              height: "sm",
              action: {
                type: "uri",
                label: "🔍 ตรวจสอบขั้นตอน Timeline สิทธิ",
                uri: trackingUrl,
              },
            },
          ],
        },
      },
    };

    try {
      const res = await this.sendPushMessage([flexBubble]);
      if (res.success) return res;
      return await this.sendPushMessage([{ type: "text", text: textMessage }]);
    } catch {
      return await this.sendPushMessage([{ type: "text", text: textMessage }]);
    }
  }

  /**
   * Send test message to verify LINE Messaging API configuration
   */
  static async sendTestMessage(
    channelAccessToken?: string,
    destinationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const timeNow = new Date().toLocaleString("th-TH");
    const testText = [
      `🔔 [ทดสอบระบบแจ้งเตือน LINE Messaging API]`,
      `🎖️ ระบบ WeR-RTA : กรมกำลังพลทหารบก (กพ.ทบ.)`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `✅ การเชื่อมต่อ LINE Messaging API สำเร็จสมบูรณ์!`,
      `🕒 เวลาทดสอบ: ${timeNow}`,
      `📌 หน่วยรับแจ้ง: ศูนย์ปฏิบัติการกองทัพบก (ศปก.ทบ.) และ กพ.ทบ.`,
      `พร้อมส่งแจ้งเตือนรายงานการสูญเสียกำลังพล (กพ.๔ / กพ.๓) และสถานะสิทธิกำลังพลตามเวลาจริง`,
    ].join("\n");

    return this.sendPushMessage([{ type: "text", text: testText }], {
      channelAccessToken,
      destinationId,
    });
  }
}
