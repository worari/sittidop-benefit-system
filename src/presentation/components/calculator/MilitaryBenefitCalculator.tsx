"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import {
  MilitaryBenefitCalculationResult,
  BenefitCategoryCode,
  BenefitScopeComparison,
} from "@/core/domain/value-objects/military-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Progress } from "@/presentation/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/presentation/components/ui/tabs";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  calculateServiceTime,
  calculateTotalServiceTime,
  formatServiceTime,
  formatThaiBE,
} from "@/presentation/lib/military-date-utils";
import { formatSalaryStep, getSalaryAmount, normalizeSalaryLevel, SALARY_LEVEL_OPTIONS, SALARY_STEP_OPTIONS } from "@/presentation/lib/salary-scale";
import { ThaiBuddhistDatePicker } from "./ThaiBuddhistDatePicker";
import { LossIncidentReportManager } from "./LossIncidentReportManager";
import {
  Calculator,
  Shield,
  Award,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  HeartHandshake,
  RotateCcw,
  Sliders,
  DollarSign,
  Coins,
  Calendar,
  CalendarDays,
  Gift,
  Activity,
  Scale,
  Building2,
  Landmark,
  Search,
  Plus,
  PencilLine,
  Trash2,
  RefreshCw,
  Database,
  FileDown,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

const RANK_OPTIONS = [
  { value: "GENERAL", label: "พลเอก (พล.อ.)" },
  { value: "LIEUTENANT_GENERAL", label: "พลโท (พล.ท.)" },
  { value: "MAJOR_GENERAL", label: "พลตรี (พล.ต.)" },
  { value: "COLONEL", label: "พันเอก (พ.อ.)" },
  { value: "COLONEL_SPECIAL", label: "พันเอกพิเศษ (พ.อ.พิเศษ)" },
  { value: "LIEUTENANT_COLONEL", label: "พันโท (พ.ท.)" },
  { value: "MAJOR", label: "พันตรี (พ.ต.)" },
  { value: "CAPTAIN", label: "ร้อยเอก (ร.อ.)" },
  { value: "FIRST_LIEUTENANT", label: "ร้อยโท (ร.ท.)" },
  { value: "SECOND_LIEUTENANT", label: "ร้อยตรี (ร.ต.)" },
  { value: "MASTER_SERGEANT_1ST", label: "จ่าสิบเอก (จ.ส.อ.)" },
  { value: "MASTER_SERGEANT_2ND", label: "จ่าสิบโท (จ.ส.ท.)" },
  { value: "MASTER_SERGEANT_3RD", label: "จ่าสิบตรี (จ.ส.ต.)" },
  { value: "SERGEANT", label: "สิบเอก (ส.อ.)" },
  { value: "CORPORAL", label: "สิบโท (ส.ท.)" },
  { value: "LANCE_CORPORAL", label: "สิบตรี (ส.ต.)" },
  { value: "PRIVATE", label: "พลทหาร (พลฯ)" },
  { value: "VOLUNTEER_RANGER", label: "อาสาสมัครทหารพราน (อส.)" },
];

const SPECIAL_PENSION_TIERS = [9, 8, 7, 5];

export function MilitaryBenefitCalculator() {
  const [step, setStep] = useState(1);
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");

  // Form State
  const [militaryId, setMilitaryId] = useState("MIL-49021884");
  const [rank, setRank] = useState("LIEUTENANT_COLONEL");
  const [rankAbbr, setRankAbbr] = useState("พ.ท.");
  const [firstName, setFirstName] = useState("วีรชาติ");
  const [lastName, setLastName] = useState("ภักดีสยาม");
  const [normalUnit, setNormalUnit] = useState("ร.19 พัน.1 (พล.ร.9)");
  const [fieldUnit, setFieldUnit] = useState("ฉก.นราธิวาส (กกล.ทบ.)");
  const [salary, setSalary] = useState(() => getSalaryAmount("น.3", 21.5));
  const [salaryLevel, setSalaryLevel] = useState("น.3");
  const [salaryStep, setSalaryStep] = useState(21.5);
  const [compensationLevel, setCompensationLevel] = useState("");
  const [compensationAmount, setCompensationAmount] = useState(5000);
  const [additionalPay, setAdditionalPay] = useState(2500);

  // Dates
  const [appointmentDate, setAppointmentDate] = useState<string>("2010-05-01");
  const [incidentDate, setIncidentDate] = useState<string | undefined>("2026-03-12");
  const [multiplierYears, setMultiplierYears] = useState(8);
  const [multiplierMonths, setMultiplierMonths] = useState(0);
  const [multiplierDays, setMultiplierDays] = useState(0);

  // Service time (auto-calculated)
  const [serviceYearsNormal, setServiceYearsNormal] = useState(16);
  const [serviceMonthsNormal, setServiceMonthsNormal] = useState(0);
  const [serviceDaysNormal, setServiceDaysNormal] = useState(0);
  const [serviceYearsMultiplier, setServiceYearsMultiplier] = useState(8);
  const [serviceMonthsMultiplier, setServiceMonthsMultiplier] = useState(0);
  const [serviceDaysMultiplier, setServiceDaysMultiplier] = useState(0);
  const [totalServiceYears, setTotalServiceYears] = useState(24);
  const [totalServiceMonths, setTotalServiceMonths] = useState(0);
  const [totalServiceDays, setTotalServiceDays] = useState(0);

  // Special pension / promotion
  const [specialPensionType, setSpecialPensionType] = useState<"EMERGENCY_TIME" | "NORMAL_TIME">("NORMAL_TIME");
  const [specialPensionTier, setSpecialPensionTier] = useState(7);
  const [rankAppointmentTo, setRankAppointmentTo] = useState("พลเอก");
  const [salaryLevelAdjustment, setSalaryLevelAdjustment] = useState("");

  const [missionType, setMissionType] = useState("COUNTER_INSURGENCY");
  const [lossType, setLossType] = useState("KIA_COMBAT_DEATH");
  const [promotedRank, setPromotedRank] = useState("GENERAL");
  const [promotedRankAbbr, setPromotedRankAbbr] = useState("พล.อ.");
  const [promotedSalary, setPromotedSalary] = useState(68500);

  const [benefitScope, setBenefitScope] = useState<"IN_ARMY" | "OUTSIDE_ARMY" | "BOTH">("BOTH");
  const [actionCause, setActionCause] = useState<"ENEMY_ACTION" | "NON_ENEMY_ACTION" | "BOTH">("ENEMY_ACTION");
  const [personnelCategory, setPersonnelCategory] = useState<string>("COMMISSIONED_OFFICER");

  // Hospital Stay dates
  const [hospitalAdmissionDate, setHospitalAdmissionDate] = useState("2026-03-12");
  const [hospitalDischargeDate, setHospitalDischargeDate] = useState("2026-03-27");

  const [hasSpouse, setHasSpouse] = useState(true);
  const [spouseName, setSpouseName] = useState("นางพิมพา ภักดีสยาม");
  const [childrenCount, setChildrenCount] = useState(2);
  const [studyingChildrenCount, setStudyingChildrenCount] = useState(2);

  const [calculationResult, setCalculationResult] = useState<MilitaryBenefitCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeComparisonTab, setActiveComparisonTab] = useState<"IN_ARMY" | "OUTSIDE_ARMY">("IN_ARMY");
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);
  const [documentConfirmed, setDocumentConfirmed] = useState(false);
  const [eSignatureName, setESignatureName] = useState("");
  const [eSignaturePosition, setESignaturePosition] = useState("เจ้าหน้าที่ผู้จัดทำประมาณการสิทธิ");
  const [reportRemark, setReportRemark] = useState("");
  const [exportMsg, setExportMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastVerification, setLastVerification] = useState<{ code: string; hash: string; verifyUrl: string; format: "pdf" | "docx" } | null>(null);

  // Personnel CRUD state
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setPersonnelList(json.data);
          loadPersonnelData(json.data[0]);
        }
      });
  }, []);

  // Auto-calculate service time when dates change
  useEffect(() => {
    const endDate = incidentDate;
    const normal = calculateServiceTime(appointmentDate, endDate);
    const multiplier = {
      years: Number(multiplierYears) || 0,
      months: Number(multiplierMonths) || 0,
      days: Number(multiplierDays) || 0,
    };
    const total = calculateTotalServiceTime(normal, multiplier, { multiplierFactor: 2 });

    setServiceYearsNormal(normal.years);
    setServiceMonthsNormal(normal.months);
    setServiceDaysNormal(normal.days);
    setServiceYearsMultiplier(multiplier.years);
    setServiceMonthsMultiplier(multiplier.months);
    setServiceDaysMultiplier(multiplier.days);
    setTotalServiceYears(total.years);
    setTotalServiceMonths(total.months);
    setTotalServiceDays(total.days);
  }, [appointmentDate, incidentDate, multiplierYears, multiplierMonths, multiplierDays]);

  // Auto-update promoted salary when tier changes
  useEffect(() => {
    setPromotedSalary(Math.round(salary * (1 + specialPensionTier * 0.08)));
  }, [salary, specialPensionTier]);

  // Auto-update rank abbreviation when rank changes
  useEffect(() => {
    const found = RANK_OPTIONS.find((r) => r.value === rank);
    if (found) {
      const abbrMatch = found.label.match(/\(([^)]+)\)/);
      setRankAbbr(abbrMatch ? abbrMatch[1] : found.value);
    }
  }, [rank]);

  const loadPersonnelData = (p: MilitaryPersonnelRecord) => {
    setSelectedPersonnelId(p.id);
    setMilitaryId(p.militaryId);
    setRank(p.rank);
    setRankAbbr(p.rankAbbr);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setNormalUnit(p.normalUnit);
    setFieldUnit(p.fieldUnit || p.normalUnit);
    setSalary(p.salary);
    setSalaryLevel(normalizeSalaryLevel(p.salaryLevel));
    setSalaryStep(p.salaryStep);
    setCompensationLevel(p.compensationLevel || "");
    setCompensationAmount(p.compensationAmount || 0);
    setAdditionalPay(p.additionalPay || 0);
    setAppointmentDate(p.appointmentDate);
    setIncidentDate(p.incidentDate);
    setServiceYearsNormal(p.serviceYearsNormal);
    setServiceMonthsNormal(p.serviceMonthsNormal || 0);
    setServiceDaysNormal(p.serviceDaysNormal || 0);
    setServiceYearsMultiplier(p.serviceYearsMultiplier);
    setServiceMonthsMultiplier(p.serviceMonthsMultiplier || 0);
    setServiceDaysMultiplier(p.serviceDaysMultiplier || 0);
    setTotalServiceYears(p.totalServiceYears);
    setTotalServiceMonths(p.totalServiceMonths || 0);
    setTotalServiceDays(p.totalServiceDays || 0);
    setSpecialPensionType(p.specialPensionType || "NORMAL_TIME");
    setSpecialPensionTier(p.specialPensionTier || p.promotionSteps || 7);
    setRankAppointmentTo(p.rankAppointmentTo || "");
    setSalaryLevelAdjustment(p.salaryLevelAdjustment || "");
    setMissionType(p.missionType);
    setLossType(p.lossType);
    setBenefitScope(p.benefitScope || "BOTH");
    setActionCause(p.actionCause || "ENEMY_ACTION");
    setSpecialPensionTier(p.specialPensionTier || p.promotionSteps || 7);
    setPromotedRank(p.promotedRank || "GENERAL");
    setPromotedRankAbbr(p.promotedRankAbbr || "พล.อ.");
    setPromotedSalary(p.promotedSalary || Math.round(p.salary * 1.55));
    setHasSpouse(!!p.spouse);
    setSpouseName(p.spouse?.fullName || "");
    setChildrenCount(p.children?.length || 0);
    setStudyingChildrenCount(p.children?.filter((c) => c.isStudying)?.length || 0);
    setHospitalAdmissionDate(p.hospitalAdmissionDate || "");
    setHospitalDischargeDate(p.hospitalDischargeDate || "");
    setMultiplierYears(p.serviceYearsMultiplier || 0);
    setMultiplierMonths(p.serviceMonthsMultiplier || 0);
    setMultiplierDays(p.serviceDaysMultiplier || 0);
  };

  const buildPersonnelPayload = () => {
    return {
      militaryId,
      citizenId: `CIT-${militaryId}`,
      rank,
      rankAbbr,
      firstName: firstName.trim() || "กำลังพล",
      lastName: lastName.trim() || "ไทย",
      militaryBranch: "ROYAL_THAI_ARMY",
      benefitScope,
      actionCause,
      missionType,
      personnelCategory,
      lossType,
      abbreviatedPosition: "ผบ.พัน.สน.",
      normalUnit,
      fieldPosition: "ผบ.ฉก.",
      fieldUnit,
      salary: Number(salary),
      salaryLevel,
      salaryStep: Number(salaryStep),
      compensationLevel,
      compensationAmount: Number(compensationAmount),
      additionalPay: Number(additionalPay),
      appointmentDate,
      incidentDate,
      serviceYearsNormal: Number(serviceYearsNormal),
      serviceMonthsNormal: Number(serviceMonthsNormal),
      serviceDaysNormal: Number(serviceDaysNormal),
      serviceYearsMultiplier: Number(serviceYearsMultiplier),
      serviceMonthsMultiplier: Number(serviceMonthsMultiplier),
      serviceDaysMultiplier: Number(serviceDaysMultiplier),
      totalServiceYears: Number(totalServiceYears),
      totalServiceMonths: Number(totalServiceMonths),
      totalServiceDays: Number(totalServiceDays),
      actionType: "DIRECT_COMBAT",
      incidentType: "COMBAT_ENGAGEMENT",
      specialPensionType,
      specialPensionTier: Number(specialPensionTier),
      rankAppointmentTo,
      salaryLevelAdjustment,
      promotionSteps: Number(specialPensionTier),
      promotedRank,
      promotedRankAbbr,
      promotedSalary: Number(promotedSalary),
      hospitalAdmissionDate,
      hospitalDischargeDate,
      hospitalStayDays: calculateStayDays(hospitalAdmissionDate, hospitalDischargeDate),
      spouse: hasSpouse ? {
        nationalId: `SP-${militaryId}`,
        fullName: spouseName,
        isLegallyMarried: true,
        hasPensionRights: true,
        allocationPercentage: 50,
      } : null,
      children: [],
      heirs: [],
    };
  };

  const fetchPersonnel = async () => {
    const res = await fetch("/api/personnel");
    const json = await res.json();
    if (json.success) setPersonnelList(json.data);
  };

  const handleSearchPersonnel = async () => {
    try {
      const res = await fetch(`/api/personnel?search=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.success) {
        setPersonnelList(json.data);
        setActionMsg({ type: "success", text: `ค้นพบ ${json.total} รายการจากคำค้น "${searchQuery || "(ทั้งหมด)"}"` });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "ค้นหาข้อมูลไม่สำเร็จ" });
    }
  };

  const handleCreatePersonnel = async () => {
    try {
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonnelPayload()),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPersonnelId(json.data.id);
        setActionMsg({ type: "success", text: `เพิ่มกำลังพล ${json.data.rankAbbr} ${json.data.firstName} ${json.data.lastName} สำเร็จ` });
        await fetchPersonnel();
      } else {
        setActionMsg({ type: "error", text: json.error || "เพิ่มกำลังพลไม่สำเร็จ" });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "เพิ่มกำลังพลไม่สำเร็จ" });
    }
  };

  const handleUpdatePersonnel = async () => {
    if (!selectedPersonnelId) {
      setActionMsg({ type: "error", text: "กรุณาเลือกกำลังพลจากรายการก่อนแก้ไข" });
      return;
    }
    try {
      const res = await fetch(`/api/personnel/${selectedPersonnelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPersonnelPayload()),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: "success", text: "บันทึกการแก้ไขกำลังพลสำเร็จ" });
        await fetchPersonnel();
      } else {
        setActionMsg({ type: "error", text: json.error || "บันทึกการแก้ไขไม่สำเร็จ" });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "บันทึกการแก้ไขไม่สำเร็จ" });
    }
  };

  const handleDeletePersonnel = async () => {
    if (!selectedPersonnelId) {
      setActionMsg({ type: "error", text: "กรุณาเลือกกำลังพลจากรายการก่อนลบ" });
      return;
    }
    if (!window.confirm("ยืนยันการลบกำลังพลที่เลือกนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/personnel/${selectedPersonnelId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setActionMsg({ type: "success", text: "ลบกำลังพลสำเร็จ" });
        setSelectedPersonnelId("");
        await fetchPersonnel();
      } else {
        setActionMsg({ type: "error", text: json.error || "ลบกำลังพลไม่สำเร็จ" });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "ลบกำลังพลไม่สำเร็จ" });
    }
  };

  const calculateStayDays = (adm: string, dis: string) => {
    if (!adm || !dis) return 0;
    try {
      const d1 = new Date(adm);
      const d2 = new Date(dis);
      const diff = Math.abs(d2.getTime() - d1.getTime());
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const stayDays = calculateStayDays(hospitalAdmissionDate, hospitalDischargeDate);

      const payload = {
        militaryId,
        citizenId: "3100600492811",
        rank,
        rankAbbr,
        firstName: firstName.trim() || "กำลังพล",
        lastName: lastName.trim() || "ไทย",
        militaryBranch: "ROYAL_THAI_ARMY",
        abbreviatedPosition: "ผบ.พัน.สน.",
        normalUnit,
        fieldPosition: "ผบ.ฉก.",
        fieldUnit,
        salary: Number(salary),
        salaryLevel,
        salaryStep: Number(salaryStep),
        compensationLevel,
        compensationAmount: Number(compensationAmount),
        additionalPay: Number(additionalPay),
        appointmentDate,
        incidentDate,
        serviceYearsNormal: Number(serviceYearsNormal),
        serviceMonthsNormal: Number(serviceMonthsNormal),
        serviceDaysNormal: Number(serviceDaysNormal),
        serviceYearsMultiplier: Number(serviceYearsMultiplier),
        serviceMonthsMultiplier: Number(serviceMonthsMultiplier),
        serviceDaysMultiplier: Number(serviceDaysMultiplier),
        totalServiceYears: Number(totalServiceYears),
        totalServiceMonths: Number(totalServiceMonths),
        totalServiceDays: Number(totalServiceDays),
        benefitScope,
        actionCause,
        missionType,
        personnelCategory,
        lossType,
        specialPensionType,
        specialPensionTier: Number(specialPensionTier),
        rankAppointmentTo,
        salaryLevelAdjustment,
        hospitalAdmissionDate,
        hospitalDischargeDate,
        hospitalStayDays: stayDays,
        promotionSteps: Number(specialPensionTier),
        promotedRank,
        promotedRankAbbr,
        promotedSalary: Number(promotedSalary),
        spouse: hasSpouse
          ? {
            nationalId: "1100400289112",
            fullName: spouseName,
            isLegallyMarried: true,
            hasPensionRights: true,
            allocationPercentage: 50,
          }
          : null,
        children: [
          {
            nationalId: "1100400289113",
            fullName: "ด.ช.นราธิป ภักดีสยาม",
            age: 11,
            isStudying: true,
            educationLevel: "PRIMARY" as const,
            allocationPercentage: 25,
          },
          {
            nationalId: "1100400289114",
            fullName: "น.ส.กานดา ภักดีสยาม",
            age: 19,
            isStudying: true,
            educationLevel: "BACHELOR" as const,
            allocationPercentage: 25,
          },
        ],
      };

      const res = await fetch("/api/rules/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setCalculationResult(json.data);
        setStep(5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleExportEstimateReport = async (format: "pdf" | "docx") => {
    if (!calculationResult) return;

    if (!documentConfirmed) {
      setExportMsg({ type: "error", text: "กรุณาตรวจยืนยันเอกสารก่อนพิมพ์รายงาน" });
      return;
    }

    if (!eSignatureName.trim()) {
      setExportMsg({ type: "error", text: "กรุณาระบุชื่อผู้ลงนามลายเซ็นอิเล็กทรอนิกส์" });
      return;
    }

    const verificationCode = `EST-${Date.now().toString().slice(-8)}`;

    setExportingFormat(format);
    setExportMsg(null);

    try {
      const payload = {
        personnel: {
          militaryId,
          rankAbbr,
          firstName,
          lastName,
          normalUnit,
          fieldUnit,
          salary,
          promotedSalary,
          specialPensionTier,
          promotedRankAbbr,
          rankAppointmentTo,
          salaryLevelAdjustment,
          totalServiceYears,
          totalServiceMonths,
          totalServiceDays,
        },
        calculation: calculationResult,
        remarks: reportRemark,
        verification: {
          confirmed: documentConfirmed,
          signerName: eSignatureName.trim(),
          signerPosition: eSignaturePosition.trim(),
          signedAt: new Date().toISOString(),
          verificationCode,
        },
      };

      const res = await fetch("/api/calculator/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, payload }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "พิมพ์รายงานไม่สำเร็จ");
      }

      const responseCode = res.headers.get("x-verification-code") || verificationCode;
      const responseHash = res.headers.get("x-verification-hash") || "";
      const responseVerifyUrl =
        res.headers.get("x-verify-url") ||
        `${window.location.origin}/verify?code=${encodeURIComponent(responseCode)}${responseHash ? `&hash=${encodeURIComponent(responseHash)}` : ""}`;

      setLastVerification({
        code: responseCode,
        hash: responseHash,
        verifyUrl: responseVerifyUrl,
        format,
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Benefit_Estimation_${militaryId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportMsg({
        type: "success",
        text: `พิมพ์รายงานประมาณการสิทธิสำเร็จ (${format.toUpperCase()}) พร้อม e-sign โดย ${eSignatureName.trim()} | Code: ${responseCode}`,
      });
    } catch (error: any) {
      setExportMsg({ type: "error", text: error.message || "พิมพ์รายงานไม่สำเร็จ" });
    } finally {
      setExportingFormat(null);
    }
  };

  const steps = [
    { num: 1, title: "ข้อมูลกำลังพล" },
    { num: 2, title: "เวลาราชการ & ทวีคูณ" },
    { num: 3, title: "ความสูญเสีย & ปูนบำเหน็จ" },
    { num: 4, title: "ครอบครัว & ทายาท" },
    { num: 5, title: "สรุป 4 หมวดสิทธิประโยชน์" },
  ];

  const renderScopeComparison = (comparison: BenefitScopeComparison) => {
    const isInArmy = comparison.scope === "IN_ARMY";
    return (
      <div className={`rounded-xl border p-4 space-y-3 ${isInArmy ? "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20" : "border-blue-200 bg-blue-50/40 dark:bg-blue-950/20"}`}>
        <div className="flex items-center gap-2">
          {isInArmy ? <Building2 className="h-4 w-4 text-emerald-600" /> : <Landmark className="h-4 w-4 text-blue-600" />}
          <h4 className={`text-sm font-bold ${isInArmy ? "text-emerald-800 dark:text-emerald-300" : "text-blue-800 dark:text-blue-300"}`}>
            {comparison.scopeThaiName}
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">หมวด 1 รับเงินครั้งเดียว</p>
            <p className="font-bold font-mono">{formatCurrency(comparison.categoryTotals[BenefitCategoryCode.LUMP_SUM_PAYMENT])}</p>
          </div>
          <div>
            <p className="text-muted-foreground">หมวด 2 รายเดือน</p>
            <p className="font-bold font-mono">{formatCurrency(comparison.categoryTotals[BenefitCategoryCode.MONTHLY_PAYMENT])}</p>
          </div>
          <div>
            <p className="text-muted-foreground">หมวด 3 รายปี</p>
            <p className="font-bold font-mono">{formatCurrency(comparison.categoryTotals[BenefitCategoryCode.ANNUAL_PAYMENT])}</p>
          </div>
          <div>
            <p className="text-muted-foreground">หมวด 4 สิทธิมิใช่ตัวเงิน</p>
            <p className="font-bold font-mono">{comparison.nonMonetaryCount} สิทธิ</p>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-muted-foreground">รวมเงินก้อน (หมวด 1)</p>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(comparison.lumpSumTotal)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ระบบคำนวณประมาณการสิทธิกำลังพล 4 หมวด
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            แยก 4 หมวดหมู่: 1.รับเงินครั้งเดียว 2.รับเงินรายเดือน 3.รับเงินรายปี 4.สิทธิมิใช่ตัวเงิน
          </p>
        </div>

        <Link href="/rules">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-emerald-600" />
            ปรับแต่งสูตรคำนวณ (Rule Config)
          </Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            ขั้นตอนที่ {step} จาก 5: {steps[step - 1].title}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600">
            {step * 20}%
          </span>
        </div>
        <Progress value={step * 20} className="h-2" />

        <div className="grid grid-cols-5 gap-1 pt-3 text-center">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`text-[10px] truncate ${step === s.num
                ? "font-bold text-emerald-600"
                : step > s.num
                  ? "text-slate-700 dark:text-slate-300"
                  : "text-muted-foreground"
                }`}
            >
              {s.num}. {s.title}
            </div>
          ))}
        </div>
      </div>

      <LossIncidentReportManager
        personnelId={selectedPersonnelId}
        militaryId={militaryId}
        rankAbbr={rankAbbr}
        firstName={firstName}
        lastName={lastName}
      />

      {/* Step 1: Select or Input Personnel */}
      {step === 1 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 1: เลือกกำลังพลหรือระบุฐานเงินเดือน
            </h2>
            <p className="text-xs text-muted-foreground">
              สามารถเลือกจากทะเบียนกำลังพลที่มีอยู่แล้ว หรือกรอกข้อมูลเพื่อจำลองการประมาณการ
            </p>
          </div>

          {/* Personnel CRUD Panel */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  จัดการข้อมูลกำลังพล (เพิ่ม / ลบ / แก้ไข / ค้นหา)
                </span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {personnelList.length} รายการ
              </Badge>
            </div>

            {actionMsg && (
              <div className={`text-xs rounded-lg px-3 py-2 ${actionMsg.type === "success" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200" : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200"}`}>
                {actionMsg.text}
              </div>
            )}

            {/* Search */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchPersonnel(); }}
                placeholder="ค้นหา: ชื่อ, เลขประจำตัวทหาร, สังกัด..."
                className="text-xs h-9"
              />
              <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0" onClick={handleSearchPersonnel}>
                <Search className="h-3.5 w-3.5" />
                ค้นหา
              </Button>
              <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={fetchPersonnel} title="แสดงทั้งหมด">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Results select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">เลือกกำลังพลจากรายการ</Label>
              <select
                value={selectedPersonnelId}
                onChange={(e) => {
                  const found = personnelList.find((p) => p.id === e.target.value);
                  if (found) loadPersonnelData(found);
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">-- กรุณาเลือกกำลังพล --</option>
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rankAbbr} {p.firstName} {p.lastName} - {p.normalUnit} ({p.militaryId})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                เลือกเพื่อโหลดลงฟอร์ม แก้ไขข้อมูลแล้วกด "บันทึกการแก้ไข" เพื่ออัปเดต
              </p>
            </div>

            {/* CRUD actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 flex-1" onClick={handleCreatePersonnel}>
                <Plus className="h-3.5 w-3.5" />
                เพิ่มกำลังพลใหม่ (บันทึกจากฟอร์ม)
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleUpdatePersonnel}>
                <PencilLine className="h-3.5 w-3.5 text-emerald-600" />
                บันทึกการแก้ไข
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-600 hover:text-red-700" onClick={handleDeletePersonnel}>
                <Trash2 className="h-3.5 w-3.5" />
                ลบ
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">ยศ</Label>
              <select
                value={rank}
                onChange={(e) => {
                  setRank(e.target.value);
                  const found = RANK_OPTIONS.find((r) => r.value === e.target.value);
                  if (found) {
                    const abbrMatch = found.label.match(/\(([^)]+)\)/);
                    setRankAbbr(abbrMatch ? abbrMatch[1] : found.value);
                  }
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {RANK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ชื่อ</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">สกุล</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก</Label>
              <Input
                value={militaryId}
                onChange={(e) => setMilitaryId(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">สังกัดปกติ (ต้นสังกัด)</Label>
              <Input
                value={normalUnit}
                onChange={(e) => setNormalUnit(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">สังกัดสนาม / หน่วยเฉพาะกิจ</Label>
              <Input
                value={fieldUnit}
                onChange={(e) => setFieldUnit(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ระดับชั้นเงินเดือน</Label>
              <select
                value={salaryLevel}
                onChange={(e) => {
                  const nextLevel = normalizeSalaryLevel(e.target.value);
                  setSalaryLevel(nextLevel);
                  setSalary(getSalaryAmount(nextLevel, salaryStep));
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
              >
                {SALARY_LEVEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ขั้น</Label>
              <select
                value={salaryStep}
                onChange={(e) => {
                  const nextStep = Number(e.target.value);
                  setSalaryStep(nextStep);
                  setSalary(getSalaryAmount(salaryLevel, nextStep));
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono"
              >
                {SALARY_STEP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    ขั้น {formatSalaryStep(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เงินเดือนปัจจุบัน (บาท)</Label>
              <Input
                type="number"
                value={salary}
                readOnly
                className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900/60"
                title="คำนวณอัตโนมัติจากระดับชั้นเงินเดือนและขั้น"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ระดับเงินเยียวยา</Label>
              <Input
                value={compensationLevel}
                onChange={(e) => setCompensationLevel(e.target.value)}
                className="text-xs"
                placeholder="เช่น ระดับ 1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">จำนวนเงินเยียวยา (บาท)</Label>
              <Input
                type="number"
                value={compensationAmount}
                onChange={(e) => setCompensationAmount(Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(2)}
            >
              ถัดไป: เวลาราชการทวีคูณ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Service Years and Multipliers */}
      {step === 2 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 2: วันบรรจุ เวลาราชการปกติ และเวลาราชการทวีคูณ
            </h2>
            <p className="text-xs text-muted-foreground">
              ระบุวันบรรจุ วันเกิดเหตุ และวันทวีคูณ ระบบจะคำนวณเวลาราชการอัตโนมัติ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ThaiBuddhistDatePicker
              label="วัน เดือน ปี บรรจุ"
              value={appointmentDate}
              onChange={(v) => setAppointmentDate(v || "")}
              required
            />
            <ThaiBuddhistDatePicker
              label="วันเกิดเหตุ"
              value={incidentDate}
              onChange={setIncidentDate}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">เวลาราชการทวีคูณรวม</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">ปี</Label>
                  <Input
                    type="number"
                    min={0}
                    value={multiplierYears}
                    onChange={(e) => setMultiplierYears(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">เดือน</Label>
                  <Input
                    type="number"
                    min={0}
                    value={multiplierMonths}
                    onChange={(e) => setMultiplierMonths(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">วัน</Label>
                  <Input
                    type="number"
                    min={0}
                    value={multiplierDays}
                    onChange={(e) => setMultiplierDays(Number(e.target.value))}
                    className="text-xs"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">กรอกระยะเวลาราชการทวีคูณที่ได้จากช่วงปฏิบัติงานสนาม</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Label className="text-xs font-bold">เวลาราชการปกติ</Label>
              <p className="text-lg font-black text-slate-700 dark:text-slate-300 pt-1">
                {formatServiceTime({ years: serviceYearsNormal, months: serviceMonthsNormal, days: serviceDaysNormal })}
              </p>
              <p className="text-[10px] text-muted-foreground">นับจากวันบรรจุถึงวันเกิดเหตุ</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30">
              <Label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">เวลาราชการทวีคูณ</Label>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 pt-1">
                {formatServiceTime({ years: serviceYearsMultiplier, months: serviceMonthsMultiplier, days: serviceDaysMultiplier })}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">ราชการสนาม / ปราบปราม</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
              <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">รวมเวลาราชการคำนวณ</Label>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 pt-1">
                {formatServiceTime({ years: totalServiceYears, months: totalServiceMonths, days: totalServiceDays })}
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">ใช้คำนวณบำเหน็จบำนาญพิเศษ</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(3)}
            >
              ถัดไป: เหตุการณ์และความสูญเสีย
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Loss & Promotion */}
      {step === 3 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 3: เหตุการณ์ความสูญเสีย ปูนบำเหน็จพิเศษ และชั้นยศ
            </h2>
            <p className="text-xs text-muted-foreground">
              กำหนดประเภทความสูญเสีย การปูนบำเหน็จพิเศษ แต่งตั้ง/เลื่อนชั้นยศ และเงินเดือนหลังเลื่อนชั้นยศ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">1. ประเภทสิทธิ (Benefit Scope)</Label>
              <select
                value={benefitScope}
                onChange={(e) => setBenefitScope(e.target.value as any)}
                aria-label="1. ประเภทสิทธิ (Benefit Scope)"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="IN_ARMY">ใน ทบ. (สิทธิและเงินกองทุนภายในกองทัพบก)</option>
                <option value="OUTSIDE_ARMY">นอก ทบ. (ประกันภัยร่วม กห., กรมบัญชีกลาง, มูลนิธิสายใจไทย)</option>
                <option value="BOTH">ทั้งในและนอก ทบ. (เปรียบเทียบ)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">2. ถูกกระทำ (Action Cause)</Label>
              <select
                value={actionCause}
                onChange={(e) => setActionCause(e.target.value as any)}
                aria-label="2. ถูกกระทำ (Action Cause)"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="ENEMY_ACTION">การกระทำของข้าศึก / ผู้ก่อความไม่สงบ / การสู้รบ</option>
                <option value="NON_ENEMY_ACTION">มิใช่การกระทำของข้าศึก (อุบัติเหตุสนาม, ปฏิบัติงานปกติ)</option>
                <option value="BOTH">ทั้งสองกรณี</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">3. ประเภทความสูญเสีย (Loss Type)</Label>
              <select
                value={lossType}
                onChange={(e) => setLossType(e.target.value)}
                aria-label="3. ประเภทความสูญเสีย (Loss Type)"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบในสมรภูมิ (KIA - 7-9 ชั้นยศ)</option>
                <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่ราชการสนาม (5-7 ชั้นยศ)</option>
                <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ (WIA)</option>
                <option value="SEVERE_WOUND_WIA">บาดเจ็บสาหัสจากการรบ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ประเภทภารกิจ (Mission Type)</Label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="COUNTER_INSURGENCY">ปราบปรามผู้ก่อการร้าย / จชต.</option>
                <option value="BORDER_DEFENSE">ป้องกันชายแดน</option>
                <option value="PEACEKEEPING_UN">รักษาสันติภาพ UN</option>
                <option value="INTERNAL_SECURITY">รักษาความมั่นคงภายใน</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">การปูนบำเหน็จพิเศษ</Label>
              <select
                value={specialPensionType}
                onChange={(e) => setSpecialPensionType(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="EMERGENCY_TIME">1. ในเวลาเหตุฉุกเฉิน</option>
                <option value="NORMAL_TIME">2. ในเวลาเหตุปกติ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ปูนบำเหน็จพิเศษ (จำนวนชั้นยศ)</Label>
              <select
                value={specialPensionTier}
                onChange={(e) => setSpecialPensionTier(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {SPECIAL_PENSION_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    ปูนบำเหน็จพิเศษ {tier} ชั้นยศ
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">แต่งตั้ง/เลื่อนชั้นยศ เป็น</Label>
              <select
                value={promotedRank}
                onChange={(e) => {
                  setPromotedRank(e.target.value);
                  const found = RANK_OPTIONS.find((r) => r.value === e.target.value);
                  if (found) {
                    const abbrMatch = found.label.match(/\(([^)]+)\)/);
                    setPromotedRankAbbr(abbrMatch ? abbrMatch[1] : found.value);
                  }
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {RANK_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ปรับระดับ (ชั้นเงิน)</Label>
              <Input
                value={salaryLevelAdjustment}
                onChange={(e) => setSalaryLevelAdjustment(e.target.value)}
                className="text-xs"
                placeholder="เช่น น.3 ขั้น 27.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">เงินเดือนหลังปูนบำเหน็จเลื่อนชั้นยศ (บาท)</Label>
              <Input
                type="number"
                value={promotedSalary}
                onChange={(e) => setPromotedSalary(Number(e.target.value))}
                className="text-xs font-mono font-bold text-amber-600"
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 p-4 space-y-2">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                สรุปการคำนวณปูนบำเหน็จพิเศษ
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-white/80 dark:bg-slate-900 p-2 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-muted-foreground">แต่งตั้ง/เลื่อนยศพิเศษ</p>
                  <p className="font-bold">{promotedRankAbbr} ({promotedRank})</p>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-slate-900 p-2 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-muted-foreground">จำนวนชั้นบำเหน็จ</p>
                  <p className="font-bold">{specialPensionTier} ชั้น</p>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-slate-900 p-2 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-muted-foreground">ระดับเงินเดือนใหม่</p>
                  <p className="font-bold">{salaryLevelAdjustment || "-"}</p>
                </div>
                <div className="rounded-lg bg-white/80 dark:bg-slate-900 p-2 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-muted-foreground">ยอดรับเงินเดือนใหม่</p>
                  <p className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(promotedSalary)}</p>
                </div>
              </div>
            </div>

            {/* Hospitalization Stay Section */}
            <div className="sm:col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  การพักรักษาพยาบาลในโรงพยาบาล (Hospital Stay)
                </Label>
                <Badge className="bg-emerald-700 text-white font-mono text-xs px-2 py-0.5">
                  คำนวณอัตโนมัติ: {calculateStayDays(hospitalAdmissionDate, hospitalDischargeDate)} วัน
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">วันที่เข้ารับการรักษาพยาบาล (Admission Date)</Label>
                  <Input
                    type="date"
                    value={hospitalAdmissionDate}
                    onChange={(e) => setHospitalAdmissionDate(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">วันที่จำหน่าย/ออกจากโรงพยาบาล (Discharge Date)</Label>
                  <Input
                    type="date"
                    value={hospitalDischargeDate}
                    onChange={(e) => setHospitalDischargeDate(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-semibold">เกณฑ์เงินช่วยเหลือ:</span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  1-10 วัน: <strong>10,000 บ.</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  11-20 วัน: <strong>20,000 บ.</strong> (รับเพิ่ม 10,000 บ.)
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  เกิน 20 วัน: <strong>30,000 บ.</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => setStep(4)}
            >
              ถัดไป: ข้อมูลครอบครัว & ทายาท
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Family & Heirs */}
      {step === 4 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 4: ข้อมูลครอบครัวและทายาทผู้มีสิทธิ
            </h2>
            <p className="text-xs text-muted-foreground">
              ระบุสถานะคู่สมรสและบุตรที่กำลังศึกษา เพื่อคำนวณทุนการศึกษาและการแบ่งสัดส่วนเงินสงเคราะห์
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">คู่สมรสจดทะเบียนตามกฎหมาย</span>
                <input
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </div>
              {hasSpouse && (
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อ-สกุล คู่สมรส</Label>
                  <Input
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">จำนวนบุตรทั้งหมด (คน)</Label>
                <Input
                  type="number"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">จำนวนบุตรที่กำลังศึกษาอยู่ (คน)</Label>
                <Input
                  type="number"
                  value={studyingChildrenCount}
                  onChange={(e) => setStudyingChildrenCount(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} className="text-xs gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-md"
              onClick={handleRunCalculation}
              disabled={calculating}
            >
              <Sparkles className="h-4 w-4" />
              {calculating ? "กำลังประมวลผล 4 หมวด..." : "ประมวลผลประมาณการสิทธิ 4 หมวด"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Calculation Results Breakdown across 4 Categories */}
      {step === 5 && calculationResult && (
        <div className="space-y-6">
          {/* Personnel Summary Card */}
          <Card className="border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              สรุปข้อมูลกำลังพลและเวลาราชการ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">ยศ/ชื่อ-สกุล</p>
                <p className="font-semibold">{calculationResult.personnelSummary.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">วันบรรจุ</p>
                <p className="font-semibold">{formatThaiBE(calculationResult.personnelSummary.appointmentDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">วันเกิดเหตุ</p>
                <p className="font-semibold">{formatThaiBE(calculationResult.personnelSummary.incidentDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">รวมเวลาราชการ</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatServiceTime({
                    years: calculationResult.personnelSummary.totalServiceYears,
                    months: calculationResult.personnelSummary.totalServiceMonths,
                    days: calculationResult.personnelSummary.totalServiceDays,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">ปูนบำเหน็จพิเศษ</p>
                <p className="font-semibold">
                  {calculationResult.personnelSummary.specialPensionType === "EMERGENCY_TIME" ? "ในเวลาเหตุฉุกเฉิน" : "ในเวลาเหตุปกติ"} {" "}
                  {calculationResult.personnelSummary.specialPensionTier} ชั้นยศ
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">เลื่อนชั้นยศเป็น</p>
                <p className="font-semibold">{calculationResult.personnelSummary.rankAppointmentTo || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">เงินเดือนหลังเลื่อนยศ</p>
                <p className="font-semibold">{formatCurrency(calculationResult.personnelSummary.promotedSalary)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">ระดับเงินเยียวยา</p>
                <p className="font-semibold">{calculationResult.personnelSummary.compensationLevel || "-"}</p>
              </div>
            </div>
          </Card>

          {/* Top 4 Categories Metric Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cat 1: Lump Sum */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-100 font-bold">
                <Coins className="h-4 w-4" />
                <span>หมวด 1: รับเงินครั้งเดียว</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalLumpSum)}
              </p>
              <p className="text-[10px] text-amber-100">เงินก้อนครั้งเดียวแก่ทายาท</p>
            </div>

            {/* Cat 2: Monthly */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-100 font-bold">
                <Calendar className="h-4 w-4" />
                <span>หมวด 2: รับเงินรายเดือน</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalMonthlyPension)}
              </p>
              <p className="text-[10px] text-blue-100">บำนาญพิเศษตลอดชีพ</p>
            </div>

            {/* Cat 3: Annual */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold">
                <CalendarDays className="h-4 w-4" />
                <span>หมวด 3: รับเงินรายปี</span>
              </div>
              <p className="text-2xl font-black">
                {formatCurrency(calculationResult.grandTotalAnnualScholarship)}
              </p>
              <p className="text-[10px] text-emerald-100">ทุนการศึกษาบุตรต่อปี</p>
            </div>

            {/* Cat 4: Non-Monetary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-purple-100 font-bold">
                <Gift className="h-4 w-4" />
                <span>หมวด 4: สิทธิมิใช่ตัวเงิน</span>
              </div>
              <p className="text-2xl font-black">
                {calculationResult.nonMonetaryRightsCount} สิทธิ
              </p>
              <p className="text-[10px] text-purple-100">บรรจุทายาท / รักษาพยาบาล</p>
            </div>
          </div>

          {/* Scope Comparison (ใน ทบ. vs นอก ทบ.) */}
          {calculationResult.scopeComparison && (
            <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-600" />
                  เปรียบเทียบสิทธิประโยชน์ ใน ทบ. vs นอก ทบ.
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  หมวด 1 รับเงินครั้งเดียว
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderScopeComparison(calculationResult.scopeComparison.inArmy)}
                {renderScopeComparison(calculationResult.scopeComparison.outsideArmy)}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  ข้อแนะนำ: {" "}
                  {calculationResult.scopeComparison.recommendedScope === "IN_ARMY" ? (
                    <span className="text-emerald-600">สิทธิใน ทบ. ให้มูลค่ารวมสูงกว่า</span>
                  ) : (
                    <span className="text-blue-600">สิทธินอก ทบ. ให้มูลค่ารวมสูงกว่า</span>
                  )}
                  {" "}(ต่างกัน {formatCurrency(calculationResult.scopeComparison.differenceLumpSum)})
                </p>
              </div>

              <Tabs value={activeComparisonTab} onValueChange={(v) => setActiveComparisonTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="IN_ARMY" className="text-xs">รายละเอียดใน ทบ.</TabsTrigger>
                  <TabsTrigger value="OUTSIDE_ARMY" className="text-xs">รายละเอียดนอก ทบ.</TabsTrigger>
                </TabsList>
                <TabsContent value="IN_ARMY" className="space-y-2 pt-2">
                  {calculationResult.scopeComparison.inArmy.items
                    .filter((i) => i.category === BenefitCategoryCode.LUMP_SUM_PAYMENT && i.isEligible)
                    .map((item) => (
                      <div key={item.ruleId} className="flex justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-900">
                        <span>{item.ruleName}</span>
                        <span className="font-mono font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                </TabsContent>
                <TabsContent value="OUTSIDE_ARMY" className="space-y-2 pt-2">
                  {calculationResult.scopeComparison.outsideArmy.items
                    .filter((i) => i.category === BenefitCategoryCode.LUMP_SUM_PAYMENT && i.isEligible)
                    .map((item) => (
                      <div key={item.ruleId} className="flex justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-900">
                        <span>{item.ruleName}</span>
                        <span className="font-mono font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {/* 4 Category Detailed Tables */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              รายละเอียดสิทธิประโยชน์รายหมวด (4 Categories Entitlement Breakdown)
            </h3>

            {Object.values(calculationResult.categories || {}).map((cat) => (
              <Card key={cat.category} className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cat.categoryThaiName} ({cat.categoryName})
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-emerald-600">
                    {cat.totalAmount > 0 ? (
                      <span>ยอดรวมหมวด: {formatCurrency(cat.totalAmount)}</span>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">สิทธิประโยชน์คุ้มครอง</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.items.map((item) => (
                    <div
                      key={item.ruleId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.ruleName}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          สูตร: {item.formulaUsed} • {item.legalBasis}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-emerald-600">
                        {item.amount > 0 ? formatCurrency(item.amount) : "มีสิทธิได้รับ"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Heir Distribution & Successor Job Right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4 text-purple-600" />
                การจัดสรรเงินให้ทายาทตามกฎหมาย
              </h4>
              <div className="space-y-2 text-xs">
                {calculationResult.heirDistribution.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{h.heirName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {h.sharePercentage}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-600 font-bold">เงินก้อน: {formatCurrency(h.allocatedLumpSum)}</span>
                      <span className="text-blue-600 font-bold">รายเดือน: {formatCurrency(h.allocatedMonthlyPension)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                หมวด 4: สิทธิบรรจุทายาททดแทน 1 อัตรา
              </h4>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>มีสิทธิได้รับการบรรจุทายาททดแทน 1 อัตรา</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  {calculationResult.successorJobRight.conditionText}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  คุณสมบัติ: บุตรหรือคู่สมรส อายุ 18 - 35 ปี มีคุณวุฒิตรงตามอัตรากำลังพลกลาโหม
                </p>
              </div>
            </Card>
          </div>

          {/* Action Footer */}
          <Card className="border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              ยืนยันเอกสารและลงนามลายเซ็นอิเล็กทรอนิกส์ก่อนพิมพ์รายงาน
            </h4>

            {exportMsg && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${exportMsg.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                {exportMsg.text}
              </div>
            )}

            {lastVerification && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 px-3 py-2 text-xs space-y-1">
                <p>
                  <span className="font-semibold">รหัสตรวจสอบ:</span> <span className="font-mono">{lastVerification.code}</span>
                </p>
                <p className="break-all">
                  <span className="font-semibold">Hash:</span> <span className="font-mono text-[11px]">{lastVerification.hash || "-"}</span>
                </p>
                <p className="break-all">
                  <span className="font-semibold">ลิงก์ตรวจสอบ:</span>{" "}
                  <a href={lastVerification.verifyUrl} className="text-blue-700 underline break-all" target="_blank" rel="noreferrer">
                    {lastVerification.verifyUrl}
                  </a>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ชื่อผู้ลงนามอิเล็กทรอนิกส์</Label>
                <Input
                  value={eSignatureName}
                  onChange={(e) => setESignatureName(e.target.value)}
                  className="text-xs"
                  placeholder="เช่น พ.ท.วีรชาติ ภักดีสยาม"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ตำแหน่ง</Label>
                <Input
                  value={eSignaturePosition}
                  onChange={(e) => setESignaturePosition(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">หมายเหตุเพิ่มเติมในรายงาน</Label>
                <textarea
                  rows={3}
                  value={reportRemark}
                  onChange={(e) => setReportRemark(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  placeholder="เพิ่มหมายเหตุ เช่น ข้อจำกัดข้อมูล เอกสารอ้างอิง หรือข้อเสนอแนะ"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={documentConfirmed}
                onChange={(e) => setDocumentConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                ผู้ใช้งานยืนยันว่าเอกสารและข้อมูลประมาณการสิทธิถูกต้องครบถ้วน และยินยอมลงนามลายเซ็นอิเล็กทรอนิกส์
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                onClick={() => handleExportEstimateReport("pdf")}
                disabled={exportingFormat !== null}
              >
                <FileDown className="h-4 w-4" />
                {exportingFormat === "pdf" ? "กำลังสร้าง PDF..." : "พิมพ์รายงาน PDF (.pdf)"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                onClick={() => handleExportEstimateReport("docx")}
                disabled={exportingFormat !== null}
              >
                <FileDown className="h-4 w-4" />
                {exportingFormat === "docx" ? "กำลังสร้าง DOCX..." : "พิมพ์รายงาน DOCX (.docx)"}
              </Button>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
              <RotateCcw className="h-4 w-4" />
              คำนวณใหม่
            </Button>
            <div className="flex items-center gap-2">
              <Link href="/documents">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-md">
                  <FileText className="h-4 w-4" />
                  สร้างหนังสือรับรองสิทธิทางการทันที (Official Certificate)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
