"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { Badge } from "../../../presentation/components/ui/badge";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  RotateCcw,
  UserPlus,
  Eye,
  EyeOff,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1526] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const isRegisteredPending = searchParams.get("registered") === "pending" || searchParams.get("registered") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (urlError === "PendingApproval") {
      setError("บัญชีของท่านอยู่ระหว่างรอการอนุมัติสิทธิ์เข้าใช้งานจากผู้ดูแลระบบ (Admin) กรุณารอการตรวจสอบและอนุมัติ");
    } else if (urlError === "CredentialsSignin") {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ");
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        if (res.error.includes("อนุมัติ") || res.error.includes("ACCOUNT_PENDING_APPROVAL")) {
          setError("บัญชีของท่านอยู่ระหว่างรอการอนุมัติสิทธิ์เข้าใช้งานจากผู้ดูแลระบบ (Admin) กรุณารอการตรวจสอบและอนุมัติ");
        } else {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีอยู่ระหว่างรอการอนุมัติสิทธิ์");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d1526] text-slate-100">
      <div className="w-full max-w-md space-y-5">
        {/* Branding Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-[#1877F2]/60 bg-[#162136] mx-auto p-1 shadow-md">
              <Image
                src="/images/logo.png"
                alt="ตรากรมกำลังพลทหารบก"
                fill
                sizes="80px"
                className="object-contain p-0.5"
                priority
              />
            </div>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ระบบ WeR-RTA : บริหารจัดการสิทธิและสวัสดิการกำลังพล
          </h1>
          <p className="text-xs text-blue-200/80">
            ศูนย์ปฏิบัติการกองทัพบก (ศปก.ทบ.) • กรมกำลังพลทหารบก (กพ.ทบ.)
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border border-[#283b5c] bg-[#162136] shadow-md rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-[#1877F2] flex">
            <div className="h-full w-24 bg-amber-400" />
          </div>
          <CardHeader className="pb-3 border-b border-[#243656]">
            <CardTitle className="text-base font-bold text-white">เข้าสู่ระบบงานราชการ WeR-RTA</CardTitle>
            <CardDescription className="text-xs text-slate-300">
              กรอกบัญชีผู้ใช้งานทางราชการเพื่อเข้าสู่ระบบบริหารจัดการสิทธิและสวัสดิการกำลังพล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {isRegisteredPending && (
              <div className="p-3.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-amber-200">
                  <Clock className="h-4 w-4 text-amber-400" />
                  บันทึกการลงทะเบียนสำเร็จ (รอการอนุมัติ)
                </p>
                <p className="text-[11px] text-slate-300">
                  บัญชีของท่านอยู่ระหว่างรอผู้ดูแลระบบ (Admin) ตรวจสอบและอนุมัติสิทธิ์เข้าใช้งาน เมื่อได้รับการอนุมัติแล้ว ท่านจึงจะสามารถเข้าสู่ระบบได้
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-xs font-medium text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">อีเมลผู้ใช้งาน (Email)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs font-mono h-9 rounded-md"
                    placeholder="name@army.mod.go.th"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">รหัสผ่าน (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs h-9 rounded-md"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs sm:text-sm py-2 shadow-sm rounded-md gap-1.5 border-0"
              >
                <KeyRound className="h-4 w-4 text-amber-300" />
                {isLoading ? "กำลังตรวจสอบความปลอดภัย..." : "เข้าสู่ระบบงาน กองทัพบก"}
              </Button>
            </form>

            {/* Forgot Password & Register Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-slate-500 hover:text-slate-800"
                  onClick={() => setShowForgotPassword(true)}
                >
                  ลืมรหัสผ่าน?
                </Button>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md text-xs border-slate-300"
                  onClick={() => router.push("/register")}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  ลงทะเบียนผู้ใช้
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium inline-flex items-center gap-1"
          >
            ← กลับสู่หน้าหลักพอร์ทัลกำลังพล กองทัพบก
          </Link>
        </div>

        {forgotPasswordModal}
      </div>
    </div>
  );
}