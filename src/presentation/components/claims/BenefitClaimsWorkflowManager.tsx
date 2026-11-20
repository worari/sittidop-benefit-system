"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileCheck,
  Send,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Banknote,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Eye,
  FileText,
  Upload,
  User,
  Users2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  CheckSquare,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Building,
  Sparkles,
} from "lucide-react";
import {
  BenefitClaimRecord,
  ClaimStage,
  ClaimStatus,
  ClaimDocumentItem,
  ClaimHeirDisbursementItem,
  INITIAL_REQUIRED_DOCUMENTS,
} from "@/infrastructure/database/repositories/ClaimStoreManager";
import { formatCurrency, formatThaiDate } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
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

interface BenefitClaimsWorkflowManagerProps {
  initialClaims?: BenefitClaimRecord[];
  userRole?: string;
}

export function BenefitClaimsWorkflowManager({
  initialClaims = [],
  userRole = "OFFICER",
}: BenefitClaimsWorkflowManagerProps) {
  const [claims, setClaims] = useState<BenefitClaimRecord[]>(initialClaims);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected claim for view/action dialogs
  const [selectedClaim, setSelectedClaim] = useState<BenefitClaimRecord | null>(null);

  // Dialog States
  const [openNewClaimModal, setOpenNewClaimModal] = useState(false);
  const [openDopVerifyModal, setOpenDopVerifyModal] = useState(false);
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [openDisbursementModal, setOpenDisbursementModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  // New Claim Form State (Step 1)
  const [formPersonnelName, setFormPersonnelName] = useState("พ.ท. วีรชาติ ภักดีสยาม");
  const [formPersonnelRank, setFormPersonnelRank] = useState("พ.ท.");
  const [formMilitaryId, setFormMilitaryId] = useState("MIL-49021884");
  const [formCitizenId, setFormCitizenId] = useState("3100600492811");
  const [formSubmittingUnit, setFormSubmittingUnit] = useState("ร.19 พัน.1 (พล.ร.9)");
  const [formSubmittingOfficer, setFormSubmittingOfficer] = useState("ร.อ. ภาคภูมิ กล้าหาญ");
  const [formOfficerPosition, setFormOfficerPosition] = useState("นายทหารฝ่ายกำลังพล");
  const [formIncidentDate, setFormIncidentDate] = useState("2026-03-01");
  const [formDelayExplanation, setFormDelayExplanation] = useState("");
  const [formLumpSum, setFormLumpSum] = useState(4250000);
  const [formMonthly, setFormMonthly] = useState(38500);
  const [formScholarship, setFormScholarship] = useState(60000);
  const [formNonMonetary, setFormNonMonetary] = useState("สิทธิบรรจุทายาททดแทน 1 อัตรา");
  
  // Document attachments state for form
  const [newClaimDocs, setNewClaimDocs] = useState<ClaimDocumentItem[]>(() =>
    INITIAL_REQUIRED_DOCUMENTS.map((doc, idx) => ({
      id: `doc-init-${idx}`,
      ...doc,
      status: "ATTACHED",
      fileName: `${doc.code.toLowerCase()}_สำเนาพร้อมรับรอง.pdf`,
      fileSizeBytes: 1024 * 350,
      uploadedAt: new Date().toISOString(),
      uploadedByStage: "UNIT_SUBMISSION",
    }))
  );

  // Heirs & Bank Accounts state for form
  const [formHeirName, setFormHeirName] = useState("นางพิมพา ภักดีสยาม");
  const [formHeirId, setFormHeirId] = useState("1100400289112");
  const [formHeirRelation, setFormHeirRelation] = useState("คู่สมรส");
  const [formHeirBank, setFormHeirBank] = useState("ธนาคารทหารไทยธนชาต (TTB)");
  const [formHeirAccount, setFormHeirAccount] = useState("123-4-56789-0");

  // DOP Verification State (Step 2)
  const [dopDecision, setDopDecision] = useState<"ACCEPT" | "RETURN_FOR_EDIT">("ACCEPT");
  const [dopReturnReason, setDopReturnReason] = useState("");
  const [dopRejectedCodes, setDopRejectedCodes] = useState<string[]>([]);
  const [dopAdditionalDocName, setDopAdditionalDocName] = useState("");
  const [dopReviewerName, setDopReviewerName] = useState("พ.อ. สมเกียรติ ยุติธรรม (กพ.ทบ.)");

  // Approval State (Step 3)
  const [approvalOrderNo, setApprovalOrderNo] = useState("กห 0401/2145 ลว. 30 มี.ค. 69");
  const [approverName, setApproverName] = useState("พล.ท. วิชัย สิทธิศาสตร์");
  const [approverPos, setApproverPos] = useState("เจ้ากรมกำลังพลทหารบก");
  const [approvalNotes, setApprovalNotes] = useState("อนุมัติจ่ายเงินตามสิทธิและระเบียบ ทบ. ครบถ้วน");

  // Disbursement State (Step 4)
  const [disburseType, setDisburseType] = useState<"WELFARE" | "INSURANCE" | "BOTH">("BOTH");
  const [disburseAmount, setDisburseAmount] = useState(4250000);
  const [disburseRefNo, setDisburseRefNo] = useState("KTB-TR-25690330-9941");
  const [disburseInsuranceCompany, setDisburseInsuranceCompany] = useState("บมจ.เมืองไทยประกันชีวิต (ประกันภัยกำลังพล ทบ.)");

  // Calculate Delay from Incident Date
  const calculateDaysDelay = (dateStr: string) => {
    if (!dateStr) return 0;
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const newClaimDays = calculateDaysDelay(formIncidentDate);
  const isNewClaimDelayed = newClaimDays > 30;

  // Fetch Claims
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claims");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClaims(json.data);
      }
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  // Filter Claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchStage = stageFilter === "ALL" || claim.currentStage === stageFilter;
      const matchStatus = statusFilter === "ALL" || claim.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        claim.claimNumber.toLowerCase().includes(q) ||
        claim.personnelName.toLowerCase().includes(q) ||
        claim.personnelCitizenId.includes(q) ||
        claim.submittingUnitName.toLowerCase().includes(q);

      return matchStage && matchStatus && matchSearch;
    });
  }, [claims, stageFilter, statusFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: claims.length,
      unitActionNeeded: claims.filter((c) => c.status === "RETURNED_FOR_EDIT" || c.status === "DRAFT").length,
      dopPending: claims.filter((c) => c.currentStage === "DOP_VERIFICATION" && c.status === "SUBMITTED_TO_DOP").length,
      approvalPending: claims.filter((c) => c.currentStage === "PAYMENT_APPROVAL").length,
      disbursementPending: claims.filter((c) => c.currentStage === "DISBURSEMENT_SETTLED" && c.status !== "DISBURSED_COMPLETED").length,
      completed: claims.filter((c) => c.status === "DISBURSED_COMPLETED").length,
    };
  }, [claims]);

  // Handlers
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewClaimDelayed && !formDelayExplanation.trim()) {
      alert("กรณีเกิน 30 วัน กรุณากรอกรายงานชี้แจงสาเหตุความล่าช้าก่อนยื่นเรื่อง");
      return;
    }

    try {
      const payload = {
        personnelName: formPersonnelName,
        personnelRank: formPersonnelRank,
        personnelMilitaryId: formMilitaryId,
        personnelCitizenId: formCitizenId,
        submittingUnitName: formSubmittingUnit,
        submittingOfficerName: formSubmittingOfficer,
        submittingOfficerPosition: formOfficerPosition,
        incidentDate: formIncidentDate,
        delayReasonExplanation: formDelayExplanation,
        requestedLumpSum: Number(formLumpSum),
        requestedMonthly: Number(formMonthly),
        requestedScholarship: Number(formScholarship),
        requestedNonMonetary: formNonMonetary,
        documents: newClaimDocs,
        heirDisbursements: [
          {
            id: `heir-${Date.now()}`,
            heirName: formHeirName,
            heirNationalId: formHeirId,
            relationship: formHeirRelation,
            allocatedPercent: 100,
            allocatedAmount: Number(formLumpSum),
            bankName: formHeirBank,
            bankAccountNumber: formHeirAccount,
            bankAccountHolderName: formHeirName,
            disbursementChannel: "BOTH",
            isTransferred: false,
          },
        ],
      };

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert("ยื่นเสนอขอรับสิทธิสำเร็จ! เรื่องถูกส่งเข้าสู่ กพ.ทบ. ตรวจสอบแล้ว");
        setOpenNewClaimModal(false);
        fetchClaims();
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการยื่นเสนอ");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDopVerifySubmit = async () => {
    if (!selectedClaim) return;
    try {
      const payload: any = {
        action: dopDecision,
        reviewerName: dopReviewerName,
      };

      if (dopDecision === "RETURN_FOR_EDIT") {
        payload.returnComment = dopReturnReason;
        payload.rejectedDocCodes = dopRejectedCodes;
      }

      if (dopAdditionalDocName.trim()) {
        payload.additionalDoc = {
          id: `dop-doc-${Date.now()}`,
          code: `DOP-ADDITIONAL-${Date.now()}`,
          title: dopAdditionalDocName,
          category: "DOP_ADDITIONAL",
          isRequired: false,
          status: "ATTACHED",
          fileName: `${dopAdditionalDocName}.pdf`,
          uploadedAt: new Date().toISOString(),
          uploadedByStage: "DOP_VERIFICATION",
        };
      }

      const res = await fetch(`/api/claims/${selectedClaim.id}/dop-verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setOpenDopVerifyModal(false);
        fetchClaims();
      } else {
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedClaim) return;
    try {
      const res = await fetch(`/api/claims/${selectedClaim.id}/approve-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: approvalOrderNo,
          approverName,
          approverPosition: approverPos,
          approvedAmount: selectedClaim.requestedLumpSum,
          notes: approvalNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setOpenApprovalModal(false);
        fetchClaims();
      } else {
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDisbursementSubmit = async () => {
    if (!selectedClaim) return;
    try {
      const res = await fetch(`/api/claims/${selectedClaim.id}/disburse`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: disburseType,
          amount: disburseAmount,
          refNumber: disburseRefNo,
          insuranceCompany: disburseInsuranceCompany,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setOpenDisbursementModal(false);
        fetchClaims();
      } else {
        alert(json.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              เสนอขอรับสิทธิและสวัสดิการกำลังพล กองทัพบก
            </h1>
            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">Tab 7</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            กระบวนการ 4 ขั้นตอน: 1.หน่วยต้นสังกัดเสนอเรื่อง ➔ 2.กพ.ทบ. ตรวจสอบ ➔ 3.ขออนุมัติจ่ายเงิน ➔ 4.สก.ทบ. และ บ.ประกัน โอนเงิน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/calculator">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-teal-300 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40">
              <RotateCcw className="h-3.5 w-3.5 text-teal-600" />
              คำนวณสิทธิ 4 หมวด (Tab 6)
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setOpenNewClaimModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            เสนอขอรับสิทธิใหม่ (ขั้นตอนที่ 1)
          </Button>
        </div>
      </div>

      {/* Workflow Navigation Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
        <Link href="/personnel" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 2: ทะเบียนกำลังพล</p>
            <p className="text-[10px] text-muted-foreground truncate">ประวัติรับราชการ</p>
          </div>
        </Link>

        <Link href="/family" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-6 w-6 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 3: ข้อมูลครอบครัว</p>
            <p className="text-[10px] text-muted-foreground truncate">คู่สมรส, บุตร</p>
          </div>
        </Link>

        <Link href="/heirs" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            4
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 4: ข้อมูลทายาท</p>
            <p className="text-[10px] text-muted-foreground truncate">สัดส่วน % ทายาท</p>
          </div>
        </Link>

        <Link href="/loss-reports" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 5: รายงานสูญเสีย</p>
            <p className="text-[10px] text-muted-foreground truncate">กพ.3 / กพ.4</p>
          </div>
        </Link>

        <Link href="/calculator" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-6 w-6 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
            6
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 6: คำนวณ 4 หมวด</p>
            <p className="text-[10px] text-muted-foreground truncate">ประมาณการสิทธิ</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200">
          <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            7
          </div>
          <div className="truncate">
            <p className="font-bold truncate">Tab 7: เสนอขอรับสิทธิ</p>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 truncate">4 ขั้นตอน สก.ทบ./ประกัน</p>
          </div>
        </div>
      </div>

      {/* 4-Step Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Unit Action / Returned */}
        <Card className={`border-slate-200/80 dark:border-slate-800 transition-all ${metrics.unitActionNeeded > 0 ? "border-rose-300 bg-rose-50/20" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Send className="h-4 w-4 text-blue-600" />
                1. หน่วยต้นสังกัดยื่นเรื่อง
              </span>
              {metrics.unitActionNeeded > 0 && (
                <Badge variant="destructive" className="text-[10px] animate-pulse">
                  ตีกลับ {metrics.unitActionNeeded} เรื่อง
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {metrics.unitActionNeeded}
              </span>
              <span className="text-xs text-muted-foreground">เรื่องต้องแก้ไข/ยื่นใหม่</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              แนบหลักฐาน 8 รายการ (เกิน 30 วันต้องมีรายงานล่าช้า)
            </p>
          </CardContent>
        </Card>

        {/* Step 2: DOP Verification */}
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                2. กพ.ทบ. ตรวจสอบเอกสาร
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
                รอตรวจ {metrics.dopPending}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {metrics.dopPending}
              </span>
              <span className="text-xs text-muted-foreground">เรื่องรอตรวจรับ/ตีกลับ</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              กพ.ทบ. ตรวจ 8 เอกสาร, แนบเพิ่มได้, กดรับหรือตีกลับ
            </p>
          </CardContent>
        </Card>

        {/* Step 3: Payment Approval */}
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-purple-600" />
                3. เสนอขออนุมัติจ่ายเงิน
              </span>
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200">
                รออนุมัติ {metrics.approvalPending}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {metrics.approvalPending}
              </span>
              <span className="text-xs text-muted-foreground">เรื่องรอออกคำสั่ง ทบ.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              สรุป 4 หมวด เสนอผู้มีอำนาจลงนามออกคำสั่ง ทบ.
            </p>
          </CardContent>
        </Card>

        {/* Step 4: Disbursement & Insurance */}
        <Card className="border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-emerald-600" />
                4. สก.ทบ. & ประกัน โอนเงิน
              </span>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                เสร็จสิ้น {metrics.completed}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.completed}
              </span>
              <span className="text-xs text-muted-foreground">โอนเงินเสร็จสมบูรณ์</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              สก.ทบ. และ บ.ประกัน แนบสลิป ปรับสถานะแจ้งผล
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-80">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ค้นหาเลขที่คำขอ, ชื่อกำลังพล, เลข ปชช., หน่วย..."
                  className="pl-8 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">ขั้นตอน:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-background px-2.5 py-1.5"
                >
                  <option value="ALL">ทุกขั้นตอน (1 - 4)</option>
                  <option value="UNIT_SUBMISSION">1. หน่วยต้นสังกัดยื่นเรื่อง</option>
                  <option value="DOP_VERIFICATION">2. กพ.ทบ. ตรวจสอบเอกสาร</option>
                  <option value="PAYMENT_APPROVAL">3. ขออนุมัติจ่ายเงิน</option>
                  <option value="DISBURSEMENT_SETTLED">4. สก.ทบ. และ บ.ประกัน โอนเงิน</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">สถานะ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-background px-2.5 py-1.5"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="SUBMITTED_TO_DOP">ยื่นเรื่องถึง กพ.ทบ. แล้ว</option>
                  <option value="RETURNED_FOR_EDIT">ตีกลับให้แก้ไขเอกสาร</option>
                  <option value="PENDING_COMMANDER_APP">รอผู้มีอำนาจลงนามอนุมัติ</option>
                  <option value="APPROVED_FOR_PAYMENT">อนุมัติจ่ายเงินแล้ว</option>
                  <option value="PROCESSING_DISBURSEMENT">กำลังโอนเงิน</option>
                  <option value="DISBURSED_COMPLETED">โอนเงินเสร็จสมบูรณ์</option>
                </select>
              </div>

              <Button variant="ghost" size="sm" onClick={fetchClaims} className="text-xs h-8">
                <RotateCcw className="h-3 w-3 mr-1" />
                รีเฟรช
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Claims Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3">เลขที่คำขอ / วันที่ยื่น</th>
                <th className="p-3">ข้อมูลกำลังพลผู้สูญเสีย</th>
                <th className="p-3">หน่วยต้นสังกัด</th>
                <th className="p-3 text-center">อายุความ (เกิน 30 วัน?)</th>
                <th className="p-3 text-right">ยอดเงินสิทธิ (หมวด 1)</th>
                <th className="p-3 text-center">ขั้นตอน & สถานะ</th>
                <th className="p-3 text-center">ดำเนินการตามขั้นตอน (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    ไม่พบรายการคำขอรับสิทธิและสวัสดิการ
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {claim.claimNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatThaiDate(claim.submissionDate)}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {claim.personnelName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {claim.personnelMilitaryId} | ปชช. {claim.personnelCitizenId}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {claim.submittingUnitName}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ผู้เสนอ: {claim.submittingOfficerName}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      {claim.isDelayedOver30Days ? (
                        <div className="inline-flex flex-col items-center">
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 text-[10px] gap-1 font-semibold">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            เกิน {claim.daysFromIncident} วัน (มีรายงานล่าช้า)
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-200 bg-emerald-50/50">
                          ปกติ ({claim.daysFromIncident} วัน)
                        </Badge>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(claim.requestedLumpSum)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        รายเดือน {formatCurrency(claim.requestedMonthly)}/ด.
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {claim.status === "SUBMITTED_TO_DOP" && (
                          <Badge className="bg-blue-600 text-white text-[10px]">
                            2. กพ.ทบ. กำลังตรวจ
                          </Badge>
                        )}
                        {claim.status === "RETURNED_FOR_EDIT" && (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <RotateCcw className="h-2.5 w-2.5" />
                            ตีกลับให้แก้ไข
                          </Badge>
                        )}
                        {claim.status === "PENDING_COMMANDER_APP" && (
                          <Badge className="bg-purple-600 text-white text-[10px]">
                            3. รออนุมัติจ่ายเงิน
                          </Badge>
                        )}
                        {claim.status === "APPROVED_FOR_PAYMENT" && (
                          <Badge className="bg-teal-600 text-white text-[10px]">
                            4. รอโอนเงิน สก.ทบ./ประกัน
                          </Badge>
                        )}
                        {claim.status === "PROCESSING_DISBURSEMENT" && (
                          <Badge className="bg-amber-600 text-white text-[10px]">
                            4. กำลังโอนเงิน
                          </Badge>
                        )}
                        {claim.status === "DISBURSED_COMPLETED" && (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            โอนเงินเสร็จสมบูรณ์
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Detail View */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="ดูรายละเอียดคำขอและเอกสาร 8 รายการ"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setOpenDetailModal(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-600" />
                        </Button>

                        {/* Step 2 Action: DOP Verify */}
                        {(claim.currentStage === "DOP_VERIFICATION" || claim.status === "SUBMITTED_TO_DOP") && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setDopDecision("ACCEPT");
                              setDopReturnReason("");
                              setDopRejectedCodes([]);
                              setOpenDopVerifyModal(true);
                            }}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            กพ.ทบ. ตรวจรับ/ตีกลับ
                          </Button>
                        )}

                        {/* If Returned, Unit Resubmit */}
                        {claim.status === "RETURNED_FOR_EDIT" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-[11px] font-medium gap-1"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setOpenDetailModal(true);
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                            ดูจุดที่ต้องแก้ไข
                          </Button>
                        )}

                        {/* Step 3 Action: Approve Payment */}
                        {claim.currentStage === "PAYMENT_APPROVAL" && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setApprovalOrderNo(`กห 0401/${Math.floor(1000 + Math.random() * 9000)} ลว. ${new Date().toLocaleDateString("th-TH")}`);
                              setOpenApprovalModal(true);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                            อนุมัติจ่ายเงิน
                          </Button>
                        )}

                        {/* Step 4 Action: Disburse */}
                        {claim.currentStage === "DISBURSEMENT_SETTLED" && claim.status !== "DISBURSED_COMPLETED" && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setDisburseAmount(claim.requestedLumpSum);
                              setDisburseRefNo(`TR-RTA-${Date.now().toString().slice(-8)}`);
                              setOpenDisbursementModal(true);
                            }}
                          >
                            <Banknote className="h-3 w-3" />
                            บันทึกการโอนเงิน
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* DIALOG 1: หน่วยต้นสังกัดยื่นเสนอขอรับสิทธิ (ขั้นตอนที่ 1) */}
      {/* ========================================================================= */}
      <Dialog open={openNewClaimModal} onOpenChange={setOpenNewClaimModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Send className="h-5 w-5 text-indigo-600" />
              ขั้นตอนที่ 1: หน่วยต้นสังกัดเสนอขอรับสิทธิและสวัสดิการ (ยื่นเรื่องเข้า กพ.ทบ.)
            </DialogTitle>
            <DialogDescription className="text-xs">
              กรอกข้อมูลกำลังพล ตรวจสอบระยะเวลา 30 วัน แนบเอกสารหลักฐาน 8 รายการ และระบุบัญชีธนาคารสำหรับโอนเงิน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateClaim} className="space-y-5 pt-2">
            {/* Personnel & Unit Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">ชื่อ-สกุล กำลังพลผู้สูญเสีย</Label>
                <Input
                  className="text-xs h-8"
                  value={formPersonnelName}
                  onChange={(e) => setFormPersonnelName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">หมายเลขประจำตัวทหาร / เลข ปชช.</Label>
                <Input
                  className="text-xs h-8 font-mono"
                  value={formCitizenId}
                  onChange={(e) => setFormCitizenId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">หน่วยต้นสังกัดที่ยื่นเรื่อง</Label>
                <Input
                  className="text-xs h-8"
                  value={formSubmittingUnit}
                  onChange={(e) => setFormSubmittingUnit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">นายทหารผู้เสนอเรื่อง (ฝ่ายกำลังพล)</Label>
                <Input
                  className="text-xs h-8"
                  value={formSubmittingOfficer}
                  onChange={(e) => setFormSubmittingOfficer(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">วันที่เกิดเหตุ / วันที่ถึงแก่กรรม</Label>
                <Input
                  type="date"
                  className="text-xs h-8"
                  value={formIncidentDate}
                  onChange={(e) => setFormIncidentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">คำนวณระยะเวลา (เกณฑ์ 30 วัน)</Label>
                <div className="h-8 flex items-center px-3 rounded-lg border bg-white dark:bg-slate-800 text-xs">
                  {isNewClaimDelayed ? (
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      เกินกำหนด ({newClaimDays} วัน) ➔ ต้องมีรายงานล่าช้า
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      ปกติ ({newClaimDays} วัน) ภายใน 30 วัน
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delay Explanation Warning (If > 30 Days) */}
            {isNewClaimDelayed && (
              <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>คำเตือน: ยื่นเรื่องเกิน 30 วันนับจากวันเกิดเหตุ (ระเบียบ ทบ. กำหนดให้ชี้แจงเหตุผล)</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  กรุณากรอกสาเหตุความจำเป็นที่ไม่สามารถเสนอเรื่องได้ภายใน 30 วัน เพื่อให้ กพ.ทบ. ใช้ประกอบการพิจารณา:
                </p>
                <textarea
                  className="w-full text-xs rounded-lg border border-amber-300 p-2.5 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  rows={2}
                  placeholder="ระบุสาเหตุความล่าช้า เช่น อยู่ในพื้นที่ปฏิบัติการห่างไกล / ทายาทอยู่ระหว่างรอใบมรณบัตรและผลชันสูตร..."
                  value={formDelayExplanation}
                  onChange={(e) => setFormDelayExplanation(e.target.value)}
                  required={isNewClaimDelayed}
                />
              </div>
            )}

            {/* 4-Category Benefit Summary (From Tab 6) */}
            <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  ยอดสิทธิประโยชน์ 4 หมวด (ส่งต่อมาจาก Tab 6: คำนวณสิทธิ)
                </span>
                <span className="text-[11px] text-teal-700 dark:text-teal-300">บูรณาการข้อมูลอัตโนมัติ</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                  <span className="text-[10px] text-muted-foreground">หมวด 1: เงินก้อนครั้งเดียว</span>
                  <p className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm">
                    {formatCurrency(formLumpSum)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                  <span className="text-[10px] text-muted-foreground">หมวด 2: เงินรายเดือน</span>
                  <p className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                    {formatCurrency(formMonthly)}/ด.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                  <span className="text-[10px] text-muted-foreground">หมวด 3: ทุนการศึกษา/ปี</span>
                  <p className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
                    {formatCurrency(formScholarship)}/ปี
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border">
                  <span className="text-[10px] text-muted-foreground">หมวด 4: สิทธิมิใช่ตัวเงิน</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                    {formNonMonetary}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Checklist (8 Items) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-indigo-600" />
                  รายการเอกสารหลักฐาน 8 รายการ ที่ต้องแนบประกอบคำขอ
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  แนบแล้ว {newClaimDocs.filter((d) => d.status === "ATTACHED").length} / 8 รายการ
                </span>
              </div>

              <div className="border rounded-xl divide-y text-xs max-h-56 overflow-y-auto bg-card">
                {newClaimDocs.map((doc, idx) => {
                  const isDelayDoc = doc.code === "DOC-8-DELAY-REASON";
                  return (
                    <div
                      key={doc.id}
                      className={`p-2.5 flex items-center justify-between gap-3 ${
                        isDelayDoc && isNewClaimDelayed ? "bg-amber-50/60 dark:bg-amber-950/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {doc.fileName || "ยังไม่ได้แนบไฟล์"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDelayDoc && !isNewClaimDelayed ? (
                          <Badge variant="secondary" className="text-[10px]">
                            ไม่ต้องแนบ (ไม่เกิน 30 วัน)
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            แนบไฟล์แล้ว
                          </Badge>
                        )}
                        <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2">
                          <Upload className="h-3 w-3 mr-1" />
                          เปลี่ยนไฟล์
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heirs & Bank Account Info (Item 7 Requirement) */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  ข้อมูลบัญชีเงินฝากของทายาทผู้รับเงิน (เอกสารข้อ 7 สำหรับ สก.ทบ. และ บ.ประกัน โอนเงิน)
                </Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">ชื่อ-สกุล ทายาทผู้รับเงิน</Label>
                  <Input
                    className="text-xs h-8"
                    value={formHeirName}
                    onChange={(e) => setFormHeirName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">เลขประจำตัวประชาชนทายาท</Label>
                  <Input
                    className="text-xs h-8 font-mono"
                    value={formHeirId}
                    onChange={(e) => setFormHeirId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">ความสัมพันธ์</Label>
                  <Input
                    className="text-xs h-8"
                    value={formHeirRelation}
                    onChange={(e) => setFormHeirRelation(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">ธนาคารสำหรับรับโอนเงิน</Label>
                  <select
                    className="w-full text-xs h-8 rounded-lg border bg-white dark:bg-slate-900 px-2.5"
                    value={formHeirBank}
                    onChange={(e) => setFormHeirBank(e.target.value)}
                  >
                    <option value="ธนาคารทหารไทยธนชาต (TTB)">ธนาคารทหารไทยธนชาต (TTB)</option>
                    <option value="ธนาคารกรุงไทย (KTB)">ธนาคารกรุงไทย (KTB)</option>
                    <option value="ธนาคารไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)">ธ.ก.ส.</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">เลขที่บัญชีเงินฝาก (10 หลัก)</Label>
                  <Input
                    className="text-xs h-8 font-mono font-bold"
                    value={formHeirAccount}
                    onChange={(e) => setFormHeirAccount(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewClaimModal(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                ยืนยันการเสนอขอรับสิทธิ ส่งเรื่องเข้า กพ.ทบ.
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: กพ.ทบ. ตรวจสอบเอกสาร (รับเรื่อง หรือ ตีกลับแก้ไขระบุเหตุผล) */}
      {/* ========================================================================= */}
      <Dialog open={openDopVerifyModal} onOpenChange={setOpenDopVerifyModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              ขั้นตอนที่ 2: กพ.ทบ. ตรวจสอบรายการเอกสารหลักฐาน
            </DialogTitle>
            <DialogDescription className="text-xs">
              คำขอเลขที่: {selectedClaim?.claimNumber} | กำลังพล: {selectedClaim?.personnelName} ({selectedClaim?.submittingUnitName})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* 8 Documents Inspection with checkboxes */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>ตรวจสอบความถูกต้องของเอกสารหลักฐาน 8 รายการ:</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  คลิกเลือกรายการที่ &quot;ไม่ผ่าน/มีข้อบกพร่อง&quot; หากต้องการตีกลับ
                </span>
              </Label>

              <div className="border rounded-xl divide-y text-xs bg-card">
                {selectedClaim?.documents.map((doc, idx) => {
                  const isCheckedForReject = dopRejectedCodes.includes(doc.code);
                  return (
                    <div
                      key={doc.id || idx}
                      className={`p-2.5 flex items-center justify-between gap-3 ${
                        isCheckedForReject ? "bg-rose-50 dark:bg-rose-950/40" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <input
                          type="checkbox"
                          className="rounded-xs text-rose-600 focus:ring-rose-500"
                          checked={isCheckedForReject}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDopRejectedCodes([...dopRejectedCodes, doc.code]);
                              setDopDecision("RETURN_FOR_EDIT");
                            } else {
                              setDopRejectedCodes(dopRejectedCodes.filter((c) => c !== doc.code));
                            }
                          }}
                        />
                        <div className="truncate">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {idx + 1}. {doc.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ไฟล์: {doc.fileName || "เอกสารต้นฉบับในสำนวน"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCheckedForReject ? (
                          <Badge variant="destructive" className="text-[10px]">
                            ตีกลับข้อนี้
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                            ตรวจสอบแล้ว
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" title="เปิดดูเอกสาร">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Document Attachment by DOP */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-blue-600" />
                กพ.ทบ. แนบเอกสารรับรองเพิ่มเติม (ถ้ามี)
              </Label>
              <div className="flex gap-2">
                <Input
                  className="text-xs h-8"
                  placeholder="เช่น คำสั่งปฏิบัติหน้าที่สนามเฉพาะกิจ / หนังสือรับรองจาก กอ.รมน."
                  value={dopAdditionalDocName}
                  onChange={(e) => setDopAdditionalDocName(e.target.value)}
                />
              </div>
            </div>

            {/* Decision Section */}
            <div className="space-y-3 p-3.5 rounded-xl border bg-card">
              <Label className="text-xs font-bold">ผลการตรวจสอบของ กพ.ทบ.:</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDopDecision("ACCEPT")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    dopDecision === "ACCEPT"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>กดรับเรื่อง (เอกสารครบถ้วน)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ส่งเรื่องต่อไปยังขั้นตอนที่ 3 เพื่อขออนุมัติจ่ายเงิน
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDopDecision("RETURN_FOR_EDIT")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    dopDecision === "RETURN_FOR_EDIT"
                      ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <RotateCcw className="h-4 w-4" />
                    <span>ตีกลับให้แก้ไขหรือเพิ่มเอกสาร</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ส่งเรื่องกลับหน่วยต้นสังกัดเพื่อแก้ไขจุดบกพร่อง
                  </p>
                </button>
              </div>

              {/* If Returned, Mandatory Comment Box */}
              {dopDecision === "RETURN_FOR_EDIT" && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    ระบุรายละเอียดข้อบกพร่องและสิ่งที่ต้องแก้ไขให้ครบถ้วน:
                  </Label>
                  <textarea
                    className="w-full text-xs rounded-lg border border-rose-300 p-2.5 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    rows={3}
                    placeholder="เช่น ภาพถ่ายหน้าสมุดบัญชีไม่ชัดเจน กรุณาถ่ายใหม่ / หนังสือแสดงเจตนายังขาดลายมือชื่อพยาน 2 ท่าน..."
                    value={dopReturnReason}
                    onChange={(e) => setDopReturnReason(e.target.value)}
                    required={dopDecision === "RETURN_FOR_EDIT"}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenDopVerifyModal(false)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              onClick={handleDopVerifySubmit}
              className={
                dopDecision === "ACCEPT"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  : "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              }
            >
              {dopDecision === "ACCEPT" ? "ยืนยันรับเรื่องและส่งต่อขออนุมัติ" : "ยืนยันตีกลับให้แก้ไขเอกสาร"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: ขั้นตอนที่ 3 ขออนุมัติจ่ายเงิน */}
      {/* ========================================================================= */}
      <Dialog open={openApprovalModal} onOpenChange={setOpenApprovalModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-purple-600" />
              ขั้นตอนที่ 3: บันทึกการขออนุมัติจ่ายเงิน (ออกคำสั่ง ทบ.)
            </DialogTitle>
            <DialogDescription className="text-xs">
              คำขอ: {selectedClaim?.claimNumber} | กำลังพล: {selectedClaim?.personnelName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Summary Box */}
            <div className="p-3 rounded-xl border bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 space-y-1.5">
              <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>ยอดเงินก้อนที่ขออนุมัติจ่าย (หมวด 1):</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 text-sm font-bold">
                  {formatCurrency(selectedClaim?.requestedLumpSum || 0)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>เงินบำนาญพิเศษรายเดือน:</span>
                <span className="font-mono">{formatCurrency(selectedClaim?.requestedMonthly || 0)}/ด.</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">เลขที่หนังสือสั่งการ / คำสั่งอนุมัติ ทบ.</Label>
              <Input
                className="text-xs h-8 font-mono font-bold"
                value={approvalOrderNo}
                onChange={(e) => setApprovalOrderNo(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">ผู้มีอำนาจลงนามอนุมัติ</Label>
                <Input
                  className="text-xs h-8"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">ตำแหน่ง</Label>
                <Input
                  className="text-xs h-8"
                  value={approverPos}
                  onChange={(e) => setApproverPos(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">หมายเหตุ / คำสั่งเพิ่มเติม</Label>
              <textarea
                className="w-full text-xs rounded-lg border p-2 bg-white dark:bg-slate-900"
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenApprovalModal(false)}>
              ยกเลิก
            </Button>
            <Button size="sm" onClick={handleApprovePayment} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              บันทึกอนุมัติจ่ายเงิน ➔ ส่งต่อ สก.ทบ. และ บ.ประกัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: ขั้นตอนที่ 4 สก.ทบ. และ บริษัทประกัน โอนเงิน */}
      {/* ========================================================================= */}
      <Dialog open={openDisbursementModal} onOpenChange={setOpenDisbursementModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-emerald-600" />
              ขั้นตอนที่ 4: สก.ทบ. และ บ.ประกัน ดำเนินการโอนเงินและปรับสถานะ
            </DialogTitle>
            <DialogDescription className="text-xs">
              คำขอ: {selectedClaim?.claimNumber} | ทายาทผู้รับเงิน: {selectedClaim?.heirDisbursements?.[0]?.heirName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Beneficiary Bank Account Details */}
            <div className="p-3 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 space-y-1">
              <p className="font-bold text-emerald-900 dark:text-emerald-200">
                บัญชีปลายทาง: {selectedClaim?.heirDisbursements?.[0]?.bankName}
              </p>
              <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                เลขบัญชี: {selectedClaim?.heirDisbursements?.[0]?.bankAccountNumber}
              </p>
              <p className="text-[11px] text-muted-foreground">
                ชื่อบัญชี: {selectedClaim?.heirDisbursements?.[0]?.bankAccountHolderName}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">หน่วยงานดำเนินการจ่ายเงิน</Label>
              <select
                className="w-full text-xs h-8 rounded-lg border bg-white dark:bg-slate-900 px-2.5"
                value={disburseType}
                onChange={(e) => setDisburseType(e.target.value as any)}
              >
                <option value="BOTH">ทั้งสองหน่วยงาน (สก.ทบ. สวัสดิการ + บริษัทประกันชีวิต)</option>
                <option value="WELFARE">กรมสวัสดิการทหารบก (สก.ทบ.) เท่านั้น</option>
                <option value="INSURANCE">บริษัทประกันชีวิต (สินไหมทดแทน ทบ.) เท่านั้น</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">จำนวนเงินที่โอน (บาท)</Label>
                <Input
                  type="number"
                  className="text-xs h-8 font-mono font-bold"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">เลขที่อ้างอิงธุรกรรม (Transaction Ref)</Label>
                <Input
                  className="text-xs h-8 font-mono"
                  value={disburseRefNo}
                  onChange={(e) => setDisburseRefNo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">ชื่อบริษัทประกันภัยคู่สัญญา</Label>
              <Input
                className="text-xs h-8"
                value={disburseInsuranceCompany}
                onChange={(e) => setDisburseInsuranceCompany(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg border border-dashed text-center bg-slate-50 dark:bg-slate-900">
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium">อัปโหลดสลิปหลักฐานการโอนเงิน (Transfer Slip)</p>
              <p className="text-[10px] text-muted-foreground">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenDisbursementModal(false)}>
              ยกเลิก
            </Button>
            <Button size="sm" onClick={handleDisbursementSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              ยืนยันการโอนเงิน ➔ ปรับสถานะเสร็จสมบูรณ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 5: ดูรายละเอียดคำขอและเอกสาร 8 รายการฉบับเต็ม */}
      {/* ========================================================================= */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              รายละเอียดคำขอรับสิทธิ: {selectedClaim?.claimNumber}
            </DialogTitle>
            <DialogDescription className="text-xs">
              สถานะปัจจุบัน: {selectedClaim?.status} | ขั้นตอน: {selectedClaim?.currentStage}
            </DialogDescription>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Alert if Returned */}
              {selectedClaim.status === "RETURNED_FOR_EDIT" && (
                <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>กพ.ทบ. ตีกลับให้หน่วยต้นสังกัดแก้ไขเอกสาร</span>
                  </div>
                  <p className="text-xs font-semibold pl-6">
                    เหตุผลข้อบกพร่อง: {selectedClaim.dopReturnComment}
                  </p>
                  <p className="text-[10px] text-muted-foreground pl-6">
                    ผู้ตรวจ: {selectedClaim.dopReviewerName} เมื่อ {formatThaiDate(selectedClaim.dopReviewedDate || "")}
                  </p>
                </div>
              )}

              {/* Personnel & Unit Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <span className="text-[10px] text-muted-foreground">ชื่อกำลังพล</span>
                  <p className="font-semibold">{selectedClaim.personnelName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">หมายเลขประจำตัว</span>
                  <p className="font-mono">{selectedClaim.personnelMilitaryId}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">หน่วยต้นสังกัด</span>
                  <p className="font-semibold">{selectedClaim.submittingUnitName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">วันเกิดเหตุ/ระยะเวลา</span>
                  <p className="font-semibold">{selectedClaim.incidentDate} ({selectedClaim.daysFromIncident} วัน)</p>
                </div>
              </div>

              {/* 8 Documents List */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">เอกสารหลักฐาน 8 รายการที่แนบมา:</Label>
                <div className="border rounded-xl divide-y bg-card">
                  {selectedClaim.documents.map((d, idx) => (
                    <div key={d.id || idx} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-medium truncate">{idx + 1}. {d.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{d.fileName}</p>
                      </div>
                      <Badge
                        variant={d.status === "REJECTED_BY_DOP" ? "destructive" : "outline"}
                        className="text-[10px] shrink-0"
                      >
                        {d.status === "REJECTED_BY_DOP" ? "ไม่ผ่าน (ต้องแก้)" : "แนบแล้ว"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heirs / Disbursement Bank Accounts */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ข้อมูลบัญชีธนาคารสำหรับโอนเงิน (เอกสารข้อ 7):</Label>
                <div className="border rounded-xl divide-y bg-card">
                  {selectedClaim.heirDisbursements.map((h, idx) => (
                    <div key={h.id || idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{h.heirName} ({h.relationship}) - สัดส่วน {h.allocatedPercent}%</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {h.bankName} | เลขบัญชี: {h.bankAccountNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-600">{formatCurrency(h.allocatedAmount)}</p>
                        <Badge variant={h.isTransferred ? "default" : "secondary"} className="text-[10px]">
                          {h.isTransferred ? "โอนเงินแล้ว" : "รอโอนเงิน"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setOpenDetailModal(false)}>
              ปิดหน้าต่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
