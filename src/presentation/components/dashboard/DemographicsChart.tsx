"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { formatNumber, formatCurrency } from "../../lib/utils";

interface DemographicsChartProps {
  cohorts: {
    cohort: string;
    count: number;
    amount: number;
  }[];
  categories: {
    categoryLabel: string;
    totalAmount: number;
    beneficiaryCount: number;
  }[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

export function DemographicsChart({ cohorts, categories }: DemographicsChartProps) {
  const pieData = categories.map((cat) => ({
    name: cat.categoryLabel,
    value: +(cat.totalAmount / 1000000000).toFixed(1),
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-slate-100">{payload[0].name}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
            งบประมาณ: {payload[0].value} พันล้านบาท
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Age Cohorts Bar Chart */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            สัดส่วนผู้รับสิทธิตามกลุ่มช่วงอายุ (ขั้นบันได)
          </CardTitle>
          <CardDescription className="text-xs">
            จำแนกตามเกณฑ์อายุ 60-69, 70-79, 80-89, 90+ ปี
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohorts} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="cohort" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`${formatNumber(Number(value))} คน`, "จำนวนผู้สูงอายุ"]}
                  contentStyle={{
                    borderRadius: "12px",
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "#334155",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="จำนวนผู้รับสิทธิ" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Benefit Categories Distribution Pie */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            การจัดสรรงบประมาณตามประเภทโครงการสวัสดิการ
          </CardTitle>
          <CardDescription className="text-xs">
            สัดส่วนงบประมาณ 7 โครงการหลัก (หน่วย: พันล้านบาท)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingLeft: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
