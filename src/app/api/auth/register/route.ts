import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

export async function POST(req: NextRequest) {
  try {

    const body = await req.json();
    const { name, email, password, role, phone, department, unit } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ชื่อ, อีเมล, รหัสผ่าน)" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือยัง
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น" },
        { status: 409 }
      );
    }

    // Hash password
    const bcrypt = require("bcryptjs");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role || "STAFF",
        isActive: false, // ต้องรอแอดมินอนุมัติก่อนจึงจะเข้าใช้งานได้
        department: department || "หน่วยงานกำลังพลสายสนาม",
        unit: unit || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลงทะเบียนสำเร็จ บัญชีของท่านอยู่ระหว่างรอการอนุมัติสิทธิ์เข้าใช้งานจากผู้ดูแลระบบ (Admin) กรมกำลังพลทหารบก",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการลงทะเบียน" },
      { status: 500 }
    );
  }
}