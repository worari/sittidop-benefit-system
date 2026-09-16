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
import {
  Calculator,
  Shield,
  MapPinned,
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
  AlertCircle,
  Link2,
  ExternalLink,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const urlLossReportId = searchParams.get("lossReportId");
  const urlMilitaryId = searchParams.get("militaryId");

  const [step, setStep] = useState(1);
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");

  // Integrated Loss Reports state (Tab 5)
  const [lossReportsList, setLossReportsList] = useState<any[]>([]);
  const [lossReportSearchTerm, setLossReportSearchTerm] = useState("");
  const [linkedLossReport, setLinkedLossReport] = useState<{
    report: any;
    casualty?: any;
  } | null>(null);

  // Form State
  const [militaryId, setMilitaryId] = useState("4902188401");
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

  // Integrated Family (Tab 3) & Heirs (Tab 4) State
  const [hasSpouse, setHasSpouse] = useState(true);
  const [spouseName, setSpouseName] = useState("นางพิมพา ภักดีสยาม");
  const [spouseData, setSpouseData] = useState<any | null>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [childrenCount, setChildrenCount] = useState(2);
  const [studyingChildrenCount, setStudyingChildrenCount] = useState(2);
  const [heirsList, setHeirsList] = useState<any[]>([]);

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

  // Load personnel and loss reports simultaneously
  useEffect(() => {
    let pList: MilitaryPersonnelRecord[] = [];
    let lrList: any[] = [];

    const fetchP = fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          pList = json.data;
          setPersonnelList(pList);
        }
      })
      .catch((e) => console.error("Failed to load personnel:", e));

    const fetchLR = fetch("/api/loss-reports")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          lrList = json.data;
          setLossReportsList(lrList);
        }
      })
      .catch((e) => console.error("Failed to load loss reports:", e));

    Promise.all([fetchP, fetchLR]).then(() => {
      // If URL has lossReportId, auto-select and link
      if (urlLossReportId && lrList.length > 0) {
        const foundReport = lrList.find((r) => r.id === urlLossReportId);
        if (foundReport) {
          let foundCas = undefined;
          if (urlMilitaryId && foundReport.casualties?.length > 0) {
            foundCas = foundReport.casualties.find((c: any) => c.militaryId === urlMilitaryId);
          } else if (foundReport.casualties?.length > 0) {
            foundCas = foundReport.casualties[0];
          }
          handleSelectCasualtyFromLossReport(foundReport, foundCas, pList);
          return;
        }
      }

      // Default load first personnel if no deep-link
      if (pList.length > 0) {
        loadPersonnelData(pList[0]);
      }
    });
  }, [urlLossReportId, urlMilitaryId]);

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
    setPromotedRank(p.promotedRank || "GENERAL");
    setPromotedRankAbbr(p.promotedRankAbbr || "พล.อ.");
    setPromotedSalary(p.promotedSalary || Math.round(p.salary * 1.55));
    
    // Tab 3: ข้อมูลครอบครัว (Spouse & Children)
    setSpouseData(p.spouse || null);
    setHasSpouse(Boolean(p.spouse));
    setSpouseName(p.spouse?.fullName || "");
    const children = (p.children || []) as any[];
    setChildrenList(children);
    setChildrenCount(children.length);
    setStudyingChildrenCount(children.filter((c) => c.isStudying).length);

    // Tab 4: ข้อมูลทายาท (Heirs)
    setHeirsList((p.heirs || []) as any[]);

    setHospitalAdmissionDate(p.hospitalAdmissionDate || "");
    setHospitalDischargeDate(p.hospitalDischargeDate || "");
    setMultiplierYears(p.serviceYearsMultiplier || 0);
    setMultiplierMonths(p.serviceMonthsMultiplier || 0);
    setMultiplierDays(p.serviceDaysMultiplier || 0);
  };

  // Select casualty from Tab 5 (กพ.3 / กพ.4) and auto-integrate with Tab 2, 3, 4
  const handleSelectCasualtyFromLossReport = (
    report: any,
    casualty?: any,
    currentPersonnelList?: MilitaryPersonnelRecord[]
  ) => {
    const pList = currentPersonnelList || personnelList;
    const targetMilId = casualty?.militaryId || report.militaryId;
    const targetName = casualty?.fullName || report.fullName;

    // 1. Cross-reference with Personnel database (Tab 2)
    const foundPersonnel = pList.find(
      (p) =>
        (targetMilId && p.militaryId === targetMilId) ||
        (p.citizenId && casualty?.citizenId && p.citizenId === casualty.citizenId) ||
        (targetName && `${p.firstName} ${p.lastName}`.trim().toLowerCase() === targetName.trim().toLowerCase()) ||
        (targetName && p.firstName && targetName.includes(p.firstName)) ||
        (report.personnelId && p.id === report.personnelId)
    );

    if (foundPersonnel) {
      loadPersonnelData(foundPersonnel);
    } else {
      // Fallback: fill basic casualty info
      if (casualty) {
        if (casualty.militaryId) setMilitaryId(casualty.militaryId);
        if (casualty.fullName) {
          const parts = casualty.fullName.trim().split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        if (casualty.rankAbbr) {
          setRankAbbr(casualty.rankAbbr);
          const r = RANK_OPTIONS.find((ro) => ro.label.includes(casualty.rankAbbr));
          if (r) setRank(r.value);
        }
      } else if (report.fullName) {
        const parts = report.fullName.trim().split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        if (report.militaryId) setMilitaryId(report.militaryId);
        if (report.rankAbbr) setRankAbbr(report.rankAbbr);
      }
    }

    // 2. Overlay incident details from Tab 5 (กพ.3 / กพ.4)
    if (report.incidentDate) {
      setIncidentDate(report.incidentDate);
    }

    const enemyCause = report.enemyAction === "ENEMY" ? "ENEMY_ACTION" : "NON_ENEMY_ACTION";
    setActionCause(enemyCause);

    // Rule-based lossType and special pension mapping
    const rawLossType = casualty?.lossType || "DECEASED";
    if (rawLossType === "DECEASED") {
      if (enemyCause === "ENEMY_ACTION") {
        setLossType("KIA_COMBAT_DEATH");
        setSpecialPensionType("EMERGENCY_TIME");
        setSpecialPensionTier(8); // 7-9 ชั้นยศ
        setPromotedRank("GENERAL");
        setPromotedRankAbbr("พล.อ.");
        setRankAppointmentTo("พลเอก");
      } else {
        setLossType("DUTY_DEATH");
        setSpecialPensionType("NORMAL_TIME");
        setSpecialPensionTier(7); // 5-7 ชั้นยศ
        setPromotedRank("COLONEL_SPECIAL");
        setPromotedRankAbbr("พ.อ.พิเศษ");
        setRankAppointmentTo("พันเอกพิเศษ");
      }
    } else if (rawLossType === "DISABLED") {
      setLossType("TOTAL_PERMANENT_DISABILITY");
      setSpecialPensionType("EMERGENCY_TIME");
      setSpecialPensionTier(7); // 5-7 ชั้นยศ
      setPromotedRank("MAJOR_GENERAL");
      setPromotedRankAbbr("พล.ต.");
      setRankAppointmentTo("พลตรี");
    } else if (rawLossType === "INJURED") {
      setLossType("SEVERE_WOUND_WIA");
      setSpecialPensionType("NORMAL_TIME");
      setSpecialPensionTier(3);
      if (report.incidentDate) {
        setHospitalAdmissionDate(report.incidentDate);
        // Default 15 days stay for demonstration
        const d = new Date(report.incidentDate);
        d.setDate(d.getDate() + 15);
        setHospitalDischargeDate(d.toISOString().slice(0, 10));
      }
    }

    // 3. Mark integrated state
    setLinkedLossReport({ report, casualty });
    setActionMsg({
      type: "success",
      text: `เชื่อมโยงข้อมูล 4 แหล่งเรียบร้อย: ${casualty ? `${casualty.rankAbbr} ${casualty.fullName} (${casualty.militaryId})` : report.eventSummary} จากรายงาน กพ.3/กพ.4`,
    });
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
      spouse: hasSpouse ? (spouseData || {
        nationalId: `SP-${militaryId}`,
        fullName: spouseName,
        isLegallyMarried: true,
        hasPensionRights: true,
        allocationPercentage: 50,
      }) : null,
      children: childrenList,
      heirs: heirsList,
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

      // Build dynamic children array from loaded Tab 3 data or fallback
      let dynamicChildren = childrenList.length > 0
        ? childrenList.map((c, idx) => ({
            nationalId: c.nationalId || `CH-${militaryId}-${idx + 1}`,
            fullName: c.fullName || `บุตรคนที่ ${idx + 1}`,
            age: Number(c.age) || 10,
            isStudying: Boolean(c.isStudying),
            educationLevel: (c.educationLevel || "PRIMARY") as any,
            allocationPercentage: Number(c.allocationPercentage) || 25,
          }))
        : [];

      if (dynamicChildren.length === 0 && childrenCount > 0) {
        dynamicChildren = Array.from({ length: childrenCount }, (_, i) => ({
          nationalId: `CH-${militaryId}-${i + 1}`,
          fullName: `บุตรคนที่ ${i + 1}`,
          age: 10 + i * 4,
          isStudying: i < studyingChildrenCount,
          educationLevel: (i === 0 ? "PRIMARY" : "SECONDARY") as any,
          allocationPercentage: Math.round(50 / Math.max(1, childrenCount)),
        }));
      }

      // Build dynamic heirs array from loaded Tab 4 data or fallback
      let dynamicHeirs = heirsList.length > 0
        ? heirsList.map((h) => ({
            nationalId: h.nationalId || `HR-${Math.random()}`,
            fullName: h.fullName,
            relationship: (h.relationship || "OTHER_HEIR") as any,
            allocationPercentage: Number(h.allocationPercentage) || 0,
          }))
        : [];

      if (dynamicHeirs.length === 0 && (hasSpouse || dynamicChildren.length > 0)) {
        if (hasSpouse) {
          dynamicHeirs.push({
            nationalId: `SP-${militaryId}`,
            fullName: spouseName,
            relationship: "SPOUSE_LEGAL" as const,
            allocationPercentage: 50,
          });
        }
        dynamicChildren.forEach((ch) => {
          dynamicHeirs.push({
            nationalId: ch.nationalId,
            fullName: ch.fullName,
            relationship: "CHILD_LEGITIMATE" as const,
            allocationPercentage: Math.round(50 / Math.max(1, dynamicChildren.length)),
          });
        });
      }

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
            nationalId: spouseData?.nationalId || `SP-${militaryId}`,
            fullName: spouseName,
            isLegallyMarried: true,
            hasPensionRights: true,
            allocationPercentage: 50,
          }
          : null,
        children: dynamicChildren,
        heirs: dynamicHeirs,
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

  // Flatten casualties from lossReportsList with parent report context for easy search & selection
  const flattenedCasualties = useMemo(() => {
    const list: {
      report: any;
      casualty: any;
      searchStr: string;
    }[] = [];

    lossReportsList.forEach((r) => {
      if (r.casualties && r.casualties.length > 0) {
        r.casualties.forEach((c: any) => {
          list.push({
            report: r,
            casualty: c,
            searchStr: `${c.fullName || ""} ${c.militaryId || ""} ${c.rankAbbr || ""} ${r.mgrsCoordinate || ""} ${r.province || ""} ${r.eventSummary || ""}`.toLowerCase(),
          });
        });
      } else if (r.militaryId || r.fullName) {
        list.push({
          report: r,
          casualty: {
            militaryId: r.militaryId || "-",
            fullName: r.fullName || "-",
            rankAbbr: r.rankAbbr || "",
            lossType: "DECEASED",
          },
          searchStr: `${r.fullName || ""} ${r.militaryId || ""} ${r.rankAbbr || ""} ${r.mgrsCoordinate || ""} ${r.province || ""}`.toLowerCase(),
        });
      }
    });

    if (!lossReportSearchTerm.trim()) return list;
    const term = lossReportSearchTerm.toLowerCase();
    return list.filter((item) => item.searchStr.includes(term));
  }, [lossReportsList, lossReportSearchTerm]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-emerald-600" />
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                ระบบคำนวณประมาณการสิทธิกำลังพล 4 หมวด
              </h1>
              <Badge className="bg-teal-600 text-white font-bold text-xs">Tab 6</Badge>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            แยก 4 หมวดหมู่: 1.รับเงินครั้งเดียว 2.รับเงินรายเดือน 3.รับเงินรายปี 4.สิทธิมิใช่ตัวเงิน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/loss-reports">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40">
              <MapPinned className="h-3.5 w-3.5 text-amber-600" />
              รายงานการสูญเสีย (Tab 5)
            </Button>
          </Link>
          <Link href="/rules">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-600" />
              ปรับแต่งสูตรคำนวณ (Rule Config)
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Navigation Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
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

        <Link href="/loss-reports" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors col-span-2 sm:col-span-1">
          <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 5: รายงานสูญเสีย</p>
            <p className="text-[10px] text-muted-foreground truncate">กพ.3 / กพ.4</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-100/70 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 text-teal-900 dark:text-teal-200 col-span-2 sm:col-span-1">
          <div className="h-6 w-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            6
          </div>
          <div className="truncate">
            <p className="font-bold truncate">Tab 6: คำนวณสิทธิ 4 หมวด (กำลังใช้งาน)</p>
            <p className="text-[10px] text-teal-700 dark:text-teal-300 truncate">ประมาณการสิทธิ</p>
          </div>
        </div>
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

      {/* Step 1: Select or Input Personnel */}
      {step === 1 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ขั้นตอนที่ 1: เลือกกำลังพลหรือระบุฐานเงินเดือน
            </h2>
            <p className="text-xs text-muted-foreground">
              สามารถค้นหาจากรายงานการสูญเสีย (กพ.3/กพ.4) หรือเลือกจากทะเบียนกำลังพลที่มีอยู่แล้ว เพื่อบูรณาการข้อมูล 4 แหล่ง
            </p>
          </div>

          {/* Active Integration Banner */}
          {linkedLossReport && (
            <div className="rounded-2xl border-2 border-emerald-500/70 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 p-4 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                        บูรณาการเชื่อมโยงข้อมูล 4 แหล่งกำลังทำงาน (Integrated 4 Sources Active)
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        ซิงก์สำเร็จ
                      </Badge>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                      รายงาน กพ.3/กพ.4 เหตุการณ์ {formatThaiBE(linkedLossReport.report.incidentDate)} | พิกัด MGRS: {linkedLossReport.report.mgrsCoordinate}
                      {linkedLossReport.casualty && ` | ${linkedLossReport.casualty.rankAbbr} ${linkedLossReport.casualty.fullName} (${linkedLossReport.casualty.militaryId})`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0 self-start sm:self-center"
                  onClick={() => {
                    setLinkedLossReport(null);
                    setActionMsg({ type: "success", text: "ยกเลิกการเชื่อมโยงรายงานสูญเสียแล้ว กำลังพลยังคงอยู่ในฟอร์ม" });
                  }}
                >
                  ยกเลิกการเชื่อมโยง
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>1. ทะเบียนกำลังพล (Tab 2) ✓</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>2. ข้อมูลครอบครัว (Tab 3) ✓</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>3. ข้อมูลทายาท (Tab 4) ✓</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>4. รายงานสูญเสีย กพ.3/กพ.4 (Tab 5) ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5 Loss Reports Casualty Selector Card */}
          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-slate-50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-slate-900/40 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <MapPinned className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                      ค้นหากำลังพลจากรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.3 / กพ.4)
                    </h3>
                    <Badge className="bg-amber-600 text-white text-[10px]">
                      บูรณาการ Tab 5 ➔ Tab 6
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                    เลือกกำลังพลที่ถูกรายงานการสูญเสีย เพื่อดึงข้อมูลประวัติ ครอบครัว ทายาท และประเภทการสูญเสียมาประมาณการสิทธิทันที
                  </p>
                </div>
              </div>
              <Link href="/loss-reports" target="_blank">
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 self-start sm:self-center">
                  <ExternalLink className="h-3 w-3" />
                  เปิดดู Tab 5 (กพ.3/กพ.4)
                </Button>
              </Link>
            </div>

            {/* Filter Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={lossReportSearchTerm}
                  onChange={(e) => setLossReportSearchTerm(e.target.value)}
                  placeholder="ค้นหาตามชื่อ-สกุล, เลขประจำตัว, พิกัด MGRS, จังหวัด หรือพฤติกรรมเหตุการณ์..."
                  className="pl-8 text-xs h-8 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800"
                />
              </div>
              {lossReportSearchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setLossReportSearchTerm("")} className="text-xs h-8">
                  ล้างค้นหา
                </Button>
              )}
            </div>

            {/* Casualties Card List */}
            {flattenedCasualties.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-white/60 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-800/50 text-xs text-muted-foreground">
                ไม่พบข้อมูลกำลังพลในรายงานการสูญเสีย หรือยังไม่มีการบันทึกรายงาน กพ.3/กพ.4
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {flattenedCasualties.slice(0, 10).map((item, idx) => {
                  const c = item.casualty;
                  const r = item.report;
                  const isSelected = linkedLossReport?.report.id === r.id && (linkedLossReport?.casualty?.militaryId === c.militaryId || !linkedLossReport?.casualty);

                  return (
                    <div
                      key={`${r.id}-${c.militaryId || idx}`}
                      className={`p-3 rounded-xl border transition-all space-y-2 text-xs ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-amber-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {c.rankAbbr || ""} {c.fullName}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ({c.militaryId || "-"})
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {r.eventSummary}
                          </p>
                        </div>

                        {/* Loss Type Badge */}
                        <div className="shrink-0">
                          {c.lossType === "DECEASED" && (
                            <Badge className="bg-red-600 text-white text-[10px]">
                              เสียชีวิต (KIA)
                            </Badge>
                          )}
                          {c.lossType === "DISABLED" && (
                            <Badge className="bg-purple-600 text-white text-[10px]">
                              พิการ/ทุพพลภาพ
                            </Badge>
                          )}
                          {c.lossType === "INJURED" && (
                            <Badge className="bg-amber-600 text-white text-[10px]">
                              บาดเจ็บ (WIA)
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>📅 {formatThaiBE(r.incidentDate)}</span>
                          <span>📍 MGRS {r.mgrsCoordinate}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {r.enemyAction === "ENEMY" ? "⚡ ข้าศึก" : "🛡️ มิใช่ข้าศึก"}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          className={`h-6 text-[10px] px-2.5 font-bold gap-1 shadow-xs ${
                            isSelected
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                          onClick={() => handleSelectCasualtyFromLossReport(r, c)}
                        >
                          <Calculator className="h-3 w-3" />
                          {isSelected ? "เลือกอยู่ (ใช้งาน)" : "เลือกคำนวณสิทธิ"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก (เฉพาะตัวเลข)</Label>
              <Input
                value={militaryId}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMilitaryId(v);
                }}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"].includes(e.key) &&
                    !e.ctrlKey &&
                    !e.metaKey
                  ) {
                    e.preventDefault();
                  }
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="0000000000"
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
            {(() => {
              const stayDays = calculateStayDays(hospitalAdmissionDate, hospitalDischargeDate);
              const isTier1 = stayDays > 0 && stayDays <= 10;
              const isTier2 = stayDays > 10;
              const benefitAmount = stayDays <= 0 ? 0 : stayDays <= 10 ? 10000 : 20000;

              return (
                <div className="sm:col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      การพักรักษาพยาบาลในโรงพยาบาล (Hospital Stay)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-700 text-white font-mono text-xs px-2 py-0.5">
                        คำนวณอัตโนมัติ: {stayDays} วัน
                      </Badge>
                      {stayDays > 0 && (
                        <Badge className="bg-amber-600 text-white font-semibold text-xs px-2.5 py-0.5">
                          เงินช่วยเหลือ: {formatCurrency(benefitAmount)}
                        </Badge>
                      )}
                    </div>
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
                    <span
                      className={`px-2.5 py-1 rounded-md border transition-all ${
                        isTier1
                          ? "bg-emerald-100 text-emerald-900 border-emerald-500 font-bold dark:bg-emerald-900/60 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      พักรักษาตัวไม่เกิน &le; 10 วัน: <strong>10,000 บ.</strong>
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md border transition-all ${
                        isTier2
                          ? "bg-emerald-100 text-emerald-900 border-emerald-500 font-bold dark:bg-emerald-900/60 dark:text-emerald-200 ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      พักรักษาตัวตั้งแต่ 11 - 20 วันขึ้นไป (&ge; 20 วัน): รับเงินเพิ่มอีก <strong>10,000 บ.</strong> (รวมเป็นเงิน <strong>20,000 บ.</strong>)
                    </span>
                  </div>

                  {stayDays > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ สิทธิประมาณการ:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {stayDays <= 10 ? (
                          <>พักรักษาตัว <strong>{stayDays} วัน</strong> (&le; 10 วัน) ได้รับเงินช่วยเหลือ <strong>10,000 บาท</strong></>
                        ) : (
                          <>พักรักษาตัว <strong>{stayDays} วัน</strong> (เกิน 10 วัน ถึง 20 วันขึ้นไป) ได้รับเงินเพิ่มอีก 10,000 บาท รวมเป็นเงิน <strong>20,000 บาท</strong></>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                ขั้นตอนที่ 4: ข้อมูลครอบครัวและทายาทผู้มีสิทธิ
              </h2>
              <p className="text-xs text-muted-foreground">
                เชื่อมโยงข้อมูลจาก Tab 3 (ข้อมูลครอบครัว) และ Tab 4 (ข้อมูลทายาท) เพื่อคำนวณทุนการศึกษาและการจัดสรรเงินสงเคราะห์
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href="/family" target="_blank">
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-purple-300 text-purple-700 dark:border-purple-800">
                  <ExternalLink className="h-3 w-3" />
                  จัดการครอบครัว (Tab 3)
                </Button>
              </Link>
              <Link href="/heirs" target="_blank">
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-blue-300 text-blue-700 dark:border-blue-800">
                  <ExternalLink className="h-3 w-3" />
                  จัดการทายาท (Tab 4)
                </Button>
              </Link>
            </div>
          </div>

          {/* Integrated Source Status */}
          <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 text-white text-[10px]">
                ซิงก์ข้อมูลบูรณาการ
              </Badge>
              <span className="font-semibold text-purple-950 dark:text-purple-200">
                {rankAbbr} {firstName} {lastName} ({militaryId})
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-purple-900 dark:text-purple-300">
              <span>คู่สมรส: {hasSpouse ? "มี (50%)" : "ไม่มี"}</span>
              <span>บุตร: {childrenCount} คน (เรียน {studyingChildrenCount} คน)</span>
              <span>ทายาทผู้รับสิทธิ: {heirsList.length > 0 ? `${heirsList.length} คน` : "จัดสรรอัตโนมัติ"}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Legal Spouse */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-purple-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    คู่สมรสจดทะเบียนตามกฎหมาย (Tab 3: ข้อมูลครอบครัว)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasSpouse}
                  onChange={(e) => setHasSpouse(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {hasSpouse && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อ-สกุล คู่สมรส</Label>
                    <Input
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="text-xs"
                      placeholder="นาง/นางสาว..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">สิทธิประโยชน์คู่สมรส</Label>
                    <div className="p-2 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>มีสิทธิรับบำนาญตกทอด และเงินสงเคราะห์สัดส่วน 50%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Children List */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    ข้อมูลบุตร & สิทธิทุนการศึกษา (Tab 3: ข้อมูลครอบครัว)
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  กำลังศึกษา {studyingChildrenCount} / {childrenCount} คน
                </Badge>
              </div>

              {childrenList.length > 0 ? (
                <div className="space-y-2">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2 text-left">ชื่อ-สกุล บุตร</th>
                          <th className="p-2 text-center">อายุ</th>
                          <th className="p-2 text-center">สถานะการศึกษา</th>
                          <th className="p-2 text-center">ระดับการศึกษา</th>
                          <th className="p-2 text-right">สิทธิทุนการศึกษา (หมวด 3)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {childrenList.map((ch, idx) => (
                          <tr key={ch.nationalId || idx} className="hover:bg-white dark:hover:bg-slate-900/40">
                            <td className="p-2 font-medium">{ch.fullName}</td>
                            <td className="p-2 text-center font-mono">{ch.age} ปี</td>
                            <td className="p-2 text-center">
                              {ch.isStudying ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[10px]">
                                  กำลังศึกษา
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">ไม่ศึกษา</span>
                              )}
                            </td>
                            <td className="p-2 text-center font-mono text-[11px]">{ch.educationLevel || "ไม่ระบุ"}</td>
                            <td className="p-2 text-right text-emerald-600 font-bold">
                              {ch.isStudying ? "ได้รับสิทธิรายปี" : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {/* Editable summary fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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

            {/* 3. Heirs Allocation */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    ข้อมูลทายาทผู้มีสิทธิรับเงินสงเคราะห์ (Tab 4: ข้อมูลทายาท)
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {heirsList.length > 0 ? `${heirsList.length} ลำดับ` : "ตามเกณฑ์กฎหมาย"}
                </Badge>
              </div>

              {heirsList.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2 text-left">ชื่อ-สกุล ทายาท</th>
                        <th className="p-2 text-center">ความสัมพันธ์</th>
                        <th className="p-2 text-right">สัดส่วนที่ระบุ (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {heirsList.map((hr, idx) => (
                        <tr key={hr.nationalId || idx} className="hover:bg-white dark:hover:bg-slate-900/40">
                          <td className="p-2 font-medium">{hr.fullName}</td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {hr.relationship === "SPOUSE_LEGAL" ? "คู่สมรส" : hr.relationship === "CHILD_LEGITIMATE" ? "บุตร" : hr.relationship === "FATHER" ? "บิดา" : hr.relationship === "MOTHER" ? "มารดา" : "ทายาท"}
                            </Badge>
                          </td>
                          <td className="p-2 text-right font-bold font-mono text-blue-600">
                            {hr.allocationPercentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-2.5 rounded bg-blue-50/50 dark:bg-blue-950/20 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>ระบบจะจัดสรรเงินสงเคราะห์อัตโนมัติ: คู่สมรส 50% และบุตรแบ่งเท่ากันในส่วนที่เหลือ 50% ตามระเบียบ กห.</span>
                </div>
              )}
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

          {/* Integrated Data Sources Audit Card (4 แหล่งข้อมูลบูรณาการ) */}
          <Card className="border-2 border-emerald-300 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-slate-900 p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    แหล่งข้อมูลบูรณาการ 4 มิติ (Integrated 4 Sources Audit)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ประมาณการสิทธิโดยประมวลผลข้อมูลเชื่อมโยงครบ 4 แหล่งตามระเบียบและ Rule Engine
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                ซิงก์ครบ 4 แหล่ง
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Source 1: Tab 2 ทะเบียนกำลังพล */}
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white/80 dark:bg-slate-900/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                  <Shield className="h-3.5 w-3.5" />
                  <span>1. ทะเบียนกำลังพล (Tab 2)</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {rankAbbr} {firstName} {lastName}
                </p>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p>สังกัด: {normalUnit}</p>
                  <p>ฐานเงินเดือน: {formatCurrency(salary)} ({salaryLevel} ขั้น {salaryStep})</p>
                  <p>วันบรรจุ: {formatThaiBE(appointmentDate)}</p>
                </div>
              </div>

              {/* Source 2: Tab 3 ข้อมูลครอบครัว */}
              <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-white/80 dark:bg-slate-900/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold text-[11px]">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  <span>2. ข้อมูลครอบครัว (Tab 3)</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {hasSpouse ? spouseName : "ไม่มีคู่สมรส"}
                </p>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p>สถานะ: {hasSpouse ? "คู่สมรสจดทะเบียน ✓" : "โสด/ไม่มีคู่สมรส"}</p>
                  <p>บุตรทั้งหมด: {childrenCount} คน</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">กำลังศึกษา (รับทุน): {studyingChildrenCount} คน</p>
                </div>
              </div>

              {/* Source 3: Tab 4 ข้อมูลทายาท */}
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white/80 dark:bg-slate-900/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-[11px]">
                  <Scale className="h-3.5 w-3.5" />
                  <span>3. ข้อมูลทายาท (Tab 4)</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {heirsList.length > 0 ? `${heirsList.length} ทายาทตามบันทึก` : "จัดสรรตามระเบียบ กห."}
                </p>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  {heirsList.length > 0 ? (
                    heirsList.slice(0, 2).map((h, i) => (
                      <p key={i} className="truncate">{h.fullName} ({h.allocationPercentage}%)</p>
                    ))
                  ) : (
                    <>
                      <p>คู่สมรส: 50%</p>
                      <p>บุตร: 50% (แบ่งเท่ากัน)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Source 4: Tab 5 รายงานสูญเสีย กพ.3/กพ.4 */}
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white/80 dark:bg-slate-900/80 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                  <MapPinned className="h-3.5 w-3.5" />
                  <span>4. รายงานสูญเสีย (Tab 5)</span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {linkedLossReport ? `พิกัด MGRS ${linkedLossReport.report.mgrsCoordinate}` : `เหตุการณ์ ${formatThaiBE(incidentDate)}`}
                </p>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p>วันเกิดเหตุ: {formatThaiBE(incidentDate)}</p>
                  <p>สาเหตุ: {actionCause === "ENEMY_ACTION" ? "การกระทำของข้าศึก (ปูนบำเหน็จฉุกเฉิน)" : "มิใช่การกระทำของข้าศึก"}</p>
                  <p>ประเภท: {lossType === "KIA_COMBAT_DEATH" ? "เสียชีวิตในสมรภูมิ (KIA)" : lossType === "TOTAL_PERMANENT_DISABILITY" ? "ทุพพลภาพถาวร (WIA)" : lossType === "SEVERE_WOUND_WIA" ? "บาดเจ็บสาหัส (WIA)" : "เสียชีวิตขณะปฏิบัติหน้าที่"}</p>
                </div>
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
