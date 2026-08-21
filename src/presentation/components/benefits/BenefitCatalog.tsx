"use client";

import React, { useState } from "react";
import { BenefitProgramEntity } from "../../../core/domain/entities/BenefitProgram";
import { formatCurrency, formatThaiDate } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Layers,
  Search,
  CheckCircle2,
  Calendar,
  Coins,
  FileText,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface BenefitCatalogProps {
  programs: BenefitProgramEntity[];
}

export function BenefitCatalog({ programs }: BenefitCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProgram, setSelectedProgram] = useState<BenefitProgramEntity | null>(null);

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.thaiName.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "ALL", label: "ทั้งหมด (7 โครงการ)" },
    { value: "LIVING_ALLOWANCE", label: "เบี้ยยังชีพผู้สูงอายุ" },
    { value: "DISABILITY_BENEFIT", label: "สิทธิคนพิการ" },
    { value: "STATE_WELFARE_TOPUP", label: "สวัสดิการแห่งรัฐ" },
    { value: "EMERGENCY_GRANT", label: "สงเคราะห์ฉุกเฉิน" },
    { value: "HOUSING_RENOVATION", label: "ปรับปรุงบ้าน" },
    { value: "FUNERAL_AID", label: "ค่าทำศพตามประเพณี" },
    { value: "OCCUPATIONAL_LOAN", label: "กองทุนเงินกู้อาชีพ" },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อโครงการ, รหัส, หรือคำสำคัญ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 4).map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrograms.map((program) => {
          const budgetPercent = program.budgetTotal > 0
            ? Math.round((program.budgetDisbursed / program.budgetTotal) * 100)
            : 0;

          return (
            <Card
              key={program.id}
              className="border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                    {program.code}
                  </span>
                  <Badge variant={program.isActive ? "success" : "secondary"} className="text-[10px]">
                    {program.isActive ? "เปิดรับคำขอ" : "ปิดรับชั่วคราว"}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {program.thaiName}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {program.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">กลุ่มเป้าหมาย:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right line-clamp-1">
                      {program.targetGroup}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">วงเงินสูงสุด/อัตรา:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(program.maxAmount)}
                      {program.paymentFrequency === "MONTHLY" ? "/เดือน" : "/รายการ"}
                    </span>
                  </div>
                </div>

                {/* Budget Utilization Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>การเบิกจ่ายงบประมาณ:</span>
                    <span className="font-semibold">{budgetPercent}%</span>
                  </div>
                  <Progress value={budgetPercent} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>จ่ายแล้ว {formatCurrency(program.budgetDisbursed)}</span>
                    <span>กรอบงบ {formatCurrency(program.budgetTotal)}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setSelectedProgram(program)}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  ดูเกณฑ์และระเบียบ
                </Button>
                <Link href="/calculator" className="w-full">
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    ประเมินสิทธิ
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Program Detail Modal */}
      <Dialog open={Boolean(selectedProgram)} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                {selectedProgram?.code}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">
              {selectedProgram?.thaiName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedProgram?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedProgram && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-muted-foreground block">หมวดหมู่สวัสดิการ:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProgram.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">ความถี่การจ่ายเงิน:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProgram.paymentFrequency}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">วงเงินสิทธิประโยชน์:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedProgram.maxAmount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">งบประมาณจัดสรร:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedProgram.budgetTotal)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  กฎหมายและระเบียบที่เกี่ยวข้อง:
                </p>
                <p className="text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border">
                  {selectedProgram.legalBasis || "พระราชบัญญัติผู้สูงอายุ พ.ศ. 2546 และระเบียบกระทรวงที่เกี่ยวข้อง"}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  คุณสมบัติผู้มีสิทธิ:
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedProgram.targetGroup}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProgram(null)}>
              ปิดหน้าต่าง
            </Button>
            <Link href="/calculator">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                ทดลองประเมินสิทธิในโครงการนี้
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
