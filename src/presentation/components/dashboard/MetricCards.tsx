"use client";

import { DashboardMetrics } from "../../../core/domain/value-objects/types";
import { formatCurrency, formatNumber } from "../../lib/utils";
import { Card, CardContent } from "../ui/card";
import {
  TrendingUp,
  Users,
  FileCheck,
  Coins,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";

interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      title: "งบประมาณสวัสดิการประมาณการรวม",
      value: formatCurrency(metrics.totalEstimatedFunds),
      subtitle: "งบประมาณประจำปี 2569 (7 โครงการ)",
      icon: Coins,
      trend: "+4.8% เทียบปีก่อน",
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "ผู้สูงอายุในระบบฐานข้อมูลสิทธิ",
      value: `${formatNumber(metrics.totalBeneficiariesCount)} คน`,
      subtitle: "ผู้มีสิทธิรับเบี้ยยังชีพทั่วประเทศ",
      icon: Users,
      trend: "+2.1% เพิ่มขึ้นตามโครงสร้างประชากร",
      color: "from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "คำขอสิทธิที่อยู่ระหว่างดำเนินการ",
      value: `${metrics.activeClaimsCount} รายการ`,
      subtitle: "รอตรวจสอบเอกสาร & อนุมัติ",
      icon: FileCheck,
      trend: "เฉลี่ยพิจารณา 3.4 วันทำการ",
      color: "from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "อัตราการอนุมัติสิทธิ (Approval Rate)",
      value: `${metrics.approvalRatePercent}%`,
      subtitle: `${metrics.approvedClaimsCount} คำขอได้รับอนุมัติ`,
      icon: CheckCircle2,
      trend: "ผ่านเกณฑ์มาตรฐาน ISO/DOP",
      color: "from-purple-500/20 to-indigo-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
                  {card.title}
                </span>
                <div
                  className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
                <span>{card.trend}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
