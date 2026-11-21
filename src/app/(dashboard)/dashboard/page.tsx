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
  ClipboardList,
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
    { name: "หมวด 1: รับเงินครั้งเดียว", value: 18250000, color: "#b45309" },
    { name: "หมวด 2: รับเงินรายเดือน", value: 4140000, color: "#1e40af" },
    { name: "หมวด 3: รับเงินรายปี", value: 2220000, color: "#1b4332" },
    { name: "หมวด 4: สิทธิมิใช่ตัวเงิน", value: 240000, color: "#4338ca" },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#1877F2]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              ภาพรวมระบบ WeR-RTA บริหารจัดการสิทธิและสวัสดิการกำลังพล
            </h1>
            <Badge variant="army" className="text-[11px] font-medium">
              ศปก.ทบ. • กพ.ทบ.
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            กำลังพลสายสนาม จชต. • กองกำลังป้องกันชายแดน • พื้นที่เสี่ยงภัย • ประมาณการสิทธิ 4 หมวด และติดตามสิทธิสวัสดิการ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/calculator">
            <Button size="sm" className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs gap-1.5 shadow-sm border-0">
              <Calculator className="h-4 w-4 text-amber-300" />
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
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              หมวดที่ ๑ : รับเงินครั้งเดียว
            </span>
            <div className="h-7 w-7 rounded bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 border border-amber-200 dark:border-amber-900">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalLumpSum)}
          </p>
          <p className="text-[11px] text-slate-500">บำเหน็จตกทอด / ชดเชย 30 เท่า / ประกันภัย</p>
        </Card>

        {/* Cat 2: Monthly Pension */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs border-l-4 border-l-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              หมวดที่ ๒ : รับเงินรายเดือน
            </span>
            <div className="h-7 w-7 rounded bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 border border-blue-200 dark:border-blue-900">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalMonthlyPension)}
          </p>
          <p className="text-[11px] text-slate-500">บำนาญพิเศษรายเดือนตลอดชีพ / เงิน พ.ส.ร.</p>
        </Card>

        {/* Cat 3: Annual Scholarships */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs border-l-4 border-l-[#1b4332]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              หมวดที่ ๓ : รับเงินรายปี
            </span>
            <div className="h-7 w-7 rounded bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-[#1b4332] border border-emerald-200 dark:border-emerald-900">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(metrics.totalAnnualScholarship)}
          </p>
          <p className="text-[11px] text-slate-500">ทุนการศึกษาบุตรกำลังพล ทบ. ทุกระดับชั้น</p>
        </Card>

        {/* Cat 4: Non-Monetary */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs border-l-4 border-l-indigo-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              หมวดที่ ๔ : สิทธิมิใช่ตัวเงิน
            </span>
            <div className="h-7 w-7 rounded bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-700 border border-indigo-200 dark:border-indigo-900">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            4 สิทธิหลัก
          </p>
          <p className="text-[11px] text-slate-500">บรรจุทายาท 1 อัตรา / รักษาพยาบาลตลอดชีพ</p>
        </Card>
      </div>


      {/* Benefit Tracking Summary */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#1b4332] dark:text-emerald-400 shrink-0 border border-slate-200 dark:border-slate-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">ติดตามสถานะรายการสิทธิและเงินสงเคราะห์</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ตรวจสอบรายการที่ได้รับอนุมัติแล้ว หรืออยู่ระหว่างการเสนอขอตามขั้นตอนราชการ
              </CardDescription>
            </div>
          </div>
          <Link href="/benefit-tracking">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-slate-300">
              <ClipboardList className="h-4 w-4 text-[#1b4332]" />
              เปิดระบบติดตาม
            </Button>
          </Link>
        </div>
      </Card>

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
                ยอดรวมสะสมการจัดสรรเงินสงเคราะห์และสวัสดิการทุกหน่วยขึ้นตรง ทบ. (บาท)
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
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="estimated" name="ยอดประมาณการสิทธิ" stroke="#1b4332" fillOpacity={1} fill="url(#colorEst)" />
                <Area type="monotone" dataKey="disbursed" name="ยอดเบิกจ่ายจริง" stroke="#1e3a5f" fillOpacity={1} fill="url(#colorDis)" />
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
                  paddingAngle={3}
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
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="font-semibold font-mono">{formatCurrency(item.value)}</span>
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
              <Card className="border border-slate-200 dark:border-slate-800 p-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-[#1b4332]/10 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-[#1b4332] transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#1b4332] transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
