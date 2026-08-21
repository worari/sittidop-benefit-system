"use client";

import React, { useState, useEffect } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { MilitaryBenefitCalculationResult, BenefitCategoryCode } from "@/core/domain/value-objects/military-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Progress } from "@/presentation/components/ui/progress";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  Calculator,
  Shield,
  Award,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  HeartHandshake,
  RotateCcw,
  Sliders,
  DollarSign,
  Coins,
  Calendar,
  CalendarDays,
  Gift,
} from "lucide-react";
import Link from "next/link";

export function MilitaryBenefitCalculator() {
  const [step, setStep] = useState(1);
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");

  // Form State
  const [militaryId, setMilitaryId] = useState("MIL-49021884");
  const [rank, setRank] = useState("LIEUTENANT_COLONEL");
  const [rankAbbr, setRankAbbr] = useState("พ.ท.");
  const [fullName, setFullName] = useState("พ.ท. วีรชาติ ภักดีสยาม");
  const [normalUnit, setNormalUnit] = useState("ร.19 พัน.1 (พล.ร.9)");
  const [fieldUnit, setFieldUnit] = useState("ฉก.นราธิวาส (กกล.ทบ.)");
  const [salary, setSalary] = useState(43500);
  const [salaryLevel, setSalaryLevel] = useState("น.3");
  const [salaryStep, setSalaryStep] = useState(21.5);
  const [compensationAmount, setCompensationAmount] = useState(5000);
  const [additionalPay, setAdditionalPay] = useState(2500);

  const [serviceYearsNormal, setServiceYearsNormal] = useState(16);
  const [serviceYearsMultiplier, setServiceYearsMultiplier] = useState(8);
  const totalServiceYears = serviceYearsNormal + serviceYearsMultiplier;

  const [missionType, setMissionType] = useState("COUNTER_INSURGENCY");
  const [lossType, setLossType] = useState("KIA_COMBAT_DEATH");
  const [promotionSteps, setPromotionSteps] = useState(7);
  const [promotedRankAbbr, setPromotedRankAbbr] = useState("พล.อ.");
  const [promotedSalary, setPromotedSalary] = useState(68500);

  const [hasSpouse, setHasSpouse] = useState(true);
  const [spouseName, setSpouseName] = useState("นางพิมพา ภักดีสยาม");
  const [childrenCount, setChildrenCount] = useState(2);
  const [studyingChildrenCount, setStudyingChildrenCount] = useState(2);

  const [calculationResult, setCalculationResult] = useState<MilitaryBenefitCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setPersonnelList(json.data);
          loadPersonnelData(json.data[0]);
        }
      });
  }, []);

  const loadPersonnelData = (p: MilitaryPersonnelRecord) => {
    setSelectedPersonnelId(p.id);
    setMilitaryId(p.militaryId);
    setRank(p.rank);
    setRankAbbr(p.rankAbbr);
    setFullName(`${p.rankAbbr} ${p.firstName} ${p.lastName}`);
    setNormalUnit(p.normalUnit);
    setFieldUnit(p.fieldUnit || p.normalUnit);
    setSalary(p.salary);
    setSalaryLevel(p.salaryLevel);
    setSalaryStep(p.salaryStep);
    setCompensationAmount(p.compensationAmount || 0);
    setAdditionalPay(p.additionalPay || 0);
    setServiceYearsNormal(p.serviceYearsNormal);
    setServiceYearsMultiplier(p.serviceYearsMultiplier);
    setMissionType(p.missionType);
    setLossType(p.lossType);
    setPromotionSteps(p.promotionSteps || 7);
    setPromotedRankAbbr(p.promotedRankAbbr || "พล.อ.");
    setPromotedSalary(p.promotedSalary || Math.round(p.salary * 1.55));
    setHasSpouse(!!p.spouse);
    setSpouseName(p.spouse?.fullName || "");
    setChildrenCount(p.children?.length || 0);
    setStudyingChildrenCount(p.children?.filter((c) => c.isStudying)?.length || 0);
  };

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const payload = {
        militaryId,
        citizenId: "3100600492811",
        rank,
        rankAbbr,
        firstName: fullName.split(" ")[1] || "กำลังพล",
        lastName: fullName.split(" ")[2] || "ไทย",
        militaryBranch: "ROYAL_THAI_ARMY",
        abbreviatedPosition: "ผบ.พัน.สน.",
        normalUnit,
        fieldPosition: "ผบ.ฉก.",
        fieldUnit,
        salary: Number(salary),
        salaryLevel,
        salaryStep: Number(salaryStep),
        compensationAmount: Number(compensationAmount),
        additionalPay: Number(additionalPay),
        appointmentDate: "2010-05-01",
        serviceYearsNormal: Number(serviceYearsNormal),
        serviceYearsMultiplier: Number(serviceYearsMultiplier),
        totalServiceYears,
        missionType,
        actionType: "DIRECT_COMBAT",
        incidentType: "COMBAT_ENGAGEMENT",
        lossType,
        promotionSteps: Number(promotionSteps),
        promotedRank: "GENERAL",
        promotedRankAbbr,
        promotedSalary: Number(promotedSalary),
        spouse: hasSpouse
          ? {
              nationalId: "1100400289112",
              fullName: spouseName,
              isLegallyMarried: true,
              hasPensionRights: true,
              allocationPercentage: 50,
            }
          : null,
        children: [
          {
            nationalId: "1100400289113",
            fullName: "ด.ช.นราธิป ภักดีสยาม",
            age: 11,
            isStudying: true,
            educationLevel: "PRIMARY" as const,
            allocationPercentage: 25,
          },
          {
            nationalId: "1100400289114",
            fullName: "น.ส.กานดา ภักดีสยาม",
            age: 19,
            isStudying: true,
            educationLevel: "BACHELOR" as const,
            allocationPercentage: 25,
          },
        ],
      };

      const res = await fetch("/api/rules/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setCalculationResult(json.data);
        setStep(5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const steps = [
    { num: 1, title: "ข้อมูลกำลังพล" },
    { num: 2, title: "เวลาราชการ & ทวีคูณ" },
    { num: 3, title: "ความสูญเสีย & ปูนบำเหน็จ" },
    { num: 4, title: "ครอบครัว & ทายาท" },
    { num: 5, title: "สรุป 4 หมวดสิทธิประโยชน์" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ระบบคำนวณประมาณการสิทธิกำลังพล 4 หมวด
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            แยก 4 หมวดหมู่: 1.รับเงินครั้งเดียว 2.รับเงินรายเดือน 3.รับเงินรายปี 4.สิทธิมิใช่ตัวเงิน
          </p>
        </div>

        <Link href="/rules">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-emerald-600" />
            ปรับแต่งสูตรคำนวณ (Rule Config)
          </Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            ขั้นตอนที่ {step} จาก 5: {steps[step - 1].title}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600">
            {step * 20}%
          </span>
        </div>
        <Progress value={step * 20} className="h-2" />

        <div className="grid grid-cols-5 gap-1 pt-3 text-center">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`text-[10px] truncate ${
                step === s.num
                  ? "font-bold text-emerald-600"
                  : step > s.num
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-muted-foreground"
              }`}
            >
              {s.num}. {s.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select or Input Personnel */}
      {step === 1 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 1: เลือกกำลังพลหรือระบุฐานเงินเดือน
            </h2>
            <p className="text-xs text-muted-foreground">
              สามารถเลือกจากทะเบียนกำลังพลที่มีอยู่แล้ว หรือกรอกข้อมูลเพื่อจำลองการประมาณการ
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold">เลือกจากทะเบียนกำลังพลตัวอย่าง</Label>
            <select
              value={selectedPersonnelId}
              onChange={(e) => {
                const found = personnelList.find((p) => p.id === e.target.value);
                if (found) loadPersonnelData(found);
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              {personnelList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rankAbbr} {p.firstName} {p.lastName} - {p.normalUnit} ({p.militaryId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">ยศและชื่อ-สกุล</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก</Label>
              <Input
                value={militaryId}
                onChange={(e) => setMilitaryId(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">สังกัดปกติ (ต้นสังกัด)</Label>
              <Input
                value={normalUnit}
                onChange={(e) => setNormalUnit(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">สังกัดสนาม / หน่วยเฉพาะกิจ</Label>
              <Input
                value={fieldUnit}
                onChange={(e) => setFieldUnit(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เงินเดือนปัจจุบัน (บาท)</Label>
              <Input
                type="number"
                value={salary}
                onChange={(e) => {
                  setSalary(Number(e.target.value));
                  setPromotedSalary(Math.round(Number(e.target.value) * 1.55));
                }}
                className="text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ค่าตอบแทนพิเศษ พ.ช.ท. / พ.ส.ร. (บาท)</Label>
              <Input
                type="number"
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(2)}
            >
              ถัดไป: เวลาราชการทวีคูณ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Service Years and Multipliers */}
      {step === 2 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 2: เวลาราชการปกติและเวลาราชการทวีคูณ
            </h2>
            <p className="text-xs text-muted-foreground">
              ระบุจำนวนปีเวลาราชการปกติและเวลาราชการทวีคูณจากการปฏิบัติราชการสงคราม/ปราบปราม
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Label className="text-xs font-bold">เวลาราชการปกติ (ปี)</Label>
              <Input
                type="number"
                value={serviceYearsNormal}
                onChange={(e) => setServiceYearsNormal(Number(e.target.value))}
                className="text-sm font-bold mt-1"
              />
              <p className="text-[10px] text-muted-foreground">นับจากวันบรรจุเข้ารับราชการ</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30">
              <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">เวลาราชการทวีคูณ (ปี)</Label>
              <Input
                type="number"
                value={serviceYearsMultiplier}
                onChange={(e) => setServiceYearsMultiplier(Number(e.target.value))}
                className="text-sm font-bold mt-1 text-emerald-600"
              />
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">ราชการสนาม / ปราบปราม</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
              <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">รวมเวลาราชการคำนวณ (ปี)</Label>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400 pt-1">
                {totalServiceYears} ปี
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">ใช้คำนวณบำเหน็จบำนาญพิเศษ</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(3)}
            >
              ถัดไป: เหตุการณ์และความสูญเสีย
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Loss & Promotion */}
      {step === 3 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 3: เหตุการณ์ความสูญเสียและชั้นยศปูนบำเหน็จ
            </h2>
            <p className="text-xs text-muted-foreground">
              กำหนดประเภทความสูญเสีย จำนวนชั้นยศที่ได้รับการปูนบำเหน็จ และเงินเดือนหลังเลื่อนชั้นยศ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ประเภทความสูญเสีย (Loss Type)</Label>
              <select
                value={lossType}
                onChange={(e) => setLossType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบในสมรภูมิ (KIA - 7-9 ชั้นยศ)</option>
                <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่ราชการสนาม (5-7 ชั้นยศ)</option>
                <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ (WIA)</option>
                <option value="SEVERE_WOUND_WIA">บาดเจ็บสาหัสจากการรบ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ประเภทภารกิจ (Mission Type)</Label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="COUNTER_INSURGENCY">ปราบปรามผู้ก่อการร้าย / จชต.</option>
                <option value="BORDER_DEFENSE">ป้องกันชายแดน</option>
                <option value="PEACEKEEPING_UN">รักษาสันติภาพ UN</option>
                <option value="INTERNAL_SECURITY">รักษาความมั่นคงภายใน</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">จำนวนชั้นยศปูนบำเหน็จพิเศษ</Label>
              <select
                value={promotionSteps}
                onChange={(e) => setPromotionSteps(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value={9}>ปูนบำเหน็จพิเศษ 9 ชั้นยศ</option>
                <option value={8}>ปูนบำเหน็จพิเศษ 8 ชั้นยศ</option>
                <option value={7}>ปูนบำเหน็จพิเศษ 7 ชั้นยศ</option>
                <option value={5}>ปูนบำเหน็จพิเศษ 5 ชั้นยศ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">เงินเดือนหลังปูนบำเหน็จเลื่อนชั้นยศ (บาท)</Label>
              <Input
                type="number"
                value={promotedSalary}
                onChange={(e) => setPromotedSalary(Number(e.target.value))}
                className="text-xs font-mono font-bold text-amber-600"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(4)}
            >
              ถัดไป: ข้อมูลครอบครัว & ทายาท
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Family & Heirs */}
      {step === 4 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 4: ข้อมูลครอบครัวและทายาทผู้มีสิทธิ
            </h2>
            <p className="text-xs text-muted-foreground">
              ระบุสถานะคู่สมรสและบุตรที่กำลังศึกษา เพื่อคำนวณทุนการศึกษาและการแบ่งสัดส่วนเงินสงเคราะห์
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">คู่สมรสจดทะเบียนตามกฎหมาย</span>
                <input
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </div>
              {hasSpouse && (
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อ-สกุล คู่สมรส</Label>
                  <Input
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">จำนวนบุตรทั้งหมด (คน)</Label>
                <Input
                  type="number"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">จำนวนบุตรที่กำลังศึกษาอยู่ (คน)</Label>
                <Input
                  type="number"
                  value={studyingChildrenCount}
                  onChange={(e) => setStudyingChildrenCount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-md"
              onClick={handleRunCalculation}
              disabled={calculating}
            >
              <Sparkles className="h-4 w-4" />
              {calculating ? "กำลังประมวลผล 4 หมวด..." : "ประมวลผลประมาณการสิทธิ 4 หมวด"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Calculation Results Breakdown across 4 Categories */}
      {step === 5 && calculationResult && (
        <div className="space-y-6">
          {/* Top 4 Categories Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cat 1: Lump Sum */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold">
                <Coins className="h-4 w-4" />
                <span>หมวด 1: รับเงินครั้งเดียว</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalLumpSum)}
              </p>
              <p className="text-[10px] text-amber-100">เงินก้อนครั้งเดียวแก่ทายาท</p>
            </div>

            {/* Cat 2: Monthly */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-100 font-bold">
                <Calendar className="h-4 w-4" />
                <span>หมวด 2: รับเงินรายเดือน</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalMonthlyPension)}
              </p>
              <p className="text-[10px] text-blue-100">บำนาญพิเศษตลอดชีพ</p>
            </div>

            {/* Cat 3: Annual */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold">
                <CalendarDays className="h-4 w-4" />
                <span>หมวด 3: รับเงินรายปี</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalAnnualScholarship)}
              </p>
              <p className="text-[10px] text-emerald-100">ทุนการศึกษาบุตรต่อปี</p>
            </div>

            {/* Cat 4: Non-Monetary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-purple-100 font-bold">
                <Gift className="h-4 w-4" />
                <span>หมวด 4: สิทธิมิใช่ตัวเงิน</span>
              </div>
              <p className="text-2xl font-black">
                {calculationResult.nonMonetaryRightsCount} สิทธิ
              </p>
              <p className="text-[10px] text-purple-100">บรรจุทายาท / รักษาพยาบาล</p>
            </div>
          </div>

          {/* 4 Category Detailed Tables */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              รายละเอียดสิทธิประโยชน์รายหมวด (4 Categories Entitlement Breakdown)
            </h3>

            {Object.values(calculationResult.categories || {}).map((cat) => (
              <Card key={cat.category} className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cat.categoryThaiName} ({cat.categoryName})
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-emerald-600">
                    {cat.totalAmount > 0 ? (
                      <span>ยอดรวมหมวด: {formatCurrency(cat.totalAmount)}</span>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">สิทธิประโยชน์คุ้มครอง</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div
                      key={item.ruleId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.ruleName}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          สูตร: {item.formulaUsed} • {item.legalBasis}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-emerald-600">
                        {item.amount > 0 ? formatCurrency(item.amount) : "มีสิทธิได้รับ"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Heir Distribution & Successor Job Right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-purple-600" />
                การจัดสรรเงินให้ทายาทตามกฎหมาย
              </h4>
              <div className="space-y-2 text-xs">
                {calculationResult.heirDistribution.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{h.heirName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {h.sharePercentage}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 font-bold">เงินก้อน: {formatCurrency(h.allocatedLumpSum)}</span>
                      <span className="text-blue-600 font-bold">รายเดือน: {formatCurrency(h.allocatedMonthlyPension)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                หมวด 4: สิทธิบรรจุทายาททดแทน 1 อัตรา
              </h4>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>มีสิทธิได้รับการบรรจุทายาททดแทน 1 อัตรา</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  {calculationResult.successorJobRight.conditionText}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  คุณสมบัติ: บุตรหรือคู่สมรส อายุ 18 - 35 ปี มีคุณวุฒิตรงตามอัตรากำลังพลกลาโหม
                </p>
              </div>
            </Card>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
              <RotateCcw className="h-4 w-4" />
              คำนวณใหม่
            </Button>
            <div className="flex items-center gap-2">
              <Link href="/documents">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-md">
                  <FileText className="h-4 w-4" />
                  สร้างหนังสือรับรองสิทธิทางการทันที (Official Certificate)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
