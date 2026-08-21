import { NextResponse } from "next/server";
import { storeManager } from "@/infrastructure/database/repositories/StoreManager";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function POST() {
  try {
    storeManager.resetToDefault();

    await AuditLogger.log({
      action: "DEMO_DATA_RESET",
      resource: "Database",
      details: {
        message: "ระบบถูกรีเซ็ตข้อมูลตัวอย่างมาตรฐานกรมกิจการผู้สูงอายุเรียบร้อยแล้ว",
      },
    });

    return NextResponse.json({
      success: true,
      message: "รีเซ็ตข้อมูลตัวอย่างสำเร็จ (Demo Data Re-seeded Successfully)",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset seed data" },
      { status: 500 }
    );
  }
}
