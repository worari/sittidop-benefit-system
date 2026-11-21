"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { PublicBenefitTrackingWidget } from "../presentation/components/tracking/PublicBenefitTrackingWidget";
import { Button } from "../presentation/components/ui/button";
import { Badge } from "../presentation/components/ui/badge";
import { Input } from "../presentation/components/ui/input";
import { Label } from "../presentation/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../presentation/components/ui/card";
import { formatCurrency } from "../presentation/lib/utils";
import {
  Search,
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
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);

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
    <div className="min-h-screen flex flex-col bg-[#0d1526] text-slate-100">
      {/* Official Government Blue & Gold Top Bar Stripe */}
      <div className="h-1 w-full bg-[#1877F2] flex">
        <div className="h-full w-28 bg-amber-400" />
      </div>

      {/* Official RTA Military Header (Facebook Blue Government Theme) */}
      <header className="sticky top-0 z-50 w-full border-b bg-[#162136] border-[#283b5c] shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-blue-400/50 bg-[#0d1526] shrink-0 shadow-sm">
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
                <span className="font-bold text-base tracking-tight text-white">
                  ระบบ WeR-RTA
                </span>
                <span className="text-xs font-semibold text-blue-200 hidden md:inline">
                  : บริหารจัดการสิทธิและสวัสดิการกำลังพล
                </span>
                <Badge variant="army" className="text-[10px] font-semibold py-0 px-1.5">
                  ศปก.ทบ. • กพ.ทบ.
                </Badge>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                ศูนย์ปฏิบัติการกองทัพบก • กรมกำลังพลทหารบก (Welfare and Rights Royal Thai Army)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs sm:text-sm font-medium gap-1.5 shadow-sm border-0">
                  <LayoutDashboard className="h-3.5 w-3.5 text-amber-300" />
                  <span className="hidden sm:inline">ศูนย์บริหารจัดการสิทธิและสวัสดิการ</span>
                  <span className="sm:hidden">ระบบงาน</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm gap-1.5 border-[#2e446b] bg-[#1a2942] text-slate-100 hover:bg-[#24395c]">
                    <LogIn className="h-3.5 w-3.5 text-blue-300" />
                    <span className="hidden sm:inline">ลงทะเบียนรออนุมัติ</span>
                    <span className="sm:hidden">ลงทะเบียน</span>
                  </Button>
                </Link>
                <Link href="/login?callbackUrl=/dashboard">
                  <Button size="sm" className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs sm:text-sm font-medium gap-1.5 shadow-sm border-0">
                    <Lock className="h-3.5 w-3.5 text-amber-300" />
                    <span className="hidden sm:inline">เข้าสู่ระบบกำลังพล (ศปก.ทบ.)</span>
                    <span className="sm:hidden">เข้าสู่ระบบ</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-14 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1877F2]/15 border border-[#1877F2]/40 text-blue-200 text-xs font-semibold">
            <Award className="h-4 w-4 text-amber-400" />
            ระบบ WeR-RTA : Welfare and Rights Royal Thai Army
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
            ระบบสารสนเทศเพื่อการบริหารจัดการสิทธิและสวัสดิการกำลังพล <br className="hidden sm:inline" />
            <span className="text-[#4599ff]">
              กองทัพบก (ศปก.ทบ. • กพ.ทบ.)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            ระบบบูรณาการบันทึกกำลังพลปฏิบัติหน้าที่ราชการสายสนาม จชต. กองกำลังป้องกันชายแดน และพื้นที่เสี่ยงภัย ตามคำสั่งรับรอง ศปก.ทบ.
            รายงานการสูญเสียด่วน (กพ.๔) และรายงานละเอียด (กพ.๓) ประมาณการสิทธิและสวัสดิการ ๔ หมวด และติดตามสิทธิสวัสดิการจนปิดจบขั้นตอน
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="#tracking-section">
              <Button size="lg" className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm sm:text-base gap-2 shadow-sm px-6 border-0">
                <Search className="h-5 w-5 text-amber-300" />
                ติดตามสถานะสิทธิกำลังพล & ทายาท
              </Button>
            </a>
            <a href="#fast-calculator">
              <Button size="lg" variant="outline" className="font-medium text-sm sm:text-base gap-2 border-[#2e446b] bg-[#162136] text-slate-100 hover:bg-[#1f2f4d]">
                <Calculator className="h-5 w-5 text-[#4599ff]" />
                ทดลองประมาณการสิทธิ 4 หมวดของ ทบ.
              </Button>
            </a>
            <Link href="/documents">
              <Button size="lg" variant="outline" className="font-medium text-sm sm:text-base gap-2 border-[#2e446b] bg-[#162136] text-slate-100 hover:bg-[#1f2f4d]">
                <FileText className="h-5 w-5 text-[#4599ff]" />
                ตัวอย่างหนังสือรับรองสิทธิ (กพ.ทบ.)
              </Button>
            </Link>
          </div>

          {/* Military Trust & Regulation Badges */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-[#4599ff]" />
              พ.ร.บ. สงเคราะห์ผู้ประสบภัย พ.ศ. 2543
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Landmark className="h-4 w-4 text-[#4599ff]" />
              ระเบียบกระทรวงกลาโหม & กองทัพบก
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Lock className="h-4 w-4 text-[#4599ff]" />
              ชั้นความลับราชการและการคุ้มครองข้อมูลทายาท
            </span>
          </div>
        </section>

        {/* ช่องติดตามสถานะสิทธิและสวัสดิการกำลังพล (WeR-RTA Tracking Timeline) */}
        <section id="tracking-section" className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
          <PublicBenefitTrackingWidget />
        </section>

        {/* Real-time Interactive Fast Benefit Estimator for Royal Thai Army */}
        <section id="fast-calculator" className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="rounded-lg border border-[#283b5c] bg-[#162136] p-6 sm:p-8 shadow-md relative">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243656] pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-[#1877F2] text-white">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    แบบฟอร์มจำลองการคำนวณสิทธิกำลังพล กองทัพบก (เบื้องต้น)
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ปรับเปลี่ยนชั้นยศ เงินเดือน เวลาราชการทวีคูณ และสถานภาพ เพื่อดูยอดเงินสงเคราะห์ 4 หมวดของ ทบ. ทันที
                </p>
              </div>

              <Badge variant="army" className="text-xs font-medium px-2.5 py-1 self-start sm:self-center">
                เกณฑ์สิทธิกำลังพล ทบ. พ.ศ. 2569
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
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
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
                        className={`text-xs font-medium py-1.5 rounded transition-colors ${rankCategory === t.id
                          ? "bg-[#1b4332] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                    <Button className="w-full bg-[#1b4332] hover:bg-[#143426] text-white text-xs font-medium gap-2 rounded-md shadow-xs">
                      <Calculator className="h-4 w-4 text-amber-300" />
                      เปิดระบบคำนวณสิทธิแบบเต็มรูปแบบ (Advanced Calculator)
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Real-time 4-Category Results Breakdown (Right Column) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category 1 Card */}
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-xs border-l-4 border-l-amber-600">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-xs font-semibold">
                      <Coins className="h-4 w-4 text-amber-700" />
                      <span>1. รับเงินครั้งเดียว</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(totalLumpSum)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      สินไหมทดแทน + บำเหน็จตกทอด + ชดเชย 30 เท่า + กองทุน ทบ.
                    </p>
                  </div>

                  {/* Category 2 Card */}
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-xs border-l-4 border-l-blue-700">
                    <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-400 text-xs font-semibold">
                      <Calendar className="h-4 w-4 text-blue-700" />
                      <span>2. รับเงินรายเดือน</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(totalMonthly)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      บำนาญพิเศษทายาทตลอดชีพ + เงินเพิ่ม พ.ส.ร. รายเดือน
                    </p>
                  </div>

                  {/* Category 3 Card */}
                  <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-xs border-l-4 border-l-[#1b4332]">
                    <div className="flex items-center gap-1.5 text-[#1b4332] dark:text-emerald-400 text-xs font-semibold">
                      <GraduationCap className="h-4 w-4 text-[#1b4332]" />
                      <span>3. รับเงินรายปี</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(totalAnnualScholarship)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ทุนการศึกษาบุตร ทบ. ({childrenCount} คน) จนจบปริญญาตรี
                    </p>
                  </div>
                </div>

                {/* Category 4 Non-Monetary Special Rights Banner */}
                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs border-l-4 border-l-indigo-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-semibold text-xs">
                      <Gift className="h-4 w-4 text-indigo-700" />
                      <span>4. สิทธิประโยชน์มิใช่ตัวเงินและสิทธิด้านอื่นๆ (Non-Monetary Rights)</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      พิจารณาตามเกณฑ์
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-start gap-2 p-2.5 rounded-md border ${lossType === "INJURY" ? "bg-slate-100/50 opacity-60" : "bg-slate-50 dark:bg-slate-800"} border-slate-200 dark:border-slate-700`}>
                      <HeartHandshake className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">สิทธิบรรจุทายาททดแทน 1 อัตรา</p>
                        <p className="text-[11px] text-slate-500">
                          {lossType === "INJURY" ? "ไม่มีสิทธิ (ใช้กรณีเสียชีวิต/ทุพพลภาพถาวร)" : "เข้ารับราชการในกองทัพบกเป็นกรณีพิเศษ"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">สิทธิการรักษาพยาบาลตลอดชีพ</p>
                        <p className="text-[11px] text-slate-500">รพ.พระมงกุฎเกล้า / รพ.ค่าย สังกัด พบ.ทบ.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Award className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">สิทธิเหรียญพิทักษ์เสรีชน / บางระจัน / กล้าหาญ</p>
                        <p className="text-[11px] text-slate-500">เสนอขอพระราชทานตามชั้นเกียรติยศ</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Building className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">สิทธิกู้เคหะ ทบ. อัตราดอกเบี้ยพิเศษ</p>
                        <p className="text-[11px] text-slate-500">สินเชื่อสวัสดิการเพื่อที่อยู่อาศัยทายาท</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Print Certificate Banner */}
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <FileCheck className="h-4 w-4 text-[#1b4332] dark:text-emerald-400" />
                    <span>หนังสือรับรองสิทธิทางการพร้อมระบบรหัสตรวจสอบย้อนกลับ (Verification Code)</span>
                  </div>
                  <Link href="/documents">
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-slate-300">
                      <FileText className="h-3.5 w-3.5 text-[#1b4332]" />
                      พิมพ์หนังสือรับรอง
                    </Button>
                  </Link>
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
                <Button type="button" onClick={saveCategory} className="bg-[#1b4332] hover:bg-[#143426] text-white">
                  {editIndex === null ? "บันทึกเพิ่มหมวด" : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={`${cat.code}-${idx}`}
                className="rounded-md border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="army" className="text-[10px] font-semibold px-2 py-0.5">
                    {cat.code}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`แก้ไข ${cat.title}`}
                      onClick={() => beginCategoryEdit(cat, idx)}
                      className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <Pen className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={`ลบ ${cat.title}`}
                      onClick={() => deleteCategory(idx)}
                      className="rounded border border-slate-200 p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.title}</h3>
                  <p className="text-[#1b4332] dark:text-emerald-400 font-bold text-xs mt-0.5">{cat.rate}</p>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {cat.items.map((item, itemIdx) => (
                    <li key={`${cat.code}-${itemIdx}`} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#1b4332] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[9px]">
                    {cat.badge}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Official Royal Thai Army Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-[#143426] text-slate-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-white p-1 flex items-center justify-center border border-white/20 shrink-0">
              <Shield className="h-6 w-6 text-[#1b4332]" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">กองทัพบก (Royal Thai Army)</p>
              <p className="text-slate-300 text-xs">
                กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right text-slate-300 text-xs space-y-1">
            <p className="flex items-center justify-center sm:justify-end gap-1.5 text-amber-300">
              <PhoneCall className="h-3.5 w-3.5" />
              สายด่วนสิทธิและสวัสดิการกำลังพล กองทัพบก โทร.ทบ. 97106 หรือ 02-297-7106
            </p>
            <p>© 2569 กองทัพบก (Royal Thai Army). สงวนลิขสิทธิ์ตามระเบียบทางราชการ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
