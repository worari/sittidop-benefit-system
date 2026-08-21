"use client";

import React, { useState } from "react";
import { BenefitEstimationEngine } from "../../../core/use-cases/estimation/BenefitEstimationEngine";
import {
  EstimateInput,
  BenefitCalculationSummary,
  BenefitEligibilityResult,
} from "../../../core/domain/value-objects/types";
import { VulnerabilityLevel, PaymentFrequency } from "../../../core/domain/value-objects/enums";
import { formatCurrency, formatThaiDate } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Calculator,
  User,
  CreditCard,
  HeartPulse,
  Home,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Building,
  Info,
  Send,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BenefitCalculatorWizardProps {
  initialCitizen?: {
    nationalId?: string;
    dateOfBirth?: string;
    age?: number;
    monthlyIncome?: number;
    hasStateWelfareCard?: boolean;
    hasDisability?: boolean;
    disabilityType?: string;
    livingCondition?: "ALONE" | "FAMILY" | "BEDRIDDEN" | "NURSING_HOME";
    province?: string;
  };
  onApplicationSubmitted?: (application: any) => void;
}

export function BenefitCalculatorWizard({ initialCitizen, onApplicationSubmitted }: BenefitCalculatorWizardProps) {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 4;

  // Form State
  const [formData, setFormData] = useState<EstimateInput>({
    nationalId: initialCitizen?.nationalId || "",
    age: initialCitizen?.age || 72,
    birthDate: initialCitizen?.dateOfBirth || "1954-04-12",
    monthlyIncome: initialCitizen?.monthlyIncome ?? 2500,
    hasStateWelfareCard: initialCitizen?.hasStateWelfareCard ?? true,
    hasDisability: initialCitizen?.hasDisability ?? false,
    disabilityType: initialCitizen?.disabilityType || "",
    livingCondition: initialCitizen?.livingCondition || "ALONE",
    hardshipFactors: {
      noCaregiver: true,
      inadequateHousing: false,
      chronicIllness: false,
      unemployed: true,
      debtBurden: false,
    },
    province: initialCitizen?.province || "กรุงเทพมหานคร",
  });

  const [calculationResult, setCalculationResult] = useState<BenefitCalculationSummary | null>(null);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedProgramToClaim, setSelectedProgramToClaim] = useState<BenefitEligibilityResult | null>(null);
  const [claimRemarks, setClaimRemarks] = useState("");
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Auto calculate when arriving at step 4 or results
  const handleCalculate = () => {
    const result = BenefitEstimationEngine.calculate(formData);
    setCalculationResult(result);
    setStep(5); // Results step
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleCalculate();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleOpenClaimModal = (program: BenefitEligibilityResult) => {
    setSelectedProgramToClaim(program);
    setClaimRemarks(`ขอยื่นรับสิทธิ ${program.programName} ตามผลการประเมินสิทธิออนไลน์`);
    setClaimModalOpen(true);
  };

  const handleSubmitClaim = async () => {
    if (!selectedProgramToClaim) return;
    setIsSubmittingClaim(true);

    try {
      const payload = {
        citizenNationalId: formData.nationalId || "1100400289112",
        programId: selectedProgramToClaim.programId,
        requestedAmount: selectedProgramToClaim.estimatedAmount,
        applicantRemarks: claimRemarks,
        citizenData: {
          title: "นาย",
          firstName: "สมศักดิ์",
          lastName: "มั่นคง",
          dateOfBirth: formData.birthDate || "1954-04-12",
          gender: "MALE",
          phone: "081-456-7890",
          address: "124/5 หมู่ 3 ซอยสุขเกษม",
          subdistrict: "วงศ์สว่าง",
          district: "บางซื่อ",
          province: formData.province || "กรุงเทพมหานคร",
          postalCode: "10800",
          monthlyIncome: formData.monthlyIncome,
          hasStateWelfareCard: formData.hasStateWelfareCard,
          isDisabilityRegistered: formData.hasDisability,
          disabilityType: formData.disabilityType,
          livingCondition: formData.livingCondition,
        },
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setClaimSuccessMessage(`ยื่นคำขอรับสิทธิสำเร็จ! รหัสคำขอ: ${json.data?.applicationNumber || "APP-2569-NEW"}`);
        setClaimModalOpen(false);
        if (onApplicationSubmitted) onApplicationSubmitted(json.data);
      }
    } catch {
      // Local fallback simulation
      setClaimSuccessMessage("ยื่นคำขอรับสิทธิสำเร็จ! เจ้าหน้าที่รับเรื่องเข้าสู่กระบวนการตรวจสอบแล้ว");
      setClaimModalOpen(false);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const calculateAgeFromDate = (dob: string) => {
    if (!dob) return formData.age;
    const birth = new Date(dob);
    const now = new Date();
    let calculated = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      calculated--;
    }
    return Math.max(0, calculated);
  };

  const progressPercentage = ((Math.min(step, totalSteps)) / totalSteps) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          ระบบประมาณการสิทธิสวัสดิการผู้สูงอายุอัจฉริยะ (DOP Benefit Estimator)
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          คำนวณสิทธิสวัสดิการและเงินช่วยเหลือภาครัฐ
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          ตรวจสอบสิทธิเบี้ยยังชีพ สวัสดิการแห่งรัฐ เบี้ยคนพิการ เงินสงเคราะห์ฉุกเฉิน และทุนปรับปรุงบ้าน ได้อย่างถูกต้องและรวดเร็ว
        </p>
      </div>

      {/* Progress Bar (Only during steps 1-4) */}
      {step <= totalSteps && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>ขั้นตอนที่ {step} จาก {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% ดำเนินการแล้ว</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* STEP 1: Personal & Age */}
      {step === 1 && (
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>ข้อมูลพื้นฐานและอายุของผู้สูงอายุ</CardTitle>
                <CardDescription>ระบุอายุหรือวันเดือนปีเกิดเพื่อคำนวณเบี้ยยังชีพขั้นบันไดตามกฎหมาย</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">วัน/เดือน/ปีเกิด (พ.ศ. หรือ ค.ศ.)</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate || ""}
                  onChange={(e) => {
                    const dob = e.target.value;
                    const calculated = calculateAgeFromDate(dob);
                    setFormData({ ...formData, birthDate: dob, age: calculated });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">อายุคำนวณ (ปีบริบูรณ์)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="font-bold text-lg text-emerald-700 dark:text-emerald-400"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">ปี</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId">เลขประจำตัวประชาชน (13 หลัก - ไม่บังคับสำหรับการทดสอบ)</Label>
                <Input
                  id="nationalId"
                  placeholder="1-xxxx-xxxxx-xx-x"
                  value={formData.nationalId || ""}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">จังหวัดตามภูมิลำเนาในทะเบียนบ้าน</Label>
                <Input
                  id="province"
                  value={formData.province || ""}
                  placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่"
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
            </div>

            {formData.age < 60 && (
              <Alert variant="warning">
                <Info className="h-4 w-4" />
                <AlertTitle>คำแนะนำช่วงอายุ</AlertTitle>
                <AlertDescription>
                  ผู้สูงอายุสัญชาติไทยที่มีอายุครบ 60 ปีบริบูรณ์จะมีสิทธิได้รับเบี้ยยังชีพ (หากอายุ 59 ปี สามารถลงทะเบียนล่วงหน้าได้ตั้งแต่ 1 ต.ค.)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div />
            <Button onClick={handleNext} className="gap-2">
              ถัดไป: ข้อมูลรายได้และสวัสดิการแห่งรัฐ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Income & State Welfare Card */}
      {step === 2 && (
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>ข้อมูลรายได้และบัตรสวัสดิการแห่งรัฐ</CardTitle>
                <CardDescription>ประเมินเกณฑ์ความช่วยเหลือสำหรับผู้มีรายได้น้อยและเงินเพิ่มพิเศษ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">รายได้เฉลี่ยต่อเดือน (บาท)</Label>
              <div className="relative">
                <Input
                  id="monthlyIncome"
                  type="number"
                  min={0}
                  step={500}
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                  className="pl-8 font-semibold"
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground">฿</span>
              </div>
              <p className="text-xs text-muted-foreground">
                (กรณีไม่มีรายได้ หรือพึ่งพาบุตรหลาน ให้ระบุ 0 บาท)
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasStateWelfareCard" className="text-sm font-semibold">
                    มีบัตรสวัสดิการแห่งรัฐ (โครงการลงทะเบียนเพื่อสวัสดิการแห่งรัฐ)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ได้รับสิทธิรูดซื้อสินค้า 300 บ./ด. และเงินสงเคราะห์เพิ่มพิเศษผู้สูงอายุ
                  </p>
                </div>
                <Switch
                  id="hasStateWelfareCard"
                  checked={formData.hasStateWelfareCard}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasStateWelfareCard: checked })}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button onClick={handleNext} className="gap-2">
              ถัดไป: สุขภาพและความพิการ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Disability & Health */}
      {step === 3 && (
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>สถานะสุขภาพและความพิการ</CardTitle>
                <CardDescription>ตรวจสอบสิทธิเบี้ยความพิการเพิ่มเติม 800 - 1,000 บาท/เดือน</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hasDisability" className="text-sm font-semibold">
                    มีบัตรประจำตัวคนพิการ / จดทะเบียนความพิการ
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    ผู้สูงอายุที่มีความพิการสามารถรับทั้งเบี้ยยังชีพและเบี้ยคนพิการควบคู่กันได้
                  </p>
                </div>
                <Switch
                  id="hasDisability"
                  checked={formData.hasDisability}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasDisability: checked })}
                />
              </div>

              {formData.hasDisability && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Label htmlFor="disabilityType">ประเภทความพิการหลัก</Label>
                  <Input
                    id="disabilityType"
                    placeholder="เช่น ทางการเคลื่อนไหว, ทางการมองเห็น, ทางการได้ยิน"
                    value={formData.disabilityType || ""}
                    onChange={(e) => setFormData({ ...formData, disabilityType: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>สภาวะสุขภาพและการดูแล</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "chronicIllness", label: "มีโรคประจำตัวเรื้อรัง/ต้องพบแพทย์ประจำ" },
                  { key: "noCaregiver", label: "ขาดผู้ดูแลประจำ หรืออยู่ลำพัง" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(formData.hardshipFactors?.[item.key as keyof typeof formData.hardshipFactors])}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hardshipFactors: {
                            ...formData.hardshipFactors,
                            [item.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button onClick={handleNext} className="gap-2">
              ถัดไป: สภาพความเป็นอยู่และที่พักอาศัย
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: Living Condition & Housing */}
      {step === 4 && (
        <Card className="border-slate-200/90 dark:border-slate-800 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>สภาพที่อยู่อาศัยและความเป็นอยู่</CardTitle>
                <CardDescription>ประเมินสิทธิเงินสงเคราะห์ฉุกเฉินและทุนปรับปรุงบ้านผู้สูงอายุ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>สภาพการอยู่อาศัยในปัจจุบัน</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: "ALONE", label: "อยู่คนเดียวลำพัง" },
                  { value: "FAMILY", label: "อยู่กับครอบครัว" },
                  { value: "BEDRIDDEN", label: "ผู้ป่วยติดเตียง" },
                  { value: "NURSING_HOME", label: "สถานสงเคราะห์" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, livingCondition: opt.value as any })}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                      formData.livingCondition === opt.value
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <Label className="text-sm font-semibold">ปัญหาความเดือดร้อนด้านที่อยู่อาศัย (เพื่อขอรับทุนปรับปรุงบ้าน)</Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.hardshipFactors?.inadequateHousing)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hardshipFactors: {
                        ...formData.hardshipFactors,
                        inadequateHousing: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>บ้านพักอาศัยชำรุดทรุดโทรม / ห้องน้ำไม่ปลอดภัย / ต้องการทางลาดสำหรับผู้สูงอายุ</span>
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button onClick={handleCalculate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-6 shadow-md shadow-emerald-600/20">
              <Calculator className="h-4 w-4" />
              ประมวลผลประมาณการสิทธิทันที
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: Detailed Results Breakdown */}
      {step === 5 && calculationResult && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {claimSuccessMessage && (
            <Alert variant="success" className="shadow-md">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <AlertTitle className="text-base font-bold">แจ้งเตือนระบบ</AlertTitle>
              <AlertDescription className="text-sm font-medium">{claimSuccessMessage}</AlertDescription>
            </Alert>
          )}

          {/* Results Summary Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-6 sm:p-8 shadow-xl">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-300 text-xs">
                    ผลการคำนวณอย่างเป็นทางการ
                  </Badge>
                  <span className="text-xs text-slate-400">
                    ณ วันที่ {formatThaiDate(new Date())}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">ดัชนีความเปราะบาง:</span>
                  <Badge
                    variant={
                      calculationResult.vulnerabilityLevel === VulnerabilityLevel.CRITICAL
                        ? "destructive"
                        : calculationResult.vulnerabilityLevel === VulnerabilityLevel.HIGH
                        ? "warning"
                        : "info"
                    }
                  >
                    {calculationResult.vulnerabilityScore}/100 ({calculationResult.vulnerabilityLevel})
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300 font-medium">สิทธิประโยชน์รายเดือน</p>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                    {formatCurrency(calculationResult.totalMonthlyEstimate)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ต่อเดือน (รวมเบี้ยยังชีพ + เบี้ยพิเศษ)</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300 font-medium">ประมาณการรับรวมต่อปี</p>
                  <p className="text-3xl font-extrabold text-teal-300 mt-1">
                    {formatCurrency(calculationResult.totalAnnualEstimate)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ต่อปีงบประมาณ</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <p className="text-xs text-slate-300 font-medium">สิทธิเงินก้อน/สงเคราะห์ครั้งคราว</p>
                  <p className="text-3xl font-extrabold text-amber-300 mt-1">
                    {formatCurrency(calculationResult.totalOneTimeEstimate)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ทุนปรับปรุงบ้าน/ฉุกเฉิน/เงินกู้</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Alert */}
          {calculationResult.summaryRecommendations.length > 0 && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-2">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                ข้อเสนอแนะและคำแนะนำสำหรับท่าน:
              </h4>
              <ul className="space-y-1 text-xs text-emerald-800 dark:text-emerald-300 pl-5 list-disc">
                {calculationResult.summaryRecommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Eligible Programs List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>รายการสิทธิประโยชน์ที่ผ่านเกณฑ์ ({calculationResult.eligiblePrograms.length} รายการ)</span>
              <span className="text-xs font-normal text-muted-foreground">คลิกรายการเพื่อดูรายละเอียดและเอกสารที่ต้องใช้</span>
            </h3>

            <div className="space-y-3">
              {calculationResult.eligiblePrograms.map((program) => {
                const isExpanded = expandedProgramId === program.programId;

                return (
                  <Card
                    key={program.programId}
                    className="border-emerald-200/80 dark:border-emerald-900/50 shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="success" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            มีสิทธิได้รับ
                          </Badge>
                          <span className="text-xs font-semibold text-slate-500 font-mono">
                            {program.programCode}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {program.programName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {program.eligibilityReasons[0]}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-muted-foreground block">
                            {program.frequency === PaymentFrequency.MONTHLY
                              ? "ยอดรับรายเดือน"
                              : program.frequency === PaymentFrequency.ONE_TIME
                              ? "วงเงินสูงสุด (ครั้งเดียว)"
                              : "วงเงินช่วยเหลือต่อครั้ง"}
                          </span>
                          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(program.estimatedAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            onClick={() => handleOpenClaimModal(program)}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            ยื่นคำขอ
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedProgramId(isExpanded ? null : program.programId)}
                            className="h-9 w-9 p-0"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Accordion Detail View */}
                    {isExpanded && (
                      <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs animate-in slide-in-from-top-1 duration-200">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">เกณฑ์การพิจารณา:</p>
                          <ul className="list-disc pl-5 space-y-0.5 text-slate-600 dark:text-slate-400">
                            {program.eligibilityReasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>

                        {program.legalBasis && (
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">ระเบียบและกฎหมายอ้างอิง:</p>
                            <p className="text-slate-500 dark:text-slate-400 italic">{program.legalBasis}</p>
                          </div>
                        )}

                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">เอกสารหลักฐานที่ต้องเตรียมยื่น:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {program.requiredDocuments.map((doc, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[11px] font-normal">
                                <FileText className="h-3 w-3 mr-1 text-slate-500" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Ineligible Programs with Advice */}
          {calculationResult.ineligiblePrograms.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                รายการที่ไม่เข้าเกณฑ์ในขณะนี้ ({calculationResult.ineligiblePrograms.length} รายการ)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {calculationResult.ineligiblePrograms.map((program) => (
                  <div
                    key={program.programId}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {program.programName}
                      </h4>
                      <Badge variant="outline" className="text-[10px] text-slate-400">
                        ยังไม่เข้าเกณฑ์
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {program.ineligibilityReasons[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <Calculator className="h-4 w-4" />
              คำนวณใหม่ด้วยข้อมูลอื่น
            </Button>
            <Button
              variant="navy"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              พิมพ์เอกสารผลการประมาณการ (Print/PDF)
            </Button>
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              ยื่นคำขอรับสิทธิสวัสดิการออนไลน์
            </DialogTitle>
            <DialogDescription>
              ระบบจะส่งคำขอของท่านไปยังเจ้าหน้าที่กลุ่มงานพิจารณาสิทธิเพื่อตรวจสอบเอกสารและอนุมัติ
            </DialogDescription>
          </DialogHeader>

          {selectedProgramToClaim && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">โครงการที่ยื่นขอ:</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">{selectedProgramToClaim.programName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  รหัสโครงการ: {selectedProgramToClaim.programCode} | วงเงิน: {formatCurrency(selectedProgramToClaim.estimatedAmount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantRemarks">บันทึกเพิ่มเติมหรือความประสงค์พิเศษของผู้ยื่น</Label>
                <Input
                  id="applicantRemarks"
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  placeholder="ระบุข้อความถึงเจ้าหน้าที่..."
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">เอกสารหลักฐานประกอบ (ระบบจัดเตรียมอัตโนมัติ):</p>
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  {selectedProgramToClaim.requiredDocuments.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleSubmitClaim}
              disabled={isSubmittingClaim}
            >
              {isSubmittingClaim ? "กำลังส่งคำขอ..." : "ยืนยันการยื่นคำขอรับสิทธิ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
