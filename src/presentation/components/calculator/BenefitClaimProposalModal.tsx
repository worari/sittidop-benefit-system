"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Printer,
  ExternalLink,
  Sparkles,
  Paperclip,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";
import { MilitaryBenefitCalculationResult } from "@/core/domain/value-objects/military-types";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { formatCurrency, formatThaiDate } from "../../lib/utils";
import Link from "next/link";

export interface DocumentItem {
  id: string;
  code: string;
  name: string;
  category: "OFFICIAL" | "IDENTITY" | "FAMILY" | "MEDICAL" | "FINANCIAL";
  required: boolean;
  status: "ATTACHED" | "PENDING" | "NOT_APPLICABLE";
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  fileDataUrl?: string;
  notes?: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: "doc-1",
    code: "RTA-KP3-4",
    name: "แบบรายงานการสูญเสียกำลังพล (กพ.3 / กพ.4) จากหน่วยต้นสังกัด",
    category: "OFFICIAL",
    required: true,
    status: "ATTACHED",
    fileName: "แบบรายงานการสูญเสีย_กพ3_กพ4_ลงนามแล้ว.pdf",
    fileSize: 1024 * 480,
    uploadedAt: new Date().toISOString(),
    notes: "มีผลการรับรองจาก ผบ.พัน และ นายทหารพระธรรมนูญแล้ว",
  },
  {
    id: "doc-2",
    code: "RTA-FIELD-ORDER",
    name: "คำสั่งปฏิบัติหน้าที่ราชการสนาม / หนังสือรับรองเหตุการณ์การสู้รบ",
    category: "OFFICIAL",
    required: true,
    status: "ATTACHED",
    fileName: "คำสั่ง_ทภ.4_ปฏิบัติหน้าที่สนาม_2569.pdf",
    fileSize: 1024 * 320,
    uploadedAt: new Date().toISOString(),
    notes: "คำสั่งปฏิบัติราชการสนามเฉพาะกิจ",
  },
  {
    id: "doc-3",
    code: "ID-PERSONNEL",
    name: "สำเนาบัตรประจำตัวข้าราชการทหาร และสำเนาทะเบียนบ้านของกำลังพล",
    category: "IDENTITY",
    required: true,
    status: "ATTACHED",
    fileName: "สำเนาบัตรข้าราชการ_ทะเบียนบ้าน_กำลังพล.pdf",
    fileSize: 1024 * 260,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-4",
    code: "MED-DEATH-CERT",
    name: "ใบมรณบัตร (กรณีเสียชีวิต) หรือ ใบสำคัญความพิการ/ใบรับรองแพทย์ รพ.ทหาร",
    category: "MEDICAL",
    required: true,
    status: "ATTACHED",
    fileName: "ใบมรณบัตร_หรือ_ใบรับรองแพทย์_รพ.พระมงกุฎเกล้า.pdf",
    fileSize: 1024 * 512,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-5",
    code: "FAM-MARRIAGE",
    name: "สำเนาทะเบียนสมรส (กรณีมีคู่สมรสขอรับสิทธิ)",
    category: "FAMILY",
    required: true,
    status: "ATTACHED",
    fileName: "สำเนาทะเบียนสมรส_คร.2.pdf",
    fileSize: 1024 * 190,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-6",
    code: "FAM-CHILD-BIRTH",
    name: "สำเนาสูติบัตรและทะเบียนบ้านของบุตรทุกท่าน (กรณีขอรับทุนการศึกษา/บำเหน็จตกทอด)",
    category: "FAMILY",
    required: true,
    status: "ATTACHED",
    fileName: "สำเนาสูติบัตร_ทะเบียนบ้าน_บุตรทุกคน.pdf",
    fileSize: 1024 * 410,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-7",
    code: "FAM-PARENTS-ID",
    name: "สำเนาบัตรประจำตัวประชาชนและทะเบียนบ้านของบิดา-มารดา",
    category: "FAMILY",
    required: false,
    status: "ATTACHED",
    fileName: "สำเนาบัตร_ทะเบียนบ้าน_บิดามารดา.pdf",
    fileSize: 1024 * 280,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-8",
    code: "FIN-BANK-BOOK",
    name: "สำเนาหน้าสมุดบัญชีเงินฝากธนาคารสำหรับรับโอนเงินสิทธิประโยชน์ (ทหารไทยธนชาต/กรุงไทย)",
    category: "FINANCIAL",
    required: true,
    status: "ATTACHED",
    fileName: "สำเนาหน้าสมุดบัญชี_TTB_รับโอนเงิน.pdf",
    fileSize: 1024 * 220,
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "doc-9",
    code: "POA-LETTER",
    name: "หนังสือมอบอำนาจ / หนังสือแสดงเจตนาผู้รับผลประโยชน์ (ถ้ามี)",
    category: "OFFICIAL",
    required: false,
    status: "NOT_APPLICABLE",
    notes: "ยื่นเรื่องโดยทายาทโดยตรง (ไม่ต้องใช้หนังสือมอบอำนาจ)",
  },
];

interface BenefitClaimProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculationResult: MilitaryBenefitCalculationResult | null;
  personnel: MilitaryPersonnelRecord | null;
  heirs?: any[];
  hospitalData?: {
    hospitalName: string;
    admissionDate: string;
    dischargeDate: string;
    totalDays: number;
    compensationAmount?: number;
  };
  eSignatureName?: string;
  eSignaturePosition?: string;
  onSuccess?: (applicationData: any) => void;
}

export function BenefitClaimProposalModal({
  open,
  onOpenChange,
  calculationResult,
  personnel,
  heirs = [],
  hospitalData,
  eSignatureName = "",
  eSignaturePosition = "เจ้าหน้าที่ผู้จัดทำประมาณการสิทธิ",
  onSuccess,
}: BenefitClaimProposalModalProps) {
  // Wizard steps: 1: Programs Review, 2: Documents Checklist, 3: Applicant & Disbursement, 4: Sign & Confirm, 5: Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccessData, setSubmissionSuccessData] = useState<any | null>(null);

  // Program selection state (which categories to claim in this application)
  const [selectedPrograms, setSelectedPrograms] = useState({
    lumpSum: true,
    monthlyPension: true,
    annualScholarship: true,
    nonMonetaryRights: true,
  });

  // Documents state
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>(DEFAULT_DOCUMENTS);

  // Applicant details state
  const [applicantRole, setApplicantRole] = useState<"SPOUSE" | "CHILD" | "PARENT" | "OFFICER" | "SELF">("SPOUSE");
  const [applicantName, setApplicantName] = useState(
    heirs.length > 0 ? heirs[0].fullName || heirs[0].heirName || "นางพิมพา ภักดีสยาม" : "นางพิมพา ภักดีสยาม"
  );
  const [applicantNationalId, setApplicantNationalId] = useState("3100600123456");
  const [applicantPhone, setApplicantPhone] = useState("081-234-5678");
  const [applicantEmail, setApplicantEmail] = useState("pimpa.p@email.com");
  const [applicantAddress, setApplicantAddress] = useState(
    (personnel as any)?.address || "123 หมู่ 4 ต.ในเมือง อ.เมือง จ.นครราชสีมา 30000"
  );

  // Disbursement bank accounts state
  const [primaryBankName, setPrimaryBankName] = useState("ธนาคารทหารไทยธนชาต (TTB)");
  const [primaryBankAccount, setPrimaryBankAccount] = useState("123-4-56789-0");
  const [primaryAccountName, setPrimaryAccountName] = useState("นางพิมพา ภักดีสยาม");
  const [heirAccounts, setHeirAccounts] = useState<Record<string, { bank: string; account: string }>>({
    "ทายาท 1": { bank: "ธนาคารทหารไทยธนชาต (TTB)", account: "123-4-56789-0" },
    "ทายาท 2": { bank: "ธนาคารกรุงไทย (KTB)", account: "987-6-54321-0" },
    "ทายาท 3": { bank: "ธนาคารไทยพาณิชย์ (SCB)", account: "555-2-33344-5" },
  });

  // Electronic Signature & Confirmation state
  const [sigName, setSigName] = useState(eSignatureName || "พ.ท. วีรชาติ ภักดีสยาม");
  const [sigPosition, setSigPosition] = useState(eSignaturePosition || "นายทหารกำลังพล ฝ่ายสวัสดิการ");
  const [sigConfirmed, setSigConfirmed] = useState(true);
  const [applicationNotes, setApplicationNotes] = useState(
    "ยื่นเรื่องขอรับสิทธิและสวัสดิการตามผลการประมาณการสิทธิ 4 หมวดของ ทบ. โดยมีเอกสารหลักฐานรับรองการสูญเสียจากการปฏิบัติหน้าที่ราชการสนามครบถ้วน"
  );

  // Calculate totals based on selected categories
  const selectedTotalLumpSum = selectedPrograms.lumpSum ? calculationResult?.grandTotalLumpSum || 0 : 0;
  const selectedTotalMonthly = selectedPrograms.monthlyPension ? calculationResult?.grandTotalMonthlyPension || 0 : 0;
  const selectedTotalScholarship = selectedPrograms.annualScholarship ? calculationResult?.grandTotalAnnualScholarship || 0 : 0;

  // File upload simulation / handler
  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentsList((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "ATTACHED",
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                fileDataUrl: String(reader.result || ""),
              }
            : doc
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleToggleDocStatus = (docId: string, newStatus: "ATTACHED" | "PENDING" | "NOT_APPLICABLE") => {
    setDocumentsList((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status: newStatus } : doc))
    );
  };

  const handleRemoveDocFile = (docId: string) => {
    setDocumentsList((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "PENDING",
              fileName: undefined,
              fileSize: undefined,
              uploadedAt: undefined,
              fileDataUrl: undefined,
            }
          : doc
      )
    );
  };

  // Check required documents completion
  const requiredDocsTotal = documentsList.filter((d) => d.required).length;
  const requiredDocsAttached = documentsList.filter((d) => d.required && d.status === "ATTACHED").length;
  const isDocsComplete = requiredDocsAttached >= requiredDocsTotal;

  // Handle final submission to backend API
  const handleFormalSubmit = async () => {
    if (!sigConfirmed) {
      setSubmitError("กรุณาคลิกยอมรับและยืนยันความถูกต้องของข้อมูลก่อนดำเนินการ");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build structured payload for backend
      const trackingPayload = {
        citizenNationalId: (personnel as any)?.citizenId || (personnel as any)?.idCardNo || applicantNationalId,
        citizenData: {
          title: "",
          firstName: personnel?.firstName || "กำลังพล",
          lastName: personnel?.lastName || "ผู้สูญเสีย",
          dateOfBirth: (personnel as any)?.birthDate || (personnel as any)?.appointmentDate || "1990-01-01",
          gender: "MALE",
          phone: applicantPhone,
          address: applicantAddress,
          subdistrict: "-",
          district: "-",
          province: (personnel as any)?.province || "กรุงเทพมหานคร",
          postalCode: "10100",
          monthlyIncome: personnel?.salary || 0,
          hasStateWelfareCard: false,
          isDisabilityRegistered: personnel?.lossType === "DISABLED",
          livingCondition: "FAMILY",
        },
        programId: "prog-001", // Default Army Benefit Program ID or auto-resolved
        requestedAmount: selectedTotalLumpSum,
        applicantRemarks: applicationNotes,
        documents: {
          requestFiles: documentsList
            .filter((d) => d.status === "ATTACHED")
            .map((d) => ({
              name: d.fileName || d.name,
              code: d.code,
              type: "application/pdf",
              size: d.fileSize || 1024 * 200,
              uploadedAt: d.uploadedAt || new Date().toISOString(),
              stage: "REQUEST",
              uploadedBy: applicantName,
              notes: d.notes,
            })),
          militaryCasualtyMetadata: {
            militaryId: personnel?.militaryId,
            fullName: `${personnel?.rank || ""} ${personnel?.firstName || ""} ${personnel?.lastName || ""}`,
            rankAbbr: personnel?.rankAbbr || personnel?.rank,
            lossType: personnel?.lossType,
            incidentDate: (personnel as any)?.incidentDate || (personnel as any)?.lossIncidentDate,
            normalUnit: personnel?.normalUnit || (personnel as any)?.department || (personnel as any)?.unit || "-",
            fieldUnit: personnel?.fieldUnit || "-",
            baseSalary: personnel?.salary,
            totalServiceYears: calculationResult?.personnelSummary?.totalServiceYears,
          },
          benefitCategoriesBreakdown: {
            lumpSumTotal: selectedTotalLumpSum,
            monthlyPensionTotal: selectedTotalMonthly,
            annualScholarshipTotal: selectedTotalScholarship,
            nonMonetaryCount: calculationResult?.nonMonetaryRightsCount || 1,
            successorJobRightEligible: calculationResult?.successorJobRight?.isEligible || false,
            selectedCategories: selectedPrograms,
          },
          heirDisbursementInfo: {
            applicantRole,
            applicantName,
            applicantNationalId,
            applicantPhone,
            applicantEmail,
            primaryBank: primaryBankName,
            primaryAccount: primaryBankAccount,
            primaryAccountName,
            heirAccounts,
          },
          electronicSignature: {
            signedByName: sigName,
            position: sigPosition,
            signedAt: new Date().toISOString(),
            verificationCode: `RTA-CLAIM-${Date.now().toString().slice(-6)}`,
            hash: `SHA256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          },
        },
      };

      // Call API /api/applications (and it will create claim and trigger tracking)
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "เกิดข้อผิดพลาดในการส่งคำขอ");
      }

      // Also trigger /api/benefit-tracking/propose if applicable to ensure full tracking records
      try {
        await fetch("/api/benefit-tracking/propose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            citizenNationalId: (personnel as any)?.citizenId || (personnel as any)?.idCardNo || applicantNationalId,
            notes: `เสนอขอรับสิทธิและสวัสดิการกำลังพล: ${personnel?.rank || ""} ${personnel?.firstName || ""} ${personnel?.lastName || ""} (ยอดเงินก้อน ${formatCurrency(selectedTotalLumpSum)})`,
            documents: trackingPayload.documents,
          }),
        });
      } catch (trackErr) {
        console.warn("Could not sync tracking propose:", trackErr);
      }

      const createdApp = json.data;
      const trackingNumber = createdApp.applicationNumber || `RTA-APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      setSubmissionSuccessData({
        applicationId: createdApp.id,
        applicationNumber: trackingNumber,
        submissionDate: new Date().toISOString(),
        applicantName,
        personnelName: `${personnel?.rank || ""} ${personnel?.firstName || ""} ${personnel?.lastName || ""}`,
        requestedLumpSum: selectedTotalLumpSum,
        requestedMonthly: selectedTotalMonthly,
        requestedScholarship: selectedTotalScholarship,
        docsCount: documentsList.filter((d) => d.status === "ATTACHED").length,
      });

      setCurrentStep(5); // Move to success step
      if (onSuccess) onSuccess(createdApp);
    } catch (err: any) {
      setSubmitError(err.message || "เกิดข้อผิดพลาดในการยื่นคำขอ");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintTrackingSlip = () => {
    window.print();
  };

  const handleResetForm = () => {
    setCurrentStep(1);
    setSubmissionSuccessData(null);
    setSubmitError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <DialogHeader className="border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>ขั้นตอนการเสนอขอรับสิทธิและสวัสดิการกองทัพบก</span>
                  <Badge variant="success" className="text-[11px] font-medium">
                    Integrated Workflow
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ยื่นเรื่องพร้อมเอกสารหลักฐานประกอบการขอรับสิทธิตามผลการประมาณการสิทธิ 4 หมวด
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Stepper Wizard Progress Bar */}
          {currentStep < 5 && (
            <div className="pt-4">
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    currentStep === 1
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                      : currentStep > 1
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep > 1 ? "bg-emerald-600 text-white" : currentStep === 1 ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                  }`}>
                    {currentStep > 1 ? "✓" : "1"}
                  </span>
                  <span className="truncate">1. ตรวจสอบสิทธิ 4 หมวด</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    currentStep === 2
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                      : currentStep > 2
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep > 2 ? "bg-emerald-600 text-white" : currentStep === 2 ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                  }`}>
                    {currentStep > 2 ? "✓" : "2"}
                  </span>
                  <span className="truncate">2. เอกสารหลักฐาน</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    currentStep === 3
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                      : currentStep > 3
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep > 3 ? "bg-emerald-600 text-white" : currentStep === 3 ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                  }`}>
                    {currentStep > 3 ? "✓" : "3"}
                  </span>
                  <span className="truncate">3. ผู้ยื่น & บัญชีโอน</span>
                </div>

                <div
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    currentStep === 4
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep === 4 ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"
                  }`}>
                    4
                  </span>
                  <span className="truncate">4. ยืนยัน & ลงนาม</span>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* ================= STEP 1: REVIEW 4-CATEGORY ENTITLEMENTS ================= */}
        {currentStep === 1 && (
          <div className="space-y-4 py-2">
            {/* Personnel Info Header Box */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {personnel?.rank} {personnel?.firstName} {personnel?.lastName}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    (ทบ. {personnel?.militaryId || "-"})
                  </span>
                </div>
                <Badge variant={personnel?.lossType === "DEATH" ? "destructive" : "warning"} className="text-[11px]">
                  {personnel?.lossType === "DEATH" ? "เสียชีวิตในการปฏิบัติหน้าที่ราชการสนาม" : "ทุพพลภาพ/บาดเจ็บจากการสู้รบ"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-slate-400 block text-[11px]">สังกัดปกติ:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {personnel?.normalUnit || (personnel as any)?.department || (personnel as any)?.unit || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">หน่วยสนาม:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{personnel?.fieldUnit || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">วันที่เกิดเหตุ:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {(personnel as any)?.incidentDate || (personnel as any)?.lossIncidentDate
                      ? formatThaiDate(((personnel as any)?.incidentDate || (personnel as any)?.lossIncidentDate)!)
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">เวลาราชการรวมทวีคูณ:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300 font-bold">
                    {calculationResult?.personnelSummary?.totalServiceYears || 0} ปี
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Category Summary Grid & Select */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  เลือกรายการสิทธิและสวัสดิการ 4 หมวดที่ต้องการเสนอขอในคำขอนี้
                </h4>
                <span className="text-[11px] text-slate-500">
                  (ทำเครื่องหมายถูกเพื่อรวมในคำขอรับสิทธินี้)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category 1: Lump Sum */}
                <Card className={`p-3.5 border transition-all ${
                  selectedPrograms.lumpSum ? "border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20" : "border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.lumpSum}
                        onChange={(e) => setSelectedPrograms({ ...selectedPrograms, lumpSum: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                          หมวด 1: เงินก้อนจ่ายครั้งเดียว
                        </span>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300">
                          (บำเหน็จตกทอด, เงินช่วยพิเศษ 3 เดือน, สินไหมประกันภัย, เงินสงเคราะห์ ทบ.)
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-900 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">ยอดเงินก้อนรวม:</span>
                    <span className="text-base font-bold text-blue-700 dark:text-blue-300 font-mono">
                      {formatCurrency(calculationResult?.grandTotalLumpSum || 0)}
                    </span>
                  </div>
                </Card>

                {/* Category 2: Monthly Pension */}
                <Card className={`p-3.5 border transition-all ${
                  selectedPrograms.monthlyPension ? "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20" : "border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.monthlyPension}
                        onChange={(e) => setSelectedPrograms({ ...selectedPrograms, monthlyPension: e.target.checked })}
                        className="rounded border-slate-300 text-amber-600 h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                          หมวด 2: เงินบำนาญพิเศษและรายเดือน
                        </span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-300">
                          (บำนาญพิเศษ, เงินเพิ่ม ช.ค.บ., บำเหน็จดำรงชีพ)
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-900 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">ยอดรายเดือนรวม:</span>
                    <span className="text-base font-bold text-amber-700 dark:text-amber-300 font-mono">
                      {formatCurrency(calculationResult?.grandTotalMonthlyPension || 0)} / เดือน
                    </span>
                  </div>
                </Card>

                {/* Category 3: Annual Scholarship */}
                <Card className={`p-3.5 border transition-all ${
                  selectedPrograms.annualScholarship ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/20" : "border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.annualScholarship}
                        onChange={(e) => setSelectedPrograms({ ...selectedPrograms, annualScholarship: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                          หมวด 3: ทุนการศึกษาบุตรรายปี
                        </span>
                        <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                          (ทุนการศึกษารายปีจนจบปริญญาตรี หรืออายุ 25 ปี)
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-900 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">ยอดทุนการศึกษารวม:</span>
                    <span className="text-base font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                      {formatCurrency(calculationResult?.grandTotalAnnualScholarship || 0)} / ปี
                    </span>
                  </div>
                </Card>

                {/* Category 4: Non-monetary Rights */}
                <Card className={`p-3.5 border transition-all ${
                  selectedPrograms.nonMonetaryRights ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-slate-200 opacity-60"
                }`}>
                  <div className="flex items-start justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.nonMonetaryRights}
                        onChange={(e) => setSelectedPrograms({ ...selectedPrograms, nonMonetaryRights: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                          หมวด 4: สิทธิมิใช่ตัวเงิน (บรรจุทายาท)
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          (สิทธิบรรจุทายาททดแทน 1 อัตรา, บัตร ผศ., สิทธิรักษาพยาบาล)
                        </span>
                      </div>
                    </label>
                  </div>
                  <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-900 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">สิทธิบรรจุทายาททดแทน:</span>
                    <Badge variant="success" className="text-[10px]">
                      มีสิทธิ 1 อัตรา
                    </Badge>
                  </div>
                </Card>
              </div>

              {/* Total Requested Summary Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-xs text-slate-300 block">ยอดรวมสิทธิและสวัสดิการที่เสนอขอในคำขอนี้</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-emerald-400 font-mono">
                      {formatCurrency(selectedTotalLumpSum)}
                    </span>
                    <span className="text-xs text-slate-300">(เงินก้อน)</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      + {formatCurrency(selectedTotalMonthly)}/เดือน
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
                >
                  ถัดไป: ตรวจสอบเอกสารหลักฐาน
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DOCUMENTS & EVIDENCE CHECKLIST ================= */}
        {currentStep === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    ความพร้อมของเอกสารหลักฐานประกอบการขอรับสิทธิ
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    เอกสารที่จำเป็น: {requiredDocsAttached} / {requiredDocsTotal} รายการ (
                    {isDocsComplete ? "พร้อมยื่นเรื่องครบถ้วน" : "รอแนบเอกสารเพิ่มเติม"})
                  </span>
                </div>
              </div>
              <Badge variant={isDocsComplete ? "success" : "warning"} className="text-xs font-bold">
                {isDocsComplete ? "✓ เอกสารจำเป็นครบถ้วน" : "⚠ ยังขาดเอกสารบางรายการ"}
              </Badge>
            </div>

            {/* Document Checklist Items */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {documentsList.map((doc, idx) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    doc.status === "ATTACHED"
                      ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 shadow-sm"
                      : doc.status === "PENDING"
                      ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                      : "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {doc.name}
                        </span>
                        {doc.required ? (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            เอกสารจำเป็น
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500">
                            เอกสารเสริม
                          </Badge>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          หมายเหตุ: {doc.notes}
                        </p>
                      )}
                    </div>

                    {/* Status & Attachment Controls */}
                    <div className="flex items-center gap-2">
                      <select
                        value={doc.status}
                        onChange={(e) => handleToggleDocStatus(doc.id, e.target.value as any)}
                        className="text-[11px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      >
                        <option value="ATTACHED">แนบเอกสารแล้ว</option>
                        <option value="PENDING">รอเอกสารเพิ่มเติม</option>
                        <option value="NOT_APPLICABLE">ไม่เข้าเงื่อนไข/ยกเว้น</option>
                      </select>

                      {doc.fileName ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-800 text-[11px] font-mono">
                          <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="max-w-[150px] truncate">{doc.fileName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocFile(doc.id)}
                            className="text-rose-500 hover:text-rose-700 ml-1"
                            title="ลบไฟล์"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px] transition-all">
                          <Upload className="h-3.5 w-3.5 text-slate-500" />
                          <span>เลือกไฟล์แนบ</span>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
              >
                ถัดไป: ระบุข้อมูลผู้ยื่นและบัญชีรับโอนเงิน
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: APPLICANT & DISBURSEMENT INFO ================= */}
        {currentStep === 3 && (
          <div className="space-y-4 py-2">
            {/* Applicant Profile */}
            <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                ข้อมูลผู้ยื่นเรื่องขอรับสิทธิและสวัสดิการ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ความสัมพันธ์กับกำลังพล</Label>
                  <select
                    value={applicantRole}
                    onChange={(e) => setApplicantRole(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                  >
                    <option value="SPOUSE">คู่สมรสถูกต้องตามกฎหมาย</option>
                    <option value="CHILD">บุตรผู้มีสิทธิ</option>
                    <option value="PARENT">บิดา / มารดา</option>
                    <option value="OFFICER">นายทหารกำลังพล/ธุรการต้นสังกัด</option>
                    <option value="SELF">ตนเอง (กำลังพลที่ได้รับบาดเจ็บ)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ชื่อ-นามสกุล ผู้ยื่นเรื่อง</Label>
                  <Input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="text-xs"
                    placeholder="เช่น นางพิมพา ภักดีสยาม"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">เลขประจำตัวประชาชน (13 หลัก)</Label>
                  <Input
                    value={applicantNationalId}
                    onChange={(e) => setApplicantNationalId(e.target.value)}
                    className="text-xs font-mono"
                    maxLength={13}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">เบอร์โทรศัพท์ติดต่อ</Label>
                  <Input
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">อีเมล</Label>
                  <Input
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-[11px] font-bold">ที่อยู่ติดต่อปัจจุบัน</Label>
                  <Input
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* Primary Disbursement Bank Account */}
            <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                บัญชีเงินฝากธนาคารหลักสำหรับรับโอนเงินสิทธิประโยชน์
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ธนาคารรับเงินโอน</Label>
                  <select
                    value={primaryBankName}
                    onChange={(e) => setPrimaryBankName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                  >
                    <option value="ธนาคารทหารไทยธนชาต (TTB)">ธนาคารทหารไทยธนชาต (TTB) *แนะนำ</option>
                    <option value="ธนาคารกรุงไทย (KTB)">ธนาคารกรุงไทย (KTB)</option>
                    <option value="ธนาคารไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="ธนาคารกสิกรไทย (KBANK)">ธนาคารกสิกรไทย (KBANK)</option>
                    <option value="ธนาคารออมสิน (GSB)">ธนาคารออมสิน (GSB)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">เลขที่บัญชีเงินฝาก</Label>
                  <Input
                    value={primaryBankAccount}
                    onChange={(e) => setPrimaryBankAccount(e.target.value)}
                    className="text-xs font-mono"
                    placeholder="xxx-x-xxxxx-x"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ชื่อบัญชี</Label>
                  <Input
                    value={primaryAccountName}
                    onChange={(e) => setPrimaryAccountName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* Heir Allocation Breakdown Table */}
            {calculationResult?.heirDistribution && calculationResult.heirDistribution.length > 0 && (
              <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    สัดส่วนการแบ่งจ่ายเงินให้ทายาทตามกฎหมาย (Heirs Share Distribution)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    คำนวณตาม พ.ร.บ. บำเหน็จบำนาญข้าราชการ
                  </Badge>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-[11px]">
                        <th className="py-1.5 px-2">ชื่อทายาท</th>
                        <th className="py-1.5 px-2">ความสัมพันธ์</th>
                        <th className="py-1.5 px-2 text-center">สัดส่วน</th>
                        <th className="py-1.5 px-2 text-right">เงินก้อนที่ได้รับ</th>
                        <th className="py-1.5 px-2 text-right">บำนาญรายเดือน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {calculationResult.heirDistribution.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="py-1.5 px-2 font-medium">{h.heirName}</td>
                          <td className="py-1.5 px-2 text-slate-500">{h.relationship}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-600">
                            {h.sharePercentage}%
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-semibold">
                            {formatCurrency(h.allocatedLumpSum)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-amber-600 font-semibold">
                            {h.allocatedMonthlyPension > 0 ? `${formatCurrency(h.allocatedMonthlyPension)}/ด.` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
              >
                ถัดไป: ตรวจสอบและลงนามอิเล็กทรอนิกส์
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SIGNATURE & FINAL CONFIRMATION ================= */}
        {currentStep === 4 && (
          <div className="space-y-4 py-2">
            {/* Executive Summary Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-bold">
                    สรุปใบคำขอเสนอรับสิทธิและสวัสดิการกองทัพบก (Official Claim Summary)
                  </span>
                </div>
                <Badge variant="outline" className="border-emerald-400 text-emerald-400 text-[10px]">
                  พร้อมยื่นเรื่อง
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">กำลังพล:</span>
                  <span className="font-bold">{personnel?.rank} {personnel?.firstName} {personnel?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ผู้ยื่นคำขอ:</span>
                  <span className="font-bold">{applicantName} ({applicantRole === "SPOUSE" ? "คู่สมรส" : applicantRole === "CHILD" ? "บุตร" : "ทายาท"})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">เงินก้อนที่เสนอขอ:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedTotalLumpSum)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">เงินรายเดือนที่เสนอขอ:</span>
                  <span className="font-mono font-bold text-amber-300">{formatCurrency(selectedTotalMonthly)} / ด.</span>
                </div>
              </div>
            </div>

            {/* Electronic Signature & Remarks */}
            <Card className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                การลงนามลายเซ็นอิเล็กทรอนิกส์และหมายเหตุคำขอ (E-Signature)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ชื่อผู้ลงนามรับรองคำขอ</Label>
                  <Input
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    className="text-xs font-medium"
                    placeholder="เช่น พ.ท. วีรชาติ ภักดีสยาม"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold">ตำแหน่ง / หน่วยงาน</Label>
                  <Input
                    value={sigPosition}
                    onChange={(e) => setSigPosition(e.target.value)}
                    className="text-xs"
                    placeholder="เช่น นายทหารฝ่ายสวัสดิการ กองทัพบก"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold">ข้อความบันทึกเสนอผู้บังคับบัญชา / หมายเหตุประกอบคำขอ</Label>
                  <textarea
                    rows={2}
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sigConfirmed}
                    onChange={(e) => setSigConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-emerald-600 rounded border-slate-300"
                  />
                  <span>
                    ข้าพเจ้าขอรับรองว่าข้อมูลสิทธิและเอกสารหลักฐานทั้งหมดเป็นความจริง ถูกต้องตามระเบียบกระทรวงกลาโหมและกองทัพบกทุกประการ และยินยอมให้ใช้ลายเซ็นอิเล็กทรอนิกส์นี้ในการดำเนินการเสนอขอรับสิทธิตามกฎหมาย
                  </span>
                </label>
              </div>
            </Card>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="text-xs gap-1.5"
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
              <Button
                onClick={handleFormalSubmit}
                disabled={submitting || !sigConfirmed}
                className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs gap-2 font-bold px-6 py-2.5 shadow-md"
              >
                {submitting ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    กำลังบันทึกและยื่นคำขอ...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ยืนยันการเสนอขอรับสิทธิและสวัสดิการ
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: SUCCESS STATE ================= */}
        {currentStep === 5 && submissionSuccessData && (
          <div className="space-y-5 py-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ยื่นเรื่องเสนอขอรับสิทธิและสวัสดิการสำเร็จเรียบร้อยแล้ว
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ระบบได้บันทึกคำขอรับสิทธิ พร้อมแนบเอกสารหลักฐานและสร้างรายการติดตามสถานะในระบบแล้ว
              </p>
            </div>

            {/* Reference Tracking Box */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">เลขที่อ้างอิงคำขอ (Tracking No.):</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  {submissionSuccessData.applicationNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">กำลังพลผู้สูญเสีย:</span>
                <span className="font-bold">{submissionSuccessData.personnelName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ผู้ยื่นคำขอ:</span>
                <span className="font-medium">{submissionSuccessData.applicantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ยอดเงินก้อนที่เสนอขอ:</span>
                <span className="font-mono font-bold text-blue-600">{formatCurrency(submissionSuccessData.requestedLumpSum)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ยอดเงินรายเดือน:</span>
                <span className="font-mono font-bold text-amber-600">{formatCurrency(submissionSuccessData.requestedMonthly)}/เดือน</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">เอกสารหลักฐานที่แนบ:</span>
                <span className="font-medium text-emerald-700">{submissionSuccessData.docsCount} รายการ</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t">
                <span>วันที่และเวลายื่นเรื่อง:</span>
                <span>{formatThaiDate(submissionSuccessData.submissionDate)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintTrackingSlip}
                className="text-xs gap-1.5"
              >
                <Printer className="h-4 w-4" />
                พิมพ์ใบนัดรับเรื่องและติดตามคำขอ
              </Button>

              <Link href="/benefit-tracking">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 shadow">
                  <ExternalLink className="h-4 w-4" />
                  ไปที่ระบบติดตามสถานะสิทธิ (Benefit Tracking)
                </Button>
              </Link>

              <Link href="/applications">
                <Button className="bg-slate-800 hover:bg-slate-900 text-white text-xs gap-1.5 shadow">
                  <FileText className="h-4 w-4" />
                  ไปที่รายการคำขอ (Applications)
                </Button>
              </Link>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetForm}
                className="text-xs"
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
