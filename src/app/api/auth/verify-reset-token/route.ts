import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { success: false, error: "ไม่พบโทเค็น" },
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
                valid: false,
                error: "โทเค็นไม่ถูกต้องหรือหมดอายุแล้ว",
            });
        }

        return NextResponse.json({
            success: true,
            valid: true,
            email: passwordReset.user.email,
            name: passwordReset.user.name,
        });
    } catch (error: any) {
        console.error("Verify reset token error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}