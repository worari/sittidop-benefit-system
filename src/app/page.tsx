"use client";

import React, { useEffect, useState } from "react";
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
  Pen,
  Trash2,
} from "lucide-react";

export default function LandingPage() {
  // Fast Interactive Estimator State
  const [rankCategory, setRankCategory] = useState<"OFFICER" | "NCO" | "ENLISTED" | "RANGER">("OFFICER");
  const [selectedRank, setSelectedRank] = useState("พ.อ. (พันเอก)");
  const [salary, setSalary] = useState<number>(43500);
  const [normalYears, setNormalYears] = useState<number>(16);
  const [multiplierYears, setMultiplierYears] = useState<number>(8);

  const [rankOptions, setRankOptions] = useState<{ value: string; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>("");

  // Category data state (session only)
  type Category = {
    code: string;
    title: string;
    rate: string;
    items: string[];
    color: string;
    badge: string;
  };

  const initialCategories: Category[] = [
    {
      code: "หมวดที่ 1",
      title: "รับเงินครั้งเดียว (Lump Sum)",
      rate: "1,500,000 - 8,000,000+ บาท",
      items: [
        "เงินบำรุงขวัญ ทบ.",
        "เงินพระราชทาน",
        "เงินเยียวยา (สำนักนายก)",
        "เงินสินไหมทดแทนประกันชีวิต (พิทักษ์พล กห.หรือ ภัยสงคราม)",
        "เงินสินไหมทดแทนประกันชีวิต ",
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
        "เงินเพิ่มพิเศษสำหรับการสู้รบ (พ.ส.ร.)",
        "เงินบำนาญกำลังพลทุพพลภาพ ทบ.",
        "เงินช่วยเหลือรายเดือน (มูลนิธิสายใจไทย)",
      ],
      color: "border-blue-500/40 bg-blue-500/5",
      badge: "บำนาญตลอดชีพ",
    },
    {
      code: "หมวดที่ 3",
      title: "รับเงินรายปี (Annual Grants)",
      rate: "12,000 - 30,000 บาท/คน/ปี",
      items: [
        "ทุนการศึกษาบุตรกำลังพล ทบ. (ไม่เกิน 3 คน)",
        "ทุนการศึกษาบุตร สปน.",
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
      badge: "สิทธิเกียรติศ",
    },
  ];

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Category>>({});

  const beginCategoryEdit = (category?: Category, index?: number) => {
    const nextData = category
      ? {
          ...category,
          items: [...category.items],
        }
      : {
          code: "หมวดใหม่",
          title: "ชื่อหมวดสิทธิประโยชน์",
          rate: "0 - 0 บาท",
          items: ["รายการสิทธิประโยชน์ 1"],
          color: "border-slate-500/40 bg-slate-500/5",
          badge: "สิทธิประโยชน์",
        };

    setEditIndex(index ?? null);
    setEditData(nextData);
  };

  const saveCategory = () => {
    const normalized = {
      code: editData.code?.trim() || "หมวดใหม่",
      title: editData.title?.trim() || "ชื่อหมวดสิทธิประโยชน์",
      rate: editData.rate?.trim() || "0 - 0 บาท",
      items: Array.isArray(editData.items)
        ? editData.items.map((item) => item.trim()).filter(Boolean)
        : [],
      color: editData.color || "border-slate-500/40 bg-slate-500/5",
      badge: editData.badge?.trim() || "สิทธิประโยชน์",
    };

    if (editIndex === null) {
      setCategories((prev) => [...prev, normalized]);
    } else {
      setCategories((prev) => prev.map((category, index) => (index === editIndex ? { ...category, ...normalized } : category)));
    }

    setEditIndex(null);
    setEditData({});
  };

  const deleteCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setEditData({});
    }
  };

  const [lossType, setLossType] = useState<"KIA_COMBAT" | "DUTY_DEATH" | "DISABILITY" | "INJURY">("KIA_COMBAT");
  const [promotionSteps, setPromotionSteps] = useState<number>(7);
  const [childrenCount, setChildrenCount] = useState<number>(2);
  const [selectedUnit, setSelectedUnit] = useState("ร.19 พัน.1 / ฉก.นราธิวาส (พล.ร.9)");

  // Fetch rank & unit options from the database-backed endpoints on mount
  useEffect(() => {
    (async () => {
      try {
        const [rankRes, unitRes] = await Promise.all([
          fetch("/api/military/ranks"),
          fetch("/api/military/units"),
        ]);
        if (rankRes.ok) {
          const data = await rankRes.json();
          if (data.success && Array.isArray(data.data)) {
            setRankOptions(data.data);
          }
        }
        if (unitRes.ok) {
          const data = await unitRes.json();
          if (data.success && Array.isArray(data.data)) {
            setUnitOptions(data.data);
          }
        }
      } catch {
        // keep empty; UI falls back to free text input
      }
    })();
  }, []);

  // When appointment date changes, compute normal service years from date of commission to today
  useEffect(() => {
    if (!appointmentDate) return;
    const start = new Date(appointmentDate);
    if (Number.isNaN(start.getTime())) return;
    const today = new Date();
    const years = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years > 0) {
      setNormalYears(Number(years.toFixed(1)));
    }
  }, [appointmentDate]);

  // Calculations
  const totalYears = normalYears + multiplierYears;
  const promotedSalary = Math.round(salary * 1.57); // Estimated 7-step promotion

  // 1. One-time Lump Sum
  const isDeathCase = lossType === "KIA_COMBAT" || lossType === "DUTY_DEATH";
  const insuranceAmount = lossType === "KIA_COMBAT" ? 2000000 : lossType === "DISABILITY" ? 1500000 : lossType === "INJURY" ? 500000 : 1000000;
  const gratuityInheritance = isDeathCase ? Math.round(promotedSalary * totalYears * 1.5) : 0;
  const disasterCompensation = lossType !== "INJURY" ? Math.max(500000, salary * 30) : 0;
  const promotionDiff = isDeathCase ? Math.round((promotedSalary - salary) * 12 * 3) : 0;
  const armyFundGrant = lossType === "KIA_COMBAT" ? 1500000 : lossType === "INJURY" ? 300000 : 800000;
  const funeralAid = isDeathCase ? 200000 : 0;
  const moraleGrant = lossType === "INJURY" ? 10000 : 0; // เงินบำรุงขวัญบาดเจ็บพักรักษาไม่เกิน 20 วัน
  const totalLumpSum = insuranceAmount + gratuityInheritance + disasterCompensation + promotionDiff + armyFundGrant + funeralAid + moraleGrant;

  // 2. Monthly Recurring
  const monthlySpecialPension = isDeathCase || lossType === "DISABILITY" ? Math.round((promotedSalary * Math.min(totalYears, 35)) / 50) : 0;
  const combatAdditionalPay = lossType === "INJURY" ? 0 : 5000;
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
                sizes="44px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  ระบบสิทธิและสวัสดิการกำลังพล กองทัพบก
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
                <span className="hidden sm:inline">ศูนย์ประสานงานช่วยเหลือกำลังพล</span>
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
              และเงินช่วยเหลือกำลังพล กองทัพบก
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
                            setSelectedRank("ร.ต. (ร้อยตรี)");
                            setSalary(28400);
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
                    {rankOptions.length > 0 ? (
                      <select
                        value={selectedRank}
                        onChange={(e) => setSelectedRank(e.target.value)}
                        aria-label="ชั้นยศที่ครองตำแหน่ง"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {rankOptions.map((r) => (
                          <option key={r.value} value={r.label}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={selectedRank}
                        onChange={(e) => setSelectedRank(e.target.value)}
                        className="text-xs h-9 font-medium"
                      />
                    )}
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
                    <Label className="text-xs font-bold">วันบรรจุ (วันที่เข้ารับราชการ)</Label>
                    <Input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="text-xs h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      คำนวณเวลาราชการปกติ (ปี) อัตโนมัติจากวันบรรจุถึงวันนี้
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">เวลาราชการปกติ (ปี)</Label>
                    <Input
                      type="number"
                      value={normalYears}
                      onChange={(e) => setNormalYears(Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">หน่วยสังกัดกองทัพบก</Label>
                    {unitOptions.length > 0 ? (
                      <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        aria-label="หน่วยสังกัดกองทัพบก"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="text-xs h-9"
                      />
                    )}
                  </div>
                </div>

                {/* Incident Loss Type & Children Count */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">กรณีความสูญเสียจากการปฏิบัติหน้าที่</Label>
                    <select
                      value={lossType}
                      onChange={(e) => setLossType(e.target.value as any)}
                      aria-label="กรณีความสูญเสียจากการปฏิบัติหน้าที่"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="KIA_COMBAT">เสียชีวิต</option>
                      <option value="DISABILITY">พิการทุพพลภาพ</option>
                      <option value="INJURY">บาดเจ็บ</option>
                    </select>
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
                      สินไหมทดแทน + บำเหน็จตกทอด + ชดเชย 30 เท่า + กองทุน ทบ.
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
                      บำนาญพิเศษทายาทตลอดชีพ + เงินเพิ่ม พ.ส.ร. รายเดือน
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
                      คณะกรรมการพิจารณา
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${lossType === "INJURY" ? "bg-background/50 opacity-60" : "bg-background/80"} border-slate-200/70 dark:border-slate-800`}>
                      <HeartHandshake className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิบรรจุทายาททดแทน 1 อัตรา</p>
                        <p className="text-[11px] text-muted-foreground">
                          {lossType === "INJURY" ? "ไม่มีสิทธิ (ใช้กรณีเสียชีวิต/ทุพพลภาพถาวร)" : "เข้ารับราชการในกองทัพบกเป็นกรณีพิเศษ"}
                        </p>
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
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิเหรียญพิทักษ์เสรีชน / บางระจัน / กล้าหาญ</p>
                        <p className="text-[11px] text-muted-foreground">เสนอขอพระราชทานตามชั้นเกียรติยศ</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-gradient-to-br from-amber-500/15 via-card to-card p-2.5 rounded-xl border border-amber-500/40">
                      <Award className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">สิทธิเสนอขอเหรียญบ</p>
                        <p className="text-[11px] text-muted-foreground">
                          {lossType === "INJURY"
                            ? "เสนอขอพระราชทานแก่ผู้บาดเจ็บจากการสู้รบ/ปฏิบัติภารกิจ"
                            : "เสนอขอพระราชทานแก่ผู้เสียชีวิต/ทุพพลภาพจากการสู้รบ"}
                        </p>
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-center sm:text-left space-y-2">
              <Badge variant="outline" className="text-xs border-emerald-700/40 text-emerald-800 dark:text-emerald-300">
                โครงสร้างสิทธิประโยชน์กำลังพล ทบ.
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                4 หมวดหมู่สิทธิประโยชน์และเงินสงเคราะห์ที่ครอบคลุม
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                อิงตามระเบียบกระทรวงกลาโหม กองทัพบก และ พ.ร.บ. สงเคราะห์ผู้ประสบภัยจากการปฏิบัติหน้าที่ราชการสนาม
              </p>
            </div>

            <Button
              type="button"
              onClick={() => beginCategoryEdit()}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
            >
              เพิ่มหมวดข้อมูล
            </Button>
          </div>

          {editData && Object.keys(editData).length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editIndex === null ? "เพิ่มหมวดสิทธิประโยชน์" : "แก้ไขหมวดสิทธิประโยชน์"}
                </h3>
                <Button type="button" variant="outline" onClick={() => { setEditIndex(null); setEditData({}); }}>
                  ยกเลิก
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">รหัสหมวด</Label>
                  <Input
                    value={editData.code ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, code: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">ชื่อหมวด</Label>
                  <Input
                    value={editData.title ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">อัตรา / ช่วงค่า</Label>
                  <Input
                    value={editData.rate ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, rate: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">ป้ายชื่อหมวด</Label>
                  <Input
                    value={editData.badge ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, badge: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold">รายการสิทธิประโยชน์ (หนึ่งบรรทัดต่อรายการ)</Label>
                  <textarea
                    value={(editData.items ?? []).join("\n")}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        items: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold">คลาสสีแสดงผล</Label>
                  <select
                    value={editData.color ?? "border-slate-500/40 bg-slate-500/5"}
                    onChange={(e) => setEditData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="border-amber-500/40 bg-amber-500/5">ทอง</option>
                    <option value="border-blue-500/40 bg-blue-500/5">น้ำเงิน</option>
                    <option value="border-emerald-500/40 bg-emerald-500/5">เขียว</option>
                    <option value="border-purple-500/40 bg-purple-500/5">ม่วง</option>
                    <option value="border-slate-500/40 bg-slate-500/5">เทา</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setEditIndex(null); setEditData({}); }}>
                  ยกเลิก
                </Button>
                <Button type="button" onClick={saveCategory} className="bg-emerald-800 hover:bg-emerald-900 text-white">
                  {editIndex === null ? "บันทึกเพิ่มหมวด" : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={`${cat.code}-${idx}`}
                className={`rounded-2xl border p-5 bg-card hover:shadow-lg transition-all space-y-3 ${cat.color}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {cat.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`แก้ไข ${cat.title}`}
                      onClick={() => beginCategoryEdit(cat, idx)}
                      className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Pen className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`ลบ ${cat.title}`}
                      onClick={() => deleteCategory(idx)}
                      className="rounded-md border border-rose-300 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.title}</h3>
                  <p className="text-emerald-700 dark:text-emerald-400 font-extrabold text-xs mt-0.5">{cat.rate}</p>
                </div>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                  {cat.items.map((item, itemIdx) => (
                    <li key={`${cat.code}-${itemIdx}`} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-1">
                  <Badge variant="outline" className="text-[9px]">
                    {cat.badge}
                  </Badge>
                </div>
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
              สายด่วนสิทธิและสวัสดิการกำลังพล กองทัพบก โทร.ทบ. 97106 หรือ 02-297-7106
            </p>
            <p>© 2569 กองทัพบก (Royal Thai Army). สงวนลิขสิทธิ์ตามระเบียบทางราชการ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
