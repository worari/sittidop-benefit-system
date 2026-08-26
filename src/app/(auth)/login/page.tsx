"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { Badge } from "../../../presentation/components/ui/badge";
import { ThemeToggle } from "../../../presentation/components/layout/ThemeToggle";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@army.mod.go.th");
  const [password, setPassword] = useState("admin1234");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const demoAccounts = [
    {
      role: "ผู้ดูแลระบบ (Admin กพ.ทบ.)",
      name: "พ.อ. พงศกร พิทักษ์สิทธิ์",
      email: "admin@army.mod.go.th",
      pass: "admin1234",
      desc: "สิทธิ์สูงสุด จัดการเกณฑ์สิทธิและทะเบียน",
      badge: "กพ.ทบ.",
      color: "border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30",
    },
    {
      role: "นายทหารฝ่ายสวัสดิการ (Staff)",
      name: "พ.ต. นพดล สายสวัสดิการ",
      email: "staff@army.mod.go.th",
      pass: "staff1234",
      desc: "คำนวณและออกหนังสือรับรองสิทธิ",
      badge: "กองสิทธิกำลังพล",
      color: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30",
    },
    {
      role: "ผู้บังคับบัญชา (Commander)",
      name: "พล.ท. สมโชค ชัยชนะ (จก.กพ.ทบ.)",
      email: "commander@army.mod.go.th",
      pass: "commander1234",
      desc: "ลงนามอนุมัติสิทธิและหนังสือรับรอง",
      badge: "ผู้บังคับบัญชา",
      color: "border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30",
    },
    {
      role: "ผู้ตรวจสอบภายใน (Auditor)",
      name: "พ.อ. พิษณุ ตรวจการดี",
      email: "auditor@army.mod.go.th",
      pass: "auditor1234",
      desc: "ตรวจสอบรายงานและ Audit Logs",
      badge: "สตส.ทบ.",
      color: "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30",
    },
    {
      role: "กำลังพล / ทายาท (Personnel)",
      name: "ส.อ. สันติ ผู้รับสิทธิ",
      email: "readonly@army.mod.go.th",
      pass: "readonly1234",
      desc: "ตรวจสอบสิทธิและสถานะเงินสงเคราะห์",
      badge: "ทายาท/กำลังพล",
      color: "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Branding Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-emerald-900/30 border border-emerald-600/40 bg-white mx-auto">
              <Image
                src="/images/logo.png"
                alt="ตรากรมกำลังพลทหารบก"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            ระบบสิทธิประโยชน์กำลังพล ทบ.
          </h1>
          <p className="text-xs text-slate-400">
            กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล กองทัพบก
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border-emerald-800/30 dark:border-slate-800 bg-card/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">เข้าสู่ระบบ (Sign In)</CardTitle>
            <CardDescription className="text-xs">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบงานประมาณการสิทธิประโยชน์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">อีเมลผู้ใช้งาน (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs font-mono"
                    placeholder="name@army.mod.go.th"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-emerald-900/30 gap-1.5"
              >
                <KeyRound className="h-4 w-4 text-amber-400" />
                {isLoading ? "กำลังตรวจสอบความปลอดภัย..." : "เข้าสู่ระบบงาน กองทัพบก"}
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Accounts Selection */}
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              คลิกเพื่อเลือกบัญชีทดสอบระบบกองทัพบก (RTA Roles):
            </p>

            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all hover:scale-[1.01] ${acc.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{acc.role}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      {acc.badge}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{acc.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{acc.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-100 font-medium inline-flex items-center gap-1"
          >
            ← กลับสู่หน้าหลักพอร์ทัลกำลังพล กองทัพบก
          </Link>
        </div>
      </div>
    </div>
  );
}
