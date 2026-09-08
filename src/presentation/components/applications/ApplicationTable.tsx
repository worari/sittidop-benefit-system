"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApplicationEntity } from "../../../core/domain/entities/Application";
import { ApplicationStatus, ApprovalDecision } from "../../../core/domain/value-objects/enums";
import { formatThaiDateTime, formatNationalId } from "../../lib/utils";
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
import { Progress } from "../ui/progress";
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
  X,
  Eye,
  Trash2,
  PencilLine,
  Plus,
  Workflow,
  ShieldCheck,
} from "lucide-react";

type UploadFileItem = {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  uploadedAt: string;
  stage: "REQUEST" | "REVIEW";
  uploadedBy?: string;
};

type WorkflowNote = {
  status: ApplicationStatus;
  reason?: string;
  by?: string;
  createdAt: string;
};

type ApplicationDocuments = {
  requestFiles: UploadFileItem[];
  reviewFiles: UploadFileItem[];
  workflowNotes: WorkflowNote[];
};

interface ProgramItem {
  id: string;
  thaiName: string;
  description?: string | null;
}

interface CitizenItem {
  id: string;
  title?: string;
  firstName: string;
  lastName: string;
  nationalId?: string;
  province?: string;
}

interface ApplicationTableProps {
  initialApplications: ApplicationEntity[];
  userRole?: string;
  onRefresh?: () => void;
}

const EMPTY_DOCS: ApplicationDocuments = {
  requestFiles: [],
  reviewFiles: [],
  workflowNotes: [],
};

const statusMeta: Record<ApplicationStatus, { label: string; percent: number; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
  [ApplicationStatus.DRAFT]: { label: "ร่างคำขอ", percent: 0, variant: "secondary" },
  [ApplicationStatus.SUBMITTED]: { label: "รับเรื่อง", percent: 20, variant: "info" },
  [ApplicationStatus.UNDER_REVIEW]: { label: "กำลังพิจารณา", percent: 55, variant: "warning" },
  [ApplicationStatus.DOCUMENT_VERIFIED]: { label: "ส่งกลับแก้ไข", percent: 70, variant: "purple" },
  [ApplicationStatus.APPROVED]: { label: "อนุมัติ", percent: 100, variant: "success" },
  [ApplicationStatus.REJECTED]: { label: "ไม่อนุมัติ", percent: 100, variant: "destructive" },
  [ApplicationStatus.DISBURSED]: { label: "ดำเนินการเสร็จสิ้น", percent: 100, variant: "success" },
};

function parseDocumentsJson(documentsJson?: string | null): ApplicationDocuments {
  if (!documentsJson) return EMPTY_DOCS;

  try {
    const parsed = JSON.parse(documentsJson);

    if (Array.isArray(parsed)) {
      const requestFiles = parsed.map((item: any) => ({
        name: item.name || "document",
        type: item.type || "application/octet-stream",
        size: Number(item.size || 0),
        dataUrl: item.dataUrl,
        uploadedAt: item.uploadedAt || new Date().toISOString(),
        stage: "REQUEST" as const,
        uploadedBy: item.uploadedBy || "ผู้ยื่นคำขอ",
      }));
      return { ...EMPTY_DOCS, requestFiles };
    }

    return {
      requestFiles: Array.isArray(parsed.requestFiles) ? parsed.requestFiles : [],
      reviewFiles: Array.isArray(parsed.reviewFiles) ? parsed.reviewFiles : [],
      workflowNotes: Array.isArray(parsed.workflowNotes) ? parsed.workflowNotes : [],
    };
  } catch {
    return EMPTY_DOCS;
  }
}

async function filesToPayload(files: FileList | null, stage: "REQUEST" | "REVIEW", uploadedBy: string): Promise<UploadFileItem[]> {
  if (!files || files.length === 0) return [];

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const maxSizeBytes = 5 * 1024 * 1024;
  const result: UploadFileItem[] = [];

  for (const file of Array.from(files)) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`ไฟล์ ${file.name} ไม่รองรับ (รองรับเฉพาะ PDF/JPG/PNG)`);
    }
    if (file.size > maxSizeBytes) {
      throw new Error(`ไฟล์ ${file.name} มีขนาดเกิน 5MB`);
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    result.push({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      uploadedAt: new Date().toISOString(),
      stage,
      uploadedBy,
    });
  }

  return result;
}

function mergeDocuments(base: ApplicationDocuments, extra: Partial<ApplicationDocuments>): ApplicationDocuments {
  return {
    requestFiles: extra.requestFiles ?? base.requestFiles,
    reviewFiles: extra.reviewFiles ?? base.reviewFiles,
    workflowNotes: extra.workflowNotes ?? base.workflowNotes,
  };
}

export function ApplicationTable({ initialApplications, userRole = "OFFICER", onRefresh }: ApplicationTableProps) {
  const [applications, setApplications] = useState<ApplicationEntity[]>(initialApplications);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [citizens, setCitizens] = useState<CitizenItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [citizenId, setCitizenId] = useState("");
  const [programId, setProgramId] = useState("");
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [applicantRemarks, setApplicantRemarks] = useState("");
  const [requestFiles, setRequestFiles] = useState<UploadFileItem[]>([]);

  const [selectedApp, setSelectedApp] = useState<ApplicationEntity | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decision, setDecision] = useState<ApprovalDecision>(ApprovalDecision.FORWARD);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [officerNotes, setOfficerNotes] = useState<string>("");
  const [reviewFiles, setReviewFiles] = useState<UploadFileItem[]>([]);

  const [previewFile, setPreviewFile] = useState<UploadFileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const canManage = !["READONLY", "AUDITOR"].includes(String(userRole || "").toUpperCase());
  const canReview = ["SUPERADMIN", "ADMIN", "COMMANDER", "STAFF", "OFFICER"].includes(String(userRole || "").toUpperCase());

  const selectedProgram = useMemo(() => programs.find((p) => p.id === programId) || null, [programId, programs]);

  const filteredApps = useMemo(() => {
    const s = search.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch = !s || [
        app.applicationNumber,
        app.citizenName,
        app.citizenNationalId,
        app.citizenProvince,
        app.programName,
        app.reviewerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s);

      const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const refreshApplications = async () => {
    const res = await fetch("/api/applications");
    const json = await res.json();
    if (json.success) {
      setApplications(json.data || []);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/benefits?activeOnly=true").then((r) => r.json()),
      fetch("/api/citizens").then((r) => r.json()),
    ])
      .then(([benefitsJson, citizensJson]) => {
        if (benefitsJson.success) setPrograms(benefitsJson.data || []);
        if (citizensJson.success) setCitizens(citizensJson.data || []);
      })
      .catch(() => {
        setFeedbackMessage({ type: "error", text: "โหลดข้อมูลเริ่มต้นไม่สำเร็จ" });
      });
  }, []);

  const resetSubmitForm = () => {
    setEditId(null);
    setCitizenId("");
    setProgramId("");
    setRequestedAmount(0);
    setApplicantRemarks("");
    setRequestFiles([]);
  };

  const openCreate = () => {
    resetSubmitForm();
    setSubmitModalOpen(true);
  };

  const openEdit = (app: ApplicationEntity) => {
    if (app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.DISBURSED) {
      setFeedbackMessage({ type: "error", text: "คำขอนี้ไม่สามารถแก้ไขได้ เนื่องจากอยู่สถานะอนุมัติ/เสร็จสิ้น" });
      return;
    }

    setEditId(app.id);
    setCitizenId(app.citizenId);
    setProgramId(app.programId);
    setRequestedAmount(app.requestedAmount);
    setApplicantRemarks(app.applicantRemarks || "");
    setRequestFiles(parseDocumentsJson(app.documentsJson).requestFiles);
    setSubmitModalOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!citizenId || !programId || requestedAmount <= 0) {
      setFeedbackMessage({ type: "error", text: "กรุณาระบุผู้ยื่นคำขอ รายการสิทธิ และวงเงินที่ขอให้ครบ" });
      return;
    }

    setIsProcessing(true);
    try {
      const payloadDocs: ApplicationDocuments = mergeDocuments(EMPTY_DOCS, {
        requestFiles,
      });

      const body = {
        citizenId,
        programId,
        requestedAmount,
        applicantRemarks,
        documents: payloadDocs,
      };

      const res = await fetch(editId ? `/api/applications/${editId}` : "/api/applications", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกคำขอไม่สำเร็จ");
      }

      setFeedbackMessage({
        type: "success",
        text: editId ? "อัปเดตคำขอรับสิทธิสำเร็จ" : "ยื่นคำขอรับสิทธิออนไลน์สำเร็จ",
      });

      setSubmitModalOpen(false);
      resetSubmitForm();
      await refreshApplications();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setFeedbackMessage({ type: "error", text: error.message || "บันทึกคำขอไม่สำเร็จ" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteApplication = async (app: ApplicationEntity) => {
    if (!(window.confirm(`ยืนยันการลบคำขอ ${app.applicationNumber} ใช่หรือไม่?`))) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "ลบคำขอไม่สำเร็จ");
      }

      setFeedbackMessage({ type: "success", text: `ลบคำขอ ${app.applicationNumber} เรียบร้อยแล้ว` });
      await refreshApplications();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setFeedbackMessage({ type: "error", text: error.message || "ลบคำขอไม่สำเร็จ" });
    } finally {
      setIsProcessing(false);
    }
  };

  const openReview = (app: ApplicationEntity) => {
    setSelectedApp(app);
    setDecision(ApprovalDecision.FORWARD);
    setApprovedAmount(app.approvedAmount || app.requestedAmount || 0);
    setOfficerNotes(app.officerNotes || "");
    setReviewFiles([]);
    setReviewModalOpen(true);
  };

  const handleReview = async () => {
    if (!selectedApp) return;

    setIsProcessing(true);
    try {
      const existingDocs = parseDocumentsJson(selectedApp.documentsJson);
      const nextStatus =
        decision === ApprovalDecision.APPROVE
          ? ApplicationStatus.APPROVED
          : decision === ApprovalDecision.REJECT
            ? ApplicationStatus.REJECTED
            : decision === ApprovalDecision.REQUEST_DOCUMENTS
              ? ApplicationStatus.DOCUMENT_VERIFIED
              : ApplicationStatus.UNDER_REVIEW;

      const notes = [
        ...existingDocs.workflowNotes,
        {
          status: nextStatus,
          reason: officerNotes || undefined,
          by: "เจ้าหน้าที่ผู้พิจารณา",
          createdAt: new Date().toISOString(),
        },
      ];

      const docsPayload = mergeDocuments(existingDocs, {
        reviewFiles: [...existingDocs.reviewFiles, ...reviewFiles],
        workflowNotes: notes,
      });

      const res = await fetch(`/api/applications/${selectedApp.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes: officerNotes,
          approvedAmount: decision === ApprovalDecision.APPROVE ? Number(approvedAmount) : null,
          documents: docsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกผลการพิจารณาไม่สำเร็จ");
      }

      setReviewModalOpen(false);
      setFeedbackMessage({ type: "success", text: `อัปเดตสถานะคำขอ ${selectedApp.applicationNumber} เรียบร้อย` });
      await refreshApplications();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      setFeedbackMessage({ type: "error", text: error.message || "บันทึกผลการพิจารณาไม่สำเร็จ" });
    } finally {
      setIsProcessing(false);
    }
  };

  const workflowSteps = (app: ApplicationEntity) => {
    const docs = parseDocumentsJson(app.documentsJson);
    const notesByStatus = new Map<ApplicationStatus, WorkflowNote>();
    docs.workflowNotes.forEach((n) => notesByStatus.set(n.status, n));

    const stepOrder: { status: ApplicationStatus; title: string }[] = [
      { status: ApplicationStatus.SUBMITTED, title: "รับเรื่อง" },
      { status: ApplicationStatus.UNDER_REVIEW, title: "กำลังพิจารณา" },
      { status: ApplicationStatus.DOCUMENT_VERIFIED, title: "ส่งกลับแก้ไข" },
      { status: ApplicationStatus.APPROVED, title: "อนุมัติ" },
      { status: ApplicationStatus.REJECTED, title: "ไม่อนุมัติ" },
    ];

    return stepOrder.map((s) => {
      const meta = statusMeta[s.status];
      const done = meta.percent <= statusMeta[app.status].percent;
      const note = notesByStatus.get(s.status);
      return {
        title: s.title,
        done,
        status: s.status,
        reason: note?.reason,
        at: note?.createdAt,
      };
    });
  };

  const allDocsForApp = (app: ApplicationEntity) => {
    const parsed = parseDocumentsJson(app.documentsJson);
    return [...parsed.requestFiles, ...parsed.reviewFiles];
  };

  return (
    <div className="space-y-4">
      {feedbackMessage && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${feedbackMessage.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">ช่องทางยื่นคำขอสิทธิและสวัสดิการออนไลน์</h3>
            <p className="text-xs text-muted-foreground">ผู้มีสิทธิ์สามารถยื่นคำขอ แนบไฟล์ดิจิทัล และติดตามสถานะแบบ workflow ได้ในหน้าจอเดียว</p>
          </div>
          {canManage && (
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              ยื่นคำขอใหม่
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขคำขอ, ชื่อผู้มีสิทธิ์, เลขบัตร, รายการสวัสดิการ, ผู้พิจารณา"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">สถานะ:</span>
            {["ALL", ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.DOCUMENT_VERIFIED, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].map((statusKey) => (
              <Button
                key={statusKey}
                variant={statusFilter === statusKey ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusKey)}
                className="text-xs whitespace-nowrap"
              >
                {statusKey === "ALL" ? "ทั้งหมด" : statusMeta[statusKey as ApplicationStatus]?.label || statusKey}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">เลขที่คำขอ</TableHead>
              <TableHead>ผู้มีสิทธิ์</TableHead>
              <TableHead>รายการสิทธิ/สวัสดิการ</TableHead>
              <TableHead>วันที่ยื่น</TableHead>
              <TableHead>ผู้พิจารณา</TableHead>
              <TableHead>เอกสาร</TableHead>
              <TableHead>สถานะและความคืบหน้า</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                  ไม่พบรายการคำขอตามเงื่อนไขการค้นหา
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => {
                const docs = allDocsForApp(app);
                const status = statusMeta[app.status] || statusMeta[ApplicationStatus.SUBMITTED];
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {app.applicationNumber}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{app.citizenName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {app.citizenNationalId ? formatNationalId(app.citizenNationalId) : "-"} • {app.citizenProvince || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{app.programName}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2">{app.programDescription || "-"}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatThaiDateTime(app.submissionDate)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold">{app.reviewerName || app.assignedOfficerName || "ยังไม่ระบุ"}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{docs.length} ไฟล์</Badge>
                        {docs.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => {
                              setPreviewFile(docs[0]);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            ดูตัวอย่าง
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <Badge variant={status.variant} className="text-[11px]">{status.label}</Badge>
                          <span className="text-[11px] font-semibold text-slate-600">{status.percent}%</span>
                        </div>
                        <Progress value={status.percent} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setSelectedApp(app)}>
                          <Workflow className="h-3.5 w-3.5" />
                        </Button>
                        {canManage && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => openEdit(app)}>
                              <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-rose-600"
                              onClick={() => handleDeleteApplication(app)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {canReview && (
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => openReview(app)}>
                            <ShieldCheck className="h-3.5 w-3.5" />
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

      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editId ? "แก้ไขคำขอรับสิทธิ" : "ยื่นคำขอรับสิทธิ/สวัสดิการออนไลน์"}</DialogTitle>
            <DialogDescription className="text-xs">
              แนบไฟล์ดิจิทัลได้เฉพาะ .PDF, .JPG, .PNG และสามารถกลับมาตรวจสอบเอกสารก่อนส่งคำขอ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ผู้มีสิทธิ์ยื่นคำขอ</Label>
                <select
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">-- เลือกผู้มีสิทธิ์ --</option>
                  {citizens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.title || "") + c.firstName} {c.lastName} ({c.nationalId || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>วงเงินที่ขอ (บาท)</Label>
                <Input
                  type="number"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value || 0))}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>ชื่อรายการสิทธิและสวัสดิการกำลังพล</Label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">-- เลือกรายการสิทธิ/สวัสดิการ --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.thaiName}</option>
                  ))}
                </select>
                {selectedProgram?.description && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 p-2 text-[11px]">
                    รายละเอียดสิทธิ: {selectedProgram.description}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>หมายเหตุประกอบคำขอ</Label>
                <textarea
                  rows={3}
                  value={applicantRemarks}
                  onChange={(e) => setApplicantRemarks(e.target.value)}
                  placeholder="บันทึกรายละเอียดเหตุผลของคำขอ"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>แนบเอกสารคำขอ (PDF/JPG/PNG)</Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={async (e) => {
                    try {
                      const files = await filesToPayload(e.target.files, "REQUEST", "ผู้ยื่นคำขอ");
                      setRequestFiles((prev) => [...prev, ...files]);
                    } catch (error: any) {
                      setFeedbackMessage({ type: "error", text: error.message || "แนบไฟล์ไม่สำเร็จ" });
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
                <div className="space-y-1">
                  {requestFiles.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
                  ) : (
                    requestFiles.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                        <span className="truncate pr-2">{f.name}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => { setPreviewFile(f); setPreviewOpen(true); }}>
                            ดู
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] text-rose-600"
                            onClick={() => setRequestFiles((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            ลบ
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmitApplication} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isProcessing ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "ยื่นคำขอออนไลน์"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reviewModalOpen}
        onOpenChange={(open) => {
          setReviewModalOpen(open);
          if (!open) {
            setSelectedApp(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Workflow พิจารณาคำขอ</DialogTitle>
            <DialogDescription className="text-xs">รับเรื่อง / กำลังพิจารณา / ส่งกลับแก้ไข / อนุมัติ / ไม่อนุมัติ</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border p-3 bg-slate-50 dark:bg-slate-900">
                <div className="font-mono font-bold text-emerald-600">{selectedApp.applicationNumber}</div>
                <div className="font-semibold">{selectedApp.citizenName} • {selectedApp.programName}</div>
                <div className="text-muted-foreground">ยื่นเมื่อ: {formatThaiDateTime(selectedApp.submissionDate)}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: ApprovalDecision.FORWARD, label: "กำลังพิจารณา" },
                  { key: ApprovalDecision.REQUEST_DOCUMENTS, label: "ส่งกลับแก้ไข" },
                  { key: ApprovalDecision.APPROVE, label: "อนุมัติ" },
                  { key: ApprovalDecision.REJECT, label: "ไม่อนุมัติ" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setDecision(item.key)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold ${decision === item.key ? "bg-emerald-50 border-emerald-400 text-emerald-800" : "border-slate-200 text-slate-600"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {decision === ApprovalDecision.APPROVE && (
                <div className="space-y-1.5">
                  <Label>วงเงินที่อนุมัติ (บาท)</Label>
                  <Input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(Number(e.target.value || 0))} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>หมายเหตุ/เหตุผลการพิจารณา</Label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label>แนบเอกสารประกอบการพิจารณา (PDF/JPG/PNG)</Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={async (e) => {
                    try {
                      const files = await filesToPayload(e.target.files, "REVIEW", "เจ้าหน้าที่ผู้พิจารณา");
                      setReviewFiles((prev) => [...prev, ...files]);
                    } catch (error: any) {
                      setFeedbackMessage({ type: "error", text: error.message || "แนบไฟล์ไม่สำเร็จ" });
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
                <div className="space-y-1">
                  {reviewFiles.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                      <span className="truncate pr-2">{f.name}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => { setPreviewFile(f); setPreviewOpen(true); }}>
                          ดู
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] text-rose-600"
                          onClick={() => setReviewFiles((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          ลบ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleReview} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isProcessing ? "กำลังบันทึก..." : "บันทึกผลพิจารณา"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApp && !reviewModalOpen} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">ขั้นตอนพร้อมสถานะคำขอ</DialogTitle>
            <DialogDescription className="text-xs">แสดงสถานะ workflow และเหตุผลในแต่ละขั้นตอนการดำเนินการ</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border p-3 bg-slate-50 dark:bg-slate-900">
                <div className="font-mono font-bold text-emerald-600">{selectedApp.applicationNumber}</div>
                <div>{selectedApp.citizenName} • {selectedApp.programName}</div>
                <div className="text-muted-foreground">ผู้ตรวจสอบล่าสุด: {selectedApp.reviewerName || "ยังไม่ระบุ"}</div>
              </div>

              <div className="space-y-2">
                {workflowSteps(selectedApp).map((step) => (
                  <div key={step.status} className={`rounded-lg border px-3 py-2 ${step.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{step.title}</div>
                      <Badge variant={step.done ? "success" : "outline"}>{step.done ? "ดำเนินการแล้ว" : "รอดำเนินการ"}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {step.at ? `อัปเดตเมื่อ ${formatThaiDateTime(new Date(step.at))}` : "ยังไม่มีบันทึกเวลา"}
                    </div>
                    {step.reason && <div className="text-[11px] mt-1">เหตุผล: {step.reason}</div>}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="font-semibold">เอกสารแนบทั้งหมด</div>
                {allDocsForApp(selectedApp).length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">ยังไม่มีเอกสารแนบ</div>
                ) : (
                  allDocsForApp(selectedApp).map((d, i) => (
                    <div key={`${d.name}-${i}`} className="flex items-center justify-between rounded-md border px-2 py-1 text-[11px]">
                      <span className="truncate pr-2">{d.name}</span>
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => { setPreviewFile(d); setPreviewOpen(true); }}>
                        ดูตัวอย่าง
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">ตัวอย่างเอกสารแนบ</DialogTitle>
            <DialogDescription className="text-xs">{previewFile?.name || ""}</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-2 min-h-[360px]">
            {!previewFile?.dataUrl ? (
              <div className="h-[360px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
                ไฟล์นี้ไม่มีข้อมูล preview ในระบบ (อาจเป็นข้อมูลเก่าที่เก็บเฉพาะชื่อไฟล์)
              </div>
            ) : previewFile.type === "application/pdf" ? (
              <iframe title="pdf-preview" src={previewFile.dataUrl} className="w-full h-[520px] rounded-md bg-white" />
            ) : (
              <img src={previewFile.dataUrl} alt={previewFile.name} className="w-full max-h-[520px] object-contain rounded-md bg-white" />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>ปิดตัวอย่าง</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
