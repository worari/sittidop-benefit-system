"use client";

import React, { useState } from "react";
import { ApplicationEntity } from "../../../core/domain/entities/Application";
import { ApplicationStatus, ApprovalDecision } from "../../../core/domain/value-objects/enums";
import { formatCurrency, formatThaiDate, formatThaiDateTime, formatNationalId } from "../../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Send,
  Eye,
  FileText,
  AlertCircle,
  Check,
  X,
  Filter,
} from "lucide-react";

interface ApplicationTableProps {
  initialApplications: ApplicationEntity[];
  userRole?: string;
  onRefresh?: () => void;
}

export function ApplicationTable({ initialApplications, userRole = "OFFICER", onRefresh }: ApplicationTableProps) {
  const [applications, setApplications] = useState<ApplicationEntity[]>(initialApplications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<ApplicationEntity | null>(null);

  // Review Dialog State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decision, setDecision] = useState<ApprovalDecision>(ApprovalDecision.APPROVE);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [officerNotes, setOfficerNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const statusBadges: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
    [ApplicationStatus.DRAFT]: { label: "ร่างคำขอ", variant: "secondary" },
    [ApplicationStatus.SUBMITTED]: { label: "ยื่นคำขอใหม่", variant: "info" },
    [ApplicationStatus.UNDER_REVIEW]: { label: "รอตรวจเอกสาร", variant: "warning" },
    [ApplicationStatus.DOCUMENT_VERIFIED]: { label: "ตรวจเอกสารผ่าน", variant: "purple" },
    [ApplicationStatus.APPROVED]: { label: "อนุมัติแล้ว", variant: "success" },
    [ApplicationStatus.REJECTED]: { label: "ไม่อนุมัติ", variant: "destructive" },
    [ApplicationStatus.DISBURSED]: { label: "โอนเงินแล้ว", variant: "success" },
  };

  const filteredApps = applications.filter((app) => {
    const s = search.toLowerCase();
    const matchesSearch =
      app.applicationNumber.toLowerCase().includes(s) ||
      (app.citizenName && app.citizenName.toLowerCase().includes(s)) ||
      (app.citizenNationalId && app.citizenNationalId.includes(s)) ||
      (app.citizenProvince && app.citizenProvince.toLowerCase().includes(s)) ||
      (app.programName && app.programName.toLowerCase().includes(s));

    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenReview = (app: ApplicationEntity) => {
    setSelectedApp(app);
    setApprovedAmount(app.approvedAmount || app.requestedAmount);
    setOfficerNotes(app.officerNotes || "");
    setDecision(ApprovalDecision.APPROVE);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: officerNotes,
          approvedAmount: decision === ApprovalDecision.APPROVE ? Number(approvedAmount) : null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Update local list
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApp.id ? json.data : a))
        );
        setFeedbackMessage(`บันทึกผลการพิจารณาคำขอ ${selectedApp.applicationNumber} เรียบร้อยแล้ว`);
        setReviewModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch {
      // Local optimistic update
      let nextStatus = ApplicationStatus.APPROVED;
      if (decision === ApprovalDecision.REJECT) nextStatus = ApplicationStatus.REJECTED;
      if (decision === ApprovalDecision.REQUEST_DOCUMENTS) nextStatus = ApplicationStatus.UNDER_REVIEW;
      if (decision === ApprovalDecision.FORWARD) nextStatus = ApplicationStatus.DOCUMENT_VERIFIED;

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: nextStatus,
                officerNotes,
                approvedAmount: decision === ApprovalDecision.APPROVE ? Number(approvedAmount) : null,
                decisionDate: new Date(),
              }
            : a
        )
      );
      setFeedbackMessage(`บันทึกผลการพิจารณาคำขอ ${selectedApp.applicationNumber} สำเร็จ`);
      setReviewModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขคำขอ, ชื่อผู้สูงอายุ, เลขบัตร 13 หลัก, จังหวัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">สถานะ:</span>
          {["ALL", ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED].map(
            (statusKey) => (
              <Button
                key={statusKey}
                variant={statusFilter === statusKey ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusKey)}
                className="text-xs whitespace-nowrap"
              >
                {statusKey === "ALL"
                  ? "ทั้งหมด"
                  : statusBadges[statusKey as ApplicationStatus]?.label || statusKey}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">เลขที่คำขอ</TableHead>
              <TableHead>ผู้ยื่นคำขอ / ผู้สูงอายุ</TableHead>
              <TableHead>โครงการสวัสดิการ</TableHead>
              <TableHead className="text-right">วงเงินที่ขอ</TableHead>
              <TableHead className="text-center">สถานะคำขอ</TableHead>
              <TableHead>วันที่ยื่น</TableHead>
              <TableHead className="text-right">การดำเนินการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  ไม่พบรายการคำขอตามเงื่อนไขการค้นหา
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => {
                const statusInfo = statusBadges[app.status] || {
                  label: app.status,
                  variant: "secondary",
                };

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {app.applicationNumber}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {app.citizenName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {app.citizenNationalId ? formatNationalId(app.citizenNationalId) : "-"} • {app.citizenProvince}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {app.programName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(app.requestedAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusInfo.variant} className="text-[11px]">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatThaiDate(app.submissionDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReview(app)}
                        className="text-xs h-8 px-2.5 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        ตรวจสอบ / พิจารณา
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review and Approval Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                {selectedApp?.applicationNumber}
              </span>
              <Badge variant={statusBadges[selectedApp?.status || ApplicationStatus.SUBMITTED]?.variant}>
                {statusBadges[selectedApp?.status || ApplicationStatus.SUBMITTED]?.label}
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold">
              พิจารณาคำขอรับสิทธิสวัสดิการและบันทึกผลการตรวจสอบ
            </DialogTitle>
            <DialogDescription className="text-xs">
              กลุ่มงานพิจารณาสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 py-2 text-xs">
              {/* Beneficiary & Program Card */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-muted-foreground block font-semibold">ข้อมูลผู้สูงอายุ:</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedApp.citizenName}</p>
                  <p className="font-mono text-slate-500">{selectedApp.citizenNationalId}</p>
                  <p className="text-slate-500">ภูมิลำเนา: {selectedApp.citizenProvince}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block font-semibold">โครงการที่ยื่นขอ:</span>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedApp.programName}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    วงเงินที่ขอ: {formatCurrency(selectedApp.requestedAmount)}
                  </p>
                  <p className="text-slate-500">ยื่นเมื่อ: {formatThaiDateTime(selectedApp.submissionDate)}</p>
                </div>
              </div>

              {selectedApp.applicantRemarks && (
                <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">เหตุผลความจำเป็นของผู้ยื่น:</span>
                  <p className="text-blue-800 dark:text-blue-200">{selectedApp.applicantRemarks}</p>
                </div>
              )}

              {/* Review Decision Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">ผลการพิจารณา (Decision):</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: ApprovalDecision.APPROVE, label: "อนุมัติสิทธิ", color: "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50" },
                    { key: ApprovalDecision.REJECT, label: "ไม่อนุมัติ", color: "border-rose-600 text-rose-700 bg-rose-50 dark:bg-rose-950/50" },
                    { key: ApprovalDecision.REQUEST_DOCUMENTS, label: "ขอเอกสารเพิ่ม", color: "border-amber-600 text-amber-700 bg-amber-50 dark:bg-amber-950/50" },
                    { key: ApprovalDecision.FORWARD, label: "ส่งต่อพิจารณา", color: "border-purple-600 text-purple-700 bg-purple-50 dark:bg-purple-950/50" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setDecision(item.key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        decision === item.key
                          ? `${item.color} font-bold shadow-xs`
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {decision === ApprovalDecision.APPROVE && (
                <div className="space-y-1.5">
                  <Label htmlFor="approvedAmount">วงเงินที่อนุมัติ (บาท)</Label>
                  <Input
                    id="approvedAmount"
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="font-bold text-emerald-600"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="officerNotes">บันทึกข้อความ / เหตุผลของเจ้าหน้าที่ผู้พิจารณา</Label>
                <textarea
                  id="officerNotes"
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="ระบุข้อเท็จจริงจากการตรวจสอบ หรือระเบียบที่ใช้ในการพิจารณา..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleSubmitReview}
              disabled={isProcessing}
            >
              {isProcessing ? "กำลังบันทึก..." : "ยืนยันผลการพิจารณา (Save Decision)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
