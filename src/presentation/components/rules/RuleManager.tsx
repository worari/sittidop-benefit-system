"use client";

import React, { useState, useEffect } from "react";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";
import { BenefitCategoryCode, MilitaryBenefitCalculationResult } from "@/core/domain/value-objects/military-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
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
} from "lucide-react";

export function RuleManager() {
  const [rules, setRules] = useState<BenefitRuleDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategoryCode>(
    BenefitCategoryCode.LUMP_SUM_PAYMENT
  );
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<BenefitRuleDefinition | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  // Sandbox simulation state
  const [simulationResult, setSimulationResult] = useState<MilitaryBenefitCalculationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Edit form state
  const [formFormula, setFormFormula] = useState("");
  const [formFactor, setFormFactor] = useState(1);
  const [formBaseAmount, setFormBaseAmount] = useState(0);
  const [formMinAmount, setFormMinAmount] = useState<number | undefined>(undefined);
  const [formMaxAmount, setFormMaxAmount] = useState<number | undefined>(undefined);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState("");

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
    setIsEditorOpen(true);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      const res = await fetch(`/api/rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formulaExpression: formFormula,
          multiplierFactor: Number(formFactor),
          baseAmount: Number(formBaseAmount),
          minAmount: formMinAmount ? Number(formMinAmount) : undefined,
          maxAmount: formMaxAmount ? Number(formMaxAmount) : undefined,
          isActive: formIsActive,
          description: formDescription,
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

  const runSimulation = async () => {
    try {
      setSimulating(true);
      const res = await fetch("/api/rules/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          militaryId: "MIL-49021884",
          citizenId: "3100600492811",
          rank: "LIEUTENANT_COLONEL",
          rankAbbr: "พ.ท.",
          firstName: "วีรชาติ",
          lastName: "ภักดีสยาม",
          militaryBranch: "ROYAL_THAI_ARMY",
          abbreviatedPosition: "ผบ.พัน.ร.1911",
          normalUnit: "ร.19 พัน.1 (พล.ร.9)",
          fieldPosition: "ผบ.ฉก.นราธิวาส 30",
          fieldUnit: "ฉก.นราธิวาส",
          salary: 43500,
          salaryLevel: "น.3",
          salaryStep: 21.5,
          compensation: "พ.ช.ท.",
          compensationAmount: 5000,
          additionalPay: 2500,
          appointmentDate: "2010-05-01",
          multiplierDate: "2016-10-01",
          serviceYearsNormal: 16,
          serviceYearsMultiplier: 8,
          totalServiceYears: 24,
          missionType: "COUNTER_INSURGENCY",
          actionType: "DIRECT_COMBAT",
          incidentType: "COMBAT_ENGAGEMENT",
          incidentDate: "2026-03-12",
          lossType: "KIA_COMBAT_DEATH",
          promotionSteps: 7,
          promotedRank: "GENERAL",
          promotedRankAbbr: "พล.อ.",
          promotedSalary: 68500,
          spouse: {
            nationalId: "1100400289112",
            fullName: "นางพิมพา ภักดีสยาม",
            isLegallyMarried: true,
            hasPensionRights: true,
            allocationPercentage: 50,
          },
          children: [
            {
              nationalId: "1100400289113",
              fullName: "ด.ช.นราธิป ภักดีสยาม",
              age: 11,
              isStudying: true,
              educationLevel: "PRIMARY",
              allocationPercentage: 25,
            },
            {
              nationalId: "1100400289114",
              fullName: "น.ส.กานดา ภักดีสยาม",
              age: 19,
              isStudying: true,
              educationLevel: "BACHELOR",
              allocationPercentage: 25,
            },
          ],
          heirs: [
            {
              nationalId: "1100400289112",
              fullName: "นางพิมพา ภักดีสยาม",
              relationship: "SPOUSE_LEGAL",
              allocationPercentage: 50,
            },
            {
              nationalId: "1100400289113",
              fullName: "ด.ช.นราธิป ภักดีสยาม",
              relationship: "CHILD_LEGITIMATE",
              allocationPercentage: 25,
            },
            {
              nationalId: "3100600492800",
              fullName: "นายสมศักดิ์ ภักดีสยาม (บิดา)",
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

  const filteredRules = rules.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              การจัดการสูตรและกฎเกณฑ์สิทธิประโยชน์ 4 หมวด
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            แยก 4 หมวดหมู่: 1.รับเงินครั้งเดียว 2.รับเงินรายเดือน 3.รับเงินรายปี 4.สิทธิมิใช่ตัวเงิน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={runSimulation}
            disabled={simulating}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            {simulating ? "กำลังประมวลผล..." : "ทดสอบคำนวณ (Live Sandbox)"}
          </Button>
        </div>
      </div>

      {/* 4 Category Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.code;
          const Icon = cat.icon;
          return (
            <div
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-gradient-to-br ${
                cat.color
              } ${
                isSelected
                  ? "ring-2 ring-emerald-600 shadow-md font-bold"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{cat.subtitle}</p>
                  </div>
                </div>
                <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px]">
                  {cat.count} กฎ
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold">รหัส / ชื่อกฎเกณฑ์</TableHead>
                <TableHead className="text-xs font-bold">สูตรคำนวณที่ใช้ (Formula Expression)</TableHead>
                <TableHead className="text-xs font-bold">ตัวคูณ / ฐานเงิน</TableHead>
                <TableHead className="text-xs font-bold">กฎหมายอ้างอิง</TableHead>
                <TableHead className="text-xs font-bold text-center">สถานะ</TableHead>
                <TableHead className="text-xs font-bold text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    กำลังโหลดกฎเกณฑ์สิทธิประโยชน์...
                  </TableCell>
                </TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    ไม่มีกฎเกณฑ์ในหมวดหมู่นี้
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            {rule.ruleCode}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {rule.ruleName}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {rule.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-800 dark:text-slate-200">
                      <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px]">
                        {rule.formulaExpression}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs">
                      {rule.multiplierFactor > 1 && (
                        <span className="block font-bold text-emerald-600">
                          คูณ {rule.multiplierFactor} เท่า
                        </span>
                      )}
                      {rule.baseAmount > 0 && (
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          ฐาน {formatCurrency(rule.baseAmount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground max-w-xs truncate">
                      {rule.legalBasis}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={rule.isActive ? "default" : "secondary"}
                        className={
                          rule.isActive
                            ? "bg-emerald-600 text-white text-[10px]"
                            : "bg-slate-200 text-slate-600 text-[10px]"
                        }
                      >
                        {rule.isActive ? "เปิดใช้งาน" : "ปิดชั่วคราว"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs gap-1.5 text-slate-600 hover:text-emerald-600"
                        onClick={() => openEditor(rule)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        แก้ไขสูตร
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Formula Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              แก้ไขสูตรและตัวแปรคำนวณ ({editingRule?.ruleCode})
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingRule?.ruleName} - {editingRule?.categoryThaiName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Tokens Shortcuts */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                คลิกเพื่อแทรกตัวแปรคำนวณ (Tokens)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "{salary}",
                  "{promotedSalary}",
                  "{totalServiceYears}",
                  "{serviceYearsMultiplier}",
                  "{multiplierFactor}",
                  "{baseAmount}",
                  "{studyingChildrenCount}",
                ].map((token) => (
                  <Button
                    key={token}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 font-mono"
                    onClick={() => setFormFormula((prev) => `${prev} ${token}`)}
                  >
                    {token}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">สูตรทางคณิตศาสตร์ (Mathematical Expression)</Label>
              <Input
                value={formFormula}
                onChange={(e) => setFormFormula(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ตัวคูณ (Multiplier Factor)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formFactor}
                  onChange={(e) => setFormFactor(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">จำนวนเงินฐาน (Base Amount - บาท)</Label>
                <Input
                  type="number"
                  value={formBaseAmount}
                  onChange={(e) => setFormBaseAmount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
              <span className="text-xs font-bold">สถานะเปิดใช้งานกฎข้อนี้</span>
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(false)}>
              ยกเลิก
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleSaveRule}>
              <CheckCircle2 className="h-4 w-4" />
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sandbox Simulation Modal */}
      <Dialog open={isSandboxOpen} onOpenChange={setIsSandboxOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              ผลการทดสอบคำนวณประมาณการสิทธิ 4 หมวด (Sandbox Results)
            </DialogTitle>
            <DialogDescription className="text-xs">
              ตัวอย่างกำลังพล: พ.ท. วีรชาติ ภักดีสยาม (ปูนบำเหน็จ พล.อ. 7 ชั้นยศ)
            </DialogDescription>
          </DialogHeader>

          {simulationResult && (
            <div className="space-y-4 py-2 text-xs">
              {/* 4 Grand Summary Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-center">
                  <span className="text-[10px] text-amber-700 block">1. เงินก้อนครั้งเดียว</span>
                  <span className="text-base font-black text-amber-900 dark:text-amber-200 font-mono">
                    {formatCurrency(simulationResult.grandTotalLumpSum)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-center">
                  <span className="text-[10px] text-blue-700 block">2. เงินรายเดือน</span>
                  <span className="text-base font-black text-blue-900 dark:text-blue-200 font-mono">
                    {formatCurrency(simulationResult.grandTotalMonthlyPension)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-[10px] text-emerald-700 block">3. เงินรายปี (ทุนการศึกษา)</span>
                  <span className="text-base font-black text-emerald-900 dark:text-emerald-200 font-mono">
                    {formatCurrency(simulationResult.grandTotalAnnualScholarship)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900 text-center">
                  <span className="text-[10px] text-purple-700 block">4. สิทธิมิใช่ตัวเงิน</span>
                  <span className="text-base font-black text-purple-900 dark:text-purple-200 font-mono">
                    {simulationResult.nonMonetaryRightsCount} รายการ
                  </span>
                </div>
              </div>

              {/* 4 Categories Breakdown */}
              <div className="space-y-3">
                {Object.values(simulationResult.categories || {}).map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-bold text-xs">{cat.categoryThaiName}</span>
                      <span className="font-mono font-bold text-emerald-600">
                        รวม: {formatCurrency(cat.totalAmount)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {cat.items.map((item) => (
                        <div
                          key={item.ruleId}
                          className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-50 dark:bg-slate-900"
                        >
                          <span>{item.ruleName}</span>
                          <span className="font-mono font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setIsSandboxOpen(false)}>
              ปิดหน้าต่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
