"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  Shield,
  Search,
  Plus,
  Filter,
  Calculator,
  Eye,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Users,
  Users2,
  HeartHandshake,
  ArrowRight,
  Activity,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  SALARY_LEVEL_OPTIONS,
  SALARY_STEP_OPTIONS,
  COMPENSATION_STEP_OPTIONS,
  getSalaryAmount,
  getCompensationAmount,
  getAvailableSalarySteps,
  getAvailableCompensationSteps,
  formatSalaryStep,
} from "@/presentation/lib/salary-scale";
import { calculateServiceTime } from "@/presentation/lib/military-date-utils";

// ── Default Military Presets for Autocomplete ──
const DEFAULT_NORMAL_POSITIONS = [
  "ผบ.มว.ปล.",
  "ผบ.ร้อย.",
  "นายทหารยุทธการ",
  "ผช.นยธ.",
  "ผบ.พัน.",
  "รอง ผบ.พัน.",
  "นายทหารฝ่ายยุทธการและการฝึก",
  "นายทหารส่งกำลังบำรุง",
  "เสธ.พัน.",
  "นายสิบส่งกำลัง",
  "นายสิบพยาบาล",
  "พลปืนเล็ก",
  "พลขับ",
  "พลวิทยุ",
  "พลยิง ค.",
  "หน.ชุดปฏิบัติการ",
];

const DEFAULT_NORMAL_UNITS = [
  "ร.19 พัน.1",
  "ร.19 พัน.2",
  "ร.19 พัน.3",
  "พล.ร.9",
  "ร.15 พัน.1",
  "ร.15 พัน.2",
  "ร.21 พัน.1 รอ.",
  "ร.21 พัน.2 รอ.",
  "ร.31 พัน.1 รอ.",
  "ม.1 พัน.1",
  "ป.9 พัน.19",
  "ช.พัน.9",
  "ส.พัน.9",
  "พัน.พัฒนา 3",
  "ศร.",
  "ศสพ.",
];

const DEFAULT_FIELD_POSITIONS = [
  "ผบ.ร้อย.ร. (สนาม)",
  "ผบ.มว.ปล. สน.",
  "รอง ผบ.ร้อย. (สนาม)",
  "หน.ชป. (สนาม)",
  "จนท.พลขับ (สนาม)",
  "จนท.เสนารักษ์ (สนาม)",
  "พลปืนเล็ก สน.",
  "พลวิทยุ สน.",
  "ผบ.หมู่ปล.",
  "จนท.ระวังป้องกัน",
];

const DEFAULT_FIELD_UNITS = [
  "ฉก.นราธิวาส",
  "ฉก.ปัตตานี",
  "ฉก.ยะลา",
  "ฉก.สงขลา",
  "ฉก.ร.19",
  "ฉก.ร.25",
  "ฉก.ทพ.41",
  "ฉก.ทพ.42",
  "ฉก.ทพ.43",
  "ฉก.ทพ.44",
  "ฉก.ทพ.45",
  "ฉก.ทพ.46",
  "ฉก.ทพ.47",
  "ฉก.ทพ.48",
  "ฉก.ทพ.49",
  "กกล.สุรสีห์",
  "กกล.ผาเมือง",
  "กกล.บูรพา",
  "กกล.สุรนารี",
  "กกล.เทพสตรี",
];

const DEFAULT_ORDER_ISSUERS = [
  "กองทัพบก (ทบ.)",
  "กองทัพภาคที่ 1 (ทภ.1)",
  "กองทัพภาคที่ 2 (ทภ.2)",
  "กองทัพภาคที่ 3 (ทภ.3)",
  "กองทัพภาคที่ 4 (ทภ.4)",
  "กองพลทหารราบที่ 9 (พล.ร.9)",
  "กองพลทหารราบที่ 15 (พล.ร.15)",
  "กรมทหารราบที่ 19 (ร.19)",
  "กรมทหารราบที่ 25 (ร.25)",
  "กอ.รมน.ภาค 4 สน.",
  "ศปก.ทบ.",
];

export function PersonnelTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [lossFilter, setLossFilter] = useState("ALL");
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnelRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<Partial<MilitaryPersonnelRecord> | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Action Result Confirmation Modal State ──
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    actionName: string;
    message: string;
    details?: {
      fullName: string;
      militaryId?: string;
      citizenId?: string;
      normalUnit?: string;
      fieldUnit?: string;
      lossType?: string;
      timestamp: string;
    };
  }>({
    isOpen: false,
    type: "success",
    title: "",
    actionName: "",
    message: "",
  });

  // ── Delete Confirmation Modal State ──
  const [personnelToDelete, setPersonnelToDelete] = useState<MilitaryPersonnelRecord | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // New Personnel Form State
  const [newRank, setNewRank] = useState("PRIVATE");
  const [newRankAbbr, setNewRankAbbr] = useState("พลทหาร");

  // Rank mapping table for easy lookup
  const RANK_MAP: Record<string, { abbr: string; label: string }> = {
    GENERAL:           { abbr: "พล.อ.",       label: "พลเอก (พล.อ.)" },
    LIEUTENANT_GENERAL:{ abbr: "พล.ท.",       label: "พลโท (พล.ท.)" },
    MAJOR_GENERAL:     { abbr: "พล.ต.",      label: "พลตรี (พล.ต.)" },
    COLONEL_SPECIAL:   { abbr: "พ.อ.(พิเศษ)",label: "พันเอกพิเศษ (พ.อ.พิเศษ)" },
    COLONEL:           { abbr: "พ.อ.",       label: "พันเอก (พ.อ.)" },
    LIEUTENANT_COLONEL:{ abbr: "พ.ท.",       label: "พันโท (พ.ท.)" },
    MAJOR:             { abbr: "พ.ต.",       label: "พันตรี (พ.ต.)" },
    CAPTAIN:           { abbr: "ร.อ.",       label: "ร้อยเอก (ร.อ.)" },
    FIRST_LIEUTENANT:  { abbr: "ร.ท.",       label: "ร้อยโท (ร.ท.)" },
    SECOND_LIEUTENANT: { abbr: "ร.ต.",       label: "ร้อยตรี (ร.ต.)" },
    MASTER_SERGEANT_1ST:{ abbr: "จ.ส.อ.",     label: "จ่าสิบเอก (จ.ส.อ.)" },
    MASTER_SERGEANT_2ND:{ abbr: "จ.ส.ท.",     label: "จ่าสิบโท (จ.ส.ท.)" },
    MASTER_SERGEANT_3RD:{ abbr: "จ.ส.ต.",     label: "จ่าสิบตรี (จ.ส.ต.)" },
    SERGEANT:          { abbr: "ส.อ.",       label: "สิบเอก (ส.อ.)" },
    CORPORAL:          { abbr: "ส.ท.",       label: "สิบโท (ส.ท.)" },
    LANCE_CORPORAL:    { abbr: "ส.ต.",       label: "สิบตรี (ส.ต.)" },
    PRIVATE:           { abbr: "พลทหาร",     label: "พลทหาร (พลฯ)" },
    VOLUNTEER_RANGER:  { abbr: "อส.ทพ.",     label: "อาสาสมัครทหารพราน (อส.ทพ.)" },
    // Backward-compatibility aliases for legacy records
    CORPORAL_RESERVE:  { abbr: "ส.ต.กองฯ",   label: "ส.ต.กองประจำการ (ส.ต.กองฯ)" },
    RANGER_ENLISTED:   { abbr: "พล.อส.",     label: "พลอาสาสมัคร (พล.อส.)" },
    SERGEANT_2ND:      { abbr: "ส.ท.",       label: "สิบโท (ส.ท.)" },
    SERGEANT_1ST:      { abbr: "ส.อ.",       label: "สิบเอก (ส.อ.)" },
    STAFF_SGT_3RD:     { abbr: "จ.ส.ต.",     label: "จ่าสิบตรี (จ.ส.ต.)" },
    STAFF_SGT_2ND:     { abbr: "จ.ส.ท.",     label: "จ่าสิบโท (จ.ส.ท.)" },
    STAFF_SGT_1ST:     { abbr: "จ.ส.อ.",     label: "จ่าสิบเอก (จ.ส.อ.)" },
  };

  // ── Thai months / Buddhist year constants ──
  const THAI_MONTHS = [
    { value: 1, label: "มกราคม" }, { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" }, { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" }, { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" }, { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" }, { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" }, { value: 12, label: "ธันวาคม" },
  ];
  const RELIGION_OPTIONS = ["พุทธ", "อิสลาม", "คริสต์", "ฮินดู", "ซิกข์", "อื่นๆ"];

  // ── Generate Buddhist year list (current BE − 60 … current BE) ──
  const currentBE = new Date().getFullYear() + 543;
  const BE_YEARS = Array.from({ length: 61 }, (_, i) => currentBE - 60 + i).reverse();

  // ── Validation helpers ──
  const validateThaiCitizenId = (id: string): boolean => {
    if (!/^\d{13}$/.test(id)) return false;
    const digits = id.split("").map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
    const check = (11 - (sum % 11)) % 10;
    return check === digits[12];
  };

  const generateValidThaiCitizenId = (): string => {
    const base = "3" + Math.floor(10000000000 + Math.random() * 90000000000).toString().slice(0, 11);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number(base[i]) * (13 - i);
    }
    const check = (11 - (sum % 11)) % 10;
    return base + String(check);
  };

  const validateMobilePhone = (phone: string): boolean => /^0[689]\d{8}$/.test(phone);
  const validateMilitaryId = (id: string): boolean => /^\d{10}$/.test(id);

  // Calculate age from Thai date parts
  const calcAgeFromBE = (day: number, month: number, yearBE: number): number => {
    const yearCE = yearBE - 543;
    const birthDate = new Date(yearCE, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return Math.max(0, age);
  };

  // Convert Thai date parts to ISO date string for API
  const thaiDateToISO = (day: number, month: number, yearBE: number): string => {
    const yearCE = yearBE - 543;
    return `${yearCE}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDateOfBirth, setNewDateOfBirth] = useState("");
  const [newBirthDay, setNewBirthDay] = useState(1);
  const [newBirthMonth, setNewBirthMonth] = useState(1);
  const [newBirthYear, setNewBirthYear] = useState(currentBE - 30);
  const [newAge, setNewAge] = useState(30);
  const [newMaritalStatus, setNewMaritalStatus] = useState("โสด");
  const [newReligion, setNewReligion] = useState("พุทธ");
  const [newPhone, setNewPhone] = useState("");
  const [newMilitaryId, setNewMilitaryId] = useState("");
  const [newCitizenId, setNewCitizenId] = useState("");
  const [newPersonnelType, setNewPersonnelType] = useState("OFFICER");
  const [newConscriptionBatch, setNewConscriptionBatch] = useState<number>(1);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNormalPosition, setNewNormalPosition] = useState("");
  const [newNormalUnit, setNewNormalUnit] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldPosition, setNewFieldPosition] = useState("");
  const [newFieldDutyOrderNo, setNewFieldDutyOrderNo] = useState("");
  const [newFieldDutyOrderDate, setNewFieldDutyOrderDate] = useState("");
  const [newFieldDutyOrderIssuer, setNewFieldDutyOrderIssuer] = useState("");
  const [newMissionCategory, setNewMissionCategory] = useState("COUNTER_INSURGENCY");
  const [newSalaryLevel, setNewSalaryLevel] = useState("น.3");
  const [newSalaryStep, setNewSalaryStep] = useState(19);
  const [newSalary, setNewSalary] = useState(34110);
  const [newCompensationStep, setNewCompensationStep] = useState(0);
  const [newCompensationAmount, setNewCompensationAmount] = useState(0);
  const [newAdditionalPay, setNewAdditionalPay] = useState(0);
  const [newMultiplierYears, setNewMultiplierYears] = useState(0);
  const [newMultiplierMonths, setNewMultiplierMonths] = useState(0);
  const [newMultiplierDays, setNewMultiplierDays] = useState(0);
  const [newTotalYears, setNewTotalYears] = useState(0);
  const [newTotalMonths, setNewTotalMonths] = useState(0);
  const [newTotalDays, setNewTotalDays] = useState(0);
  const [newLossType, setNewLossType] = useState("KIA_COMBAT_DEATH");
  const [newAppointmentDate, setNewAppointmentDate] = useState("");
  const [newProfilePhotoUrl, setNewProfilePhotoUrl] = useState<string>("");
  const [newDocumentAttachments, setNewDocumentAttachments] = useState<Array<{ name: string; type: string; size: number; dataUrl?: string }>>([]);

  // Auto-calculate total service time (normal service from appointment date + multiplier service)
  useEffect(() => {
    const normalService = calculateServiceTime(newAppointmentDate, null);
    const totalD = normalService.days + (Number(newMultiplierDays) || 0);
    const extraM = Math.floor(totalD / 30);
    const finalDays = totalD % 30;

    const totalM = normalService.months + (Number(newMultiplierMonths) || 0) + extraM;
    const extraY = Math.floor(totalM / 12);
    const finalMonths = totalM % 12;

    const finalYears = normalService.years + (Number(newMultiplierYears) || 0) + extraY;

    setNewTotalYears(finalYears);
    setNewTotalMonths(finalMonths);
    setNewTotalDays(finalDays);
  }, [newAppointmentDate, newMultiplierYears, newMultiplierMonths, newMultiplierDays]);

  // Auto-update salary when salary level changes
  const handleSalaryLevelChange = (level: string) => {
    setNewSalaryLevel(level);
    const availableSteps = getAvailableSalarySteps(level);
    let stepToUse = newSalaryStep;
    if (!availableSteps.includes(newSalaryStep)) {
      stepToUse = availableSteps[0] ?? 1;
      setNewSalaryStep(stepToUse);
    }
    const autoSalary = getSalaryAmount(level, stepToUse);
    setNewSalary(autoSalary);

    if (newCompensationStep > 0) {
      setNewCompensationAmount(getCompensationAmount(level, newCompensationStep));
    }
  };

  // Auto-update salary when salary step changes
  const handleSalaryStepChange = (step: number) => {
    setNewSalaryStep(step);
    const autoSalary = getSalaryAmount(newSalaryLevel, step);
    setNewSalary(autoSalary);
  };

  // Auto-update compensation amount when compensation tier changes
  const handleCompensationStepChange = (compStep: number) => {
    setNewCompensationStep(compStep);
    const autoComp = getCompensationAmount(newSalaryLevel, compStep);
    setNewCompensationAmount(autoComp);
  };

  // ── Autocomplete options combined from database records + default presets ──
  const normalPositionOptions = useMemo(() => {
    const fromDb = personnelList.map((p) => p.abbreviatedPosition || (p as any).position).filter((x): x is string => Boolean(x));
    return Array.from(new Set([...fromDb, ...DEFAULT_NORMAL_POSITIONS]));
  }, [personnelList]);

  const normalUnitOptions = useMemo(() => {
    const fromDb = personnelList.map((p) => p.normalUnit).filter((x): x is string => Boolean(x));
    return Array.from(new Set([...fromDb, ...DEFAULT_NORMAL_UNITS]));
  }, [personnelList]);

  const fieldPositionOptions = useMemo(() => {
    const fromDb = personnelList.map((p) => p.fieldPosition).filter((x): x is string => Boolean(x));
    return Array.from(new Set([...fromDb, ...DEFAULT_FIELD_POSITIONS]));
  }, [personnelList]);

  const fieldUnitOptions = useMemo(() => {
    const fromDb = personnelList.map((p) => p.fieldUnit).filter((x): x is string => Boolean(x));
    return Array.from(new Set([...fromDb, ...DEFAULT_FIELD_UNITS]));
  }, [personnelList]);

  const orderIssuerOptions = useMemo(() => {
    const fromDb = personnelList.map((p) => (p as any).fieldDutyOrderIssuer).filter((x): x is string => Boolean(x));
    return Array.from(new Set([...fromDb, ...DEFAULT_ORDER_ISSUERS]));
  }, [personnelList]);

  // ── Validation error states ──
  const [militaryIdError, setMilitaryIdError] = useState("");
  const [citizenIdError, setCitizenIdError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  const checkDuplicateName = (first: string, last: string) => {
    const f = (first || "").trim().toLowerCase();
    const l = (last || "").trim().toLowerCase();
    if (f && l) {
      const found = personnelList.find(
        (p) => p.firstName.trim().toLowerCase() === f && p.lastName.trim().toLowerCase() === l
      );
      if (found) {
        setNameError(`พบกำลังพลชื่อ "${found.firstName} ${found.lastName}" (เลขทหาร ${found.militaryId}) ในระบบแล้ว (ห้ามชื่อ-นามสกุลซ้ำซ้อน)`);
        return true;
      }
    }
    setNameError("");
    return false;
  };

  // Auto-recalculate age when birth date parts change
  useEffect(() => {
    const age = calcAgeFromBE(newBirthDay, newBirthMonth, newBirthYear);
    setNewAge(age);
    setNewDateOfBirth(thaiDateToISO(newBirthDay, newBirthMonth, newBirthYear));
  }, [newBirthDay, newBirthMonth, newBirthYear]);

  const readFileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const mapped = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: file.type.startsWith("image/") || file.type === "application/pdf" ? await readFileToDataUrl(file) : undefined,
      }))
    );

    setNewDocumentAttachments((prev) => [...prev, ...mapped]);
    event.target.value = "";
  };

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/personnel");
      const json = await res.json();
      if (json.success) {
        setPersonnelList(json.data);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("personnel-updated"));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  // ── List of all unique units present in database + defaults ──
  const availableUnits = useMemo(() => {
    const units = new Set<string>();
    personnelList.forEach((p) => {
      if (p.normalUnit && p.normalUnit.trim()) units.add(p.normalUnit.trim());
      if (p.fieldUnit && p.fieldUnit.trim()) units.add(p.fieldUnit.trim());
    });
    // Add default popular units
    DEFAULT_NORMAL_UNITS.forEach((u) => units.add(u));
    DEFAULT_FIELD_UNITS.forEach((u) => units.add(u));
    return Array.from(units).sort((a, b) => a.localeCompare(b, "th"));
  }, [personnelList]);

  const filteredList = useMemo(() => {
    return personnelList.filter((p) => {
      const searchLower = search.trim().toLowerCase();
      const matchSearch =
        searchLower === "" ||
        p.firstName.toLowerCase().includes(searchLower) ||
        p.lastName.toLowerCase().includes(searchLower) ||
        p.militaryId.includes(searchLower) ||
        p.citizenId.includes(searchLower) ||
        (p.rankAbbr && p.rankAbbr.toLowerCase().includes(searchLower)) ||
        (p.normalUnit && p.normalUnit.toLowerCase().includes(searchLower)) ||
        (p.fieldUnit && p.fieldUnit.toLowerCase().includes(searchLower)) ||
        (p.abbreviatedPosition && p.abbreviatedPosition.toLowerCase().includes(searchLower)) ||
        (p.fieldPosition && p.fieldPosition.toLowerCase().includes(searchLower));

      const matchUnit =
        unitFilter === "ALL" ||
        p.normalUnit === unitFilter ||
        p.fieldUnit === unitFilter;

      let matchLoss = true;
      if (lossFilter === "KIA_COMBAT_DEATH" || lossFilter === "DEATH") {
        matchLoss = p.lossType === "KIA_COMBAT_DEATH" || p.lossType === "DUTY_DEATH";
      } else if (lossFilter === "TOTAL_PERMANENT_DISABILITY" || lossFilter === "DISABILITY") {
        matchLoss = p.lossType === "TOTAL_PERMANENT_DISABILITY";
      } else if (lossFilter === "SEVERE_WOUND_WIA" || lossFilter === "WIA") {
        matchLoss = p.lossType === "SEVERE_WOUND_WIA" || p.lossType === "WOUNDED_IN_ACTION";
      } else if (lossFilter !== "ALL") {
        matchLoss = p.lossType === lossFilter;
      }

      return matchSearch && matchUnit && matchLoss;
    });
  }, [personnelList, search, unitFilter, lossFilter]);

  // Auto-dismiss action feedback after 4 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  const resetAddForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewMilitaryId("");
    setNewCitizenId("");
    setNewPhone("");
    setNewRank("PRIVATE");
    setNewRankAbbr("พลทหาร");
    setNewPersonnelType("ENLISTED");
    setNewConscriptionBatch(1);
    setNewNormalPosition("");
    setNewNormalUnit("");
    setNewFieldUnit("");
    setNewFieldPosition("");
    setNewFieldDutyOrderNo("");
    setNewFieldDutyOrderDate("");
    setNewFieldDutyOrderIssuer("");
    setNewSalaryLevel("น.3");
    setNewSalaryStep(19);
    setNewSalary(34110);
    setNewCompensationStep(0);
    setNewCompensationAmount(0);
    setNewAdditionalPay(0);
    setNewAppointmentDate("");
    setNewMultiplierYears(0);
    setNewMultiplierMonths(0);
    setNewMultiplierDays(0);
    setNewTotalYears(0);
    setNewTotalMonths(0);
    setNewTotalDays(0);
    setNewLossType("KIA_COMBAT_DEATH");
    setNewMissionCategory("COUNTER_INSURGENCY");
    setNewBirthDay(1);
    setNewBirthMonth(1);
    setNewBirthYear(currentBE - 30);
    setNewProfilePhotoUrl("");
    setNewDocumentAttachments([]);
    setMilitaryIdError("");
    setCitizenIdError("");
    setPhoneError("");
    setNameError("");
  };

  const fillSampleTestData = () => {
    const sampleMilitaryId = `49${Math.floor(10000000 + Math.random() * 90000000)}`;
    const sampleCitizenId = generateValidThaiCitizenId();
    const samplePhone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
    const sampleFirstNames = ["วีรชัย", "สมชาย", "กิตติพงษ์", "ธีรภัทร", "อนุสรณ์", "ณัฐวุฒิ", "สิทธิศักดิ์", "อัครเดช"];
    const sampleLastNames = ["ภักดีสยาม", "กล้าหาญ", "รักชาติ", "มั่นคง", "เดชณรงค์", "พิทักษ์แดน", "พิทักษ์ไทย"];
    const randFirst = sampleFirstNames[Math.floor(Math.random() * sampleFirstNames.length)];
    const randLast = sampleLastNames[Math.floor(Math.random() * sampleLastNames.length)];

    setNewMilitaryId(sampleMilitaryId);
    setNewCitizenId(sampleCitizenId);
    setNewFirstName(randFirst);
    setNewLastName(randLast);
    setNewPhone(samplePhone);
    setNewRank("MASTER_SERGEANT_1ST");
    setNewRankAbbr("จ.ส.อ.");
    setNewPersonnelType("NCO");
    setNewNormalUnit("ร.19 พัน.1 (พล.ร.9)");
    setNewNormalPosition("ผบ.มว.ปล.");
    setNewFieldUnit("ฉก.นราธิวาส (กกล.ทบ.)");
    setNewFieldPosition("ผบ.มว.ปล. สน.");
    setNewFieldDutyOrderNo("คำสั่ง ทภ.4 ที่ 142/2567");
    setNewFieldDutyOrderDate("2024-10-01");
    setNewFieldDutyOrderIssuer("กองทัพภาคที่ 4");
    setNewMissionCategory("COUNTER_INSURGENCY");
    setNewSalaryLevel("ป.3");
    setNewSalaryStep(15);
    setNewSalary(26500);
    setNewCompensationStep(1.5);
    setNewCompensationAmount(28500);
    setNewAdditionalPay(2500);
    setNewAppointmentDate("2016-05-01");
    setNewMultiplierYears(4);
    setNewMultiplierMonths(6);
    setNewMultiplierDays(0);
    setNewLossType("KIA_COMBAT_DEATH");
    setMilitaryIdError("");
    setCitizenIdError("");
    setPhoneError("");
    setNameError("");
  };

  const getThaiTimestamp = () => {
    const now = new Date();
    return now.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatLossTypeLabel = (type?: string) => {
    if (!type) return "-";
    switch (type) {
      case "KIA_COMBAT_DEATH":
      case "DUTY_DEATH":
        return "เสียชีวิตจากการปฏิบัติหน้าที่/สู้รบ";
      case "TOTAL_PERMANENT_DISABILITY":
        return "พิการทุพพลภาพถาวร";
      case "SEVERE_WOUND_WIA":
      case "WOUNDED_IN_ACTION":
        return "บาดเจ็บจากการปฏิบัติหน้าที่สนาม";
      default:
        return type;
    }
  };

  const handleCreatePersonnel = async () => {
    let hasError = false;
    if (!newMilitaryId) {
      setMilitaryIdError("กรุณากรอกเลขประจำตัวทหาร 10 หลัก (เฉพาะตัวเลข)");
      hasError = true;
    } else if (!validateMilitaryId(newMilitaryId)) {
      setMilitaryIdError("เลขประจำตัวทหารต้องเป็นตัวเลข 10 หลักเท่านั้น");
      hasError = true;
    } else if (personnelList.some((p) => p.militaryId === newMilitaryId)) {
      setMilitaryIdError("เลขประจำตัวทหารนี้มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)");
      hasError = true;
    } else {
      setMilitaryIdError("");
    }

    if (newCitizenId) {
      if (!validateThaiCitizenId(newCitizenId)) {
        setCitizenIdError("เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก และ Check Digit ถูกต้อง)");
        hasError = true;
      } else if (personnelList.some((p) => p.citizenId === newCitizenId)) {
        setCitizenIdError("เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)");
        hasError = true;
      } else {
        setCitizenIdError("");
      }
    } else {
      setCitizenIdError("");
    }

    if (newFirstName.trim() && newLastName.trim()) {
      if (checkDuplicateName(newFirstName, newLastName)) {
        hasError = true;
      }
    }

    if (newPhone && !validateMobilePhone(newPhone)) {
      setPhoneError("เบอร์โทรไม่ถูกต้อง (ต้องเป็นเบอร์มือถือ 10 หลัก เริ่มด้วย 06, 08 หรือ 09)");
      hasError = true;
    } else {
      setPhoneError("");
    }

    if (!newFirstName || !newLastName || !newMilitaryId || hasError) {
      setActionFeedback({ type: "error", message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง (ห้ามข้อมูลซ้ำซ้อน)" });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "ข้อมูลซ้ำซ้อนหรือไม่ถูกต้อง",
        actionName: "ลงทะเบียนกำลังพลใหม่",
        message: nameError || militaryIdError || citizenIdError || "กรุณาตรวจสอบและแก้ไขข้อมูลที่มีข้อผิดพลาด เช่น ชื่อ-นามสกุล, เลขประจำตัวทหาร หรือเลขบัตรประชาชน",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          militaryId: newMilitaryId,
          citizenId: newCitizenId || generateValidThaiCitizenId(),
          rank: newRank,
          rankAbbr: newRankAbbr,
          firstName: newFirstName,
          lastName: newLastName,
          dateOfBirth: newDateOfBirth || undefined,
          age: newAge,
          maritalStatus: newMaritalStatus,
          religion: newReligion,
          phone: newPhone,
          profilePhotoUrl: newProfilePhotoUrl || undefined,
          militaryBranch: "ROYAL_THAI_ARMY",
          abbreviatedPosition: newNormalPosition || "นายทหารยุทธการ",
          normalUnit: newNormalUnit || "พล.ร.9",
          fieldPosition: newFieldPosition || "ผบ.มว.ปล. สน.",
          fieldUnit: newFieldUnit || "ฉก.นราธิวาส",
          fieldDutyOrderNo: newFieldDutyOrderNo,
          fieldDutyOrderDate: newFieldDutyOrderDate || undefined,
          fieldDutyOrderIssuer: newFieldDutyOrderIssuer,
          missionCategory: newMissionCategory,
          salary: Number(newSalary),
          salaryLevel: newSalaryLevel,
          salaryStep: Number(newSalaryStep),
          compensationAmount: Number(newCompensationAmount),
          additionalPay: Number(newAdditionalPay || 0),
          appointmentDate: newAppointmentDate || "2015-05-01",
          serviceYearsNormal: Math.max(0, calculateServiceTime(newAppointmentDate || "2015-05-01", null).years),
          serviceMonthsNormal: calculateServiceTime(newAppointmentDate || "2015-05-01", null).months,
          serviceDaysNormal: calculateServiceTime(newAppointmentDate || "2015-05-01", null).days,
          serviceYearsMultiplier: Number(newMultiplierYears || 0),
          serviceMonthsMultiplier: Number(newMultiplierMonths || 0),
          serviceDaysMultiplier: Number(newMultiplierDays || 0),
          totalServiceYears: Number(newTotalYears),
          totalServiceMonths: Number(newTotalMonths),
          totalServiceDays: Number(newTotalDays),
          missionType: newMissionCategory,
          actionType: "DIRECT_COMBAT",
          incidentType: "COMBAT_ENGAGEMENT",
          lossType: newLossType,
          conscriptionBatch: (newRank === "PRIVATE" || newPersonnelType === "ENLISTED") ? Number(newConscriptionBatch) : null,
          promotionSteps: 0,
          promotedRankAbbr: "พล.อ.",
          promotedSalary: Math.round(Number(newSalary) * 1.5),
          documentAttachments: newDocumentAttachments,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: `ลงทะเบียนกำลังพล ${newRankAbbr} ${newFirstName} ${newLastName} เข้าสู่ฐานข้อมูลเรียบร้อยแล้ว`,
        });
        const savedFullName = `${newRankAbbr} ${newFirstName} ${newLastName}`;
        const savedMilId = newMilitaryId;
        const savedCitId = newCitizenId || json.data?.citizenId || "";
        const savedUnit = newNormalUnit || "พล.ร.9";
        const savedField = newFieldUnit;
        const savedLoss = newLossType;

        resetAddForm();
        setIsAddModalOpen(false);
        fetchPersonnel();

        // Trigger confirmation result popup modal
        setResultModal({
          isOpen: true,
          type: "success",
          title: "บันทึกข้อมูลกำลังพลสำเร็จ",
          actionName: "ลงทะเบียนกำลังพลใหม่ (Add Personnel)",
          message: `ระบบได้ทำการบันทึกข้อมูลกำลังพลเข้าสู่ฐานข้อมูลระบบประมาณการสิทธิเรียบร้อยแล้ว`,
          details: {
            fullName: savedFullName,
            militaryId: savedMilId,
            citizenId: savedCitId,
            normalUnit: savedUnit,
            fieldUnit: savedField,
            lossType: savedLoss,
            timestamp: getThaiTimestamp(),
          },
        });
      } else {
        setActionFeedback({
          type: "error",
          message: json.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลกำลังพล",
        });
        setResultModal({
          isOpen: true,
          type: "error",
          title: "บันทึกข้อมูลกำลังพลไม่สำเร็จ",
          actionName: "ลงทะเบียนกำลังพลใหม่",
          message: json.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลกำลังพล กรุณาตรวจสอบและลองใหม่อีกครั้ง",
        });
      }
    } catch (err: any) {
      console.error(err);
      setActionFeedback({
        type: "error",
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        actionName: "ลงทะเบียนกำลังพลใหม่",
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (personnel: MilitaryPersonnelRecord) => {
    setEditingPersonnelId(personnel.id);
    setEditingPersonnel({
      ...personnel,
      salary: Number(personnel.salary ?? 0),
      compensationAmount: Number(personnel.compensationAmount ?? 0),
      additionalPay: Number(personnel.additionalPay ?? 0),
      totalServiceYears: Number(personnel.totalServiceYears ?? 0),
      promotionSteps: Number(personnel.promotionSteps ?? 0),
      hospitalAdmissionDate: personnel.hospitalAdmissionDate ?? "",
      hospitalDischargeDate: personnel.hospitalDischargeDate ?? "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePersonnel = async () => {
    if (!editingPersonnelId || !editingPersonnel) return;

    // ตรวจสอบข้อมูลซ้ำซ้อนก่อนอัปเดต
    const isDupMil = editingPersonnel.militaryId && personnelList.some(
      (p) => p.id !== editingPersonnelId && p.militaryId === editingPersonnel.militaryId
    );
    if (isDupMil) {
      setActionFeedback({ type: "error", message: `เลขประจำตัวทหาร ${editingPersonnel.militaryId} มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)` });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "ข้อมูลซ้ำซ้อน",
        actionName: "แก้ไขข้อมูลกำลังพล",
        message: `เลขประจำตัวทหาร ${editingPersonnel.militaryId} มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง`,
      });
      return;
    }

    const isDupCit = editingPersonnel.citizenId && personnelList.some(
      (p) => p.id !== editingPersonnelId && p.citizenId === editingPersonnel.citizenId
    );
    if (isDupCit) {
      setActionFeedback({ type: "error", message: `เลขบัตรประชาชน ${editingPersonnel.citizenId} มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)` });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "ข้อมูลซ้ำซ้อน",
        actionName: "แก้ไขข้อมูลกำลังพล",
        message: `เลขบัตรประชาชน ${editingPersonnel.citizenId} มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง`,
      });
      return;
    }

    const editFirst = (editingPersonnel.firstName || "").trim();
    const editLast = (editingPersonnel.lastName || "").trim();
    const isDupName = editFirst && editLast && personnelList.some(
      (p) => p.id !== editingPersonnelId &&
             p.firstName.trim().toLowerCase() === editFirst.toLowerCase() &&
             p.lastName.trim().toLowerCase() === editLast.toLowerCase()
    );
    if (isDupName) {
      setActionFeedback({ type: "error", message: `พบกำลังพลชื่อ "${editFirst} ${editLast}" ในระบบแล้ว (ห้ามชื่อ-นามสกุลซ้ำซ้อน)` });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "ชื่อซ้ำซ้อน",
        actionName: "แก้ไขข้อมูลกำลังพล",
        message: `พบข้อมูลกำลังพลชื่อ "${editFirst} ${editLast}" ในระบบแล้ว กรุณาตรวจสอบเพื่อป้องกันชื่อซ้ำซ้อน`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...editingPersonnel,
        salary: Number(editingPersonnel.salary ?? 0),
        compensationAmount: Number(editingPersonnel.compensationAmount ?? 0),
        additionalPay: Number(editingPersonnel.additionalPay ?? 0),
        totalServiceYears: Number(editingPersonnel.totalServiceYears ?? 0),
        promotionSteps: Number(editingPersonnel.promotionSteps ?? 0),
      };

      const res = await fetch(`/api/personnel/${editingPersonnelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        const updatedName = `${editingPersonnel.rankAbbr || ""} ${editingPersonnel.firstName || ""} ${editingPersonnel.lastName || ""}`.trim();
        const updatedMilId = editingPersonnel.militaryId;
        const updatedCitId = editingPersonnel.citizenId;
        const updatedNormal = editingPersonnel.normalUnit;
        const updatedField = editingPersonnel.fieldUnit;
        const updatedLoss = editingPersonnel.lossType;

        setActionFeedback({
          type: "success",
          message: `ปรับปรุงข้อมูลกำลังพล ${updatedName} ในฐานข้อมูลเรียบร้อยแล้ว`,
        });
        setIsEditModalOpen(false);
        setEditingPersonnelId(null);
        setEditingPersonnel(null);
        fetchPersonnel();

        // Trigger confirmation result popup modal
        setResultModal({
          isOpen: true,
          type: "success",
          title: "บันทึกการแก้ไขข้อมูลกำลังพลสำเร็จ",
          actionName: "ปรับปรุงประวัติกำลังพล (Edit Personnel)",
          message: `ระบบได้ทำการอัปเดตข้อมูลกำลังพลในฐานข้อมูลเรียบร้อยแล้ว`,
          details: {
            fullName: updatedName,
            militaryId: updatedMilId,
            citizenId: updatedCitId,
            normalUnit: updatedNormal,
            fieldUnit: updatedField,
            lossType: updatedLoss,
            timestamp: getThaiTimestamp(),
          },
        });
      } else {
        setActionFeedback({
          type: "error",
          message: json.error || "เกิดข้อผิดพลาดในการปรับปรุงข้อมูลกำลังพล",
        });
        setResultModal({
          isOpen: true,
          type: "error",
          title: "ปรับปรุงข้อมูลไม่สำเร็จ",
          actionName: "ปรับปรุงประวัติกำลังพล",
          message: json.error || "เกิดข้อผิดพลาดในการปรับปรุงข้อมูลกำลังพล",
        });
      }
    } catch (err: any) {
      console.error(err);
      setActionFeedback({
        type: "error",
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        actionName: "ปรับปรุงประวัติกำลังพล",
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeletePersonnel = (personnel: MilitaryPersonnelRecord) => {
    setPersonnelToDelete(personnel);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePersonnel = async () => {
    if (!personnelToDelete) return;

    try {
      setIsSubmitting(true);
      const target = personnelToDelete;
      const res = await fetch(`/api/personnel/${target.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setActionFeedback({
          type: "success",
          message: `ลบข้อมูลกำลังพล ${target.rankAbbr} ${target.firstName} ${target.lastName} ออกจากฐานข้อมูลเรียบร้อยแล้ว`,
        });
        setPersonnelList((prev) => prev.filter((item) => item.id !== target.id));
        setIsDeleteConfirmOpen(false);
        setPersonnelToDelete(null);

        // Trigger confirmation result popup modal
        setResultModal({
          isOpen: true,
          type: "success",
          title: "ลบข้อมูลกำลังพลสำเร็จ",
          actionName: "ลบข้อมูลกำลังพล (Delete Personnel)",
          message: `ระบบได้ทำการลบข้อมูลกำลังพลออกจากฐานข้อมูลเรียบร้อยแล้ว`,
          details: {
            fullName: `${target.rankAbbr} ${target.firstName} ${target.lastName}`,
            militaryId: target.militaryId,
            citizenId: target.citizenId,
            normalUnit: target.normalUnit,
            lossType: target.lossType,
            timestamp: getThaiTimestamp(),
          },
        });
      } else {
        setActionFeedback({
          type: "error",
          message: json.error || "เกิดข้อผิดพลาดในการลบข้อมูลกำลังพล",
        });
        setIsDeleteConfirmOpen(false);
        setResultModal({
          isOpen: true,
          type: "error",
          title: "ลบข้อมูลกำลังพลไม่สำเร็จ",
          actionName: "ลบข้อมูลกำลังพล",
          message: json.error || "เกิดข้อผิดพลาดในการลบข้อมูลกำลังพล",
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsDeleteConfirmOpen(false);
      setResultModal({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        actionName: "ลบข้อมูลกำลังพล",
        message: err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLossBadge = (lossType: string) => {
    switch (lossType) {
      case "KIA_COMBAT_DEATH":
        return <Badge className="bg-red-600 text-white hover:bg-red-700">เสียชีวิตในการรบ (KIA)</Badge>;
      case "DUTY_DEATH":
        return <Badge className="bg-orange-600 text-white hover:bg-orange-700">เสียชีวิตปฏิบัติหน้าที่</Badge>;
      case "TOTAL_PERMANENT_DISABILITY":
        return <Badge className="bg-purple-600 text-white hover:bg-purple-700">ทุพพลภาพถาวร (WIA)</Badge>;
      default:
        return <Badge variant="secondary">บาดเจ็บขณะปฏิบัติหน้าที่</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ทะเบียนและประวัติกำลังพล (Personnel Management)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            ระบบฐานข้อมูลประวัติการรับราชการ สังกัดปกติ สังกัดสนาม เวลาราชการทวีคูณ และสถานะความสูญเสีย
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            ลงทะเบียนกำลังพลใหม่
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ-สกุล, เลขประจำตัวทหาร, เลขบัตรปชช., หน่วยสังกัด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              aria-label="ตัวกรองหน่วยสังกัด"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">ทุกหน่วยสังกัด (All Units)</option>
              {availableUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={lossFilter}
              onChange={(e) => setLossFilter(e.target.value)}
              aria-label="ตัวกรองประเภทความสูญเสีย"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">ทุกประเภทความสูญเสีย (All Loss Types)</option>
              <option value="KIA_COMBAT_DEATH">เสียชีวิต (KIA / Duty Death)</option>
              <option value="TOTAL_PERMANENT_DISABILITY">พิการทุพพลภาพ (Total Disability)</option>
              <option value="SEVERE_WOUND_WIA">บาดเจ็บ (WIA / Severe Wound)</option>
            </select>
          </div>
        </div>

        {(search || unitFilter !== "ALL" || lossFilter !== "ALL") && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1 border-t border-slate-100 dark:border-slate-800/60">
            <span>
              พบข้อมูลกำลังพล <strong className="text-slate-900 dark:text-slate-100">{filteredList.length}</strong> นาย (จากทั้งหมด {personnelList.length} นาย)
            </span>
            <button
              onClick={() => {
                setSearch("");
                setUnitFilter("ALL");
                setLossFilter("ALL");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Personnel Table Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold">เลขประจำตัว / ยศ-ชื่อ-สกุล</TableHead>
                <TableHead className="text-xs font-bold">สังกัดปกติ / สังกัดสนาม</TableHead>
                <TableHead className="text-xs font-bold">ฐานเงินเดือน</TableHead>
                <TableHead className="text-xs font-bold">เวลาราชการรวม</TableHead>
                <TableHead className="text-xs font-bold">สถานะความสูญเสีย</TableHead>
                <TableHead className="text-xs font-bold">ปูนบำเหน็จ</TableHead>
                <TableHead className="text-xs font-bold text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลกำลังพล...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    ไม่พบข้อมูลกำลังพลตามเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {p.rankAbbr} {p.firstName} {p.lastName}
                          </span>
                          {p.conscriptionBatch ? (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40">
                              ผลัด {p.conscriptionBatch}
                            </Badge>
                          ) : null}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          ID: {p.militaryId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{p.normalUnit}</span>
                        {p.fieldUnit && (
                          <span className="block text-[11px] text-emerald-600 font-semibold">
                            {p.fieldUnit}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.salary)}
                      <span className="text-[10px] text-muted-foreground font-normal block">
                        ขั้น {p.salaryStep} ({p.salaryLevel})
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {p.totalServiceYears} ปี
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        (ทวีคูณ +{p.serviceYearsMultiplier} ปี)
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{getLossBadge(p.lossType)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                          {p.promotedRankAbbr || "พล.อ."}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({p.promotionSteps} ชั้น)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 gap-1 text-slate-600 hover:text-emerald-600"
                          onClick={() => {
                            setSelectedPersonnel(p);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          ดูประวัติ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 gap-1 border-slate-300 hover:border-emerald-600 hover:text-emerald-700"
                          onClick={() => openEditModal(p)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          แก้ไข
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                          onClick={() => promptDeletePersonnel(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          ลบ
                        </Button>
                        <Link href={`/family?personnelId=${p.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                            title="บันทึกข้อมูลครอบครัว (Tab 3)"
                          >
                            <Users2 className="h-3.5 w-3.5" />
                            ครอบครัว
                          </Button>
                        </Link>
                        <Link href={`/heirs?personnelId=${p.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                            title="บันทึกข้อมูลทายาท (Tab 4)"
                          >
                            <HeartHandshake className="h-3.5 w-3.5" />
                            ทายาท
                          </Button>
                        </Link>
                        <Link href={`/calculator?personnelId=${p.id}`}>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <Calculator className="h-3 w-3" />
                            คำนวณสิทธิ
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Personnel Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {selectedPersonnel?.militaryId}
              </Badge>
              <DialogTitle className="text-lg font-bold">
                ข้อมูลประวัติกำลังพลและภารกิจราชการสนาม
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              {selectedPersonnel?.rankAbbr} {selectedPersonnel?.firstName} {selectedPersonnel?.lastName} - {selectedPersonnel?.normalUnit}
            </DialogDescription>
          </DialogHeader>

          {selectedPersonnel && (
            <div className="space-y-4 py-2 text-xs">
              {/* Summary Profile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-muted-foreground block">ยศและชื่อ-สกุล:</span>
                  <span className="font-bold">{selectedPersonnel.rankAbbr} {selectedPersonnel.firstName} {selectedPersonnel.lastName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">เลขบัตรประชาชน:</span>
                  <span className="font-mono">{selectedPersonnel.citizenId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">เหล่าทัพ:</span>
                  <span className="font-bold">กองทัพบก (RTA)</span>
                </div>
                {selectedPersonnel.conscriptionBatch ? (
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ผลัดทหาร:</span>
                    <span className="font-bold text-amber-600">ผลัดที่ {selectedPersonnel.conscriptionBatch}</span>
                  </div>
                ) : null}
                <div>
                  <span className="text-[10px] text-muted-foreground block">ตำแหน่งปกติ:</span>
                  <span>{selectedPersonnel.abbreviatedPosition} ({selectedPersonnel.normalUnit})</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">ตำแหน่งสนาม:</span>
                  <span className="font-semibold text-emerald-600">{selectedPersonnel.fieldPosition} ({selectedPersonnel.fieldUnit})</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">ฐานเงินเดือน:</span>
                  <span className="font-bold font-mono">{formatCurrency(selectedPersonnel.salary)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">เวลาราชการปกติ:</span>
                  <span>{selectedPersonnel.serviceYearsNormal} ปี</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">เวลาราชการทวีคูณ:</span>
                  <span className="text-emerald-600 font-bold">+{selectedPersonnel.serviceYearsMultiplier} ปี</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">รวมเวลาราชการคำนวณ:</span>
                  <span className="font-bold text-amber-600">{selectedPersonnel.totalServiceYears} ปี</span>
                </div>
              </div>

              {/* Loss and Incident */}
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-1">
                <span className="text-[11px] font-bold text-red-900 dark:text-red-200">
                  ข้อมูลเหตุการณ์และความสูญเสีย:
                </span>
                <p className="text-red-700 dark:text-red-300">
                  {selectedPersonnel.lossType} จากภารกิจ {selectedPersonnel.missionType} วันที่ {selectedPersonnel.incidentDate || "12 มี.ค. 2569"}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge className="bg-amber-600 text-white text-[10px]">
                    ปูนบำเหน็จพิเศษ {selectedPersonnel.promotionSteps} ชั้นยศ เป็น {selectedPersonnel.promotedRankAbbr || "พล.อ."}
                  </Badge>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                    เงินเดือนปูนบำเหน็จ: {formatCurrency(selectedPersonnel.promotedSalary || 68500)}
                  </span>
                </div>
              </div>

              {/* Hospital Stay */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  ข้อมูลการพักรักษาพยาบาล (เงินบำรุงขวัญ):
                </span>
                {selectedPersonnel.hospitalAdmissionDate && selectedPersonnel.hospitalDischargeDate ? (
                  <div className="space-y-1">
                    <p className="text-blue-700 dark:text-blue-300">
                      วันที่เข้ารักษา: <strong>{selectedPersonnel.hospitalAdmissionDate}</strong> ถึง วันที่ออก: <strong>{selectedPersonnel.hospitalDischargeDate}</strong>
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">
                      ระยะเวลาพักรักษาจะถูกคำนวณอัตโนมัติเมื่อประมาณการสิทธิ
                    </p>
                  </div>
                ) : (
                  <p className="text-blue-700 dark:text-blue-300">ไม่ได้ระบุวันที่พักรักษาพยาบาล</p>
                )}
              </div>

              {/* Family Snapshot */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-600" />
                  ข้อมูลคู่สมรสและบุตร
                </span>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>คู่สมรส: <strong>{selectedPersonnel.spouse?.fullName || "ไม่มี"}</strong></span>
                    <Badge variant="outline">สิทธิบำนาญตกทอด 50%</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">บุตรในอุปการะ ({selectedPersonnel.children?.length || 0} คน):</span>
                    {selectedPersonnel.children?.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                        <span>{c.fullName} (อายุ {c.age} ปี - {c.educationLevel})</span>
                        <Badge className="bg-emerald-600 text-white text-[9px]">มีสิทธิรับทุนการศึกษา</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              ปิดหน้าต่าง
            </Button>
            {selectedPersonnel && (
              <>
                <Link href={`/family?personnelId=${selectedPersonnel.id}`}>
                  <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-1.5">
                    <Users2 className="h-4 w-4" />
                    บันทึกข้อมูลครอบครัว (Tab 3)
                  </Button>
                </Link>
                <Link href={`/heirs?personnelId=${selectedPersonnel.id}`}>
                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5">
                    <HeartHandshake className="h-4 w-4" />
                    บันทึกข้อมูลทายาท (Tab 4)
                  </Button>
                </Link>
                <Link href={`/calculator?personnelId=${selectedPersonnel.id}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                    <Calculator className="h-4 w-4" />
                    คำนวณสิทธิ 4 หมวด
                  </Button>
                </Link>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Personnel Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">แก้ไขข้อมูลกำลังพล</DialogTitle>
            <DialogDescription className="text-xs">
              ปรับปรุงข้อมูลพื้นฐานและสภาพความสูญเสียที่เกี่ยวข้องกับสิทธิประโยชน์
            </DialogDescription>
          </DialogHeader>

          {editingPersonnel && (
            <div className="space-y-4 py-2 text-xs">
              {/* ── 1. ข้อมูลส่วนตัว ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  1. ข้อมูลส่วนตัว / ข้อมูลประจำตัว
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ยศทหาร <span className="text-red-500">*</span></Label>
                    <select
                      value={editingPersonnel.rank ?? "PRIVATE"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingPersonnel((prev) => ({ ...prev, rank: v, rankAbbr: RANK_MAP[v]?.abbr ?? "พลทหาร" }));
                      }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                    >
                      <optgroup label="── ทหารชั้นประทวน / อาสาสมัคร ──">
                        <option value="PRIVATE">พลทหาร (พลฯ)</option>
                        <option value="VOLUNTEER_RANGER">อาสาสมัครทหารพราน (อส.ทพ.)</option>
                        <option value="LANCE_CORPORAL">สิบตรี (ส.ต.)</option>
                        <option value="CORPORAL">สิบโท (ส.ท.)</option>
                        <option value="SERGEANT">สิบเอก (ส.อ.)</option>
                        <option value="MASTER_SERGEANT_3RD">จ่าสิบตรี (จ.ส.ต.)</option>
                        <option value="MASTER_SERGEANT_2ND">จ่าสิบโท (จ.ส.ท.)</option>
                        <option value="MASTER_SERGEANT_1ST">จ่าสิบเอก (จ.ส.อ.)</option>
                      </optgroup>
                      <optgroup label="── นายทหารสัญญาบัตร ──">
                        <option value="SECOND_LIEUTENANT">ร้อยตรี (ร.ต.)</option>
                        <option value="FIRST_LIEUTENANT">ร้อยโท (ร.ท.)</option>
                        <option value="CAPTAIN">ร้อยเอก (ร.อ.)</option>
                        <option value="MAJOR">พันตรี (พ.ต.)</option>
                        <option value="LIEUTENANT_COLONEL">พันโท (พ.ท.)</option>
                        <option value="COLONEL">พันเอก (พ.อ.)</option>
                        <option value="COLONEL_SPECIAL">พันเอกพิเศษ (พ.อ.พิเศษ)</option>
                        <option value="MAJOR_GENERAL">พลตรี (พล.ต.)</option>
                        <option value="LIEUTENANT_GENERAL">พลโท (พล.ท.)</option>
                        <option value="GENERAL">พลเอก (พล.อ.)</option>
                      </optgroup>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">เลขประจำตัวทหาร (10 หลัก ตัวเลขเท่านั้น) <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.militaryId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEditingPersonnel((prev) => ({ ...prev, militaryId: v }));
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
                      className="h-8 text-xs font-mono font-medium"
                    />
                  </div>

                  {(editingPersonnel.rank === "PRIVATE" || editingPersonnel.rank === "CORPORAL_RESERVE" || editingPersonnel.conscriptionBatch) && (
                    <div className="space-y-1 col-span-2 bg-amber-50/70 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-300 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          ผลัดทหาร (พลทหาร / ส.ต.กองประจำการ) <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">ผลัดที่ 1 หรือ 2</span>
                      </div>
                      <select
                        value={editingPersonnel.conscriptionBatch ?? 1}
                        onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, conscriptionBatch: Number(e.target.value) }))}
                        className="w-full h-8 rounded-md border border-amber-400 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-amber-950 dark:text-amber-200"
                      >
                        <option value={1}>ผลัดที่ 1</option>
                        <option value={2}>ผลัดที่ 2</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อ <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.firstName ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">นามสกุล <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.lastName ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">เลขบัตรประชาชน (13 หลัก)</Label>
                    <Input
                      value={editingPersonnel.citizenId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                        setEditingPersonnel((prev) => ({ ...prev, citizenId: v }));
                      }}
                      maxLength={13}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">เบอร์โทรศัพท์</Label>
                    <Input
                      value={editingPersonnel.phone ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEditingPersonnel((prev) => ({ ...prev, phone: v }));
                      }}
                      maxLength={10}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">สถานภาพ</Label>
                    <select
                      value={editingPersonnel.maritalStatus ?? "โสด"}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, maritalStatus: e.target.value }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="โสด">โสด</option>
                      <option value="สมรส">สมรส</option>
                      <option value="หย่าร้าง">หย่าร้าง</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ศาสนา</Label>
                    <select
                      value={editingPersonnel.religion ?? "พุทธ"}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, religion: e.target.value }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {RELIGION_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── 2. ข้อมูลตำแหน่ง / สังกัด ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  2. ข้อมูลปกติ / สายสนาม
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อตำแหน่งปกติคำย่อ</Label>
                    <Input
                      list="normal-position-list"
                      value={editingPersonnel.abbreviatedPosition ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, abbreviatedPosition: e.target.value }))}
                      placeholder="เช่น ผบ.มว.ปล."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">สังกัดปกติคำย่อ</Label>
                    <Input
                      list="normal-unit-list"
                      value={editingPersonnel.normalUnit ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, normalUnit: e.target.value }))}
                      placeholder="เช่น ร.19 พัน.1"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ตำแหน่งในสนาม</Label>
                    <Input
                      list="field-position-list"
                      value={editingPersonnel.fieldPosition ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, fieldPosition: e.target.value }))}
                      placeholder="เช่น ผบ.มว.ปล. สน."
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">สังกัดในสนาม</Label>
                    <Input
                      list="field-unit-list"
                      value={editingPersonnel.fieldUnit ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, fieldUnit: e.target.value }))}
                      placeholder="เช่น ฉก.นราธิวาส"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">วันบรรจุรับราชการ</Label>
                    <Input
                      type="date"
                      value={editingPersonnel.appointmentDate ? String(editingPersonnel.appointmentDate).slice(0, 10) : ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">หน่วยที่ออกคำสั่ง</Label>
                    <Input
                      list="field-order-issuer-list"
                      value={editingPersonnel.fieldDutyOrderIssuer ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, fieldDutyOrderIssuer: e.target.value }))}
                      placeholder="เช่น กองทัพบก (ทบ.)"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">เลขที่คำสั่งปฏิบัติหน้าที่สนาม</Label>
                    <Input
                      value={editingPersonnel.fieldDutyOrderNo ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, fieldDutyOrderNo: e.target.value }))}
                      placeholder="เช่น 123/2569"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ประเภทภารกิจ</Label>
                    <select
                      value={editingPersonnel.missionCategory ?? "COUNTER_INSURGENCY"}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, missionCategory: e.target.value }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="COUNTER_INSURGENCY">ปราบปรามความไม่สงบ (จชต.)</option>
                      <option value="BORDER_DEFENSE">ป้องกันชายแดน</option>
                      <option value="INTERNAL_SECURITY">รักษาความมั่นคงภายใน</option>
                      <option value="SPECIAL_SECURITY_OPERATION">ปฏิบัติการความมั่นคงพิเศษ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── 3. ข้อมูลเงินเดือน / สิทธิ / การสูญเสีย ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  3. ข้อมูลเงินเดือน / การคำนวณสิทธิ / การสูญเสีย
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ระดับเงินเดือน</Label>
                    <select
                      value={editingPersonnel.salaryLevel ?? "น.3"}
                      onChange={(e) => {
                        const lvl = e.target.value;
                        const steps = getAvailableSalarySteps(lvl);
                        const defaultStep = steps[0] ?? 1;
                        const sal = getSalaryAmount(lvl, defaultStep);
                        setEditingPersonnel((prev) => ({
                          ...prev,
                          salaryLevel: lvl,
                          salaryStep: defaultStep,
                          salary: sal,
                        }));
                      }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {SALARY_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ขั้นเงินเดือน</Label>
                    <select
                      value={editingPersonnel.salaryStep ?? 1}
                      onChange={(e) => {
                        const stp = Number(e.target.value);
                        const lvl = editingPersonnel.salaryLevel ?? "น.3";
                        const sal = getSalaryAmount(lvl, stp);
                        setEditingPersonnel((prev) => ({
                          ...prev,
                          salaryStep: stp,
                          salary: sal,
                        }));
                      }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {getAvailableSalarySteps(editingPersonnel.salaryLevel ?? "น.3").map((s) => (
                        <option key={s} value={s}>{formatSalaryStep(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ยอดเงินเดือน (บาท)</Label>
                    <Input
                      type="number"
                      value={editingPersonnel.salary ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, salary: Number(e.target.value) }))}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">ยอดเงินเยียวยา (บาท)</Label>
                    <Input
                      type="number"
                      value={editingPersonnel.compensationAmount ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, compensationAmount: Number(e.target.value) }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">เงินเพิ่ม (พ.ส.ร.+ฝ่าอันตราย)</Label>
                    <Input
                      type="number"
                      value={editingPersonnel.additionalPay ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, additionalPay: Number(e.target.value) }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">รวมปีราชการ (ปี)</Label>
                    <Input
                      type="number"
                      value={editingPersonnel.totalServiceYears ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, totalServiceYears: Number(e.target.value) }))}
                      className="h-8 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1 col-span-3">
                    <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">ประเภทความสูญเสีย <span className="text-red-500">*</span></Label>
                    <select
                      value={editingPersonnel.lossType ?? "KIA_COMBAT_DEATH"}
                      onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, lossType: e.target.value }))}
                      className="w-full h-8 rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/30 px-2 text-xs font-medium text-rose-900 dark:text-rose-200"
                    >
                      <option value="KIA_COMBAT_DEATH">เสียชีวิต</option>
                      <option value="TOTAL_PERMANENT_DISABILITY">พิการทุพพลภาพ</option>
                      <option value="SEVERE_WOUND_WIA">บาดเจ็บ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleUpdatePersonnel}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Personnel Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold">
                  ลงทะเบียนข้อมูลกำลังพลใหม่ (Add Personnel)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  กรอกข้อมูลเพื่อบันทึกเข้าสู่ระบบฐานข้อมูลกำลังพลและประมาณการสิทธิประโยชน์
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillSampleTestData}
                className="text-xs border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 gap-1.5 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                สุ่มข้อมูลตัวอย่าง (Fill Test Data)
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">ข้อมูลส่วนตัว / กำลังพลสายสนาม</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ยศทหาร</Label>
                  <select
                    value={newRank}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewRank(v);
                      setNewRankAbbr(RANK_MAP[v]?.abbr ?? "พลทหาร");
                    }}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <optgroup label="── ทหารชั้นประทวน / อาสาสมัคร ──">
                      <option value="PRIVATE">พลทหาร (พลฯ)</option>
                      <option value="VOLUNTEER_RANGER">อาสาสมัครทหารพราน (อส.ทพ.)</option>
                      <option value="LANCE_CORPORAL">สิบตรี (ส.ต.)</option>
                      <option value="CORPORAL">สิบโท (ส.ท.)</option>
                      <option value="SERGEANT">สิบเอก (ส.อ.)</option>
                      <option value="MASTER_SERGEANT_3RD">จ่าสิบตรี (จ.ส.ต.)</option>
                      <option value="MASTER_SERGEANT_2ND">จ่าสิบโท (จ.ส.ท.)</option>
                      <option value="MASTER_SERGEANT_1ST">จ่าสิบเอก (จ.ส.อ.)</option>
                    </optgroup>
                    <optgroup label="── นายทหารสัญญาบัตร ──">
                      <option value="SECOND_LIEUTENANT">ร้อยตรี (ร.ต.)</option>
                      <option value="FIRST_LIEUTENANT">ร้อยโท (ร.ท.)</option>
                      <option value="CAPTAIN">ร้อยเอก (ร.อ.)</option>
                      <option value="MAJOR">พันตรี (พ.ต.)</option>
                      <option value="LIEUTENANT_COLONEL">พันโท (พ.ท.)</option>
                      <option value="COLONEL">พันเอก (พ.อ.)</option>
                      <option value="COLONEL_SPECIAL">พันเอกพิเศษ (พ.อ.พิเศษ)</option>
                      <option value="MAJOR_GENERAL">พลตรี (พล.ต.)</option>
                      <option value="LIEUTENANT_GENERAL">พลโท (พล.ท.)</option>
                      <option value="GENERAL">พลเอก (พล.อ.)</option>
                    </optgroup>
                  </select>
                </div>
                {/* ── เลขประจำตัวทหาร (10 หลัก ตัวเลขเท่านั้น) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก (เฉพาะตัวเลข) <span className="text-red-500">*</span></Label>
                  <Input
                    value={newMilitaryId}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewMilitaryId(v);
                      const foundMil = personnelList.find((p) => p.militaryId === v);
                      if (foundMil) {
                        setMilitaryIdError(`เลขประจำตัวทหารนี้มีในระบบแล้ว (${foundMil.rankAbbr} ${foundMil.firstName})`);
                      } else if (v.length === 10) {
                        setMilitaryIdError("");
                      } else if (v.length > 0) {
                        setMilitaryIdError(`กรอกแล้ว ${v.length}/10 หลัก (เฉพาะตัวเลขเท่านั้น)`);
                      } else {
                        setMilitaryIdError("");
                      }
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
                    placeholder="0000000000"
                    maxLength={10}
                    className={`h-8 text-xs font-mono ${militaryIdError ? "border-red-400 focus:ring-red-400" : ""}`}
                  />
                  {militaryIdError && <p className="text-[10px] text-red-500 mt-0.5">{militaryIdError}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อ <span className="text-red-500">*</span></Label>
                  <Input
                    value={newFirstName}
                    onChange={(e) => {
                      setNewFirstName(e.target.value);
                      checkDuplicateName(e.target.value, newLastName);
                    }}
                    placeholder="ชื่อกำลังพล"
                    className={`h-8 text-xs ${nameError ? "border-red-400 focus:ring-red-400" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">นามสกุล <span className="text-red-500">*</span></Label>
                  <Input
                    value={newLastName}
                    onChange={(e) => {
                      setNewLastName(e.target.value);
                      checkDuplicateName(newFirstName, e.target.value);
                    }}
                    placeholder="นามสกุล"
                    className={`h-8 text-xs ${nameError ? "border-red-400 focus:ring-red-400" : ""}`}
                  />
                </div>
                {nameError && (
                  <div className="col-span-2 text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-1.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{nameError}</span>
                  </div>
                )}
                {/* ── ว/ด/ป. เกิด (เดือนไทย + ปี พ.ศ.) ── */}
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">ว/ด/ป. เกิด (วัน / เดือนไทย / ปี พ.ศ.)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newBirthDay}
                      onChange={(e) => setNewBirthDay(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      value={newBirthMonth}
                      onChange={(e) => setNewBirthMonth(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {THAI_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <select
                      value={newBirthYear}
                      onChange={(e) => setNewBirthYear(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {BE_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* ── อายุ (คำนวณอัตโนมัติ) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">อายุ (คำนวณอัตโนมัติ)</Label>
                  <Input type="number" value={newAge} readOnly className="h-8 text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-bold" />
                  <p className="text-[10px] text-muted-foreground">คำนวณจากวันเกิดที่เลือก</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">สถานภาพ</Label>
                  <select value={newMaritalStatus} onChange={(e) => setNewMaritalStatus(e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="โสด">โสด</option>
                    <option value="สมรส">สมรส</option>
                    <option value="หย่าร้าง">หย่าร้าง</option>
                  </select>
                </div>
                {/* ── ศาสนา (dropdown) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">ศาสนา</Label>
                  <select
                    value={newReligion}
                    onChange={(e) => setNewReligion(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {RELIGION_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                {/* ── เลขบัตรประชาชน (13 หลัก + check digit) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">เลขบัตรประชาชน (13 หลัก)</Label>
                  <Input
                    value={newCitizenId}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                      setNewCitizenId(v);
                      const foundCit = personnelList.find((p) => p.citizenId === v);
                      if (foundCit) {
                        setCitizenIdError(`เลขบัตรประชาชนนี้มีในระบบแล้ว (${foundCit.rankAbbr} ${foundCit.firstName})`);
                      } else if (v.length === 13) {
                        setCitizenIdError(validateThaiCitizenId(v) ? "" : "เลขบัตรประชาชนไม่ผ่าน check digit");
                      } else if (v.length > 0) {
                        setCitizenIdError(`กรอกแล้ว ${v.length}/13 หลัก`);
                      } else {
                        setCitizenIdError("");
                      }
                    }}
                    placeholder="0-0000-00000-00-0"
                    maxLength={13}
                    className={`h-8 text-xs font-mono ${citizenIdError ? "border-red-400 focus:ring-red-400" : newCitizenId.length === 13 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                  />
                  {citizenIdError && <p className="text-[10px] text-red-500 mt-0.5">{citizenIdError}</p>}
                  {!citizenIdError && newCitizenId.length === 13 && <p className="text-[10px] text-emerald-600 mt-0.5">✓ เลขบัตรประชาชนถูกต้อง</p>}
                </div>
                {/* ── เบอร์โทร (10 หลัก รูปแบบมือถือ) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">เบอร์โทรศัพท์มือถือ</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewPhone(v);
                      if (v.length === 10) {
                        setPhoneError(validateMobilePhone(v) ? "" : "เบอร์ต้องขึ้นต้นด้วย 06, 08 หรือ 09");
                      } else if (v.length > 0) {
                        setPhoneError(`กรอกแล้ว ${v.length}/10 หลัก`);
                      } else {
                        setPhoneError("");
                      }
                    }}
                    placeholder="08XXXXXXXX"
                    maxLength={10}
                    className={`h-8 text-xs font-mono ${phoneError ? "border-red-400 focus:ring-red-400" : newPhone.length === 10 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                  />
                  {phoneError && <p className="text-[10px] text-red-500 mt-0.5">{phoneError}</p>}
                  {!phoneError && newPhone.length === 10 && <p className="text-[10px] text-emerald-600 mt-0.5">✓ เบอร์โทรถูกต้อง</p>}
                </div>
                {/* ── ประเภทกำลังพล (เพิ่ม อส.ทพ.) ── */}
                <div className="space-y-1">
                  <Label className="text-xs">ประเภทกำลังพล</Label>
                  <select
                    value={newPersonnelType}
                    onChange={(e) => setNewPersonnelType(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="OFFICER">นายทหารสัญญาบัตร</option>
                    <option value="NCO">นายทหารประทวน</option>
                    <option value="RANGER">พลอาสาสมัคร (พล.อส.)</option>
                    <option value="VOLUNTEER_RANGER">อาสาสมัครทหารพราน (อส.ทพ.)</option>
                    <option value="ENLISTED">ทหารกองประจำการ (พลทหาร)</option>
                  </select>
                </div>

                {/* ── ช่องระบุ ผลัดที่ 1 หรือ 2 (กรณีเป็นพลทหาร / ส.ต.กองประจำการ / ทหารกองประจำการ) ── */}
                {(newRank === "PRIVATE" || newRank === "CORPORAL_RESERVE" || newPersonnelType === "ENLISTED") && (
                  <div className="space-y-1 bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        ผลัดทหาร (พลทหาร / ส.ต.กองประจำการ) <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">ผลัดที่ 1 หรือ 2</span>
                    </div>
                    <select
                      value={newConscriptionBatch}
                      onChange={(e) => setNewConscriptionBatch(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-amber-400 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-amber-950 dark:text-amber-200"
                    >
                      <option value={1}>ผลัดที่ 1</option>
                      <option value={2}>ผลัดที่ 2</option>
                    </select>
                  </div>
                )}

                {/* ── รูปประจำตัวกำลังพล ── */}
                <div className="space-y-1 col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <Label className="text-xs font-medium">รูปประจำตัวกำลังพล</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const files = e.target.files ?? [];
                        if (!files[0]) return;
                        const dataUrl = await readFileToDataUrl(files[0]);
                        setNewProfilePhotoUrl(dataUrl);
                      }}
                      className="h-8 text-xs flex-1"
                    />
                    {newProfilePhotoUrl ? (
                      <img src={newProfilePhotoUrl} alt="profile" className="h-10 w-10 rounded-md object-cover border shrink-0 shadow-sm" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">ข้อมูลปกติ / สายสนาม</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อตำแหน่งปกติคำย่อ</Label>
                  <Input
                    list="normal-position-list"
                    value={newNormalPosition}
                    onChange={(e) => setNewNormalPosition(e.target.value)}
                    placeholder="เลือกหรือพิมพ์ เช่น ผบ.มว.ปล."
                    className="h-8 text-xs"
                  />
                  <datalist id="normal-position-list">
                    {normalPositionOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">สังกัดปกติคำย่อ</Label>
                  <Input
                    list="normal-unit-list"
                    value={newNormalUnit}
                    onChange={(e) => setNewNormalUnit(e.target.value)}
                    placeholder="เลือกหรือพิมพ์ เช่น ร.19 พัน.1"
                    className="h-8 text-xs"
                  />
                  <datalist id="normal-unit-list">
                    {normalUnitOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">ตำแหน่งในสนาม</Label>
                  <Input
                    list="field-position-list"
                    value={newFieldPosition}
                    onChange={(e) => setNewFieldPosition(e.target.value)}
                    placeholder="เลือกหรือพิมพ์ เช่น ผบ.กองร้อย"
                    className="h-8 text-xs"
                  />
                  <datalist id="field-position-list">
                    {fieldPositionOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">สังกัดในสนาม</Label>
                  <Input
                    list="field-unit-list"
                    value={newFieldUnit}
                    onChange={(e) => setNewFieldUnit(e.target.value)}
                    placeholder="เลือกหรือพิมพ์ เช่น ฉก.นราธิวาส"
                    className="h-8 text-xs"
                  />
                  <datalist id="field-unit-list">
                    {fieldUnitOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">เลขที่คำสั่งปฏิบัติหน้าที่</Label>
                  <Input value={newFieldDutyOrderNo} onChange={(e) => setNewFieldDutyOrderNo(e.target.value)} className="h-8 text-xs" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">วันที่ออกคำสั่ง</Label>
                  <Input type="date" value={newFieldDutyOrderDate} onChange={(e) => setNewFieldDutyOrderDate(e.target.value)} className="h-8 text-xs" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">หน่วยที่ออกคำสั่ง</Label>
                  <Input
                    list="order-issuer-list"
                    value={newFieldDutyOrderIssuer}
                    onChange={(e) => setNewFieldDutyOrderIssuer(e.target.value)}
                    placeholder="เลือกหรือพิมพ์ เช่น กรมทหารราบที่ 19"
                    className="h-8 text-xs"
                  />
                  <datalist id="order-issuer-list">
                    {orderIssuerOptions.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ประเภทภารกิจ</Label>
                  <select value={newMissionCategory} onChange={(e) => setNewMissionCategory(e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="COUNTER_INSURGENCY">จชต.</option>
                    <option value="BORDER_DEFENSE">กกล.</option>
                    <option value="INTERNAL_SECURITY">แผนป้องกันประเทศ</option>
                    <option value="ROUTINE_SERVICE">การปฏิบัติราชการเวลาปกติ</option>
                    <option value="DISASTER_RELIEF">การช่วยเหลือและบรรเทาสาธารณภัย</option>
                    <option value="PEACEKEEPING_UN">การช่วยเหลือตามมนุษยชน</option>
                  </select>
                </div>

                {/* ── เอกสารแนบ / ไฟล์ประกอบ ── */}
                <div className="space-y-1 col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <Label className="text-xs font-medium">เอกสารแนบ / ไฟล์ประกอบ</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,image/png,image/jpeg,.png,.jpg,.jpeg"
                      onChange={handleAttachmentUpload}
                      className="h-8 text-xs"
                    />
                    {newDocumentAttachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {newDocumentAttachments.map((item, index) => (
                          <span key={`${item.name}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">{item.name}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  ข้อมูลเงินเดือน / การคำนวณสิทธิ (คำสั่ง กห ที่ 160/2560)
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                  อัตราเงินเดือน & เยียวยา อัตโนมัติ
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* 1. ระดับเงินเดือน */}
                <div className="space-y-1">
                  <Label className="text-xs">ระดับเงินเดือน (พ.1 - น.9)</Label>
                  <select
                    value={newSalaryLevel}
                    onChange={(e) => handleSalaryLevelChange(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                  >
                    {SALARY_LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                {/* 2. ระดับชั้น (ขั้นเงินเดือน 1 - 46) */}
                <div className="space-y-1">
                  <Label className="text-xs">ระดับชั้น (ขั้น 1 - 46)</Label>
                  <select
                    value={newSalaryStep}
                    onChange={(e) => handleSalaryStepChange(Number(e.target.value))}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {getAvailableSalarySteps(newSalaryLevel).map((st) => (
                      <option key={st} value={st}>ขั้น {formatSalaryStep(st)}</option>
                    ))}
                  </select>
                </div>

                {/* 3. ยอดรับเงินเดือน */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">ยอดรับเงินเดือน (บาท)</Label>
                    <span className="text-[9px] text-emerald-600 font-medium">คำนวณอัตโนมัติ</span>
                  </div>
                  <Input
                    type="number"
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="h-8 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </div>

                {/* 4. ระดับชั้นเยียวยา */}
                <div className="space-y-1">
                  <Label className="text-xs">ระดับชั้นเยียวยา (0.5 - 12.5)</Label>
                  <select
                    value={newCompensationStep}
                    onChange={(e) => handleCompensationStepChange(Number(e.target.value))}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value={0}>ไม่ระบุ (0)</option>
                    {getAvailableCompensationSteps(newSalaryLevel).filter((s) => s > 0).map((cs) => (
                      <option key={cs} value={cs}>ชั้นเยียวยา {formatSalaryStep(cs)}</option>
                    ))}
                  </select>
                </div>

                {/* 5. ยอดเงินเยียวยา */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">ยอดเงินเยียวยา (บาท)</Label>
                    <span className="text-[9px] text-blue-600 font-medium">คำนวณอัตโนมัติ</span>
                  </div>
                  <Input
                    type="number"
                    value={newCompensationAmount}
                    onChange={(e) => setNewCompensationAmount(Number(e.target.value))}
                    className="h-8 text-xs font-bold text-blue-700 dark:text-blue-300"
                  />
                </div>

                {/* 6. เงินเพิ่ม (พ.ส.ร. + ฝ่าอันตราย) */}
                <div className="space-y-1">
                  <Label className="text-xs">เงินเพิ่ม (พ.ส.ร. + ฝ่าอันตราย)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newAdditionalPay}
                    onChange={(e) => setNewAdditionalPay(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="h-8 text-xs font-semibold"
                    placeholder="0"
                  />
                </div>

                {/* 7. ยอดเงินรับรวม (เงินเดือน/เงินเยียวยา + เงินเพิ่ม) */}
                <div className="space-y-1 col-span-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <Label className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      💰 ยอดเงินรับรวม (คำนวณอัตโนมัติ)
                    </Label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300">
                      ({newCompensationAmount > 0 ? `เงินเยียวยา ${formatCurrency(newCompensationAmount)}` : `เงินเดือน ${formatCurrency(newSalary)}`} + เงินเพิ่ม {formatCurrency(newAdditionalPay || 0)})
                    </span>
                  </div>
                  <Input
                    type="text"
                    value={`${formatCurrency((newCompensationAmount > 0 ? newCompensationAmount : newSalary) + (Number(newAdditionalPay) || 0))} บาท`}
                    readOnly
                    className="h-9 text-sm font-extrabold text-amber-900 dark:text-amber-100 bg-amber-100/60 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 cursor-not-allowed text-right pr-3"
                  />
                </div>

                {/* 8. ว.ด.ป./บรรจุ */}
                <div className="space-y-1 col-span-3 sm:col-span-1">
                  <Label className="text-xs">ว.ด.ป./บรรจุ</Label>
                  <Input
                    type="date"
                    value={newAppointmentDate}
                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* 9. วันทวีคูณ (แยกช่อง ปี / เดือน / วัน) */}
                <div className="space-y-1 col-span-3 sm:col-span-2">
                  <Label className="text-xs">วันทวีคูณ (ปี / เดือน / วัน)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={newMultiplierYears}
                        onChange={(e) => setNewMultiplierYears(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="h-8 text-xs pr-6 font-semibold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">ปี</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={11}
                        value={newMultiplierMonths}
                        onChange={(e) => setNewMultiplierMonths(e.target.value === "" ? 0 : Math.max(0, Math.min(11, Number(e.target.value))))}
                        placeholder="0"
                        className="h-8 text-xs pr-8 font-semibold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">เดือน</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={newMultiplierDays}
                        onChange={(e) => setNewMultiplierDays(e.target.value === "" ? 0 : Math.max(0, Math.min(30, Number(e.target.value))))}
                        placeholder="0"
                        className="h-8 text-xs pr-7 font-semibold"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">วัน</span>
                    </div>
                  </div>
                </div>

                {/* 10. อายุราชการรวม (คำนวณรวมวันทวีคูณอัตโนมัติ กี่ปี/กี่เดือน/กี่วัน) */}
                <div className="space-y-1 col-span-3">
                  <div className="flex justify-between items-center mb-0.5">
                    <Label className="text-xs font-medium">อายุราชการรวม (คำนวณรวมวันทวีคูณอัตโนมัติ)</Label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ รวม: {newTotalYears} ปี {newTotalMonths} เดือน {newTotalDays} วัน
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        value={newTotalYears}
                        readOnly
                        className="h-8 text-xs pr-6 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">ปี</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={newTotalMonths}
                        readOnly
                        className="h-8 text-xs pr-8 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">เดือน</span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={newTotalDays}
                        readOnly
                        className="h-8 text-xs pr-7 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">วัน</span>
                    </div>
                  </div>
                </div>

                {/* 11. ประเภทความสูญเสีย (3 ประเภท: เสียชีวิต / พิการทุพพลภาพ / บาดเจ็บ) */}
                <div className="space-y-1 col-span-3">
                  <Label className="text-xs font-semibold">ประเภทความสูญเสีย <span className="text-red-500">*</span></Label>
                  <select
                    value={newLossType}
                    onChange={(e) => setNewLossType(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                  >
                    <option value="KIA_COMBAT_DEATH">เสียชีวิต</option>
                    <option value="TOTAL_PERMANENT_DISABILITY">พิการทุพพลภาพ</option>
                    <option value="SEVERE_WOUND_WIA">บาดเจ็บ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Workflow Info Callout */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3.5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shrink-0">
                <Users2 className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs">
                  ระบบการบันทึกข้อมูลแยกตาม Workflow (Tab 2, 3, 4)
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  เมื่อบันทึกข้อมูลทะเบียนกำลังพลหน้านี้แล้ว ท่านสามารถไปที่ <strong>แท็บ 3 (ข้อมูลครอบครัว)</strong> เพื่อบันทึกคู่สมรสและบุตร และ <strong>แท็บ 4 (ข้อมูลทายาท)</strong> เพื่อบันทึกทายาทและจัดสรรสัดส่วนร้อยละ (%) ได้อย่างเป็นอิสระและครบถ้วน
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleCreatePersonnel}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลกำลังพล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action Result Confirmation Modal Popup (แจ้งเตือนยืนยันการกระทำกับข้อมูล) ── */}
      <Dialog open={resultModal.isOpen} onOpenChange={(open) => setResultModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={`p-4 rounded-full transition-transform animate-in zoom-in-50 duration-300 ${
                resultModal.type === "success"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-900/30"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-900/30"
              }`}
            >
              {resultModal.type === "success" ? (
                <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="h-10 w-10 stroke-[2.5]" />
              )}
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {resultModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {resultModal.message}
              </DialogDescription>
            </div>

            {resultModal.details && (
              <div className="w-full text-left bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-muted-foreground font-medium">ประเภทรายการ:</span>
                  <Badge variant="outline" className="text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                    {resultModal.actionName}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">ยศ - ชื่อ - สกุล:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{resultModal.details.fullName}</span>
                </div>
                {resultModal.details.militaryId && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">เลขประจำตัวทหาร:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{resultModal.details.militaryId}</span>
                  </div>
                )}
                {resultModal.details.citizenId && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">เลขประจำตัวประชาชน:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{resultModal.details.citizenId}</span>
                  </div>
                )}
                {resultModal.details.normalUnit && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">สังกัด:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {resultModal.details.normalUnit}
                      {resultModal.details.fieldUnit ? ` (${resultModal.details.fieldUnit})` : ""}
                    </span>
                  </div>
                )}
                {resultModal.details.lossType && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">สถานะความสูญเสีย:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatLossTypeLabel(resultModal.details.lossType)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-muted-foreground">
                  <span>วันเวลาที่ดำเนินการ:</span>
                  <span className="font-medium">{resultModal.details.timestamp}</span>
                </div>
              </div>
            )}

            <div className="w-full pt-1">
              <Button
                onClick={() => setResultModal((prev) => ({ ...prev, isOpen: false }))}
                className={`w-full font-semibold text-xs py-2 shadow-md ${
                  resultModal.type === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700"
                }`}
              >
                ตกลง / ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal Popup ── */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/30">
              <Trash2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                ยืนยันการลบข้อมูลกำลังพล
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                ท่านต้องการลบข้อมูลกำลังพลนี้ออกจากฐานข้อมูลใช่หรือไม่? เมื่อลบแล้วจะไม่สามารถเรียกคืนได้
              </DialogDescription>
            </div>

            {personnelToDelete && (
              <div className="w-full text-left bg-rose-50/50 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200/70 dark:border-rose-900/40 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">กำลังพล:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {personnelToDelete.rankAbbr} {personnelToDelete.firstName} {personnelToDelete.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เลขประจำตัวทหาร:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{personnelToDelete.militaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สังกัด:</span>
                  <span className="text-slate-700 dark:text-slate-300">{personnelToDelete.normalUnit}</span>
                </div>
              </div>
            )}

            <DialogFooter className="w-full grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                onClick={confirmDeletePersonnel}
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
                {isSubmitting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
