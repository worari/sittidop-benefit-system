import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกอีเมล" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีผู้ใช้จริงหรือไม่
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // ไม่แสดงว่า user ไม่มีอยู่จริง เพื่อความปลอดภัย (กันไม่ให้คนรู้จับอีเมลผู้อื่น)
      return NextResponse.json({
        success: true,
        message: "ถ้าอีเมลนี้มีในระบบ เราจะส่งลิงค์รีเซ็ตไปยังอีเมลนั้น",
      });
    }

    // สร้างโทเค็นที่ปลอดภัย
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 ชั่วโมง

    // บันทึกโทเค็นลงในฐานข้อมูล
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        tokenHash: tokenHash,
        expiresAt: expiresAt,
      },
    });

    // บันทึก log การส่งอีเมล (simulation)
    await prisma.emailLog.create({
      data: {
        email: user.email,
        subject: "ลิงค์รีเซ็ตรหัสผ่าน - ระบบประมาณการสิทธิประโยชน์กำลังพล ทบ.",
        body: `สวัสดี ${user.name},

คุณได้ขอลิงค์รีเซ็ตรหัสผ่าน กรุณาคลิกที่ลิงค์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:

${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}

ลิงค์นี้มีอายุ 1 ชั่วโมง

ถ้าคุณไม่ได้ขอลิงค์นี้ โปรดละเว้นการดำเนินการนี้

ขอแสดงความนับถือ,
ทีมงาน ระบบสิทธิประโยชน์กำลังพล ทบ.`,
        type: "RESET_PASSWORD",
        recipientId: user.id,
        recipientType: "USER",
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "ส่งลิงค์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาตรวจสอบอีเมล",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "ไม่พบโทเค็นหรือรหัสผ่านใหม่" },
        { status: 400 }
      );
    }

    // สร้าง hash ของโทเค็นที่รับเข้ามา
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // ค้นหาโทเค็นที่ตรงกันและยังไม่หมดอายุ
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        tokenHash: tokenHash,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      return NextResponse.json({
        success: false,
        error: "โทเค็นไม่ถูกต้องหรือหมดอายุแล้ว",
      });
    }

    // Hash รหัสผ่านใหม่
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // อัปเดตรหัสผ่านผู้ใช้
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { passwordHash },
    });

    // ทำเครื่องหมายโทเค็นว่าใช้แล้ว
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "รีเซ็ตรหัสผ่านสำเร็จแล้ว",
    });
  } catch (error: any) {
    console.error("Reset password update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}