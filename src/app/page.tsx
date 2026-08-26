"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "../presentation/components/layout/ThemeToggle";
import { Button } from "../presentation/components/ui/button";
import { Badge } from "../presentation/components/ui/badge";
import { Input } from "../presentation/components/ui/input";
import { Label } from "../presentation/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../presentation/components/ui/card";
import { formatCurrency } from "../presentation/lib/utils";
import {
  Shield,
  Award,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Lock,
  LogIn,
  LayoutDashboard,
  Coins,
  Calendar,
  Gift,
  FileText,
  PhoneCall,
  Flame,
  Crosshair,
  Building,
  HeartHandshake,
  Landmark,
  FileCheck,
} from "lucide-react";

export default function LandingPage() {
  // Fast Interactive Estimator State
  const [rankCategory, setRankCategory] = useState<"OFFICER" | "NCO" | "ENLISTED" | "RANGER">("OFFICER");
  const [selectedRank, setSelectedRank] = useState("พ.ท. (พันโท)");
  const [salary, setSalary] = useState<number>(43500);
  const [normalYears, setNormalYears] = useState<number>(16);
  const [multiplierYears, setMultiplierYears] = useState<number>(8);
  const [lossType, setLossType] = useState<"KIA_COMBAT" | "DUTY_DEATH" | "DISABILITY">("KIA_COMBAT");
  const [promotionSteps, setPromotionSteps] = useState<number>(7);
  const [childrenCount, setChildrenCount] = useState<number>(2);
  const [selectedUnit, setSelectedUnit] = useState("ร.19 พัน.1 / ฉก.นราธิวาส (พล.ร.9)");

  // Calculations
  const totalYears = normalYears + multiplierYears;
  const promotedSalary = Math.round(salary * 1.57); // Estimated 7-step promotion

  // 1. One-time Lump Sum
  const insuranceAmount = lossType === "KIA_COMBAT" ? 2000000 : lossType === "DISABILITY" ? 1500000 : 1000000;
  const gratuityInheritance = Math.round(promotedSalary * totalYears * 1.5);
  const disasterCompensation = Math.max(500000, salary * 30);
  const promotionDiff = Math.round((promotedSalary - salary) * 12 * 3);
  const armyFundGrant = lossType === "KIA_COMBAT" ? 1500000 : 800000;
  const funeralAid = 200000;
  const totalLumpSum = insuranceAmount + gratuityInheritance + disasterCompensation + promotionDiff + armyFundGrant + funeralAid;

  // 2. Monthly Recurring
  const monthlySpecialPension = Math.round((promotedSalary * Math.min(totalYears, 35)) / 50);
  const combatAdditionalPay = 5000;
  const totalMonthly = monthlySpecialPension + combatAdditionalPay;

  // 3. Annual Education Grants
  const annualScholarshipPerChild = 23500;
  const totalAnnualScholarship = childrenCount * annualScholarshipPerChild;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-950/10 via-background to-slate-100/70 dark:from-slate-950 dark:via-background dark:to-slate-950">
      {/* Official RTA Military Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md border-emerald-800/20 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-md shadow-emerald-900/30 border border-emerald-600/40 bg-white">
              <Image
                src="/images/logo.png"
                alt="ตรากรมกำลังพลทหารบก"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  ระบบสิทธิประโยชน์กำลังพล ทบ.
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  กองทัพบก
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm gap-1.5 border-emerald-700/30">
                <LogIn className="h-3.5 w-3.5" />
                เข้าสู่ระบบกำลังพล / ทายาท
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold gap-1.5 shadow-sm shadow-emerald-900/20">
                <LayoutDashboard className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">ศูนย์ปฏิบัติงาน กพ.ทบ.</span>
                <span className="sm:hidden">ระบบงาน</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 dark:bg-emerald-950/60 border border-emerald-700/30 text-emerald-900 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <Award className="h-4 w-4 text-amber-500" />
            ระบบสารสนเทศเพื่อการคุ้มครองสิทธิ เกียรติยศ และสวัสดิการกำลังพล กองทัพบก
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            ระบบประมาณการสิทธิประโยชน์ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-amber-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-amber-400 bg-clip-text text-transparent">
              และเงินสงเคราะห์กำลังพล กองทัพบก
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            บริการตรวจสอบและประมาณการสิทธิประโยชน์ 4 หมวดหมู่ สำหรับกำลังพลและทายาทผู้สูญเสียจากการปฏิบัติหน้าที่ราชการสนาม
            ครอบคลุมเงินสินไหมทดแทน บำนาญพิเศษ บำเหน็จตกทอด ทุนการศึกษาบุตร และสิทธิการบรรจุทายาททดแทนเข้ารับราชการในกองทัพบก
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="#fast-calculator">
              <Button size="lg" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base gap-2 shadow-lg shadow-emerald-900/25 px-6">
                <Calculator className="h-5 w-5 text-amber-400" />
                ทดลองคำนวณสิทธิ 4 หมวดของ ทบ. ทันที
              </Button>
            </a>
            <Link href="/documents">
              <Button size="lg" variant="outline" className="font-semibold text-sm sm:text-base gap-2 border-slate-300 dark:border-slate-700">
                <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                ตัวอย่างหนังสือรับรองสิทธิ (กพ.ทบ.)
              </Button>
            </Link>
          </div>

          {/* Military Trust & Regulation Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              พ.ร.บ. สงเคราะห์ผู้ประสบภัย พ.ศ. 2543
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Landmark className="h-4 w-4 text-emerald-600" />
              ระเบียบกระทรวงกลาโหม & กองทัพบก
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="h-4 w-4 text-emerald-600" />
              ชั้นความลับราชการและการคุ้มครองข้อมูลทายาท
            </span>
          </div>
        </section>

        {/* Real-time Interactive Fast Benefit Estimator for Royal Thai Army */}
        <section id="fast-calculator" className="py-8 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="rounded-3xl border border-emerald-800/30 dark:border-slate-800 bg-card/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-800 text-amber-400">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    เครื่องมือประมาณการสิทธิกำลังพล ทบ. แบบเรียลไทม์ (Live Estimator)
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  ปรับเปลี่ยนชั้นยศ เงินเดือน เวลาราชการทวีคูณ และสถานภาพ เพื่อดูยอดเงินสงเคราะห์ 4 หมวดของ ทบ. ทันที
                </p>
              </div>

              <Badge className="bg-emerald-800 text-amber-400 font-mono text-xs px-3 py-1 self-start sm:self-center border border-amber-500/30">
                RTA RULES ENGINE 2026
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Input Controls (Left Column) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Category Rank Tabs */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    กลุ่มชั้นยศกำลังพล กองทัพบก
                  </Label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    {[
                      { id: "OFFICER", label: "สัญญาบัตร" },
                      { id: "NCO", label: "ประทวน" },
                      { id: "ENLISTED", label: "พลทหาร" },
                      { id: "RANGER", label: "อส.ทพ." },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setRankCategory(t.id as any);
                          if (t.id === "OFFICER") {
                            setSelectedRank("พ.ท. (พันโท)");
                            setSalary(43500);
                          } else if (t.id === "NCO") {
                            setSelectedRank("จ.ส.อ. (จ่าสิบเอก)");
                            setSalary(28400);
                          } else if (t.id === "ENLISTED") {
                            setSelectedRank("พลฯ (พลทหาร)");
                            setSalary(10000);
                          } else {
                            setSelectedRank("อส.ทพ. (อาสาสมัครทหารพราน)");
                            setSalary(14000);
                          }
                        }}
                        className={`text-xs font-bold py-1.5 rounded-lg transition-all ${rankCategory === t.id
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rank & Salary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">ชั้นยศที่ครองตำแหน่ง</Label>
                    <Input
                      value={selectedRank}
                      onChange={(e) => setSelectedRank(e.target.value)}
                      className="text-xs h-9 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">เงินเดือนพื้นฐาน (บาท)</Label>
                    <Input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                {/* Service Years & Combat Multipliers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">เวลาราชการปกติ (ปี)</Label>
                    <Input
                      type="number"
                      value={normalYears}
                      onChange={(e) => setNormalYears(Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1">
                      <Flame className="h-3 w-3 text-amber-500" />
                      เวลาราชการทวีคูณ (ปี)
                    </Label>
                    <Input
                      type="number"
                      value={multiplierYears}
                      onChange={(e) => setMultiplierYears(Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                {/* Incident Loss Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">กรณีความสูญเสียจากการปฏิบัติหน้าที่</Label>
                  <select
                    value={lossType}
                    onChange={(e) => setLossType(e.target.value as any)}
                    aria-label="กรณีความสูญเสียจากการปฏิบัติหน้าที่"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="KIA_COMBAT">เสียชีวิตจากการสู้รบ/การปะทะ (KIA) ปูนบำเหน็จ 7-9 ชั้นยศ</option>
                    <option value="DUTY_DEATH">เสียชีวิตจากการปฏิบัติราชการสนาม/รักษาความสงบ</option>
                    <option value="DISABILITY">ทุพพลภาพสมบูรณ์จากการสู้รบ/กับระเบิด</option>
                  </select>
                </div>

                {/* Army Unit & Children */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">หน่วยสังกัดกองทัพบก</Label>
                    <Input
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">จำนวนบุตรกำลังพล (คน)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/calculator">
                    <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold gap-2">
                      <Calculator className="h-4 w-4 text-amber-400" />
                      เปิดเครื่องมือคำนวณสิทธิแบบเต็มรูปแบบ (Advanced Studio)
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Real-time 4-Category Results Breakdown (Right Column) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category 1 Card */}
                  <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-4 space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      <Coins className="h-4 w-4" />
                      <span>1. รับเงินครั้งเดียว</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(totalLumpSum)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      สินไหมภัยสงคราม + บำเหน็จตกทอด + ชดเชย 30 เท่า + กองทุน ทบ.
                    </p>
                  </div>

                  {/* Category 2 Card */}
                  <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-card to-card p-4 space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs font-bold">
                      <Calendar className="h-4 w-4" />
                      <span>2. รับเงินรายเดือน</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(totalMonthly)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      บำนาญพิเศษทายาทตลอดชีพ + เงินเพิ่ม พ.ช.ท. รายเดือน
                    </p>
                  </div>

                  {/* Category 3 Card */}
                  <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 space-y-1 shadow-sm">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      <GraduationCap className="h-4 w-4" />
                      <span>3. รับเงินรายปี</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(totalAnnualScholarship)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      ทุนการศึกษาบุตร ทบ. ({childrenCount} คน) จนจบปริญญาตรี
                    </p>
                  </div>
                </div>

                {/* Category 4 Non-Monetary Special Rights Banner */}
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs">
                      <Gift className="h-4 w-4" />
                      <span>4. สิทธิประโยชน์มิใช่ตัวเงินและสิทธิด้านอื่นๆ (Non-Monetary Rights)</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px]">
                      อนุมัติอัตโนมัติ
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <HeartHandshake className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิบรรจุทายาททดแทน 1 อัตรา</p>
                        <p className="text-[11px] text-muted-foreground">เข้ารับราชการในกองทัพบกเป็นกรณีพิเศษ</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <Shield className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิการรักษาพยาบาลตลอดชีพ</p>
                        <p className="text-[11px] text-muted-foreground">รพ.พระมงกุฎเกล้า / รพ.ค่าย สังกัด พบ.ทบ.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <Award className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิเหรียญพิทักษ์เสรีชน / กล้าหาญ</p>
                        <p className="text-[11px] text-muted-foreground">เสนอขอพระราชทานตามชั้นเกียรติยศ</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      <Building className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิกู้เคหะ ทบ. อัตราดอกเบี้ยพิเศษ</p>
                        <p className="text-[11px] text-muted-foreground">สินเชื่อสวัสดิการเพื่อที่อยู่อาศัยทายาท</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Print Certificate Banner */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/10 dark:bg-emerald-950/30 border border-emerald-800/30 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>หนังสือรับรองสิทธิทางการพร้อมระบบลายน้ำ QR Code e-Verification</span>
                  </div>
                  <Link href="/documents">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-emerald-700/40">
                      <FileText className="h-3.5 w-3.5" />
                      ออกหนังสือรับรอง
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Benefit Categories In-depth Showcase */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-xs border-emerald-700/40 text-emerald-800 dark:text-emerald-300">
              โครงสร้างสิทธิประโยชน์กำลังพล ทบ.
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              4 หมวดหมู่สิทธิประโยชน์และเงินสงเคราะห์ที่ครอบคลุม
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              อิงตามระเบียบกระทรวงกลาโหม กองทัพบก และ พ.ร.บ. สงเคราะห์ผู้ประสบภัยจากการปฏิบัติหน้าที่ราชการสนาม
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                code: "หมวดที่ 1",
                title: "รับเงินครั้งเดียว (Lump Sum)",
                rate: "1,500,000 - 8,000,000+ บาท",
                items: [
                  "สินไหมทดแทนประกันชีวิตภัยสงคราม ทบ.",
                  "บำเหน็จตกทอดทายาทตามกฎหมาย",
                  "เงินชดเชยตาม พ.ร.บ. สงเคราะห์ (30 เท่า)",
                  "เงินเพิ่มผลต่างปูนบำเหน็จเลื่อนชั้นยศ",
                  "เงินกองทุนสวัสดิการกองทัพบก (สก.ทบ.)",
                ],
                color: "border-amber-500/40 bg-amber-500/5",
                badge: "เงินก้อนช่วยเหลือ",
              },
              {
                code: "หมวดที่ 2",
                title: "รับเงินรายเดือน (Recurring)",
                rate: "15,000 - 55,000+ บาท/เดือน",
                items: [
                  "บำนาญพิเศษทายาทตามอัตราปูนบำเหน็จ",
                  "เงินเพิ่มพิเศษสำหรับการสู้รบ (พ.ช.ท.)",
                  "เงินบำนาญกำลังพลทุพพลภาพ ทบ.",
                  "เงินสงเคราะห์รายเดือนจาก สก.ทบ.",
                ],
                color: "border-blue-500/40 bg-blue-500/5",
                badge: "บำนาญตลอดชีพ",
              },
              {
                code: "หมวดที่ 3",
                title: "รับเงินรายปี (Annual Grants)",
                rate: "12,000 - 30,000 บาท/คน/ปี",
                items: [
                  "ทุนการศึกษาบุตรกำลังพล ทบ. (สก.ทบ.)",
                  "ทุนมูลนิธิ พล.อ.เปรม ติณสูลานนท์",
                  "ทุนมูลนิธิสายใจไทยในพระบรมราชูปถัมภ์",
                  "เงินสนับสนุนอุปกรณ์การศึกษารายปี",
                ],
                color: "border-emerald-500/40 bg-emerald-500/5",
                badge: "ทุนการศึกษา",
              },
              {
                code: "หมวดที่ 4",
                title: "สิทธิประโยชน์มิใช่ตัวเงิน",
                rate: "สิทธิเกียรติยศและสวัสดิการ",
                items: [
                  "สิทธิบรรจุทายาททดแทนเข้ารับราชการ ทบ. 1 อัตรา",
                  "สิทธิรักษาพยาบาล รพ.ค่าย / รพ.พระมงกุฎเกล้า",
                  "สิทธิขอพระราชทานเหรียญพิทักษ์เสรีชน",
                  "สิทธิสินเชื่อเคหะ ทบ. อัตราดอกเบี้ยพิเศษ",
                ],
                color: "border-purple-500/40 bg-purple-500/5",
                badge: "สิทธิเกียรติยศ",
              },
            ].map((cat, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-5 bg-card hover:shadow-lg transition-all space-y-3 ${cat.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {cat.code}
                  </span>
                  <Badge variant="outline" className="text-[9px]">
                    {cat.badge}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.title}</h3>
                  <p className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xs mt-0.5">{cat.rate}</p>
                </div>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  {cat.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Official Royal Thai Army Footer */}
      <footer className="border-t border-emerald-900/30 bg-slate-950 text-slate-300 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-700 to-slate-900 flex items-center justify-center text-amber-400 font-bold border border-emerald-600/40 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-sm">กองทัพบก (Royal Thai Army)</p>
              <p className="text-slate-400 text-[11px]">
                กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right text-slate-400 text-[11px] space-y-1">
            <p className="flex items-center justify-center sm:justify-end gap-1.5 text-slate-300">
              <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
              สายด่วนสวัสดิการกำลังพล กองทัพบก โทร.ทบ. 97106 หรือ 02-297-7106
            </p>
            <p>© 2569 กองทัพบก (Royal Thai Army). สงวนลิขสิทธิ์ตามระเบียบทางราชการ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
