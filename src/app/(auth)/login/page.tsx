"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { Badge } from "../../../presentation/components/ui/badge";
import { ThemeToggle } from "../../../presentation/components/layout/ThemeToggle";
import {
  Calculator,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dop.go.th");
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
      role: "Admin (ผู้ดูแลระบบ)",
      email: "admin@dop.go.th",
      pass: "admin1234",
      desc: "สิทธิ์สูงสุด จัดการเกณฑ์สิทธิและผู้ใช้",
      badge: "Full Access",
      color: "border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30",
    },
    {
      role: "Officer (เจ้าหน้าที่)",
      email: "officer@dop.go.th",
      pass: "officer1234",
      desc: "ตรวจสอบเอกสารและอนุมัติคำขอ",
      badge: "Reviewer",
      color: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30",
    },
    {
      role: "Auditor (ผู้ตรวจสอบ)",
      email: "auditor@dop.go.th",
      pass: "auditor1234",
      desc: "ตรวจสอบรายงานและ Audit Logs",
      badge: "Audit Only",
      color: "border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30",
    },
    {
      role: "Citizen (ประชาชน)",
      email: "citizen@dop.go.th",
      pass: "citizen1234",
      desc: "คำนวณสิทธิและยื่นคำขอรับสวัสดิการ",
      badge: "Applicant",
      color: "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Branding Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Calculator className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            sittidop-benefit-system
          </h1>
          <p className="text-xs text-muted-foreground">
            ระบบประมาณการสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ (DOP)
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">เข้าสู่ระบบ (Sign In)</CardTitle>
            <CardDescription className="text-xs">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบงานสิทธิสวัสดิการ
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
                    className="pl-9 text-xs"
                    placeholder="name@dop.go.th"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-emerald-600/20"
              >
                {isLoading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ (Sign In)"}
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Accounts Selection */}
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              คลิกเพื่อเลือกบัญชีทดสอบระบบ (Demo Accounts):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all hover:scale-[1.02] ${acc.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{acc.role}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 font-medium inline-flex items-center gap-1"
          >
            ← กลับสู่หน้าหลักพอร์ทัลประชาชน
          </Link>
        </div>
      </div>
    </div>
  );
}
