"use client";

import React, { useState, useEffect } from "react";
import {
  BenefitRuleDefinition,
  BenefitScopeType,
  ActionCauseType,
  DimensionOption,
  DimensionType,
  FormulaTierConfig,
} from "@/core/domain/entities/BenefitRule";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { BenefitCategoryCode, MilitaryBenefitCalculationResult } from "@/core/domain/value-objects/military-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Switch } from "@/presentation/components/ui/switch";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import { Search, X } from "lucide-react";
import { DimensionChipsEditor } from "@/presentation/components/rules/DimensionChipsEditor";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  Sliders,
  Edit,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Award,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Code,
  DollarSign,
  Plus,
  Coins,
  Calendar,
  CalendarDays,
  Gift,
  Target,
  Flame,
  Building,
  HeartCrack,
  Activity,
  Layers,
  Crosshair,
  Trash2,
  FilePlus2,
  Landmark,
} from "lucide-react";

// ============================================================================
// Centralized Benefit Category Metadata (หมวดหมู่สิทธิและสวัสดิการ กองทัพบก)
// หมวด 1: รับเงินครั้งเดียว | หมวด 2: รับเงินรายเดือน | หมวด 3: รับเงินรายปี | หมวด 4: สิทธิมิใช่ตัวเงิน
// ============================================================================
type PaymentType = "ONE_TIME_LUMP_SUM" | "MONTHLY_PENSION" | "ANNUAL_GRANT" | "NON_MONETARY";

export const BENEFIT_CATEGORY_META: Record<
  BenefitCategoryCode,
  { label: string; thaiName: string; englishName: string; paymentType: PaymentType }
> = {
  [BenefitCategoryCode.LUMP_SUM_PAYMENT]: {
    label: "หมวด 1: รับเงินครั้งเดียว (Lump Sum)",
    thaiName: "หมวด 1: รับเงินครั้งเดียว",
    englishName: "One-Time Lump Sum",
    paymentType: "ONE_TIME_LUMP_SUM",
  },
  [BenefitCategoryCode.MONTHLY_PAYMENT]: {
    label: "หมวด 2: รับเงินรายเดือน (Monthly)",
    thaiName: "หมวด 2: รับเงินรายเดือน",
    englishName: "Monthly Payment",
    paymentType: "MONTHLY_PENSION",
  },
  [BenefitCategoryCode.ANNUAL_PAYMENT]: {
    label: "หมวด 3: รับเงินรายปี (Annual)",
    thaiName: "หมวด 3: รับเงินรายปี",
    englishName: "Annual Payment",
    paymentType: "ANNUAL_GRANT",
  },
  [BenefitCategoryCode.NON_MONETARY_BENEFIT]: {
    label: "หมวด 4: สิทธิมิใช่ตัวเงิน (Non-Monetary)",
    thaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    englishName: "Non-Monetary Rights",
    paymentType: "NON_MONETARY",
  },
};

export function RuleManager() {
  const [rules, setRules] = useState<BenefitRuleDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategoryCode>(
    BenefitCategoryCode.LUMP_SUM_PAYMENT
  );
  const [loading, setLoading] = useState(true);
  // Search box for the rules table (รหัส / ชื่อสิทธิ / ข้อกฎหมาย / คำอธิบาย)
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRule, setEditingRule] = useState<BenefitRuleDefinition | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Filters for Rule Table
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");
  const [causeFilter, setCauseFilter] = useState<string>("ALL");

  // Master dimension options loaded from the server (extensible via API CRUD)
  const [missionOptions, setMissionOptions] = useState<DimensionOption[]>([]);
  const [personnelCategoryOptions, setPersonnelCategoryOptions] = useState<DimensionOption[]>([]);
  const [lossTypeOptions, setLossTypeOptions] = useState<DimensionOption[]>([]);

  const fetchDimensionOptions = async () => {
    try {
      const res = await fetch("/api/rules/dimensions");
      const json = await res.json();
      if (json.success) {
        const all: DimensionOption[] = json.data;
        setMissionOptions(all.filter((o) => o.type === "MISSION_TYPE"));
        setPersonnelCategoryOptions(all.filter((o) => o.type === "PERSONNEL_CATEGORY"));
        setLossTypeOptions(all.filter((o) => o.type === "LOSS_TYPE"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshRuleCatalog = async () => {
    await Promise.all([fetchRules(), fetchDimensionOptions()]);
  };

  // Edit form state
  const [formFormula, setFormFormula] = useState("");
  const [formFactor, setFormFactor] = useState(1);
  const [formBaseAmount, setFormBaseAmount] = useState(0);
  const [formMinAmount, setFormMinAmount] = useState<number | undefined>(undefined);
  const [formMaxAmount, setFormMaxAmount] = useState<number | undefined>(undefined);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<BenefitCategoryCode>(BenefitCategoryCode.LUMP_SUM_PAYMENT);

  // 5 Dimension state in Editor
  const [formBenefitScope, setFormBenefitScope] = useState<BenefitScopeType>("IN_ARMY");
  const [formCauseType, setFormCauseType] = useState<ActionCauseType>("BOTH");
  const [formMissions, setFormMissions] = useState<string[]>([]);
  const [formPersonnelCategories, setFormPersonnelCategories] = useState<string[]>([]);
  const [formLossTypes, setFormLossTypes] = useState<string[]>([]);

  // Configurable Benefit Tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทน เช่น เงินบำรุงขวัญ)
  const [formTiers, setFormTiers] = useState<FormulaTierConfig[]>([]);

  // Create Form State
  const [newRuleCode, setNewRuleCode] = useState("");
  const [newRuleName, setNewRuleName] = useState("");
  const [newCategory, setNewCategory] = useState<BenefitCategoryCode>(BenefitCategoryCode.LUMP_SUM_PAYMENT);
  const [newDescription, setNewDescription] = useState("");
  const [newLegalBasis, setNewLegalBasis] = useState("");
  const [newPaymentType, setNewPaymentType] = useState<"ONE_TIME_LUMP_SUM" | "MONTHLY_PENSION" | "ANNUAL_GRANT" | "NON_MONETARY">("ONE_TIME_LUMP_SUM");
  const [newBenefitScope, setNewBenefitScope] = useState<BenefitScopeType>("OUTSIDE_ARMY");
  const [newCauseType, setNewCauseType] = useState<ActionCauseType>("ENEMY_ACTION");
  const [newFormula, setNewFormula] = useState("{baseAmount}");
  const [newBaseAmount, setNewBaseAmount] = useState(500000);
  const [newFactor, setNewFactor] = useState(1);
  const [newMinAmount, setNewMinAmount] = useState<number | undefined>(undefined);
  const [newMaxAmount, setNewMaxAmount] = useState<number | undefined>(undefined);
  const [newMissions, setNewMissions] = useState<string[]>(["SOUTHERN_BORDER", "COUNTER_INSURGENCY"]);
  const [newPersonnelCategories, setNewPersonnelCategories] = useState<string[]>(["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER"]);
  const [newLossTypes, setNewLossTypes] = useState<string[]>(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"]);
  const [newTiers, setNewTiers] = useState<FormulaTierConfig[]>([]);
  const [creating, setCreating] = useState(false);

  // Sandbox simulation interactive state (5 dimensions tester)
  const [sbScope, setSbScope] = useState<"IN_ARMY" | "OUTSIDE_ARMY">("IN_ARMY");
  const [sbCause, setSbCause] = useState<"ENEMY_ACTION" | "NON_ENEMY_ACTION">("ENEMY_ACTION");
  const [sbMission, setSbMission] = useState("SOUTHERN_BORDER");
  const [sbCategory, setSbCategory] = useState("COMMISSIONED_OFFICER");
  const [sbLossType, setSbLossType] = useState("SEVERE_WOUND_WIA");
  const [sbAdmissionDate, setSbAdmissionDate] = useState("2026-03-12");
  const [sbDischargeDate, setSbDischargeDate] = useState("2026-03-27");
  const [sbSalary, setSbSalary] = useState(43500);
  const [sbTotalYears, setSbTotalYears] = useState(24);
  const [sbPromotionSteps, setSbPromotionSteps] = useState(7);
  const [simulationResult, setSimulationResult] = useState<MilitaryBenefitCalculationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const calculateStayDays = (adm: string, dis: string) => {
    if (!adm || !dis) return 0;
    try {
      const d1 = new Date(adm);
      const d2 = new Date(dis);
      const diff = Math.abs(d2.getTime() - d1.getTime());
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  // Estimate เงินบำรุงขวัญ from configurable tiers defined on RULE-LUMP-HOSPITAL-STAY (single source of truth = engine)
  const getMoraleEstimate = (): number => {
    const days = calculateStayDays(sbAdmissionDate, sbDischargeDate);
    const moraleRule = rules.find((r) => r.ruleCode === "RULE-LUMP-HOSPITAL-STAY");
    if (moraleRule?.formulaTiers && moraleRule.formulaTiers.length > 0) {
      return MilitaryRuleEngine.evaluateFormulaTiers(moraleRule.formulaTiers, sbLossType, days);
    }
    const lt = (sbLossType || "").toUpperCase();
    if (lt.includes("DEATH") || lt.includes("KIA")) return 40000;
    return days <= 20 ? 10000 : 20000;
  };

  // Reusable Benefit Tiers editor (used in Create modal and Edit dialog)
  const renderTierEditor = (
    tiers: FormulaTierConfig[],
    setTiers: React.Dispatch<React.SetStateAction<FormulaTierConfig[]>>
  ) => (
    <div className="space-y-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            สูตร & กฎเกณฑ์ระดับเงินตอบแทน (Benefit Tiers)
          </Label>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {"กำหนดเงื่อนไขและจำนวนเงินแต่ละระดับ เช่น เสียชีวิต/ทุพพลภาพ 40,000 | บาดเจ็บพักรักษา ≤20 วัน 10,000 | >20 วัน รับเพิ่มอีก 10,000"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setTiers([...tiers, { id: `tier-${Date.now()}`, label: "", amount: 10000 }])
          }
          className="text-[11px] h-7 gap-1 shrink-0"
        >
          <Plus className="h-3 w-3" />
          เพิ่มระดับเงิน
        </Button>
      </div>

      {tiers.length > 0 && (
        <>
          <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-muted-foreground">
            <span className="col-span-4">เงื่อนไข / ชื่อระดับ</span>
            <span className="col-span-2">กลุ่มความสูญเสีย</span>
            <span className="col-span-1">วัน ≥</span>
            <span className="col-span-1">วัน ≤</span>
            <span className="col-span-2">จำนวนเงิน (บาท)</span>
            <span className="col-span-1 text-center">เพิ่มเติม</span>
            <span className="col-span-1"></span>
          </div>

          {tiers.map((tier, idx) => (
            <div
              key={tier.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-background"
            >
              <div className="col-span-12 sm:col-span-4">
                <Input
                  value={tier.label}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, label: e.target.value };
                    setTiers(next);
                  }}
                  placeholder="เช่น กรณีเสียชีวิตหรือพิการทุพพลภาพ"
                  className="text-xs h-8"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <select
                  value={(tier.lossTypes && tier.lossTypes[0]) || "ALL"}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, lossTypes: [e.target.value] };
                    setTiers(next);
                  }}
                  aria-label="กลุ่มประเภทความสูญเสียของระดับเงิน"
                  className="w-full h-8 rounded border border-input bg-background px-1.5 text-xs"
                >
                  <option value="DEATH">เสียชีวิต</option>
                  <option value="DISABILITY">ทุพพลภาพ</option>
                  <option value="INJURY">บาดเจ็บ</option>
                  <option value="ALL">ทุกกรณี</option>
                </select>
              </div>

              <div className="col-span-3 sm:col-span-1">
                <Input
                  type="number"
                  value={tier.minDays ?? ""}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, minDays: e.target.value ? Number(e.target.value) : undefined };
                    setTiers(next);
                  }}
                  placeholder="≥"
                  className="text-xs h-8"
                />
              </div>

              <div className="col-span-3 sm:col-span-1">
                <Input
                  type="number"
                  value={tier.maxDays ?? ""}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, maxDays: e.target.value ? Number(e.target.value) : undefined };
                    setTiers(next);
                  }}
                  placeholder="≤"
                  className="text-xs h-8"
                />
              </div>

              <div className="col-span-6 sm:col-span-2">
                <Input
                  type="number"
                  value={tier.amount}
                  onChange={(e) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, amount: Number(e.target.value) };
                    setTiers(next);
                  }}
                  className="font-mono text-xs h-8 font-bold text-emerald-600"
                />
              </div>

              <div className="col-span-4 sm:col-span-1 flex items-center justify-center">
                <Switch
                  checked={!!tier.isAdditional}
                  onCheckedChange={(v) => {
                    const next = [...tiers];
                    next[idx] = { ...tier, isAdditional: v };
                    setTiers(next);
                  }}
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTiers(tiers.filter((_, i) => i !== idx))}
                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground">
            💡 เปิดสวิตช์ "เพิ่มเติม" เพื่อให้จำนวนเงินของระดับนั้นถูก<strong>บวกเพิ่ม</strong>จากระดับฐาน (เช่น เกิน 20 วัน รับเพิ่มอีก 10,000 บาท) มิฉะนั้นระบบจะเลือกใช้ระดับเงินที่สูงที่สุดที่ตรงเงื่อนไข
          </p>
        </>
      )}
    </div>
  );

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rules");
      const json = await res.json();
      if (json.success) {
        setRules(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchDimensionOptions();
  }, []);

  const openEditor = (rule: BenefitRuleDefinition) => {
    setEditingRule(rule);
    setFormFormula(rule.formulaExpression);
    setFormFactor(rule.multiplierFactor);
    setFormBaseAmount(rule.baseAmount);
    setFormMinAmount(rule.minAmount);
    setFormMaxAmount(rule.maxAmount);
    setFormIsActive(rule.isActive);
    setFormDescription(rule.description);
    setFormCategory(rule.category);

    // 5 Dimensions
    setFormBenefitScope(rule.benefitScope || "IN_ARMY");
    setFormCauseType(rule.causeType || "BOTH");
    setFormMissions(rule.conditions?.allowedMissions || ["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY"]);
    setFormPersonnelCategories(rule.conditions?.allowedPersonnelCategories || ["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER"]);
    setFormLossTypes(rule.conditions?.allowedLossTypes || ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"]);

    // Configurable Benefit Tiers
    setFormTiers(rule.formulaTiers ? rule.formulaTiers.map((t) => ({ ...t })) : []);

    setIsEditorOpen(true);
  };

  const handleOpenCreateModal = () => {
    setNewRuleCode(`RULE-LUMP-NEW-${Date.now().toString().slice(-4)}`);
    setNewRuleName("");
    setNewCategory(selectedCategory);
    setNewDescription("");
    setNewLegalBasis("");
    setNewPaymentType(BENEFIT_CATEGORY_META[selectedCategory].paymentType);
    setNewBenefitScope("OUTSIDE_ARMY");
    setNewCauseType("ENEMY_ACTION");
    setNewFormula("{baseAmount}");
    setNewBaseAmount(500000);
    setNewFactor(1);
    setNewMinAmount(undefined);
    setNewMaxAmount(undefined);
    setNewMissions(["SOUTHERN_BORDER", "BORDER_DEFENSE", "COUNTER_INSURGENCY"]);
    setNewPersonnelCategories(["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER", "CIVILIAN_STAFF"]);
    setNewLossTypes(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "SEVERE_WOUND_WIA"]);
    setNewTiers([]);
    setIsCreateModalOpen(true);
  };

  // Preset Template loader (e.g. เงินเยียวยา สำนักนายกฯ, พักรักษาพยาบาล)
  const applyTemplate = (type: "PM_RELIEF" | "SBPAC_AID" | "ARMY_SPECIAL_FUND" | "PM_SCHOLARSHIP" | "HOSPITAL_STAY") => {
    if (type === "PM_RELIEF") {
      setNewRuleCode("RULE-LUMP-PM-RELIEF");
      setNewRuleName("เงินเยียวยาพิเศษ สำนักนายกรัฐมนตรี");
      setNewCategory(BenefitCategoryCode.LUMP_SUM_PAYMENT);
      setNewPaymentType("ONE_TIME_LUMP_SUM");
      setNewDescription("เงินช่วยเหลือเยียวยาผู้ได้รับผลกระทบสืบเนื่องจากสถานการณ์ความไม่สงบในจังหวัดชายแดนภาคใต้ (กองทุนสำนักนายกฯ)");
      setNewLegalBasis("ระเบียบสำนักนายกรัฐมนตรีว่าด้วยการให้ความช่วยเหลือเยียวยาผู้ได้รับผลกระทบจากเหตุการณ์ความไม่สงบฯ พ.ศ. 2555");
      setNewBenefitScope("OUTSIDE_ARMY");
      setNewCauseType("ENEMY_ACTION");
      setNewFormula("{baseAmount}");
      setNewBaseAmount(500000);
      setNewMissions(["SOUTHERN_BORDER", "COUNTER_INSURGENCY"]);
      setNewLossTypes(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"]);
    } else if (type === "SBPAC_AID") {
      setNewRuleCode("RULE-LUMP-SBPAC-AID");
      setNewRuleName("เงินช่วยเหลือเยียวยา ศอ.บต.");
      setNewCategory(BenefitCategoryCode.LUMP_SUM_PAYMENT);
      setNewPaymentType("ONE_TIME_LUMP_SUM");
      setNewDescription("เงินช่วยเหลือเยียวยาผู้ได้รับผลกระทบจากศูนย์อำนวยการบริหารจังหวัดชายแดนภาคใต้");
      setNewLegalBasis("ระเบียบคณะกรรมการยุทธศาสตร์ด้านการพัฒนาจังหวัดชายแดนภาคใต้ (กพต.)");
      setNewBenefitScope("OUTSIDE_ARMY");
      setNewCauseType("ENEMY_ACTION");
      setNewFormula("{baseAmount}");
      setNewBaseAmount(500000);
      setNewMissions(["SOUTHERN_BORDER"]);
      setNewLossTypes(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "SEVERE_WOUND_WIA"]);
    } else if (type === "PM_SCHOLARSHIP") {
      setNewRuleCode("RULE-ANNUAL-PM-SCHOLARSHIP");
      setNewRuleName("ทุนการศึกษาบุตรผู้เสียสละ สำนักนายกรัฐมนตรี");
      setNewCategory(BenefitCategoryCode.ANNUAL_PAYMENT);
      setNewPaymentType("ANNUAL_GRANT");
      setNewDescription("ทุนการศึกษาต่อเนื่องรายปีสำหรับบุตรกำลังพลผู้สูญเสียจนสำเร็จการศึกษาระดับปริญญาตรี");
      setNewLegalBasis("กองทุนช่วยเหลือเยียวยาด้านการศึกษา สำนักนายกรัฐมนตรี");
      setNewBenefitScope("OUTSIDE_ARMY");
      setNewCauseType("ENEMY_ACTION");
      setNewFormula("{baseAmount} * {studyingChildrenCount}");
      setNewBaseAmount(50000);
      setNewMissions(["SOUTHERN_BORDER", "BORDER_DEFENSE"]);
      setNewLossTypes(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"]);
    } else if (type === "HOSPITAL_STAY") {
      setNewRuleCode("RULE-LUMP-HOSPITAL-STAY");
      setNewRuleName("เงินช่วยเหลือการพักรักษาพยาบาล (Hospital Stay Benefit)");
      setNewCategory(BenefitCategoryCode.LUMP_SUM_PAYMENT);
      setNewPaymentType("ONE_TIME_LUMP_SUM");
      setNewDescription("เงินบำรุงขวัญกำลังพล: กรณีเสียชีวิตหรือพิการทุพพลภาพรับ 40,000 บาท; กรณีบาดเจ็บและพักรักษาตัวในโรงพยาบาลไม่เกิน 10 วันรับ 10,000 บาท; กรณีบาดเจ็บพักรักษาตัว 11-20 วันขึ้นไป (>= 20 วัน) รับเพิ่มอีก 10,000 บาท รวม 20,000 บาท");
      setNewLegalBasis("ระเบียบกองทัพบกว่าด้วยการสงเคราะห์กำลังพลที่ได้รับบาดเจ็บจากการปฏิบัติราชการสนาม พ.ศ. 2562");
      setNewBenefitScope("IN_ARMY");
      setNewCauseType("BOTH");
      setNewFormula("{hospitalStayDays} <= 10 ? 10000 : 20000");
      setNewBaseAmount(10000);
      setNewMissions(["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY", "ALL"]);
      setNewLossTypes(["KIA_COMBAT_DEATH", "DUTY_DEATH", "TOTAL_PERMANENT_DISABILITY", "PARTIAL_DISABILITY", "SEVERE_WOUND_WIA", "MODERATE_INJURY", "MINOR_INJURY", "ALL"]);
      // เงินบำรุงขวัญ: เสียชีวิต/ทุพพลภาพ 40,000 | บาดเจ็บ ≤10 วัน 10,000 | 11-20 วันขึ้นไป +10,000
      setNewTiers([
        { id: "tier-morale-death-disability", label: "กรณีเสียชีวิตหรือพิการทุพพลภาพ", lossTypes: ["DEATH", "DISABILITY"], amount: 40000 },
        { id: "tier-morale-injury-base", label: "กรณีบาดเจ็บและพักรักษาตัวในโรงพยาบาล (ฐาน ไม่เกิน 10 วัน)", lossTypes: ["INJURY"], amount: 10000 },
        { id: "tier-morale-injury-over10", label: "กรณีบาดเจ็บพักรักษาตัว 11-20 วันขึ้นไป (รับเพิ่มเติม)", lossTypes: ["INJURY"], minDays: 11, amount: 10000, isAdditional: true },
      ]);
    } else if (type === "ARMY_SPECIAL_FUND") {
      setNewRuleCode("RULE-LUMP-ARMY-HERO-FUND");
      setNewRuleName("เงินกองทุนเชิดชูเกียรติวีรชน ทบ. พิทักษ์ชาติ");
      setNewCategory(BenefitCategoryCode.LUMP_SUM_PAYMENT);
      setNewPaymentType("ONE_TIME_LUMP_SUM");
      setNewDescription("เงินกองทุนพิเศษกองทัพบกเพื่อช่วยเหลือครอบครัวและทายาทกำลังพลผู้เสียสละชีพ");
      setNewLegalBasis("ระเบียบกองทัพบกว่าด้วยกองทุนสวัสดิการเชิดชูเกียรติกำลังพล พ.ศ. 2568");
      setNewBenefitScope("IN_ARMY");
      setNewCauseType("BOTH");
      setNewFormula("{baseAmount}");
      setNewBaseAmount(300000);
      setNewMissions(["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY"]);
      setNewLossTypes(["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"]);
    }
  };

  const handleCreateRule = async () => {
    if (!newRuleCode || !newRuleName || !newFormula) {
      alert("กรุณากรอกรหัสกฎเกณฑ์ ชื่อสิทธิประโยชน์ และสูตรคำนวณ");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleCode: newRuleCode,
          ruleName: newRuleName,
          category: newCategory,
          categoryName: BENEFIT_CATEGORY_META[newCategory].englishName,
          categoryThaiName: BENEFIT_CATEGORY_META[newCategory].thaiName,
          description: newDescription,
          legalBasis: newLegalBasis,
          paymentType: newPaymentType,
          benefitScope: newBenefitScope,
          causeType: newCauseType,
          formulaType: newFormula.includes("{") ? "EXPRESSION" : "FIXED_AMOUNT",
          formulaExpression: newFormula,
          multiplierFactor: Number(newFactor),
          baseAmount: Number(newBaseAmount),
          minAmount: newMinAmount ? Number(newMinAmount) : undefined,
          maxAmount: newMaxAmount ? Number(newMaxAmount) : undefined,
          conditions: {
            allowedMissions: newMissions,
            allowedPersonnelCategories: newPersonnelCategories,
            allowedLossTypes: newLossTypes,
          },
          formulaTiers: newTiers.length > 0 ? newTiers : undefined,
          isActive: true,
          priorityOrder: rules.length + 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        fetchRules();
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการสร้างกฎเกณฑ์");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      const res = await fetch(`/api/rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          categoryName: BENEFIT_CATEGORY_META[formCategory].englishName,
          categoryThaiName: BENEFIT_CATEGORY_META[formCategory].thaiName,
          paymentType: BENEFIT_CATEGORY_META[formCategory].paymentType,
          formulaExpression: formFormula,
          multiplierFactor: Number(formFactor),
          baseAmount: Number(formBaseAmount),
          minAmount: formMinAmount ? Number(formMinAmount) : undefined,
          maxAmount: formMaxAmount ? Number(formMaxAmount) : undefined,
          isActive: formIsActive,
          description: formDescription,
          benefitScope: formBenefitScope,
          causeType: formCauseType,
          conditions: {
            ...editingRule.conditions,
            allowedMissions: formMissions,
            allowedPersonnelCategories: formPersonnelCategories,
            allowedLossTypes: formLossTypes,
          },
          formulaTiers: formTiers.length > 0 ? formTiers : [],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditorOpen(false);
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`ยืนยันการลบกฎเกณฑ์สิทธิประโยชน์ "${ruleName}" ออกจากระบบ?`)) return;
    try {
      const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runSimulation = async () => {
    try {
      setSimulating(true);
      const res = await fetch("/api/rules/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          militaryId: "MIL-RTA-TEST",
          citizenId: "3100600492811",
          rank: sbCategory === "COMMISSIONED_OFFICER" ? "LIEUTENANT_COLONEL" : sbCategory === "NON_COMMISSIONED_OFFICER" ? "MASTER_SERGEANT_1ST" : sbCategory === "VOLUNTEER_RANGER" ? "VOLUNTEER_RANGER" : "PRIVATE",
          rankAbbr: sbCategory === "COMMISSIONED_OFFICER" ? "พ.ท." : sbCategory === "NON_COMMISSIONED_OFFICER" ? "จ.ส.อ." : sbCategory === "VOLUNTEER_RANGER" ? "อส.ทพ." : "พลฯ",
          firstName: "ทดสอบ",
          lastName: "ระบบสิทธิ ทบ.",
          militaryBranch: "ROYAL_THAI_ARMY",
          benefitScope: sbScope,
          actionCause: sbCause,
          missionType: sbMission,
          personnelCategory: sbCategory,
          lossType: sbLossType,
          hospitalAdmissionDate: sbAdmissionDate,
          hospitalDischargeDate: sbDischargeDate,
          hospitalStayDays: calculateStayDays(sbAdmissionDate, sbDischargeDate),
          abbreviatedPosition: "ผบ.ร้อย.ร.",
          normalUnit: "ร.19 พัน.1 (พล.ร.9)",
          fieldPosition: "ผบ.ฉก.",
          fieldUnit: "ฉก.นราธิวาส",
          salary: Number(sbSalary),
          salaryLevel: "น.3",
          salaryStep: 21.5,
          compensationAmount: 5000,
          additionalPay: 2500,
          appointmentDate: "2010-05-01",
          serviceYearsNormal: Math.max(1, Math.round(sbTotalYears * 0.65)),
          serviceYearsMultiplier: Math.round(sbTotalYears * 0.35),
          totalServiceYears: Number(sbTotalYears),
          actionType: "DIRECT_COMBAT",
          incidentType: "COMBAT_ENGAGEMENT",
          incidentDate: "2026-03-12",
          promotionSteps: Number(sbPromotionSteps),
          spouse: {
            nationalId: "1100400289112",
            fullName: "นางสมหญิง ทดสอบ",
            isLegallyMarried: true,
            hasPensionRights: true,
            allocationPercentage: 50,
          },
          children: [
            {
              nationalId: "1100400289113",
              fullName: "ด.ช.นราธิป ทดสอบ",
              age: 11,
              isStudying: true,
              educationLevel: "PRIMARY",
              allocationPercentage: 25,
            },
            {
              nationalId: "1100400289114",
              fullName: "น.ส.กานดา ทดสอบ",
              age: 19,
              isStudying: true,
              educationLevel: "BACHELOR",
              allocationPercentage: 25,
            },
          ],
          heirs: [
            {
              nationalId: "1100400289112",
              fullName: "นางสมหญิง ทดสอบ",
              relationship: "SPOUSE_LEGAL",
              allocationPercentage: 50,
            },
            {
              nationalId: "1100400289113",
              fullName: "ด.ช.นราธิป ทดสอบ",
              relationship: "CHILD_LEGITIMATE",
              allocationPercentage: 25,
            },
            {
              nationalId: "3100600492800",
              fullName: "นายสมศักดิ์ ทดสอบ (บิดา)",
              relationship: "FATHER",
              allocationPercentage: 25,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSimulationResult(json.data);
        setIsSandboxOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const categories = [
    {
      code: BenefitCategoryCode.LUMP_SUM_PAYMENT,
      name: "หมวด 1: รับเงินครั้งเดียว",
      subtitle: "One-Time Lump Sum",
      icon: Coins,
      count: rules.filter((r) => r.category === BenefitCategoryCode.LUMP_SUM_PAYMENT).length,
      color: "from-amber-500/10 to-amber-600/5 text-amber-800 border-amber-300 dark:border-amber-900",
    },
    {
      code: BenefitCategoryCode.MONTHLY_PAYMENT,
      name: "หมวด 2: รับเงินรายเดือน",
      subtitle: "Monthly Payment",
      icon: Calendar,
      count: rules.filter((r) => r.category === BenefitCategoryCode.MONTHLY_PAYMENT).length,
      color: "from-blue-500/10 to-blue-600/5 text-blue-800 border-blue-300 dark:border-blue-900",
    },
    {
      code: BenefitCategoryCode.ANNUAL_PAYMENT,
      name: "หมวด 3: รับเงินรายปี",
      subtitle: "Annual Grants",
      icon: CalendarDays,
      count: rules.filter((r) => r.category === BenefitCategoryCode.ANNUAL_PAYMENT).length,
      color: "from-emerald-500/10 to-emerald-600/5 text-emerald-800 border-emerald-300 dark:border-emerald-900",
    },
    {
      code: BenefitCategoryCode.NON_MONETARY_BENEFIT,
      name: "หมวด 4: สิทธิมิใช่ตัวเงิน",
      subtitle: "Non-Monetary Rights",
      icon: Gift,
      count: rules.filter((r) => r.category === BenefitCategoryCode.NON_MONETARY_BENEFIT).length,
      color: "from-purple-500/10 to-purple-600/5 text-purple-800 border-purple-300 dark:border-purple-900",
    },
  ];

  const filteredRules = rules.filter((r) => {
    const matchCat = r.category === selectedCategory;
    const matchScope = scopeFilter === "ALL" || !r.benefitScope || r.benefitScope === "BOTH" || r.benefitScope === scopeFilter;
    const matchCause = causeFilter === "ALL" || !r.causeType || r.causeType === "BOTH" || r.causeType === causeFilter;

    // Search box: รหัสกฎเกณฑ์ / ชื่อสิทธิ / ข้อกฎหมาย / คำอธิบาย
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      r.ruleCode?.toLowerCase().includes(q) ||
      r.ruleName?.toLowerCase().includes(q) ||
      r.legalBasis?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q);

    return matchCat && matchScope && matchCause && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-emerald-700 dark:text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              สูตร & กฎเกณฑ์สิทธิและสวัสดิการ กองทัพบก (RTA Rules Engine)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            จัดการสูตรคำนวณ ตัวแปร 5 มิติ (ประเภทสิทธิ, ถูกกระทำ, ภารกิจ, กำลังพล, การสูญเสีย) และเพิ่มสิทธิประโยชน์ใหม่ที่เกิดขึ้นในอนาคต
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1.5 shadow-sm font-bold"
          >
            <Plus className="h-4 w-4 text-amber-300" />
            เพิ่มสูตร/กฎเกณฑ์สิทธิประโยชน์ใหม่
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={runSimulation}
            disabled={simulating}
            className="text-xs gap-1.5 shadow-sm border-slate-300 dark:border-slate-700"
          >
            <Play className="h-4 w-4 text-amber-500" />
            {simulating ? "กำลังจำลอง..." : "ทดสอบ Sandbox (5 มิติ)"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={refreshRuleCatalog}
            className="text-xs gap-1.5 shadow-sm border-slate-300 dark:border-slate-700"
          >
            <RotateCcw className="h-4 w-4 text-emerald-600" />
            รีเฟรชฐานข้อมูล
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-4 shadow-xs">
        <div className="sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">ฐานข้อมูลมิติ</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Master data จาก /api/rules/dimensions</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-500/5 p-3">
          <p className="text-[10px] text-muted-foreground">ประเภทภารกิจ</p>
          <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300">{missionOptions.length}</p>
        </div>
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-500/5 p-3">
          <p className="text-[10px] text-muted-foreground">ประเภทกำลังพล</p>
          <p className="text-lg font-extrabold text-purple-800 dark:text-purple-300">{personnelCategoryOptions.length}</p>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-500/5 p-3">
          <p className="text-[10px] text-muted-foreground">ประเภทความสูญเสีย</p>
          <p className="text-lg font-extrabold text-rose-800 dark:text-rose-300">{lossTypeOptions.length}</p>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">จัดการตัวเลือกมิติจากฐานข้อมูล</CardTitle>
              <CardDescription className="text-xs">
                เพิ่ม แก้ไข ลบ และค้นหาตัวเลือกของมิติหลักจากตาราง `BenefitDimensionOption`
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDimensionOptions} className="text-xs gap-1.5">
              <RotateCcw className="h-4 w-4" />
              โหลดใหม่
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              ประเภทภารกิจ
            </Label>
            <DimensionChipsEditor
              options={missionOptions}
              dimensionType="MISSION_TYPE"
              selected={[]}
              onChange={() => undefined}
              tone="emerald"
              onOptionsChanged={refreshRuleCatalog}
              readOnlySelection
              addPlaceholder="พิมพ์ชื่อภารกิจใหม่ เช่น ภารกิจลาดตระเวนชายแดนพิเศษ..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-purple-600" />
              ประเภทกำลังพล
            </Label>
            <DimensionChipsEditor
              options={personnelCategoryOptions}
              dimensionType="PERSONNEL_CATEGORY"
              selected={[]}
              onChange={() => undefined}
              tone="purple"
              onOptionsChanged={refreshRuleCatalog}
              readOnlySelection
              addPlaceholder="พิมพ์ประเภทกำลังพลใหม่ เช่น ทหารพราน, พลทหารเกณฑ์..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HeartCrack className="h-3.5 w-3.5 text-rose-600" />
              ประเภทความสูญเสีย
            </Label>
            <DimensionChipsEditor
              options={lossTypeOptions}
              dimensionType="LOSS_TYPE"
              selected={[]}
              onChange={() => undefined}
              tone="rose"
              onOptionsChanged={refreshRuleCatalog}
              readOnlySelection
              addPlaceholder="พิมพ์ประเภทความสูญเสียใหม่ เช่น บาดเจ็บต้องตัดนิ้ว..."
            />
          </div>
        </CardContent>
      </Card>

      {/* 4 Category Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.code;
          const Icon = cat.icon;
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => setSelectedCategory(cat.code)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${isSelected
                ? "bg-gradient-to-br border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                : "bg-card hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${isSelected ? "text-emerald-700 dark:text-amber-400" : "text-slate-600"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px]">
                  {cat.count} กฎเกณฑ์
                </Badge>
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mt-2">
                {cat.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">{cat.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Scope & Cause Dimension Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="space-y-1">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-emerald-600" />
            ตัวกรองมิติ: ประเภทสิทธิ (Benefit Scope)
          </Label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs">
            {[
              { id: "ALL", label: "ทั้งหมด" },
              { id: "IN_ARMY", label: "ใน ทบ." },
              { id: "OUTSIDE_ARMY", label: "นอก ทบ." },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setScopeFilter(t.id)}
                className={`py-1 rounded font-bold transition-all ${scopeFilter === t.id
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-amber-600" />
            ตัวกรองมิติ: ถูกกระทำ (Action Cause)
          </Label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs">
            {[
              { id: "ALL", label: "ทั้งหมด" },
              { id: "ENEMY_ACTION", label: "ข้าศึก" },
              { id: "NON_ENEMY_ACTION", label: "มิใช่ข้าศึก" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setCauseFilter(t.id)}
                className={`py-1 rounded font-bold transition-all ${causeFilter === t.id
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold">
                รายการสูตรและกฎเกณฑ์สิทธิประโยชน์
              </CardTitle>
              <CardDescription className="text-xs">
                แสดงผล {filteredRules.length} กฎเกณฑ์ที่ตรงตามเงื่อนไข
              </CardDescription>
            </div>

            {/* Search Box: ค้นหาสิทธิและสวัสดิการ */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาสิทธิและสวัสดิการ (รหัส, ชื่อ, ข้อกฎหมาย)..."
                className="h-9 text-xs pl-8 pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="ล้างการค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold w-28">รหัสกฎเกณฑ์</TableHead>
                <TableHead className="text-xs font-bold">ชื่อสิทธิประโยชน์และข้อกฎหมาย</TableHead>
                <TableHead className="text-xs font-bold">ประเภทสิทธิ / ถูกกระทำ</TableHead>
                <TableHead className="text-xs font-bold">สูตร / ตัวแปรคำนวณ</TableHead>
                <TableHead className="text-xs font-bold">เกณฑ์ภารกิจ & กำลังพล</TableHead>
                <TableHead className="text-xs font-bold text-center">สถานะ</TableHead>
                <TableHead className="text-xs font-bold text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลกฎเกณฑ์...
                  </TableCell>
                </TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    ไม่พบกฎเกณฑ์ที่ตรงตามเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => {
                  const isInsurance = rule.ruleCode === "RULE-LUMP-INSURANCE";
                  const isPM = rule.ruleCode.includes("PM-") || rule.ruleName.includes("นายก");
                  return (
                    <TableRow
                      key={rule.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-900/30 ${isInsurance ? "bg-amber-500/5 dark:bg-amber-950/20" : isPM ? "bg-blue-500/5 dark:bg-blue-950/20" : ""
                        }`}
                    >
                      <TableCell className="font-mono text-xs font-bold text-emerald-800 dark:text-amber-400">
                        {rule.ruleCode}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {rule.ruleName}
                            </p>
                            {isPM && (
                              <Badge className="bg-blue-600 text-white text-[9px] px-1 py-0">
                                สำนักนายกฯ
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {rule.legalBasis}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800">
                            {rule.benefitScope === "OUTSIDE_ARMY" ? "นอก ทบ." : rule.benefitScope === "BOTH" ? "ใน/นอก ทบ." : "ใน ทบ."}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                            {rule.causeType === "ENEMY_ACTION" ? "ข้าศึก" : rule.causeType === "NON_ENEMY_ACTION" ? "มิใช่ข้าศึก" : "ทุกกรณี"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <code className="text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400">
                            {rule.formulaExpression}
                          </code>
                          {rule.baseAmount > 0 && (
                            <p className="text-[10px] text-muted-foreground">
                              ฐานวงเงิน: {formatCurrency(rule.baseAmount)}
                            </p>
                          )}
                          {rule.formulaTiers && rule.formulaTiers.length > 0 && (
                            <div className="pt-1 space-y-0.5">
                              <Badge className="bg-emerald-700 text-white text-[9px] px-1 py-0">
                                {rule.formulaTiers.length} ระดับเงิน (Tiers)
                              </Badge>
                              {rule.formulaTiers.map((t) => (
                                <p key={t.id} className="text-[10px] text-muted-foreground line-clamp-1">
                                  • {t.label || t.id}: {formatCurrency(t.amount)}
                                  {t.isAdditional ? " (+)" : ""}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <p className="line-clamp-1">
                            ภารกิจ: {rule.conditions?.allowedMissions?.includes("ALL") || !rule.conditions?.allowedMissions?.length ? "ทุกภารกิจ" : rule.conditions.allowedMissions.join(", ")}
                          </p>
                          <p className="line-clamp-1">
                            กำลังพล: {rule.conditions?.allowedPersonnelCategories?.includes("ALL") || !rule.conditions?.allowedPersonnelCategories?.length ? "ทุกกลุ่ม" : rule.conditions.allowedPersonnelCategories.join(", ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={rule.isActive ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {rule.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditor(rule)}
                            className="text-xs h-8 gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            แก้ไข
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule.id, rule.ruleName)}
                            className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* CREATE NEW RULE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FilePlus2 className="h-5 w-5 text-emerald-700 dark:text-amber-400" />
              เพิ่มสูตร & กฎเกณฑ์สิทธิและสวัสดิการใหม่ (Create New Benefit Rule)
            </DialogTitle>
            <DialogDescription className="text-xs">
              กำหนดสิทธิประโยชน์ใหม่ เช่น เงินเยียวยาสำนักนายกรัฐมนตรี, เงินช่วยเหลือ ศอ.บต., หรือกองทุนพิเศษที่จัดตั้งขึ้นใหม่
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Rapid Preset Templates Bar */}
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                แม่แบบสิทธิประโยชน์สำเร็จรูป (Quick Templates):
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate("PM_RELIEF")}
                  className="text-xs h-7 bg-white dark:bg-slate-900 border-blue-300 dark:border-blue-900 text-blue-800 dark:text-blue-300 gap-1"
                >
                  <Landmark className="h-3 w-3" />
                  🏛️ เงินเยียวยา สำนักนายกฯ (5 แสน)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate("SBPAC_AID")}
                  className="text-xs h-7 bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-300 gap-1"
                >
                  <Shield className="h-3 w-3" />
                  🛡️ เงินเยียวยา ศอ.บต. (5 แสน)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate("PM_SCHOLARSHIP")}
                  className="text-xs h-7 bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-900 text-purple-800 dark:text-purple-300 gap-1"
                >
                  <GraduationCap className="h-3 w-3" />
                  🎓 ทุนการศึกษา สำนักนายกฯ (รายปี)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate("HOSPITAL_STAY")}
                  className="text-xs h-7 bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 gap-1"
                >
                  <Activity className="h-3 w-3" />
                  🏥 เงินช่วยเหลือพักรักษาพยาบาล (10-20 วัน)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => applyTemplate("ARMY_SPECIAL_FUND")}
                  className="text-xs h-7 bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 gap-1"
                >
                  <Award className="h-3 w-3" />
                  🎖️ กองทุนเชิดชูเกียรติ ทบ. (ใน ทบ.)
                </Button>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">รหัสกฎเกณฑ์ (Rule Code)</Label>
                <Input
                  value={newRuleCode}
                  onChange={(e) => setNewRuleCode(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="RULE-LUMP-PM-RELIEF"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">หมวดหมู่สิทธิประโยชน์</Label>
                <select
                  value={newCategory}
                  onChange={(e) => {
                    const code = e.target.value as BenefitCategoryCode;
                    setNewCategory(code);
                    setNewPaymentType(BENEFIT_CATEGORY_META[code].paymentType);
                  }}
                  aria-label="หมวดหมู่สิทธิประโยชน์"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {Object.values(BenefitCategoryCode).map((code) => (
                    <option key={code} value={code}>
                      {BENEFIT_CATEGORY_META[code].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">ชื่อสิทธิประโยชน์และเงินสงเคราะห์</Label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="text-xs"
                  placeholder="เช่น เงินเยียวยาพิเศษ สำนักนายกรัฐมนตรี"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">ข้อกฎหมาย / มติ ครม. / ระเบียบอ้างอิง</Label>
                <Input
                  value={newLegalBasis}
                  onChange={(e) => setNewLegalBasis(e.target.value)}
                  className="text-xs"
                  placeholder="เช่น ระเบียบสำนักนายกรัฐมนตรีว่าด้วยการให้ความช่วยเหลือเยียวยาฯ พ.ศ. 2555"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">คำอธิบายและรายละเอียดสิทธิ</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="text-xs"
                  placeholder="ระบุวัตถุประสงค์และรายละเอียดการจ่ายเงิน..."
                />
              </div>
            </div>

            {/* 5 Dimensions Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Building className="h-3 w-3 text-emerald-600" />
                  1. ประเภทสิทธิ (Benefit Scope)
                </Label>
                <select
                  value={newBenefitScope}
                  onChange={(e) => setNewBenefitScope(e.target.value as any)}
                  aria-label="1. ประเภทสิทธิ (Benefit Scope)"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="OUTSIDE_ARMY">นอก ทบ. (สำนักนายกฯ, ประกันภัยร่วม กห., กระทรวงการคลัง)</option>
                  <option value="IN_ARMY">ใน ทบ. (สิทธิและกองทุนภายในกองทัพบก)</option>
                  <option value="BOTH">ทั้งในและนอก ทบ.</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1">
                  <Crosshair className="h-3 w-3 text-amber-600" />
                  2. ถูกกระทำ (Action Cause)
                </Label>
                <select
                  value={newCauseType}
                  onChange={(e) => setNewCauseType(e.target.value as any)}
                  aria-label="2. ถูกกระทำ (Action Cause)"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="ENEMY_ACTION">การกระทำของข้าศึก / ผู้ก่อความไม่สงบ</option>
                  <option value="NON_ENEMY_ACTION">มิใช่การกระทำของข้าศึก (อุบัติเหตุสนาม)</option>
                  <option value="BOTH">ทุกกรณี</option>
                </select>
              </div>
            </div>

            {/* Formula & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <Label className="text-xs font-bold">สูตรคำนวณ (Formula Expression)</Label>
                <Input
                  value={newFormula}
                  onChange={(e) => setNewFormula(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="{baseAmount}"
                />
                <p className="text-[10px] text-muted-foreground">เช่น &#123;baseAmount&#125;, &#123;salary&#125; * 30</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">ฐานวงเงินสิทธิ (บาท)</Label>
                <Input
                  type="number"
                  value={newBaseAmount}
                  onChange={(e) => setNewBaseAmount(Number(e.target.value))}
                  className="font-mono text-xs font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">ตัวคูณ (Multiplier)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newFactor}
                  onChange={(e) => setNewFactor(Number(e.target.value))}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Configurable Benefit Tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทน) */}
            {renderTierEditor(newTiers, setNewTiers)}

            {/* Mission & Loss Type Badges (Extensible: search / add / edit / delete) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">ประเภทภารกิจที่ได้รับสิทธิ</Label>
              <DimensionChipsEditor
                options={missionOptions}
                dimensionType="MISSION_TYPE"
                selected={newMissions}
                onChange={setNewMissions}
                tone="emerald"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ชื่อภารกิจใหม่ เช่น ภารกิจลาดตระเวนชายแดนพิเศษ..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">ประเภทความสูญเสียที่ได้รับสิทธิ</Label>
              <DimensionChipsEditor
                options={lossTypeOptions}
                dimensionType="LOSS_TYPE"
                selected={newLossTypes}
                onChange={setNewLossTypes}
                tone="rose"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ประเภทความสูญเสียใหม่ เช่น บาดเจ็บต้องตัดนิ้ว..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">ประเภทกำลังพลที่ได้รับสิทธิ (Personnel Categories)</Label>
              <DimensionChipsEditor
                options={personnelCategoryOptions}
                dimensionType="PERSONNEL_CATEGORY"
                selected={newPersonnelCategories}
                onChange={setNewPersonnelCategories}
                tone="purple"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ประเภทกำลังพลใหม่ เช่น ทหารพราน, พลทหารเกณฑ์..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="text-xs">
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={creating}
              className="text-xs bg-emerald-800 text-white font-bold"
            >
              {creating ? "กำลังบันทึก..." : "บันทึกและเปิดใช้งานกฎเกณฑ์ใหม่"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5-Dimension Rule Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-700 dark:text-amber-400" />
              แก้ไขสูตรและตัวแปรคำนวณ 5 มิติ: {editingRule?.ruleCode}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingRule?.ruleName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Category Selector (หมวดหมู่สิทธิและสวัสดิการ) */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
              <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                หมวดหมู่สิทธิและสวัสดิการ (Benefit Category)
              </Label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as BenefitCategoryCode)}
                aria-label="หมวดหมู่สิทธิและสวัสดิการ (Benefit Category)"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-ring"
              >
                {Object.values(BenefitCategoryCode).map((code) => (
                  <option key={code} value={code}>
                    {BENEFIT_CATEGORY_META[code].label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                การบันทึกจะปรับประเภทการจ่ายเงิน (Payment Type) ให้ตรงกับหมวดหมู่ที่เลือกโดยอัตโนมัติ
              </p>
            </div>

            {/* 1 & 2 Dimension: Scope and Action Cause */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-emerald-600" />
                  1. ประเภทสิทธิ (Benefit Scope)
                </Label>
                <select
                  value={formBenefitScope}
                  onChange={(e) => setFormBenefitScope(e.target.value as any)}
                  aria-label="1. ประเภทสิทธิ (Benefit Scope)"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-ring"
                >
                  <option value="IN_ARMY">ใน ทบ. (สิทธิและเงินกองทุนภายในกองทัพบก)</option>
                  <option value="OUTSIDE_ARMY">นอก ทบ. (สำนักนายกฯ, ประกันภัยร่วม กห., กรมบัญชีกลาง, สายใจไทย)</option>
                  <option value="BOTH">ทั้งในและนอก ทบ. (ใช้ร่วมกันทุกหน่วย)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-amber-600" />
                  2. ถูกกระทำ (Action Cause / Perpetrator)
                </Label>
                <select
                  value={formCauseType}
                  onChange={(e) => setFormCauseType(e.target.value as any)}
                  aria-label="2. ถูกกระทำ (Action Cause / Perpetrator)"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-ring"
                >
                  <option value="ENEMY_ACTION">การกระทำของข้าศึก / ผู้ก่อความไม่สงบ / การสู้รบ</option>
                  <option value="NON_ENEMY_ACTION">มิใช่การกระทำของข้าศึก (อุบัติเหตุปฏิบัติหน้าที่, ช่วยเหลือประชาชน)</option>
                  <option value="BOTH">ทุกกรณีการถูกกระทำ</option>
                </select>
              </div>
            </div>

            {/* 3. Dimension: Mission Types (Extensible: search / add / edit / delete) */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-blue-600" />
                3. ประเภทภารกิจที่ได้รับสิทธิ (Mission Types)
              </Label>
              <DimensionChipsEditor
                options={missionOptions}
                dimensionType="MISSION_TYPE"
                selected={formMissions}
                onChange={setFormMissions}
                tone="emerald"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ชื่อภารกิจใหม่ เช่น ภารกิจลาดตระเวนชายแดนพิเศษ..."
              />
            </div>

            {/* 4. Dimension: Personnel Categories (Extensible: search / add / edit / delete) */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-600" />
                4. ประเภทกำลังพลที่ได้รับสิทธิ (Personnel Categories)
              </Label>
              <DimensionChipsEditor
                options={personnelCategoryOptions}
                dimensionType="PERSONNEL_CATEGORY"
                selected={formPersonnelCategories}
                onChange={setFormPersonnelCategories}
                tone="purple"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ชื่อกลุ่มกำลังพลใหม่ เช่น ทหารพรานจู่โจมพิเศษ..."
              />
            </div>

            {/* 5. Dimension: Loss Types (Extensible: search / add / edit / delete) */}
            <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HeartCrack className="h-3.5 w-3.5 text-rose-600" />
                5. ประเภทความสูญเสียที่ได้รับสิทธิ (Loss & Casualty Types)
              </Label>
              <DimensionChipsEditor
                options={lossTypeOptions}
                dimensionType="LOSS_TYPE"
                selected={formLossTypes}
                onChange={setFormLossTypes}
                tone="rose"
                onOptionsChanged={fetchDimensionOptions}
                addPlaceholder="พิมพ์ประเภทความสูญเสียใหม่ เช่น บาดเจ็บต้องตัดนิ้ว..."
              />
            </div>

            {/* Formula & Variables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="formula">สูตรคำนวณ (Formula Expression)</Label>
                <Input
                  id="formula"
                  value={formFormula}
                  onChange={(e) => setFormFormula(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="{baseAmount}"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baseAmount">ฐานวงเงินสิทธิ (บาท)</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  value={formBaseAmount}
                  onChange={(e) => setFormBaseAmount(Number(e.target.value))}
                  className="font-mono text-xs font-bold text-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor">ตัวคูณ (Multiplier Factor)</Label>
                <Input
                  id="factor"
                  type="number"
                  step="0.1"
                  value={formFactor}
                  onChange={(e) => setFormFactor(Number(e.target.value))}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minAmount">วงเงินขั้นต่ำ (Min Cap)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formMinAmount ?? ""}
                  onChange={(e) => setFormMinAmount(e.target.value ? Number(e.target.value) : undefined)}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Configurable Benefit Tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทน) */}
            {renderTierEditor(formTiers, setFormTiers)}

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold">สถานะการเปิดใช้งานกฎเกณฑ์</p>
                <p className="text-[11px] text-muted-foreground">เปิดหรือปิดการประเมินสิทธิข้อนี้ในเครื่องมือคำนวณ</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="text-xs">
              ยกเลิก
            </Button>
            <Button onClick={handleSaveRule} className="text-xs bg-emerald-800 text-white font-bold">
              บันทึกการเปลี่ยนแปลง 5 มิติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive 5-Dimension Sandbox Simulation Dialog */}
      <Dialog open={isSandboxOpen} onOpenChange={setIsSandboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              การทดสอบคำนวณ 5 มิติ (Sandbox Simulator & Matrix Tester)
            </DialogTitle>
            <DialogDescription className="text-xs">
              ทดลองสลับตัวแปรทั้ง 5 มิติเพื่อดูผลการคำนวณของ RULE-LUMP-INSURANCE และสิทธิ 4 หมวดของ ทบ. แบบเรียลไทม์
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Interactive Dimension Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-emerald-800/30 bg-slate-50 dark:bg-slate-900/60">
              <div className="space-y-1">
                <Label className="text-xs font-bold">1. ประเภทสิทธิ</Label>
                <select
                  value={sbScope}
                  onChange={(e) => setSbScope(e.target.value as any)}
                  aria-label="1. ประเภทสิทธิ"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="IN_ARMY">ใน ทบ. (กองทุน ทบ.)</option>
                  <option value="OUTSIDE_ARMY">นอก ทบ. (สำนักนายกฯ / ประกันภัย กห.)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">2. ถูกกระทำ</Label>
                <select
                  value={sbCause}
                  onChange={(e) => setSbCause(e.target.value as any)}
                  aria-label="2. ถูกกระทำ"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="ENEMY_ACTION">ข้าศึก / ผู้ก่อความไม่สงบ</option>
                  <option value="NON_ENEMY_ACTION">มิใช่ข้าศึก (อุบัติเหตุสนาม)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">3. ประเภทภารกิจ</Label>
                <select
                  value={sbMission}
                  onChange={(e) => setSbMission(e.target.value)}
                  aria-label="3. ประเภทภารกิจ"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="SOUTHERN_BORDER">จชต. (กอ.รมน.ภาค 4 สน.)</option>
                  <option value="BORDER_DEFENSE">แผนป้องกันประเทศ (ชายแดน)</option>
                  <option value="INTERNAL_SECURITY">รักษาความสงบเรียบร้อย</option>
                  <option value="DISASTER_RELIEF">บรรเทาสาธารณภัย</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">4. ประเภทกำลังพล</Label>
                <select
                  value={sbCategory}
                  onChange={(e) => setSbCategory(e.target.value)}
                  aria-label="4. ประเภทกำลังพล"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="COMMISSIONED_OFFICER">นายทหารสัญญาบัตร (พ.ท.)</option>
                  <option value="NON_COMMISSIONED_OFFICER">นายทหารประทวน (จ.ส.อ.)</option>
                  <option value="VOLUNTEER_RANGER">อาสาสมัครทหารพราน (อส.ทพ.)</option>
                  <option value="CONSCRIPT_SOLDIER">ทหารกองประจำการ (พลทหาร)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">5. ประเภทความสูญเสีย</Label>
                <select
                  value={sbLossType}
                  onChange={(e) => setSbLossType(e.target.value)}
                  aria-label="5. ประเภทความสูญเสีย"
                  className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบ (KIA) ปูนบำเหน็จ 7 ชั้น</option>
                  <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่ราชการสนาม</option>
                  <option value="TOTAL_PERMANENT_DISABILITY">พิการทุพพลภาพถาวรสมบูรณ์จากการรบ</option>
                  <option value="SEVERE_WOUND_WIA">บาดเจ็บสาหัสจากการสู้รบ (WIA)</option>
                  <option value="MODERATE_INJURY">บาดเจ็บปานกลาง / เล็กน้อย</option>
                </select>
              </div>

              {/* Hospital Stay Dates Tester */}
              <div className="sm:col-span-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-600" />
                    🏥 การพักรักษาพยาบาล (Hospital Stay - คำนวณวันอัตโนมัติ)
                  </Label>
                  <Badge className="bg-emerald-700 text-white font-mono text-xs px-2 py-0.5">
                    เงินบำรุงขวัญโดยประมาณ: {getMoraleEstimate().toLocaleString("en-US")} บาท
                    (พักรักษา {calculateStayDays(sbAdmissionDate, sbDischargeDate)} วัน)
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">วันที่เข้ารับการรักษาพยาบาล</Label>
                    <Input
                      type="date"
                      value={sbAdmissionDate}
                      onChange={(e) => setSbAdmissionDate(e.target.value)}
                      className="text-xs h-8 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">วันที่จำหน่าย/ออกจากโรงพยาบาล</Label>
                    <Input
                      type="date"
                      value={sbDischargeDate}
                      onChange={(e) => setSbDischargeDate(e.target.value)}
                      className="text-xs h-8 bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={runSimulation} className="text-xs bg-emerald-800 text-white font-bold gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                คำนวณผลลัพธ์ใหม่ทันที
              </Button>
            </div>

            {/* Results Grid */}
            {simulationResult && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">1. รับเงินครั้งเดียว</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                      {formatCurrency(simulationResult.grandTotalLumpSum)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300">2. รับเงินรายเดือน</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(simulationResult.grandTotalMonthlyPension)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">3. รับเงินรายปี</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(simulationResult.grandTotalAnnualScholarship)}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown of Category 1 Items */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-card">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                    รายการคำนวณในหมวด 1 (เงินสินไหมและเงินก้อน):
                  </h4>
                  <div className="space-y-2">
                    {simulationResult.categories[BenefitCategoryCode.LUMP_SUM_PAYMENT].items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${item.ruleCode === "RULE-LUMP-INSURANCE"
                          ? "bg-amber-500/10 border-amber-500/40"
                          : item.ruleCode.includes("PM-")
                            ? "bg-blue-500/10 border-blue-500/40"
                            : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{item.ruleName}</span>
                            {item.ruleCode === "RULE-LUMP-INSURANCE" && (
                              <Badge className="bg-amber-600 text-white text-[9px] px-1.5 py-0">
                                5-DIMENSIONS APPLIED
                              </Badge>
                            )}
                            {item.ruleCode.includes("PM-") && (
                              <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0">
                                สำนักนายกฯ
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{item.eligibilityNotes.join(", ")}</p>
                        </div>
                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsSandboxOpen(false)} className="text-xs">
              ปิดหน้าต่างจำลอง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
