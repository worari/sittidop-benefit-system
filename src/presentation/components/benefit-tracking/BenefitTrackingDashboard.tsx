"use client";

import React, { useState, useMemo } from "react";
import { BenefitTrackingEntity } from "../../../core/domain/entities/BenefitTracking";
import { BenefitTrackingStatus } from "../../../core/domain/value-objects/enums";
import type { EstimationOverviewItem } from "../../../core/domain/value-objects/types";
import { formatCurrency, formatThaiDate, formatNationalId } from "../../lib/utils";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
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
    Eye,
    Filter,
    PackageCheck,
    Banknote,
    AlertCircle,
    RotateCcw,
    Truck,
    Send,
    Sparkles,
    X,
    PencilLine,
    Trash2,
} from "lucide-react";

interface BenefitTrackingDashboardProps {
    initialTrackings: BenefitTrackingEntity[];
    initialCounts?: Record<BenefitTrackingStatus, number>;
    initialEstimationOverview?: EstimationOverviewItem[];
    userRole?: string;
    onRefresh?: () => void;
}

const statusConfig: Record<
    BenefitTrackingStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple"; icon: React.ElementType; color: string }
> = {
    [BenefitTrackingStatus.PROPOSED]: { label: "เสนอขอรับสิทธิ", variant: "info", icon: Send, color: "text-sky-600" },
    [BenefitTrackingStatus.PENDING]: { label: "รอดำเนินการ", variant: "secondary", icon: Clock, color: "text-slate-600" },
    [BenefitTrackingStatus.UNDER_REVIEW]: { label: "ตรวจสอบเอกสาร", variant: "warning", icon: FileCheck, color: "text-amber-600" },
    [BenefitTrackingStatus.APPROVED]: { label: "อนุมัติแล้ว", variant: "success", icon: CheckCircle2, color: "text-emerald-600" },
    [BenefitTrackingStatus.DISBURSED]: { label: "โอนเงินแล้ว", variant: "info", icon: Banknote, color: "text-blue-600" },
    [BenefitTrackingStatus.RECEIVED]: { label: "ได้รับสิทธิแล้ว", variant: "success", icon: PackageCheck, color: "text-emerald-700" },
    [BenefitTrackingStatus.REJECTED]: { label: "ไม่อนุมัติ", variant: "destructive", icon: XCircle, color: "text-rose-600" },
    [BenefitTrackingStatus.CANCELLED]: { label: "ยกเลิก", variant: "outline", icon: X, color: "text-slate-400" },
};

const unknownStatusConfig = {
    label: "ไม่ทราบสถานะ",
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-slate-400",
};

function getStatusConfig(status: BenefitTrackingStatus | string | undefined | null) {
    return statusConfig[status as BenefitTrackingStatus] ?? {
        ...unknownStatusConfig,
        label: status || unknownStatusConfig.label,
    };
}

const statusOptions = [
    { key: "ALL", label: "ทั้งหมด" },
    { key: BenefitTrackingStatus.PROPOSED, label: statusConfig[BenefitTrackingStatus.PROPOSED].label },
    { key: BenefitTrackingStatus.PENDING, label: statusConfig[BenefitTrackingStatus.PENDING].label },
    { key: BenefitTrackingStatus.UNDER_REVIEW, label: statusConfig[BenefitTrackingStatus.UNDER_REVIEW].label },
    { key: BenefitTrackingStatus.APPROVED, label: statusConfig[BenefitTrackingStatus.APPROVED].label },
    { key: BenefitTrackingStatus.DISBURSED, label: statusConfig[BenefitTrackingStatus.DISBURSED].label },
    { key: BenefitTrackingStatus.RECEIVED, label: statusConfig[BenefitTrackingStatus.RECEIVED].label },
    { key: BenefitTrackingStatus.REJECTED, label: statusConfig[BenefitTrackingStatus.REJECTED].label },
];

export function BenefitTrackingDashboard({
    initialTrackings,
    initialCounts,
    initialEstimationOverview,
    userRole = "STAFF",
    onRefresh,
}: BenefitTrackingDashboardProps) {
    const [trackings, setTrackings] = useState<BenefitTrackingEntity[]>(initialTrackings);
    const [counts, setCounts] = useState<Record<BenefitTrackingStatus, number> | undefined>(initialCounts);
    const [overview, setOverview] = useState<EstimationOverviewItem[]>(initialEstimationOverview || []);
    const [proposingKey, setProposingKey] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedTracking, setSelectedTracking] = useState<BenefitTrackingEntity | null>(null);

    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<BenefitTrackingStatus>(BenefitTrackingStatus.PENDING);
    const [approvedAmount, setApprovedAmount] = useState<number>(0);
    const [disbursedAmount, setDisbursedAmount] = useState<number>(0);
    const [paymentReference, setPaymentReference] = useState<string>("");
    const [officerNotes, setOfficerNotes] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editBenefitName, setEditBenefitName] = useState("");
    const [editRequestedAmount, setEditRequestedAmount] = useState<number>(0);
    const [editNotes, setEditNotes] = useState("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<BenefitTrackingEntity | null>(null);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<BenefitTrackingEntity | null>(null);

    const filteredTrackings = useMemo(() => {
        return trackings.filter((t) => {
            const s = search.toLowerCase();
            const matchesSearch =
                t.trackingNumber.toLowerCase().includes(s) ||
                t.benefitName.toLowerCase().includes(s) ||
                (t.citizenName && t.citizenName.toLowerCase().includes(s)) ||
                (t.citizenNationalId && t.citizenNationalId.includes(s)) ||
                (t.citizenProvince && t.citizenProvince.toLowerCase().includes(s)) ||
                (t.programName && t.programName.toLowerCase().includes(s));
            const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [trackings, search, statusFilter]);

    const handleOpenUpdate = (tracking: BenefitTrackingEntity) => {
        setSelectedTracking(tracking);
        setNewStatus(tracking.status);
        setApprovedAmount(tracking.approvedAmount || tracking.requestedAmount);
        setDisbursedAmount(tracking.disbursedAmount || tracking.approvedAmount || tracking.requestedAmount);
        setPaymentReference(tracking.paymentReference || "");
        setOfficerNotes(tracking.officerNotes || "");
        setUpdateModalOpen(true);
    };

    const handleSubmitUpdate = async () => {
        if (!selectedTracking) return;
        setIsProcessing(true);

        try {
            const res = await fetch(`/api/benefit-tracking/${selectedTracking.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    approvedAmount: [BenefitTrackingStatus.APPROVED, BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus)
                        ? Number(approvedAmount)
                        : null,
                    disbursedAmount: [BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus)
                        ? Number(disbursedAmount)
                        : null,
                    paymentReference: newStatus === BenefitTrackingStatus.DISBURSED || newStatus === BenefitTrackingStatus.RECEIVED ? paymentReference : null,
                    officerNotes,
                }),
            });

            if (res.ok) {
                const json = await res.json();
                setTrackings((prev) => prev.map((t) => (t.id === selectedTracking.id ? json.data : t)));
                setFeedbackMessage(`อัปเดตสถานะ ${selectedTracking.trackingNumber} เป็น "${getStatusConfig(newStatus).label}" เรียบร้อยแล้ว`);
                setUpdateModalOpen(false);
                if (onRefresh) onRefresh();
            } else {
                const err = await res.json();
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${err.error || res.statusText}`);
            }
        } catch {
            setTrackings((prev) =>
                prev.map((t) =>
                    t.id === selectedTracking.id
                        ? {
                            ...t,
                            status: newStatus,
                            approvedAmount: [BenefitTrackingStatus.APPROVED, BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus)
                                ? Number(approvedAmount)
                                : t.approvedAmount,
                            disbursedAmount: [BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus)
                                ? Number(disbursedAmount)
                                : t.disbursedAmount,
                            paymentReference: newStatus === BenefitTrackingStatus.DISBURSED || newStatus === BenefitTrackingStatus.RECEIVED ? paymentReference : t.paymentReference,
                            officerNotes,
                        }
                        : t
                )
            );
            setFeedbackMessage(`อัปเดตสถานะ ${selectedTracking.trackingNumber} สำเร็จ (โหมดออฟไลน์)`);
            setUpdateModalOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenEdit = (tracking: BenefitTrackingEntity) => {
        setSelectedTracking(tracking);
        setEditBenefitName(tracking.benefitName);
        setEditRequestedAmount(tracking.requestedAmount);
        setEditNotes(tracking.notes || "");
        setEditModalOpen(true);
    };

    const handleSubmitEdit = async () => {
        if (!selectedTracking) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/benefit-tracking/${selectedTracking.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    benefitName: editBenefitName,
                    requestedAmount: Number(editRequestedAmount),
                    notes: editNotes,
                }),
            });
            if (res.ok) {
                const json = await res.json();
                setTrackings((prev) => prev.map((t) => (t.id === selectedTracking.id ? json.data : t)));
                setFeedbackMessage(`แก้ไขรายการ ${selectedTracking.trackingNumber} เรียบร้อยแล้ว`);
                setEditModalOpen(false);
            } else {
                const err = await res.json();
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${err.error || res.statusText}`);
            }
        } catch {
            setFeedbackMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenDelete = (tracking: BenefitTrackingEntity) => {
        setDeleteTarget(tracking);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/benefit-tracking/${deleteTarget.id}`, { method: "DELETE" });
            if (res.ok) {
                setTrackings((prev) => prev.filter((t) => t.id !== deleteTarget.id));
                setFeedbackMessage(`ลบรายการ ${deleteTarget.trackingNumber} เรียบร้อยแล้ว`);
                setDeleteConfirmOpen(false);
                setDeleteTarget(null);
            } else {
                const err = await res.json();
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${err.error || res.statusText}`);
            }
        } catch {
            setFeedbackMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOpenCancel = (tracking: BenefitTrackingEntity) => {
        setCancelTarget(tracking);
        setCancelConfirmOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/benefit-tracking/${cancelTarget.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: BenefitTrackingStatus.CANCELLED, officerNotes: "ยกเลิกโดยผู้ดูแลระบบ" }),
            });
            if (res.ok) {
                const json = await res.json();
                setTrackings((prev) => prev.map((t) => (t.id === cancelTarget.id ? json.data : t)));
                setFeedbackMessage(`ยกเลิกรายการ ${cancelTarget.trackingNumber} เรียบร้อยแล้ว`);
                setCancelConfirmOpen(false);
                setCancelTarget(null);
            } else {
                const err = await res.json();
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${err.error || res.statusText}`);
            }
        } catch {
            setFeedbackMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsProcessing(false);
        }
    };

    const canEdit = ["SUPERADMIN", "ADMIN", "STAFF", "COMMANDER"].includes(userRole);
    const canDelete = ["SUPERADMIN", "ADMIN"].includes(userRole);
    const canCancel = ["SUPERADMIN", "ADMIN", "COMMANDER"].includes(userRole);

    const refreshData = async () => {
        try {
            const [trRes, ovRes] = await Promise.all([
                fetch("/api/benefit-tracking?take=100"),
                fetch("/api/benefit-tracking/estimates?limit=10"),
            ]);
            if (trRes.ok) {
                const json = await trRes.json();
                const fetched: BenefitTrackingEntity[] = json.data?.trackings || [];
                setTrackings(fetched);
                const computed = Object.values(BenefitTrackingStatus).reduce(
                    (acc, s) => ({ ...acc, [s]: 0 }),
                    {} as Record<BenefitTrackingStatus, number>
                );
                fetched.forEach((t) => {
                    computed[t.status] = (computed[t.status] || 0) + 1;
                });
                setCounts(computed);
            }
            if (ovRes.ok) {
                const json = await ovRes.json();
                setOverview(json.data || []);
            }
            if (onRefresh) onRefresh();
        } catch {
            // offline mode: keep current state
        }
    };

    const handlePropose = async (estimateId: string, programId: string | null, programName: string) => {
        setProposingKey(programId || estimateId);
        try {
            const res = await fetch("/api/benefit-tracking/propose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estimateId,
                    programIds: programId ? [programId] : undefined,
                }),
            });
            const json = await res.json();
            if (res.ok) {
                const trackingNumbers = (json.data?.trackingNumbers || []).join(", ");
                setFeedbackMessage(
                    `เสนอขอรับสิทธิ "${programName}" สำเร็จ แล้ว${trackingNumbers ? ` เลขติดตาม: ${trackingNumbers}` : ""}`
                );
                await refreshData();
            } else {
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${json.error || res.statusText}`);
            }
        } catch {
            setFeedbackMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setProposingKey(null);
        }
    };

    const summaryCards = [
        { status: BenefitTrackingStatus.PROPOSED, label: "เสนอขอรับสิทธิ", color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
        { status: BenefitTrackingStatus.PENDING, label: "รอดำเนินการ", color: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
        { status: BenefitTrackingStatus.UNDER_REVIEW, label: "ตรวจสอบเอกสาร", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
        { status: BenefitTrackingStatus.APPROVED, label: "อนุมัติแล้ว", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
        { status: BenefitTrackingStatus.DISBURSED, label: "โอนเงินแล้ว", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
        { status: BenefitTrackingStatus.RECEIVED, label: "ได้รับสิทธิแล้ว", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
        { status: BenefitTrackingStatus.REJECTED, label: "ไม่อนุมัติ", color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
    ];

    return (
        <div className="space-y-5">
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

            {/* Estimation Overview: เสนอขอรับสิทธิต่อจากผลประมาณการ (บูรณาการ) */}
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-sky-600" />
                        ผลประมาณการสิทธิและสวัสดิการ — เสนอขอรับสิทธิต่อ
                    </h3>
                    <span className="text-[11px] text-muted-foreground">
                        รายการที่ได้รับการพิจารณาประมาณการสิทธิแล้ว สามารถเสนอขอรับสิทธิต่อได้ทันที
                    </span>
                </div>
                {overview.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">
                        ยังไม่มีผลประมาณการสิทธิที่บันทึกไว้ — คำนวณประมาณการสิทธิได้จากเมนู "ประมาณการสิทธิ"
                    </p>
                ) : (
                    <div className="space-y-3">
                        {overview.map((item) => (
                            <div
                                key={item.estimate.id}
                                className="rounded-lg border border-sky-200 dark:border-sky-900 bg-card p-3 space-y-2"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">
                                            {item.estimate.estimateNumber || item.estimate.id}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {item.estimate.citizenName || item.estimate.citizenNationalId || "ไม่ระบุตัวตน"}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            อายุ {item.estimate.calculatedAge} ปี • ประมาณการเมื่อ {formatThaiDate(item.estimate.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                        <span>
                                            รายเดือน{" "}
                                            <b className="text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(item.estimate.totalMonthlyEstimate)}
                                            </b>
                                        </span>
                                        <span>
                                            เงินก้อน/สงเคราะห์{" "}
                                            <b className="text-amber-600 dark:text-amber-400">
                                                {formatCurrency(item.estimate.totalOneTimeEstimate)}
                                            </b>
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[11px] gap-1 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60"
                                            disabled={proposingKey === item.estimate.id}
                                            onClick={() => handlePropose(item.estimate.id, null, "ทุกรายการที่ผ่านเกณฑ์")}
                                        >
                                            <Send className="h-3 w-3" />
                                            {proposingKey === item.estimate.id ? "กำลังเสนอ..." : "เสนอขอทุกรายการคงเหลือ"}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.eligiblePrograms.map((program) => {
                                        const proposedTracking = item.trackings.find((t) => t.programId === program.programId);
                                        if (proposedTracking) {
                                            return (
                                                <Badge key={program.programId} variant="success" className="text-[11px] gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {program.programName} • {proposedTracking.trackingNumber}
                                                </Badge>
                                            );
                                        }
                                        return (
                                            <button
                                                key={program.programId}
                                                onClick={() => handlePropose(item.estimate.id, program.programId, program.programName)}
                                                disabled={proposingKey === program.programId}
                                                className="inline-flex items-center gap-1 rounded-full border border-sky-300 dark:border-sky-700 bg-white dark:bg-sky-950/40 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors disabled:opacity-50"
                                            >
                                                <Send className="h-3 w-3" />
                                                {proposingKey === program.programId ? "กำลังเสนอ..." : `เสนอขอ ${program.programName}`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {summaryCards.map((card) => {
                    const count = counts?.[card.status] ?? trackings.filter((t) => t.status === card.status).length;
                    const isActive = statusFilter === card.status;
                    return (
                        <button
                            key={card.status}
                            onClick={() => setStatusFilter(isActive ? "ALL" : card.status)}
                            className={`text-left rounded-xl border p-3 transition-all ${isActive
                                ? "ring-2 ring-emerald-500 border-emerald-500"
                                : "border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                                }`}
                        >
                            <div className={`text-[10px] font-bold uppercase tracking-wide ${card.color.split(" ")[1]}`}>{card.label}</div>
                            <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{count}</div>
                            <div className="text-[10px] text-muted-foreground">รายการ</div>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาเลขติดตาม, ชื่อผู้รับสิทธิ, เลขบัตร 13 หลัก, โครงการ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    {statusOptions.map((opt) => (
                        <Button
                            key={opt.key}
                            variant={statusFilter === opt.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(opt.key)}
                            className="text-xs whitespace-nowrap"
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tracking Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[130px]">เลขติดตาม</TableHead>
                            <TableHead>ผู้รับสิทธิ / โครงการ</TableHead>
                            <TableHead className="text-right">วงเงิน</TableHead>
                            <TableHead className="text-center">สถานะ</TableHead>
                            <TableHead>วันที่ยื่น / คาดว่าได้รับ</TableHead>
                            <TableHead className="text-right">การดำเนินการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTrackings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                                    ไม่พบรายการติดตามสถานะตามเงื่อนไข
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTrackings.map((tracking) => {
                                const statusInfo = getStatusConfig(tracking.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <TableRow key={tracking.id}>
                                        <TableCell className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                                            {tracking.trackingNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{tracking.citizenName}</p>
                                                <p className="text-[11px] text-muted-foreground font-mono">
                                                    {tracking.citizenNationalId ? formatNationalId(tracking.citizenNationalId) : "-"} • {tracking.citizenProvince}
                                                </p>
                                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{tracking.programName}</p>
                                                {tracking.sourceType === "ESTIMATE" && (
                                                    <p className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        จากประมาณการสิทธิ{tracking.estimateNumber ? ` ${tracking.estimateNumber}` : ""}
                                                    </p>
                                                )}
                                                {tracking.sourceType === "MANUAL" && (
                                                    <p className="text-[10px] text-slate-400 font-medium">บันทึกคำขอโดยเจ้าหน้าที่</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="space-y-0.5 text-xs">
                                                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(tracking.requestedAmount)}</p>
                                                {tracking.approvedAmount !== null && tracking.approvedAmount !== undefined && (
                                                    <p className="text-[11px] text-muted-foreground">อนุมัติ {formatCurrency(tracking.approvedAmount)}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={statusInfo.variant} className="text-[11px] gap-1">
                                                <StatusIcon className="h-3 w-3" />
                                                {statusInfo.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            <div className="space-y-0.5">
                                                <p>ยื่น {formatThaiDate(tracking.submissionDate)}</p>
                                                {tracking.expectedReceiveDate && (
                                                    <p className="text-amber-600 dark:text-amber-400">คาดรับ {formatThaiDate(tracking.expectedReceiveDate)}</p>
                                                )}
                                                {tracking.paymentReference && (
                                                    <p className="font-mono text-[10px]">Ref: {tracking.paymentReference}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenUpdate(tracking)}
                                                    className="text-xs h-8 px-2.5 gap-1"
                                                >
                                                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                                                    ติดตาม
                                                </Button>
                                                {canEdit && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenEdit(tracking)}
                                                        className="text-xs h-8 px-2 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                                                    >
                                                        <PencilLine className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canCancel && tracking.status !== BenefitTrackingStatus.CANCELLED && tracking.status !== BenefitTrackingStatus.RECEIVED && tracking.status !== BenefitTrackingStatus.DISBURSED && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenCancel(tracking)}
                                                        className="text-xs h-8 px-2 gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                {canDelete && tracking.status !== BenefitTrackingStatus.RECEIVED && tracking.status !== BenefitTrackingStatus.DISBURSED && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenDelete(tracking)}
                                                        className="text-xs h-8 px-2 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Update Status Modal */}
            <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                                {selectedTracking?.trackingNumber}
                            </span>
                            {selectedTracking && (
                                <Badge variant={getStatusConfig(selectedTracking.status).variant}>
                                    {getStatusConfig(selectedTracking.status).label}
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-lg font-bold">ติดตามและอัปเดตสถานะรายการสิทธิ</DialogTitle>
                        <DialogDescription className="text-xs">
                            บันทึกความคืบหน้าของรายการสิทธิประโยชน์และเงินสงเคราะห์
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTracking && (
                        <div className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block font-semibold">ผู้รับสิทธิ:</span>
                                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedTracking.citizenName}</p>
                                    <p className="font-mono text-slate-500">{selectedTracking.citizenNationalId}</p>
                                    <p className="text-slate-500">{selectedTracking.citizenProvince}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block font-semibold">รายการสิทธิ:</span>
                                    <p className="font-bold text-slate-900 dark:text-slate-100">{selectedTracking.benefitName}</p>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        วงเงินขอ: {formatCurrency(selectedTracking.requestedAmount)}
                                    </p>
                                    <p className="text-slate-500">{selectedTracking.programName}</p>
                                </div>
                            </div>

                            {/* Status Selector */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">อัปเดตสถานะ:</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                        BenefitTrackingStatus.PENDING,
                                        BenefitTrackingStatus.UNDER_REVIEW,
                                        BenefitTrackingStatus.APPROVED,
                                        BenefitTrackingStatus.DISBURSED,
                                        BenefitTrackingStatus.RECEIVED,
                                        BenefitTrackingStatus.REJECTED,
                                    ].map((statusKey) => {
                                        const cfg = statusConfig[statusKey];
                                        return (
                                            <button
                                                type="button"
                                                key={statusKey}
                                                onClick={() => setNewStatus(statusKey)}
                                                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${newStatus === statusKey
                                                    ? "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 font-bold shadow-xs"
                                                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                    }`}
                                            >
                                                {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Amount Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[BenefitTrackingStatus.APPROVED, BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus) && (
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
                                {[BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus) && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="disbursedAmount">วงเงินที่โอน (บาท)</Label>
                                        <Input
                                            id="disbursedAmount"
                                            type="number"
                                            value={disbursedAmount}
                                            onChange={(e) => setDisbursedAmount(Number(e.target.value))}
                                            className="font-bold text-blue-600"
                                        />
                                    </div>
                                )}
                            </div>

                            {[BenefitTrackingStatus.DISBURSED, BenefitTrackingStatus.RECEIVED].includes(newStatus) && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="paymentReference">เลขอ้างอิงการโอนเงิน / Payment Reference</Label>
                                    <Input
                                        id="paymentReference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="เช่น PAY-2569-0001"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="officerNotes">บันทึกเจ้าหน้าที่ / หมายเหตุ</Label>
                                <textarea
                                    id="officerNotes"
                                    rows={3}
                                    value={officerNotes}
                                    onChange={(e) => setOfficerNotes(e.target.value)}
                                    placeholder="ระบุรายละเอียดการติดตาม หรือเหตุผลการเปลี่ยนสถานะ..."
                                    className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUpdateModalOpen(false)}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={handleSubmitUpdate}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "กำลังบันทึก..." : "บันทึกสถานะการติดตาม"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <PencilLine className="h-5 w-5 text-blue-600" />
                            แก้ไขรายการติดตาม
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            เลขติดตาม: <span className="font-mono font-bold">{selectedTracking?.trackingNumber}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                            <Label htmlFor="editBenefitName">ชื่อสิทธิประโยชน์</Label>
                            <Input
                                id="editBenefitName"
                                value={editBenefitName}
                                onChange={(e) => setEditBenefitName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editRequestedAmount">วงเงินที่ขอ (บาท)</Label>
                            <Input
                                id="editRequestedAmount"
                                type="number"
                                value={editRequestedAmount}
                                onChange={(e) => setEditRequestedAmount(Number(e.target.value))}
                                className="font-bold text-emerald-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="editNotes">หมายเหตุ</Label>
                            <textarea
                                id="editNotes"
                                rows={3}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>ยกเลิก</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold" onClick={handleSubmitEdit} disabled={isProcessing}>
                            {isProcessing ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-700">
                            <Trash2 className="h-5 w-5" />
                            ยืนยันการลบรายการ
                        </DialogTitle>
                    </DialogHeader>
                    {deleteTarget && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                                <p className="font-bold text-rose-800 dark:text-rose-300">{deleteTarget.trackingNumber}</p>
                                <p className="text-rose-700 dark:text-rose-400">{deleteTarget.benefitName}</p>
                                <p className="text-muted-foreground">{deleteTarget.citizenName}</p>
                            </div>
                            <p className="text-muted-foreground">การลบไม่สามารถย้อนกลับได้ กรุณายืนยันการลบ</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isProcessing}>
                            {isProcessing ? "กำลังลบ..." : "ยืนยันลบรายการ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Modal */}
            <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-700">
                            <X className="h-5 w-5" />
                            ยืนยันการยกเลิกรายการ
                        </DialogTitle>
                    </DialogHeader>
                    {cancelTarget && (
                        <div className="space-y-3 py-2 text-xs">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                                <p className="font-bold text-amber-800 dark:text-amber-300">{cancelTarget.trackingNumber}</p>
                                <p className="text-amber-700 dark:text-amber-400">{cancelTarget.benefitName}</p>
                                <p className="text-muted-foreground">{cancelTarget.citizenName}</p>
                            </div>
                            <p className="text-muted-foreground">สถานะจะเปลี่ยนเป็น "ยกเลิก" และไม่สามารถดำเนินการต่อได้</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelConfirmOpen(false)}>ยกเลิก</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold" onClick={handleConfirmCancel} disabled={isProcessing}>
                            {isProcessing ? "กำลังยกเลิก..." : "ยืนยันยกเลิกรายการ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
