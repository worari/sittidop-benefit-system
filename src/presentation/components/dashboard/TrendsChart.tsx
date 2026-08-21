"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { formatCurrency } from "../../lib/utils";

interface TrendsChartProps {
  data: {
    month: string;
    estimatedAmount: number;
    disbursedAmount: number;
    newApplications: number;
  }[];
}

export function TrendsChart({ data }: TrendsChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    estimatedInBillions: +(item.estimatedAmount / 1000000000).toFixed(2),
    disbursedInBillions: +(item.disbursedAmount / 1000000000).toFixed(2),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-slate-100">
            เดือน {label} 2569
          </p>
          <div className="space-y-1">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between gap-3">
              <span>งบประมาณการ:</span>
              <span>{payload[0]?.value} พันล้านบาท</span>
            </p>
            <p className="text-teal-600 dark:text-teal-400 font-semibold flex items-center justify-between gap-3">
              <span>เบิกจ่ายจริง:</span>
              <span>{payload[1]?.value} พันล้านบาท</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">
              แนวโน้มงบประมาณการสิทธิและการเบิกจ่ายสวัสดิการ (รายเดือน)
            </CardTitle>
            <CardDescription className="text-xs">
              เปรียบเทียบวงเงินประมาณการสิทธิ (Estimated) กับยอดจ่ายเงินจริง (Disbursed) หน่วย: พันล้านบาท
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEstimated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="estimatedInBillions"
                name="งบประมาณการสิทธิ"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEstimated)"
              />
              <Area
                type="monotone"
                dataKey="disbursedInBillions"
                name="ยอดเบิกจ่ายจริง"
                stroke="#0d9488"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDisbursed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
