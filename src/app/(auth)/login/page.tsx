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
  RotateCcw,
  UserPlus,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@army.mod.go.th");
  const [password, setPassword] = useState("admin1234");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!forgotEmail.includes("@")) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    setForgotLoading(true);
    setError(null);
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSuccess(true);
    } catch {
      setError("เกิดข้อผิดพลาดในการส่งลิงค์รีเซ็ต");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotForm = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotSuccess(false);
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

  // Forgot Password Modal
  const forgotPasswordModal = showForgotPassword ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">รีเซ็ตรหัสผ่าน</h2>
          <button
            onClick={resetForgotForm}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงค์รีเซ็ตรหัสผ่านไปยังอีเมลนั้น
        </p>
        <div className="space-y-4">
          {!forgotSuccess ? (
            <div className="space-y-3">
              <Label htmlFor="forgot-email" className="block text-sm font-medium">
                อีเมลที่ลงทะเบียน
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-9 text-sm"
                  placeholder="name@army.mod.go.th"
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <ShieldCheck className="h-5 w-5" />
                <p className="font-medium">ส่งลิงค์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว</p>
              </div>
              <p className="text-sm text-muted-foreground">
                กรุณาตรวจสอบอีเมล <strong className="font-mono">{forgotEmail}</strong> เพื่อดำเนินการต่อ
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={resetForgotForm} className="flex-1">
            {forgotSuccess ? "กลับสู่หน้าเข้าสู่ระบบ" : "ยกเลิก"}
          </Button>
          {!forgotSuccess && (
            <Button
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="flex-1 bg-emerald-800 hover:bg-emerald-900"
            >
              {forgotLoading ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ส่งลิงค์รีเซ็ต"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  ) : null;

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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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

            {/* Forgot Password & Register Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-slate-500 hover:text-emerald-600"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ลืมรหัสผ่าน?
                </Button>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/register")}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  สมัครสมาชิก
                </Button>
              </div>
            </div>
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

        {forgotPasswordModal}
      </div>
    </div>
  );
}