"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  Shield,
  Award,
  Users,
  GraduationCap,
  Calculator,
  FileText,
  HeartHandshake,
  TrendingUp,
  Sliders,
  DollarSign,
  ArrowUpRight,
  Coins,
  Calendar,
  CalendarDays,
  Gift,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const [metrics] = useState({
    totalLumpSum: 24850000,
    totalMonthlyPension: 345000,
    totalAnnualScholarship: 185000,
    activePersonnel: 4,
    issuedDocuments: 2,
    category1: 18250000, // รับเงินครั้งเดียว
    category2: 4140000,  // รับเงินรายเดือน
    category3: 2220000,  // รับเงินรายปี
    category4: 240000,   // สิทธิมิใช่ตัวเงิน
  });

  const categoryDistribution = [
    { name: "หมวด 1: รับเงินครั้งเดียว", value: 18250000, color: "#d97706" },
    { name: "หมวด 2: รับเงินรายเดือน", value: 4140000, color: "#2563eb" },
    { name: "หมวด 3: รับเงินรายปี", value: 2220000, color: "#059669" },
    { name: "หมวด 4: สิทธิมิใช่ตัวเงิน", value: 240000, color: "#9333ea" },
  ];

  const monthlyTrends = [
    { month: "ต.ค.", estimated: 4200000, disbursed: 4000000 },
    { month: "พ.ย.", estimated: 5800000, disbursed: 5500000 },
    { month: "ธ.ค.", estimated: 7100000, disbursed: 6900000 },
    { month: "ม.ค.", estimated: 9300000, disbursed: 8900000 },
    { month: "ก.พ.", estimated: 14500000, disbursed: 13800000 },
    { month: "มี.ค.", estimated: 24850000, disbursed: 23500000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ภาพรวมระบบประมาณการสิทธิกำลังพล 4 หมวด
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            แยก 4 หมวดหมู่: 1.รับเงินครั้งเดียว 2.รับเงินรายเดือน 3.รับเงินรายปี 4.สิทธิมิใช่ตัวเงิน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/calculator">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm">
              <Calculator className="h-4 w-4" />
              คำนวณสิทธิ 4 หมวด
            </Button>
          </Link>
          <Link href="/documents">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <FileText className="h-4 w-4" />
              พิมพ์หนังสือรับรอง
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Main Category KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cat 1: Total Lump Sum */}
        <Card className="border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-500/10 to-transparent p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              1. รับเงินครั้งเดียว
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalLumpSum)}
          </p>
          <p className="text-[11px] text-muted-foreground">บำเหน็จตกทอด / ชดเชย 30 เท่า / ประกัน</p>
        </Card>

        {/* Cat 2: Monthly Pension */}
        <Card className="border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-500/10 to-transparent p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
              2. รับเงินรายเดือน
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalMonthlyPension)}
          </p>
          <p className="text-[11px] text-muted-foreground">บำนาญพิเศษรายเดือนตลอดชีพ</p>
        </Card>

        {/* Cat 3: Annual Scholarships */}
        <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              3. รับเงินรายปี
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalAnnualScholarship)}
          </p>
          <p className="text-[11px] text-muted-foreground">ทุนการศึกษาบุตรรายปีทุกระดับ</p>
        </Card>

        {/* Cat 4: Non-Monetary */}
        <Card className="border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-500/10 to-transparent p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
              4. สิทธิมิใช่ตัวเงิน
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            4 สิทธิหลัก
          </p>
          <p className="text-[11px] text-muted-foreground">บรรจุทายาท / รักษาพยาบาล / โควตา</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Budget Trends */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">
                แนวโน้มประมาณการงบประมาณเปรียบเทียบยอดเบิกจ่ายจริง (ปีงบประมาณ 2569)
              </CardTitle>
              <CardDescription className="text-xs">
                ยอดรวมสะสมการจัดสรรเงินสงเคราะห์และสวัสดิการทุกเหล่าทัพ (บาท)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              งบสะสม
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="estimated" name="ยอดประมาณการสิทธิ" stroke="#059669" fillOpacity={1} fill="url(#colorEst)" />
                <Area type="monotone" dataKey="disbursed" name="ยอดเบิกจ่ายจริง" stroke="#2563eb" fillOpacity={1} fill="url(#colorDis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4 Category Pie Chart */}
        <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div>
            <CardTitle className="text-sm font-bold">สัดส่วนงบประมาณ 4 หมวด</CardTitle>
            <CardDescription className="text-xs">
              การกระจายตัวของงบประมาณตาม 4 หมวดการจ่ายสิทธิประโยชน์
            </CardDescription>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {categoryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold font-mono">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Access Grid to Key Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { title: "ทะเบียนกำลังพล", desc: "4 นายในระบบ", href: "/personnel", icon: Shield },
          { title: "ข้อมูลครอบครัว", desc: "คู่สมรสและบุตร", href: "/family", icon: Users },
          { title: "ข้อมูลทายาท", desc: "สัดส่วนแบ่ง 50/25/25", href: "/heirs", icon: HeartHandshake },
          { title: "หนังสือรับรองสิทธิ", desc: "2 ฉบับออกทางการ", href: "/documents", icon: FileText },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href}>
              <Card className="border border-slate-200 dark:border-slate-800 p-4 hover:border-emerald-500/50 transition-all group shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-900 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {item.title}
                </h4>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
