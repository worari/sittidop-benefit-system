"use client";

import Link from "next/link";
import { ApplicationEntity } from "../../../core/domain/entities/Application";
import { ApplicationStatus } from "../../../core/domain/value-objects/enums";
import { formatCurrency, formatThaiDate, formatNationalId } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowRight, Clock, CheckCircle, XCircle, FileSearch, Send, Sparkles } from "lucide-react";

interface ClaimsPipelineProps {
  applications: ApplicationEntity[];
  counts: Record<ApplicationStatus, number>;
}

export function ClaimsPipeline({ applications, counts }: ClaimsPipelineProps) {
  const statusBadges: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
    [ApplicationStatus.DRAFT]: { label: "ร่างคำขอ", variant: "secondary" },
    [ApplicationStatus.SUBMITTED]: { label: "ยื่นคำขอใหม่", variant: "info" },
    [ApplicationStatus.UNDER_REVIEW]: { label: "รอตรวจเอกสาร", variant: "warning" },
    [ApplicationStatus.DOCUMENT_VERIFIED]: { label: "ตรวจเอกสารผ่าน", variant: "purple" },
    [ApplicationStatus.APPROVED]: { label: "อนุมัติแล้ว", variant: "success" },
    [ApplicationStatus.REJECTED]: { label: "ไม่อนุมัติ", variant: "destructive" },
    [ApplicationStatus.DISBURSED]: { label: "โอนเงินแล้ว", variant: "success" },
  };

  const pipelineStages = [
    { key: ApplicationStatus.SUBMITTED, label: "ยื่นคำขอใหม่", count: counts[ApplicationStatus.SUBMITTED] || 0, color: "bg-blue-500" },
    { key: ApplicationStatus.UNDER_REVIEW, label: "รอตรวจเอกสาร", count: counts[ApplicationStatus.UNDER_REVIEW] || 0, color: "bg-amber-500" },
    { key: ApplicationStatus.DOCUMENT_VERIFIED, label: "พร้อมพิจารณา", count: counts[ApplicationStatus.DOCUMENT_VERIFIED] || 0, color: "bg-purple-500" },
    { key: ApplicationStatus.APPROVED, label: "อนุมัติสิทธิ", count: counts[ApplicationStatus.APPROVED] || 0, color: "bg-emerald-500" },
    { key: ApplicationStatus.DISBURSED, label: "โอนเงินสำเร็จ", count: counts[ApplicationStatus.DISBURSED] || 0, color: "bg-teal-500" },
  ];

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              ท่อกระบวนการพิจารณาสิทธิสวัสดิการ (Claims Processing Pipeline)
            </CardTitle>
            <CardDescription className="text-xs">
              สถานะคำขอรับสิทธิและการดำเนินการแบบเรียลไทม์
            </CardDescription>
          </div>
          <Link href="/applications">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              ดูทั้งหมด
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Pipeline Funnel */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-900/40 text-center space-y-1"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-[11px] font-semibold text-muted-foreground">{stage.label}</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{stage.count}</p>
            </div>
          ))}
        </div>

        {/* Recent Applications Mini Table */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-muted-foreground">รายการคำขอล่าสุดในระบบ:</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-card">
            {applications.slice(0, 5).map((app) => {
              const statusInfo = statusBadges[app.status] || { label: app.status, variant: "secondary" };
              return (
                <div
                  key={app.id}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {app.applicationNumber}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-[10px] py-0">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {app.citizenName} ({app.citizenProvince}) • {app.programName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(app.requestedAmount)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {formatThaiDate(app.submissionDate)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
