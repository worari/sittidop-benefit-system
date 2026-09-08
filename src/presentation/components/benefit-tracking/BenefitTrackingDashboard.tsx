"use client";

import React, { useState, useMemo, useEffect } from "react";
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
    PlusCircle,
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

interface ProgramOption {
    id: string;
    code: string;
    thaiName: string;
}

interface CreateTrackingPayload {
    citizenNationalId: string;
    programId: string;
    benefitName: string;
    requestedAmount: number;
    paymentMethod: string;
    bankName?: string;
    bankAccountNumber?: string;
    recipientName?: string;
    notes?: string;
    expectedReceiveDate?: string;
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

function parseDocumentList(documentsJson?: string | null): string[] {
    if (!documentsJson) return [];

    try {
        const parsed = JSON.parse(documentsJson);
        if (Array.isArray(parsed)) {
            return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
        if (typeof parsed === "string" && parsed.trim()) {
            return [parsed.trim()];
        }
    } catch {
        // fall through to plain string parsing below
    }

    return documentsJson
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildReviewTimeline(tracking: BenefitTrackingEntity | null) {
    if (!tracking) return [];

    const timeline = [
        { label: "ยื่นคำขอ", date: tracking.submissionDate, accent: "bg-sky-500" },
        { label: "ตรวจสอบเอกสาร", date: tracking.status === BenefitTrackingStatus.PENDING ? null : tracking.submissionDate, accent: "bg-amber-500" },
        { label: "อนุมัติ", date: tracking.approvalDate, accent: "bg-emerald-500" },
        { label: "โอนเงิน", date: tracking.disbursementDate, accent: "bg-blue-500" },
        { label: "ได้รับสิทธิ", date: tracking.receivedDate, accent: "bg-violet-500" },
        { label: "ปฏิเสธ / ยกเลิก", date: tracking.rejectionDate, accent: "bg-rose-500" },
    ].filter((item) => !!item.date);

    return timeline;
}

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

function isValidThaiNationalId(id: string): boolean {
    if (!/^\d{13}$/.test(id)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += Number(id[i]) * (13 - i);
    }

    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === Number(id[12]);
}

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
    const [debouncedSearch, setDebouncedSearch] = useState("");
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

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createCitizenNationalId, setCreateCitizenNationalId] = useState("");
    const [createProgramId, setCreateProgramId] = useState("");
    const [createBenefitName, setCreateBenefitName] = useState("");
    const [createRequestedAmount, setCreateRequestedAmount] = useState<number>(0);
    const [createExpectedReceiveDate, setCreateExpectedReceiveDate] = useState("");
    const [createRecipientName, setCreateRecipientName] = useState("");
    const [createBankName, setCreateBankName] = useState("");
    const [createBankAccountNumber, setCreateBankAccountNumber] = useState("");
    const [createNotes, setCreateNotes] = useState("");
    const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [createSubmitAttempted, setCreateSubmitAttempted] = useState(false);
    const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
    const [pendingCreatePayload, setPendingCreatePayload] = useState<CreateTrackingPayload | null>(null);

    const selectedDocumentList = useMemo(
        () => parseDocumentList(selectedTracking?.documentsJson),
        [selectedTracking]
    );
    const selectedReviewTimeline = useMemo(
        () => buildReviewTimeline(selectedTracking),
        [selectedTracking]
    );

    const filteredTrackings = useMemo(() => {
        return trackings.filter((t) => {
            const s = debouncedSearch.toLowerCase();
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
    }, [trackings, debouncedSearch, statusFilter]);

    const normalizedCreateNationalId = createCitizenNationalId.replace(/\D/g, "").slice(0, 13);
    const nationalIdValidationError = useMemo(() => {
        if (!createSubmitAttempted) return null;
        if (!normalizedCreateNationalId) return "กรุณากรอกเลขบัตรประชาชน 13 หลัก";
        if (!/^\d{13}$/.test(normalizedCreateNationalId)) return "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
        if (!isValidThaiNationalId(normalizedCreateNationalId)) return "เลขบัตรประชาชนไม่ถูกต้อง (checksum ไม่ผ่าน)";
        return null;
    }, [createSubmitAttempted, normalizedCreateNationalId]);

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
    const canDelete = ["SUPERADMIN", "ADMIN", "STAFF", "COMMANDER"].includes(userRole);
    const canCancel = ["SUPERADMIN", "ADMIN", "COMMANDER"].includes(userRole);
    const canCreate = ["SUPERADMIN", "ADMIN", "STAFF", "COMMANDER"].includes(userRole);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!createModalOpen || programOptions.length > 0) return;

        const fetchPrograms = async () => {
            setLoadingPrograms(true);
            try {
                const res = await fetch("/api/benefits?activeOnly=true");
                if (!res.ok) return;
                const json = await res.json();
                const data = Array.isArray(json.data) ? json.data : [];
                setProgramOptions(data);
            } catch {
                // ignore fetch errors in UI
            } finally {
                setLoadingPrograms(false);
            }
        };

        fetchPrograms();
    }, [createModalOpen, programOptions.length]);

    useEffect(() => {
        if (!createProgramId) return;
        const selectedProgram = programOptions.find((p) => p.id === createProgramId);
        if (selectedProgram && !createBenefitName.trim()) {
            setCreateBenefitName(selectedProgram.thaiName);
        }
    }, [createProgramId, createBenefitName, programOptions]);

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

    const resetCreateForm = () => {
        setCreateCitizenNationalId("");
        setCreateProgramId("");
        setCreateBenefitName("");
        setCreateRequestedAmount(0);
        setCreateExpectedReceiveDate("");
        setCreateRecipientName("");
        setCreateBankName("");
        setCreateBankAccountNumber("");
        setCreateNotes("");
        setCreateSubmitAttempted(false);
        setCreateConfirmOpen(false);
        setPendingCreatePayload(null);
    };

    const buildCreatePayload = (): CreateTrackingPayload => ({
        citizenNationalId: normalizedCreateNationalId,
        programId: createProgramId,
        benefitName: createBenefitName.trim(),
        requestedAmount: Number(createRequestedAmount),
        paymentMethod: "โอนเงินผ่านบัญชีธนาคาร",
        bankName: createBankName.trim() || undefined,
        bankAccountNumber: createBankAccountNumber.trim() || undefined,
        recipientName: createRecipientName.trim() || undefined,
        notes: createNotes.trim() || undefined,
        expectedReceiveDate: createExpectedReceiveDate || undefined,
    });

    const handleOpenCreateConfirm = () => {
        setCreateSubmitAttempted(true);

        if (
            !normalizedCreateNationalId ||
            !createProgramId ||
            !createBenefitName.trim() ||
            createRequestedAmount <= 0
        ) {
            setFeedbackMessage("กรอกข้อมูลเพิ่มรายการให้ครบ: เลขบัตรประชาชน, โครงการ, ชื่อสิทธิ, และวงเงินที่ขอ");
            return;
        }

        if (!/^\d{13}$/.test(normalizedCreateNationalId) || !isValidThaiNationalId(normalizedCreateNationalId)) {
            setFeedbackMessage("เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
            return;
        }

        setPendingCreatePayload(buildCreatePayload());
        setCreateConfirmOpen(true);
    };

    const handleSubmitCreate = async () => {
        if (!pendingCreatePayload) {
            setFeedbackMessage("ไม่พบข้อมูลสำหรับบันทึกรายการ กรุณาตรวจสอบข้อมูลอีกครั้ง");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch("/api/benefit-tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pendingCreatePayload),
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setFeedbackMessage(`เพิ่มรายการติดตาม ${json.data?.trackingNumber || "ใหม่"} เรียบร้อยแล้ว`);
                setCreateConfirmOpen(false);
                setCreateModalOpen(false);
                resetCreateForm();
                await refreshData();
            } else {
                setFeedbackMessage(`เกิดข้อผิดพลาด: ${json.error || res.statusText}`);
            }
        } catch {
            setFeedbackMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsProcessing(false);
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
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="relative w-full lg:max-w-2xl">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="ค้นหาเลขติดตาม, ชื่อผู้รับสิทธิ, เลขบัตร 13 หลัก, โครงการ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-10 h-10 text-sm"
                    />
                    {search.trim().length > 0 && (
                        <button
                            type="button"
                            aria-label="ล้างคำค้นหา"
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {canCreate && (
                        <Button
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                            className="h-9 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                        >
                            <PlusCircle className="h-4 w-4" />
                            เพิ่มรายการติดตาม
                        </Button>
                    )}

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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">เอกสารที่ต้องยื่น</Label>
                                    {selectedDocumentList.length > 0 ? (
                                        <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                                            {selectedDocumentList.map((doc, index) => (
                                                <li key={`${doc}-${index}`} className="flex items-start gap-2">
                                                    <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                                                    <span>{doc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">ยังไม่มีข้อมูลเอกสารที่ต้องยื่นสำหรับรายการนี้</p>
                                    )}
                                </div>

                                <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">ประวัติการตรวจสอบ</Label>
                                    {selectedReviewTimeline.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedReviewTimeline.map((item) => (
                                                <div key={item.label} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                                                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.accent}`} />
                                                    <div>
                                                        <p className="font-semibold">{item.label}</p>
                                                        <p className="text-muted-foreground">{formatThaiDate(item.date)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">ยังไม่มีประวัติการเปลี่ยนสถานะสำหรับรายการนี้</p>
                                    )}
                                </div>
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

            {/* Create Tracking Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700">
                            <PlusCircle className="h-5 w-5" />
                            เพิ่มรายการติดตามสถานะสิทธิและเงินสงเคราะห์
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            เพิ่มคำขอติดตามแบบ Manual เพื่อให้ระบบติดตามสถานะได้ครบตั้งแต่รอดำเนินการจนถึงโอนเงิน
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="createCitizenNationalId">เลขบัตรประชาชนผู้รับสิทธิ (13 หลัก)</Label>
                                <Input
                                    id="createCitizenNationalId"
                                    placeholder="110xxxxxxxxxx"
                                    value={createCitizenNationalId}
                                    onChange={(e) => setCreateCitizenNationalId(e.target.value.replace(/\D/g, "").slice(0, 13))}
                                    maxLength={13}
                                    className={nationalIdValidationError ? "border-rose-400 focus-visible:ring-rose-500" : ""}
                                />
                                {nationalIdValidationError && (
                                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{nationalIdValidationError}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createProgramId">โครงการสิทธิประโยชน์</Label>
                                <select
                                    id="createProgramId"
                                    value={createProgramId}
                                    onChange={(e) => setCreateProgramId(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                                >
                                    <option value="">{loadingPrograms ? "กำลังโหลดโครงการ..." : "-- เลือกโครงการ --"}</option>
                                    {programOptions.map((program) => (
                                        <option key={program.id} value={program.id}>
                                            {program.code} - {program.thaiName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="createBenefitName">ชื่อสิทธิประโยชน์</Label>
                                <Input
                                    id="createBenefitName"
                                    value={createBenefitName}
                                    onChange={(e) => setCreateBenefitName(e.target.value)}
                                    placeholder="เช่น เงินช่วยเหลือครอบครัวผู้เสียชีวิต"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createRequestedAmount">วงเงินที่ขอ (บาท)</Label>
                                <Input
                                    id="createRequestedAmount"
                                    type="number"
                                    min={0}
                                    value={createRequestedAmount}
                                    onChange={(e) => setCreateRequestedAmount(Number(e.target.value))}
                                    className="font-bold text-emerald-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="createExpectedReceiveDate">วันที่คาดว่าจะได้รับ</Label>
                                <Input
                                    id="createExpectedReceiveDate"
                                    type="date"
                                    value={createExpectedReceiveDate}
                                    onChange={(e) => setCreateExpectedReceiveDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createRecipientName">ชื่อผู้รับเงิน</Label>
                                <Input
                                    id="createRecipientName"
                                    value={createRecipientName}
                                    onChange={(e) => setCreateRecipientName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="createBankName">ธนาคาร</Label>
                                <Input
                                    id="createBankName"
                                    value={createBankName}
                                    onChange={(e) => setCreateBankName(e.target.value)}
                                    placeholder="เช่น ธนาคารกรุงไทย"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="createBankAccountNumber">เลขบัญชี</Label>
                                <Input
                                    id="createBankAccountNumber"
                                    value={createBankAccountNumber}
                                    onChange={(e) => setCreateBankAccountNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="createNotes">หมายเหตุ</Label>
                            <textarea
                                id="createNotes"
                                rows={3}
                                value={createNotes}
                                onChange={(e) => setCreateNotes(e.target.value)}
                                placeholder="รายละเอียดเพิ่มเติมของคำขอ..."
                                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCreateModalOpen(false);
                                resetCreateForm();
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={handleOpenCreateConfirm}
                            disabled={isProcessing}
                        >
                            ตรวจสอบก่อนบันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={createConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-emerald-700">ยืนยันการเพิ่มรายการติดตาม</DialogTitle>
                        <DialogDescription className="text-xs">
                            ตรวจสอบข้อมูลก่อนบันทึกเข้าระบบจริง
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 text-xs rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-3">
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">เลขบัตรประชาชน</span>
                            <span className="font-mono font-semibold">{normalizedCreateNationalId}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">โครงการ</span>
                            <span className="font-semibold text-right">
                                {programOptions.find((p) => p.id === createProgramId)?.thaiName || "-"}
                            </span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">ชื่อสิทธิ</span>
                            <span className="font-semibold text-right">{createBenefitName || "-"}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">วงเงินที่ขอ</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(createRequestedAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                            <span className="text-muted-foreground">วันที่คาดว่าจะได้รับ</span>
                            <span className="font-semibold">{createExpectedReceiveDate ? formatThaiDate(createExpectedReceiveDate) : "-"}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateConfirmOpen(false)}>
                            กลับไปแก้ไข
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            onClick={handleSubmitCreate}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}
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
