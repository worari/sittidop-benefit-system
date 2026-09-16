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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Building2,
  CreditCard,
  Phone,
  Briefcase,
  FileText,
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
import { calculateServiceTime, formatThaiBE, toThaiDateParts } from "@/presentation/lib/military-date-utils";

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

  // ── Edit Personnel Form Dedicated State ──
  const [editBirthDay, setEditBirthDay] = useState(1);
  const [editBirthMonth, setEditBirthMonth] = useState(1);
  const [editBirthYear, setEditBirthYear] = useState(currentBE - 30);
  const [editAge, setEditAge] = useState(30);
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editMilitaryIdError, setEditMilitaryIdError] = useState("");
  const [editCitizenIdError, setEditCitizenIdError] = useState("");
  const [editPhoneError, setEditPhoneError] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editCompensationStep, setEditCompensationStep] = useState(0);
  const [editMultiplierYears, setEditMultiplierYears] = useState(0);
  const [editMultiplierMonths, setEditMultiplierMonths] = useState(0);
  const [editMultiplierDays, setEditMultiplierDays] = useState(0);
  const [editTotalYears, setEditTotalYears] = useState(0);
  const [editTotalMonths, setEditTotalMonths] = useState(0);
  const [editTotalDays, setEditTotalDays] = useState(0);
  const [editDocumentAttachments, setEditDocumentAttachments] = useState<Array<{ name: string; type: string; size: number; dataUrl?: string }>>([]);

  // Auto-recalculate age in edit modal when birth date parts change
  useEffect(() => {
    if (!isEditModalOpen) return;
    const age = calcAgeFromBE(editBirthDay, editBirthMonth, editBirthYear);
    setEditAge(age);
    setEditDateOfBirth(thaiDateToISO(editBirthDay, editBirthMonth, editBirthYear));
  }, [editBirthDay, editBirthMonth, editBirthYear, isEditModalOpen]);

  // Auto-calculate total service time in edit modal
  useEffect(() => {
    if (!isEditModalOpen || !editingPersonnel) return;
    const appointment = editingPersonnel.appointmentDate ? String(editingPersonnel.appointmentDate).slice(0, 10) : "";
    const normalService = calculateServiceTime(appointment, null);
    const totalD = normalService.days + (Number(editMultiplierDays) || 0);
    const extraM = Math.floor(totalD / 30);
    const finalDays = totalD % 30;

    const totalM = normalService.months + (Number(editMultiplierMonths) || 0) + extraM;
    const extraY = Math.floor(totalM / 12);
    const finalMonths = totalM % 12;

    const finalYears = normalService.years + (Number(editMultiplierYears) || 0) + extraY;

    setEditTotalYears(finalYears);
    setEditTotalMonths(finalMonths);
    setEditTotalDays(finalDays);
  }, [editingPersonnel?.appointmentDate, editMultiplierYears, editMultiplierMonths, editMultiplierDays, isEditModalOpen]);

  // Salary change handlers for Edit Modal
  const handleEditSalaryLevelChange = (level: string) => {
    const availableSteps = getAvailableSalarySteps(level);
    let stepToUse = editingPersonnel?.salaryStep ?? 1;
    if (!availableSteps.includes(stepToUse)) {
      stepToUse = availableSteps[0] ?? 1;
    }
    const autoSalary = getSalaryAmount(level, stepToUse);
    let autoComp = editingPersonnel?.compensationAmount ?? 0;
    if (editCompensationStep > 0) {
      autoComp = getCompensationAmount(level, editCompensationStep);
    }
    setEditingPersonnel((prev) => prev ? ({
      ...prev,
      salaryLevel: level,
      salaryStep: stepToUse,
      salary: autoSalary,
      compensationAmount: autoComp,
    }) : null);
  };

  const handleEditSalaryStepChange = (step: number) => {
    const level = editingPersonnel?.salaryLevel ?? "น.3";
    const autoSalary = getSalaryAmount(level, step);
    setEditingPersonnel((prev) => prev ? ({
      ...prev,
      salaryStep: step,
      salary: autoSalary,
    }) : null);
  };

  const handleEditCompensationStepChange = (compStep: number) => {
    setEditCompensationStep(compStep);
    const level = editingPersonnel?.salaryLevel ?? "น.3";
    const autoComp = compStep > 0 ? getCompensationAmount(level, compStep) : 0;
    setEditingPersonnel((prev) => prev ? ({
      ...prev,
      compensationAmount: autoComp,
    }) : null);
  };

  const checkEditDuplicateName = (first: string, last: string) => {
    const f = (first || "").trim().toLowerCase();
    const l = (last || "").trim().toLowerCase();
    if (f && l && editingPersonnelId) {
      const found = personnelList.find(
        (p) => p.id !== editingPersonnelId &&
               p.firstName.trim().toLowerCase() === f &&
               p.lastName.trim().toLowerCase() === l
      );
      if (found) {
        setEditNameError(`พบกำลังพลชื่อ "${found.firstName} ${found.lastName}" (เลขทหาร ${found.militaryId}) ในระบบแล้ว (ห้ามชื่อ-นามสกุลซ้ำซ้อน)`);
        return true;
      }
    }
    setEditNameError("");
    return false;
  };

  const handleEditAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setEditDocumentAttachments((prev) => [...prev, ...mapped]);
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

      return matchSearch && matchUnit;
    });
  }, [personnelList, search, unitFilter]);

  // ── Pagination State (แสดงหน้าละ 20 รายการ มี pagination นำไปหน้าและย้อนหลัง) ──
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // รีเซ็ตหน้ากลับเป็นหน้า 1 เสมอเมื่อมีการค้นหาหรือเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [search, unitFilter]);

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, safeCurrentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // ── ข้อมูลสถิติภาพรวมเพื่อการตรวจสอบข้อมูลกำลังพล ──
  const stats = useMemo(() => {
    const total = personnelList.length;
    const officers = personnelList.filter((p) =>
      ["GENERAL", "LIEUTENANT_GENERAL", "MAJOR_GENERAL", "SPECIAL_COLONEL", "COLONEL", "LIEUTENANT_COLONEL", "MAJOR", "CAPTAIN", "FIRST_LIEUTENANT", "SECOND_LIEUTENANT"].includes(p.rank)
    ).length;
    const ncos = personnelList.filter((p) =>
      ["MASTER_SERGEANT_1ST", "MASTER_SERGEANT_2ND", "MASTER_SERGEANT_3RD", "SERGEANT", "CORPORAL", "LANCE_CORPORAL"].includes(p.rank)
    ).length;
    const enlisted = total - officers - ncos;
    const fieldDutyCount = personnelList.filter((p) => Boolean(p.fieldUnit)).length;
    const totalPayroll = personnelList.reduce((sum, p) => sum + (Number(p.salary) || 0) + (Number(p.additionalPay) || 0) + (Number(p.compensationAmount) || 0), 0);
    return { total, officers, ncos, enlisted, fieldDutyCount, totalPayroll };
  }, [personnelList]);

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
    const sal = Number(personnel.salary ?? 0);
    const compAmount = Number(personnel.compensationAmount ?? 0);
    const addPay = Number(personnel.additionalPay ?? 0);
    const mY = Number(personnel.serviceYearsMultiplier ?? 0);
    const mM = Number(personnel.serviceMonthsMultiplier ?? 0);
    const mD = Number(personnel.serviceDaysMultiplier ?? 0);
    const tY = Number(personnel.totalServiceYears ?? 0);
    const tM = Number(personnel.totalServiceMonths ?? 0);
    const tD = Number(personnel.totalServiceDays ?? 0);
    const level = personnel.salaryLevel || "น.3";

    // Deduce compensation step if not explicitly set
    let compStep = 0;
    if (compAmount > 0) {
      const availCompSteps = getAvailableCompensationSteps(level);
      const matched = availCompSteps.find((cs) => getCompensationAmount(level, cs) === compAmount);
      compStep = matched ?? 0;
    }
    setEditCompensationStep(compStep);

    // Parse dateOfBirth into Thai BE parts
    const parts = toThaiDateParts(personnel.dateOfBirth);
    if (parts) {
      setEditBirthDay(parts.day);
      setEditBirthMonth(parts.month);
      setEditBirthYear(parts.yearBE);
      setEditAge(calcAgeFromBE(parts.day, parts.month, parts.yearBE));
      setEditDateOfBirth(thaiDateToISO(parts.day, parts.month, parts.yearBE));
    } else {
      setEditBirthDay(1);
      setEditBirthMonth(1);
      setEditBirthYear(currentBE - 30);
      setEditAge(Number(personnel.age) || 30);
      setEditDateOfBirth("");
    }

    setEditMultiplierYears(mY);
    setEditMultiplierMonths(mM);
    setEditMultiplierDays(mD);
    setEditTotalYears(tY);
    setEditTotalMonths(tM);
    setEditTotalDays(tD);

    const attachments: Array<{ name: string; type: string; size: number; dataUrl?: string }> =
      (personnel as any).documentAttachments || [];
    setEditDocumentAttachments(attachments);

    setEditMilitaryIdError("");
    setEditCitizenIdError("");
    setEditPhoneError("");
    setEditNameError("");

    setEditingPersonnel({
      ...personnel,
      salary: sal,
      compensationAmount: compAmount,
      additionalPay: addPay,
      totalServiceYears: tY,
      totalServiceMonths: tM,
      totalServiceDays: tD,
      serviceYearsMultiplier: mY,
      serviceMonthsMultiplier: mM,
      serviceDaysMultiplier: mD,
      promotionSteps: Number(personnel.promotionSteps ?? 0),
      hospitalAdmissionDate: personnel.hospitalAdmissionDate ?? "",
      hospitalDischargeDate: personnel.hospitalDischargeDate ?? "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePersonnel = async () => {
    if (!editingPersonnelId || !editingPersonnel) return;

    let hasError = false;

    // 1. ตรวจสอบเลขประจำตัวทหาร
    if (!editingPersonnel.militaryId) {
      setEditMilitaryIdError("กรุณากรอกเลขประจำตัวทหาร 10 หลัก (เฉพาะตัวเลข)");
      hasError = true;
    } else if (!validateMilitaryId(editingPersonnel.militaryId)) {
      setEditMilitaryIdError("เลขประจำตัวทหารต้องเป็นตัวเลข 10 หลักเท่านั้น");
      hasError = true;
    } else if (personnelList.some((p) => p.id !== editingPersonnelId && p.militaryId === editingPersonnel.militaryId)) {
      setEditMilitaryIdError("เลขประจำตัวทหารนี้มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)");
      hasError = true;
    } else {
      setEditMilitaryIdError("");
    }

    // 2. ตรวจสอบเลขบัตรประชาชน
    if (editingPersonnel.citizenId) {
      if (!validateThaiCitizenId(editingPersonnel.citizenId)) {
        setEditCitizenIdError("เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก และ Check Digit ถูกต้อง)");
        hasError = true;
      } else if (personnelList.some((p) => p.id !== editingPersonnelId && p.citizenId === editingPersonnel.citizenId)) {
        setEditCitizenIdError("เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว (ห้ามซ้ำซ้อน)");
        hasError = true;
      } else {
        setEditCitizenIdError("");
      }
    } else {
      setEditCitizenIdError("");
    }

    // 3. ตรวจสอบเบอร์โทร
    if (editingPersonnel.phone && !validateMobilePhone(editingPersonnel.phone)) {
      setEditPhoneError("เบอร์โทรไม่ถูกต้อง (ต้องเป็นเบอร์มือถือ 10 หลัก เริ่มด้วย 06, 08 หรือ 09)");
      hasError = true;
    } else {
      setEditPhoneError("");
    }

    // 4. ตรวจสอบชื่อ-นามสกุลซ้ำ
    const editFirst = (editingPersonnel.firstName || "").trim();
    const editLast = (editingPersonnel.lastName || "").trim();
    if (editFirst && editLast) {
      if (checkEditDuplicateName(editFirst, editLast)) {
        hasError = true;
      }
    }

    if (!editFirst || !editLast || !editingPersonnel.militaryId || hasError) {
      setActionFeedback({ type: "error", message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนและถูกต้อง (ห้ามข้อมูลซ้ำซ้อน)" });
      setResultModal({
        isOpen: true,
        type: "error",
        title: "ข้อมูลซ้ำซ้อนหรือไม่ถูกต้อง",
        actionName: "แก้ไขข้อมูลกำลังพล",
        message: editNameError || editMilitaryIdError || editCitizenIdError || editPhoneError || "กรุณาตรวจสอบและแก้ไขข้อมูลที่มีข้อผิดพลาด เช่น ชื่อ-นามสกุล, เลขประจำตัวทหาร หรือเลขบัตรประชาชน",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const appDate = editingPersonnel.appointmentDate ? String(editingPersonnel.appointmentDate).slice(0, 10) : "";
      const normService = calculateServiceTime(appDate, null);

      const payload = {
        ...editingPersonnel,
        firstName: editFirst,
        lastName: editLast,
        dateOfBirth: editDateOfBirth || undefined,
        age: editAge,
        salary: Number(editingPersonnel.salary ?? 0),
        compensationAmount: Number(editingPersonnel.compensationAmount ?? 0),
        additionalPay: Number(editingPersonnel.additionalPay ?? 0),
        conscriptionBatch: (editingPersonnel.rank === "PRIVATE" || (editingPersonnel as any).personnelType === "ENLISTED") ? Number(editingPersonnel.conscriptionBatch ?? 1) : null,
        serviceYearsNormal: Math.max(0, normService.years),
        serviceMonthsNormal: normService.months,
        serviceDaysNormal: normService.days,
        serviceYearsMultiplier: Number(editMultiplierYears || 0),
        serviceMonthsMultiplier: Number(editMultiplierMonths || 0),
        serviceDaysMultiplier: Number(editMultiplierDays || 0),
        totalServiceYears: Number(editTotalYears || 0),
        totalServiceMonths: Number(editTotalMonths || 0),
        totalServiceDays: Number(editTotalDays || 0),
        documentAttachments: editDocumentAttachments,
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
            ระบบฐานข้อมูลประวัติการรับราชการ สังกัดปกติ สังกัดสนาม และเวลาราชการทวีคูณ
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

      {/* Executive Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-card dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">กำลังพลทั้งหมดในระบบ</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.total}</span>
              <span className="text-xs text-muted-foreground">นาย</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-card dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">กำลังพลสายปฏิบัติการสนาม</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.fieldDutyCount}</span>
              <span className="text-xs text-muted-foreground">นาย</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-card dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">สัญญาบัตร / ประทวน & พลฯ</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.officers}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xl font-black text-slate-700 dark:text-slate-300">{stats.ncos + stats.enlisted}</span>
              <span className="text-xs text-muted-foreground">นาย</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-card dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block">ฐานเงินเดือน & รายรับรวม/เดือน</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">{formatCurrency(stats.totalPayroll)}</span>
              <span className="text-[10px] text-muted-foreground">บาท</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ-สกุล, เลขประจำตัวทหาร 10 หลัก, เลขบัตรปชช., หน่วยสังกัด..."
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
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <span>
              พบข้อมูลกำลังพล <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> นาย (จากทั้งหมด {personnelList.length} นาย)
            </span>
            <Badge variant="secondary" className="text-[10px] font-normal py-0 h-5">
              หน้า {safeCurrentPage} จาก {totalPages} (หน้าละ 20 รายการ)
            </Badge>
          </div>
          {(search || unitFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setUnitFilter("ALL");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium self-start sm:self-auto"
            >
              ✕ ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Personnel Table Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-bold text-slate-700 dark:text-slate-300">ลำดับ</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[210px]">ข้อมูลกำลังพล / อัตลักษณ์</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[190px]">สังกัดปกติ & ปฏิบัติราชการสนาม</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[170px]">ฐานเงินเดือน & ค่าตอบแทน</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[190px]">ประวัติเวลาราชการ (ปกติ / ทวีคูณ / รวม)</TableHead>
                <TableHead className="text-xs font-bold text-right text-slate-700 dark:text-slate-300 min-w-[150px]">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลกำลังพล...
                  </TableCell>
                </TableRow>
              ) : paginatedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    ไม่พบข้อมูลกำลังพลตามเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                paginatedList.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground font-semibold">
                      {(safeCurrentPage - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="space-y-1">
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
                        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground font-mono">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold">
                            เลขทหาร: {p.militaryId}
                          </span>
                          <span>
                            บัตร ปชช.: {p.citizenId || "-"}
                          </span>
                        </div>
                        {(p.age || p.phone) && (
                          <div className="text-[10px] text-muted-foreground">
                            {p.age ? `อายุ ${p.age} ปี` : ""}
                            {p.age && p.phone ? " • " : ""}
                            {p.phone ? `โทร: ${p.phone}` : ""}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.normalUnit}
                          </span>
                          {p.abbreviatedPosition && (
                            <span className="text-muted-foreground block text-[11px]">
                              {p.abbreviatedPosition}
                            </span>
                          )}
                        </div>
                        {p.fieldUnit ? (
                          <div className="rounded-md bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 p-1 px-1.5 text-[10px]">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <Shield className="h-3 w-3 shrink-0" />
                              {p.fieldUnit}
                            </span>
                            {p.fieldPosition && (
                              <span className="text-emerald-600/80 dark:text-emerald-400/80 block pl-4 text-[9px]">
                                {p.fieldPosition}
                              </span>
                            )}
                            {p.fieldDutyOrderNo && (
                              <span className="text-muted-foreground block pl-4 text-[9px]">
                                คำสั่ง: {p.fieldDutyOrderNo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">- ไม่ได้บรรจุสนาม -</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-300 font-mono">
                            {p.salaryLevel} ขั้น {formatSalaryStep(p.salaryStep)}
                          </Badge>
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(p.salary)} บาท
                        </div>
                        {(Number(p.compensationAmount) > 0 || Number(p.additionalPay) > 0) && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            {p.compensationAmount ? `เยียวยา +${formatCurrency(p.compensationAmount)} ` : ""}
                            {p.additionalPay ? `เงินเพิ่ม +${formatCurrency(p.additionalPay)}` : ""}
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-0.5">
                          รับรวม: {formatCurrency((Number(p.compensationAmount) > 0 ? Number(p.compensationAmount) : Number(p.salary)) + (Number(p.additionalPay) || 0))} บ./ด.
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                          บรรจุ: {formatThaiBE(p.appointmentDate)}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300">
                          ปกติ: <span className="font-semibold">{p.serviceYearsNormal || 0} ปี {p.serviceMonthsNormal || 0} ด. {p.serviceDaysNormal ? `${p.serviceDaysNormal} ว.` : ""}</span>
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          ทวีคูณ: <span className="font-bold">+{p.serviceYearsMultiplier || 0} ปี {p.serviceMonthsMultiplier || 0} ด. {p.serviceDaysMultiplier ? `${p.serviceDaysMultiplier} ว.` : ""}</span>
                        </div>
                        <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400 border-t border-slate-100 dark:border-slate-800 pt-0.5">
                          รวมคำนวณ: {p.totalServiceYears || 0} ปี {p.totalServiceMonths || 0} ด. {p.totalServiceDays ? `${p.totalServiceDays} ว.` : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
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
                            className="h-7 text-[11px] px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
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

        {/* Pagination Controls (แสดงหน้าละ 20 รายการ มี pagination นำไปหน้าและย้อนหลัง) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
          <div className="text-muted-foreground text-center sm:text-left">
            แสดงรายการที่ <strong className="text-slate-900 dark:text-slate-100">{totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</strong> ถึง{" "}
            <strong className="text-slate-900 dark:text-slate-100">{Math.min(safeCurrentPage * pageSize, totalItems)}</strong> จากทั้งหมด{" "}
            <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> นาย (หน้า {safeCurrentPage} / {totalPages})
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="หน้าแรกสุด"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 gap-1 text-xs"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              ก่อนหน้า
            </Button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((pageNum, i) =>
                pageNum === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-muted-foreground select-none">
                    ...
                  </span>
                ) : (
                  <Button
                    key={`page-${pageNum}`}
                    size="sm"
                    variant={safeCurrentPage === pageNum ? "default" : "outline"}
                    className={`h-8 w-8 p-0 text-xs ${
                      safeCurrentPage === pageNum
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setCurrentPage(Number(pageNum))}
                  >
                    {pageNum}
                  </Button>
                )
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 gap-1 text-xs"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              ถัดไป
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="หน้าสุดท้าย"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* View Personnel Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono">
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
            <div className="space-y-3.5 py-2 text-xs">
              {/* 1. ข้อมูลส่วนบุคคลและอัตลักษณ์ */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <Users className="h-4 w-4 text-emerald-600" />
                  1. ข้อมูลส่วนบุคคลและอัตลักษณ์กำลังพล
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ยศและชื่อ-สกุล:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPersonnel.rankAbbr} {selectedPersonnel.firstName} {selectedPersonnel.lastName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เลขประจำตัวทหาร:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{selectedPersonnel.militaryId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เลขประจำตัวประชาชน:</span>
                    <span className="font-mono">{selectedPersonnel.citizenId || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">วันเดือนปีเกิด / อายุ:</span>
                    <span>{formatThaiBE(selectedPersonnel.dateOfBirth)} (อายุ {selectedPersonnel.age || "-"} ปี)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">สถานภาพ / ศาสนา:</span>
                    <span>{selectedPersonnel.maritalStatus || "โสด"} / {selectedPersonnel.religion || "พุทธ"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เบอร์โทรศัพท์:</span>
                    <span>{selectedPersonnel.phone || "-"}</span>
                  </div>
                  {selectedPersonnel.conscriptionBatch ? (
                    <div>
                      <span className="text-[10px] text-muted-foreground block">ผลัดทหาร:</span>
                      <span className="font-bold text-amber-600">ผลัดที่ {selectedPersonnel.conscriptionBatch}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เหล่าทัพ:</span>
                    <span className="font-bold">กองทัพบก (RTA)</span>
                  </div>
                </div>
              </div>

              {/* 2. สังกัดและคำสั่งปฏิบัติราชการสนาม */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  2. ข้อมูลตำแหน่ง สังกัด และคำสั่งปฏิบัติราชการสนาม
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ตำแหน่งปกติ:</span>
                    <span>{selectedPersonnel.abbreviatedPosition || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">หน่วยสังกัดปกติ:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPersonnel.normalUnit || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ตำแหน่งปฏิบัติราชการสนาม:</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">{selectedPersonnel.fieldPosition || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">หน่วยสนาม / ฉก.:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{selectedPersonnel.fieldUnit || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เลขที่คำสั่งปฏิบัติราชการสนาม:</span>
                    <span className="font-mono">{selectedPersonnel.fieldDutyOrderNo || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">วันที่มีคำสั่ง / ผู้ออกคำสั่ง:</span>
                    <span>{formatThaiBE(selectedPersonnel.fieldDutyOrderDate)} ({selectedPersonnel.fieldDutyOrderIssuer || "-"})</span>
                  </div>
                </div>
              </div>

              {/* 3. เงินเดือนและค่าตอบแทน */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  3. ข้อมูลอัตราเงินเดือนและค่าตอบแทน
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ระดับ-ขั้นเงินเดือน:</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {selectedPersonnel.salaryLevel} ขั้น {formatSalaryStep(selectedPersonnel.salaryStep)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ฐานเงินเดือน:</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatCurrency(selectedPersonnel.salary)} บาท</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เงินเยียวยา / เงินเพิ่ม:</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">
                      +{formatCurrency((Number(selectedPersonnel.compensationAmount) || 0) + (Number(selectedPersonnel.additionalPay) || 0))} บาท
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ยอดรับสุทธิรวม/เดือน:</span>
                    <span className="font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency((Number(selectedPersonnel.compensationAmount) > 0 ? Number(selectedPersonnel.compensationAmount) : Number(selectedPersonnel.salary)) + (Number(selectedPersonnel.additionalPay) || 0))} บาท
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. ประวัติเวลาราชการและการคำนวณ */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  4. ประวัติเวลาราชการและเวลาทวีคูณสำหรับการประมาณการสิทธิ
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">วันบรรจุรับราชการ:</span>
                    <span className="font-semibold">{formatThaiBE(selectedPersonnel.appointmentDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เวลาราชการปกติ:</span>
                    <span>{selectedPersonnel.serviceYearsNormal || 0} ปี {selectedPersonnel.serviceMonthsNormal || 0} ด. {selectedPersonnel.serviceDaysNormal ? `${selectedPersonnel.serviceDaysNormal} ว.` : ""}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">เวลาราชการทวีคูณ:</span>
                    <span className="text-emerald-600 font-bold">+{selectedPersonnel.serviceYearsMultiplier || 0} ปี {selectedPersonnel.serviceMonthsMultiplier || 0} ด. {selectedPersonnel.serviceDaysMultiplier ? `${selectedPersonnel.serviceDaysMultiplier} ว.` : ""}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">รวมเวลาราชการคำนวณสิทธิ:</span>
                    <span className="font-extrabold text-blue-700 dark:text-blue-400">{selectedPersonnel.totalServiceYears || 0} ปี {selectedPersonnel.totalServiceMonths || 0} ด. {selectedPersonnel.totalServiceDays ? `${selectedPersonnel.totalServiceDays} ว.` : ""}</span>
                  </div>
                </div>
              </div>

              {/* 5. ข้อมูลครอบครัวและทายาท */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Users2 className="h-4 w-4 text-emerald-600" />
                  5. ข้อมูลครอบครัวและทายาท
                </span>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>คู่สมรส: <strong>{selectedPersonnel.spouse?.fullName || "ไม่มี"}</strong></span>
                    {selectedPersonnel.spouse ? <Badge variant="outline">สิทธิบำนาญตกทอด 50%</Badge> : null}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">บุตรในอุปการะ ({selectedPersonnel.children?.length || 0} คน):</span>
                    {selectedPersonnel.children && selectedPersonnel.children.length > 0 ? (
                      selectedPersonnel.children.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                          <span>{c.fullName} (อายุ {c.age} ปี - {c.educationLevel})</span>
                          <Badge className="bg-emerald-600 text-white text-[9px]">มีสิทธิรับทุนการศึกษา</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic pl-2">ไม่มีข้อมูลบุตรในระบบ</p>
                    )}
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
            <DialogTitle className="text-lg font-bold">แก้ไขข้อมูลกำลังพล (Edit Personnel)</DialogTitle>
            <DialogDescription className="text-xs">
              แก้ไขและปรับปรุงข้อมูลทะเบียนกำลังพลให้ถูกต้องครบถ้วนตามแบบบันทึกข้อมูล
            </DialogDescription>
          </DialogHeader>

          {editingPersonnel && (
            <div className="space-y-4 py-2 text-xs">
              {/* ── Card 1: ข้อมูลส่วนตัว / กำลังพลสายสนาม ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  ข้อมูลส่วนตัว / กำลังพลสายสนาม
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* ยศทหาร */}
                  <div className="space-y-1">
                    <Label className="text-xs">ยศทหาร <span className="text-red-500">*</span></Label>
                    <select
                      value={editingPersonnel.rank ?? "PRIVATE"}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingPersonnel((prev) => prev ? ({ ...prev, rank: v, rankAbbr: RANK_MAP[v]?.abbr ?? "พลทหาร" }) : null);
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

                  {/* เลขประจำตัวทหาร */}
                  <div className="space-y-1">
                    <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก (เฉพาะตัวเลข) <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.militaryId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEditingPersonnel((prev) => prev ? ({ ...prev, militaryId: v }) : null);
                        const foundMil = personnelList.find((p) => p.id !== editingPersonnelId && p.militaryId === v);
                        if (foundMil) {
                          setEditMilitaryIdError(`เลขประจำตัวทหารนี้มีในระบบแล้ว (${foundMil.rankAbbr} ${foundMil.firstName})`);
                        } else if (v.length === 10) {
                          setEditMilitaryIdError("");
                        } else if (v.length > 0) {
                          setEditMilitaryIdError(`กรอกแล้ว ${v.length}/10 หลัก (เฉพาะตัวเลขเท่านั้น)`);
                        } else {
                          setEditMilitaryIdError("");
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
                      className={`h-8 text-xs font-mono ${editMilitaryIdError ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                    {editMilitaryIdError && <p className="text-[10px] text-red-500 mt-0.5">{editMilitaryIdError}</p>}
                  </div>

                  {/* ชื่อ */}
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อ <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.firstName ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingPersonnel((prev) => prev ? ({ ...prev, firstName: v }) : null);
                        checkEditDuplicateName(v, editingPersonnel.lastName ?? "");
                      }}
                      placeholder="ชื่อกำลังพล"
                      className={`h-8 text-xs ${editNameError ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                  </div>

                  {/* นามสกุล */}
                  <div className="space-y-1">
                    <Label className="text-xs">นามสกุล <span className="text-red-500">*</span></Label>
                    <Input
                      value={editingPersonnel.lastName ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingPersonnel((prev) => prev ? ({ ...prev, lastName: v }) : null);
                        checkEditDuplicateName(editingPersonnel.firstName ?? "", v);
                      }}
                      placeholder="นามสกุล"
                      className={`h-8 text-xs ${editNameError ? "border-red-400 focus:ring-red-400" : ""}`}
                    />
                  </div>
                  {editNameError && (
                    <div className="col-span-2 text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-1.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                      <span>{editNameError}</span>
                    </div>
                  )}

                  {/* ว/ด/ป. เกิด (เดือนไทย + ปี พ.ศ.) */}
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">ว/ด/ป. เกิด (วัน / เดือนไทย / ปี พ.ศ.)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={editBirthDay}
                        onChange={(e) => setEditBirthDay(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={editBirthMonth}
                        onChange={(e) => setEditBirthMonth(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {THAI_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={editBirthYear}
                        onChange={(e) => setEditBirthYear(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {BE_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* อายุ (คำนวณอัตโนมัติ) */}
                  <div className="space-y-1">
                    <Label className="text-xs">อายุ (คำนวณอัตโนมัติ)</Label>
                    <Input type="number" value={editAge} readOnly className="h-8 text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-bold" />
                    <p className="text-[10px] text-muted-foreground">คำนวณจากวันเกิดที่เลือก</p>
                  </div>

                  {/* สถานภาพ */}
                  <div className="space-y-1">
                    <Label className="text-xs">สถานภาพ</Label>
                    <select
                      value={editingPersonnel.maritalStatus ?? "โสด"}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, maritalStatus: e.target.value }) : null)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="โสด">โสด</option>
                      <option value="สมรส">สมรส</option>
                      <option value="หย่าร้าง">หย่าร้าง</option>
                    </select>
                  </div>

                  {/* ศาสนา */}
                  <div className="space-y-1">
                    <Label className="text-xs">ศาสนา</Label>
                    <select
                      value={editingPersonnel.religion ?? "พุทธ"}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, religion: e.target.value }) : null)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {RELIGION_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* เลขบัตรประชาชน */}
                  <div className="space-y-1">
                    <Label className="text-xs">เลขบัตรประชาชน (13 หลัก)</Label>
                    <Input
                      value={editingPersonnel.citizenId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                        setEditingPersonnel((prev) => prev ? ({ ...prev, citizenId: v }) : null);
                        const foundCit = personnelList.find((p) => p.id !== editingPersonnelId && p.citizenId === v);
                        if (foundCit) {
                          setEditCitizenIdError(`เลขบัตรประชาชนนี้มีในระบบแล้ว (${foundCit.rankAbbr} ${foundCit.firstName})`);
                        } else if (v.length === 13) {
                          setEditCitizenIdError(validateThaiCitizenId(v) ? "" : "เลขบัตรประชาชนไม่ผ่าน check digit");
                        } else if (v.length > 0) {
                          setEditCitizenIdError(`กรอกแล้ว ${v.length}/13 หลัก`);
                        } else {
                          setEditCitizenIdError("");
                        }
                      }}
                      placeholder="0-0000-00000-00-0"
                      maxLength={13}
                      className={`h-8 text-xs font-mono ${editCitizenIdError ? "border-red-400 focus:ring-red-400" : (editingPersonnel.citizenId || "").length === 13 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                    />
                    {editCitizenIdError && <p className="text-[10px] text-red-500 mt-0.5">{editCitizenIdError}</p>}
                    {!editCitizenIdError && (editingPersonnel.citizenId || "").length === 13 && <p className="text-[10px] text-emerald-600 mt-0.5">✓ เลขบัตรประชาชนถูกต้อง</p>}
                  </div>

                  {/* เบอร์โทรศัพท์มือถือ */}
                  <div className="space-y-1">
                    <Label className="text-xs">เบอร์โทรศัพท์มือถือ</Label>
                    <Input
                      value={editingPersonnel.phone ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEditingPersonnel((prev) => prev ? ({ ...prev, phone: v }) : null);
                        if (v.length === 10) {
                          setEditPhoneError(validateMobilePhone(v) ? "" : "เบอร์ต้องขึ้นต้นด้วย 06, 08 หรือ 09");
                        } else if (v.length > 0) {
                          setEditPhoneError(`กรอกแล้ว ${v.length}/10 หลัก`);
                        } else {
                          setEditPhoneError("");
                        }
                      }}
                      placeholder="08XXXXXXXX"
                      maxLength={10}
                      className={`h-8 text-xs font-mono ${editPhoneError ? "border-red-400 focus:ring-red-400" : (editingPersonnel.phone || "").length === 10 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                    />
                    {editPhoneError && <p className="text-[10px] text-red-500 mt-0.5">{editPhoneError}</p>}
                    {!editPhoneError && (editingPersonnel.phone || "").length === 10 && <p className="text-[10px] text-emerald-600 mt-0.5">✓ เบอร์โทรถูกต้อง</p>}
                  </div>

                  {/* ประเภทกำลังพล */}
                  <div className="space-y-1">
                    <Label className="text-xs">ประเภทกำลังพล</Label>
                    <select
                      value={(editingPersonnel as any).personnelType ?? ((editingPersonnel.rank === "PRIVATE" || editingPersonnel.rank === "CORPORAL_RESERVE") ? "ENLISTED" : editingPersonnel.rank === "VOLUNTEER_RANGER" ? "VOLUNTEER_RANGER" : editingPersonnel.rank === "RANGER_ENLISTED" ? "RANGER" : ["MASTER_SERGEANT_1ST", "MASTER_SERGEANT_2ND", "MASTER_SERGEANT_3RD", "SERGEANT", "CORPORAL", "LANCE_CORPORAL"].includes(editingPersonnel.rank || "") ? "NCO" : "OFFICER")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditingPersonnel((prev) => prev ? ({ ...prev, personnelType: v } as any) : null);
                      }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="OFFICER">นายทหารสัญญาบัตร</option>
                      <option value="NCO">นายทหารประทวน</option>
                      <option value="RANGER">พลอาสาสมัคร (พล.อส.)</option>
                      <option value="VOLUNTEER_RANGER">อาสาสมัครทหารพราน (อส.ทพ.)</option>
                      <option value="ENLISTED">ทหารกองประจำการ (พลทหาร)</option>
                    </select>
                  </div>

                  {/* ผลัดทหาร (กรณีเป็นพลทหาร / ส.ต.กองประจำการ / ทหารกองประจำการ) */}
                  {(editingPersonnel.rank === "PRIVATE" || editingPersonnel.rank === "CORPORAL_RESERVE" || (editingPersonnel as any).personnelType === "ENLISTED") && (
                    <div className="space-y-1 bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-300 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          ผลัดทหาร (พลทหาร / ส.ต.กองประจำการ) <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">ผลัดที่ 1 หรือ 2</span>
                      </div>
                      <select
                        value={editingPersonnel.conscriptionBatch ?? 1}
                        onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, conscriptionBatch: Number(e.target.value) }) : null)}
                        className="w-full h-8 rounded-md border border-amber-400 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-amber-950 dark:text-amber-200"
                      >
                        <option value={1}>ผลัดที่ 1</option>
                        <option value={2}>ผลัดที่ 2</option>
                      </select>
                    </div>
                  )}

                  {/* รูปประจำตัวกำลังพล */}
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
                          setEditingPersonnel((prev) => prev ? ({ ...prev, profilePhotoUrl: dataUrl }) : null);
                        }}
                        className="h-8 text-xs flex-1"
                      />
                      {editingPersonnel.profilePhotoUrl ? (
                        <img src={editingPersonnel.profilePhotoUrl} alt="profile" className="h-10 w-10 rounded-md object-cover border shrink-0 shadow-sm" />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Card 2: ข้อมูลปกติ / สายสนาม ── */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  ข้อมูลปกติ / สายสนาม
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อตำแหน่งปกติคำย่อ</Label>
                    <Input
                      list="edit-normal-position-list"
                      value={editingPersonnel.abbreviatedPosition ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, abbreviatedPosition: e.target.value }) : null)}
                      placeholder="เลือกหรือพิมพ์ เช่น ผบ.มว.ปล."
                      className="h-8 text-xs"
                    />
                    <datalist id="edit-normal-position-list">
                      {normalPositionOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">สังกัดปกติคำย่อ</Label>
                    <Input
                      list="edit-normal-unit-list"
                      value={editingPersonnel.normalUnit ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, normalUnit: e.target.value }) : null)}
                      placeholder="เลือกหรือพิมพ์ เช่น ร.19 พัน.1"
                      className="h-8 text-xs"
                    />
                    <datalist id="edit-normal-unit-list">
                      {normalUnitOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">ตำแหน่งในสนาม</Label>
                    <Input
                      list="edit-field-position-list"
                      value={editingPersonnel.fieldPosition ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, fieldPosition: e.target.value }) : null)}
                      placeholder="เลือกหรือพิมพ์ เช่น ผบ.กองร้อย"
                      className="h-8 text-xs"
                    />
                    <datalist id="edit-field-position-list">
                      {fieldPositionOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">สังกัดในสนาม</Label>
                    <Input
                      list="edit-field-unit-list"
                      value={editingPersonnel.fieldUnit ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, fieldUnit: e.target.value }) : null)}
                      placeholder="เลือกหรือพิมพ์ เช่น ฉก.นราธิวาส"
                      className="h-8 text-xs"
                    />
                    <datalist id="edit-field-unit-list">
                      {fieldUnitOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">เลขที่คำสั่งปฏิบัติหน้าที่</Label>
                    <Input
                      value={editingPersonnel.fieldDutyOrderNo ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, fieldDutyOrderNo: e.target.value }) : null)}
                      placeholder="เช่น 123/2569"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">วันที่ออกคำสั่ง</Label>
                    <Input
                      type="date"
                      value={editingPersonnel.fieldDutyOrderDate ? String(editingPersonnel.fieldDutyOrderDate).slice(0, 10) : ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, fieldDutyOrderDate: e.target.value }) : null)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">หน่วยที่ออกคำสั่ง</Label>
                    <Input
                      list="edit-order-issuer-list"
                      value={editingPersonnel.fieldDutyOrderIssuer ?? ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, fieldDutyOrderIssuer: e.target.value }) : null)}
                      placeholder="เลือกหรือพิมพ์ เช่น กรมทหารราบที่ 19"
                      className="h-8 text-xs"
                    />
                    <datalist id="edit-order-issuer-list">
                      {orderIssuerOptions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">ประเภทภารกิจ</Label>
                    <select
                      value={editingPersonnel.missionCategory ?? "COUNTER_INSURGENCY"}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, missionCategory: e.target.value }) : null)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="COUNTER_INSURGENCY">จชต.</option>
                      <option value="BORDER_DEFENSE">กกล.</option>
                      <option value="INTERNAL_SECURITY">แผนป้องกันประเทศ</option>
                      <option value="ROUTINE_SERVICE">การปฏิบัติราชการเวลาปกติ</option>
                      <option value="DISASTER_RELIEF">การช่วยเหลือและบรรเทาสาธารณภัย</option>
                      <option value="PEACEKEEPING_UN">การช่วยเหลือตามมนุษยชน</option>
                    </select>
                  </div>

                  {/* เอกสารแนบ / ไฟล์ประกอบ */}
                  <div className="space-y-1 col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <Label className="text-xs font-medium">เอกสารแนบ / ไฟล์ประกอบ</Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,image/png,image/jpeg,.png,.jpg,.jpeg"
                        onChange={handleEditAttachmentUpload}
                        className="h-8 text-xs"
                      />
                      {editDocumentAttachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {editDocumentAttachments.map((item, index) => (
                            <span key={`${item.name}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Card 3: ข้อมูลเงินเดือน / การคำนวณสิทธิ (คำสั่ง กห ที่ 160/2560) ── */}
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
                      value={editingPersonnel.salaryLevel ?? "น.3"}
                      onChange={(e) => handleEditSalaryLevelChange(e.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                    >
                      {SALARY_LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. ระดับชั้น (ขั้น 1 - 46) */}
                  <div className="space-y-1">
                    <Label className="text-xs">ระดับชั้น (ขั้น 1 - 46)</Label>
                    <select
                      value={editingPersonnel.salaryStep ?? 1}
                      onChange={(e) => handleEditSalaryStepChange(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {getAvailableSalarySteps(editingPersonnel.salaryLevel ?? "น.3").map((st) => (
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
                      value={editingPersonnel.salary ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, salary: Number(e.target.value) }) : null)}
                      className="h-8 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                    />
                  </div>

                  {/* 4. ระดับชั้นเยียวยา */}
                  <div className="space-y-1">
                    <Label className="text-xs">ระดับชั้นเยียวยา (0.5 - 12.5)</Label>
                    <select
                      value={editCompensationStep}
                      onChange={(e) => handleEditCompensationStepChange(Number(e.target.value))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value={0}>ไม่ระบุ (0)</option>
                      {getAvailableCompensationSteps(editingPersonnel.salaryLevel ?? "น.3").filter((s) => s > 0).map((cs) => (
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
                      value={editingPersonnel.compensationAmount ?? 0}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, compensationAmount: Number(e.target.value) }) : null)}
                      className="h-8 text-xs font-bold text-blue-700 dark:text-blue-300"
                    />
                  </div>

                  {/* 6. เงินเพิ่ม (พ.ส.ร. + ฝ่าอันตราย) */}
                  <div className="space-y-1">
                    <Label className="text-xs">เงินเพิ่ม (พ.ส.ร. + ฝ่าอันตราย)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editingPersonnel.additionalPay ?? 0}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setEditingPersonnel((prev) => prev ? ({ ...prev, additionalPay: val }) : null);
                      }}
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
                        ({(editingPersonnel.compensationAmount ?? 0) > 0 ? `เงินเยียวยา ${formatCurrency(editingPersonnel.compensationAmount ?? 0)}` : `เงินเดือน ${formatCurrency(editingPersonnel.salary ?? 0)}`} + เงินเพิ่ม {formatCurrency(editingPersonnel.additionalPay ?? 0)})
                      </span>
                    </div>
                    <Input
                      type="text"
                      value={`${formatCurrency(((editingPersonnel.compensationAmount ?? 0) > 0 ? (editingPersonnel.compensationAmount ?? 0) : (editingPersonnel.salary ?? 0)) + (Number(editingPersonnel.additionalPay) || 0))} บาท`}
                      readOnly
                      className="h-9 text-sm font-extrabold text-amber-900 dark:text-amber-100 bg-amber-100/60 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 cursor-not-allowed text-right pr-3"
                    />
                  </div>

                  {/* 8. ว.ด.ป./บรรจุ */}
                  <div className="space-y-1 col-span-3 sm:col-span-1">
                    <Label className="text-xs">ว.ด.ป./บรรจุ</Label>
                    <Input
                      type="date"
                      value={editingPersonnel.appointmentDate ? String(editingPersonnel.appointmentDate).slice(0, 10) : ""}
                      onChange={(e) => setEditingPersonnel((prev) => prev ? ({ ...prev, appointmentDate: e.target.value }) : null)}
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
                          value={editMultiplierYears}
                          onChange={(e) => setEditMultiplierYears(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
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
                          value={editMultiplierMonths}
                          onChange={(e) => setEditMultiplierMonths(e.target.value === "" ? 0 : Math.max(0, Math.min(11, Number(e.target.value))))}
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
                          value={editMultiplierDays}
                          onChange={(e) => setEditMultiplierDays(e.target.value === "" ? 0 : Math.max(0, Math.min(30, Number(e.target.value))))}
                          placeholder="0"
                          className="h-8 text-xs pr-7 font-semibold"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">วัน</span>
                      </div>
                    </div>
                  </div>

                  {/* 10. อายุราชการรวม (คำนวณรวมวันทวีคูณอัตโนมัติ) */}
                  <div className="space-y-1 col-span-3">
                    <div className="flex justify-between items-center mb-0.5">
                      <Label className="text-xs font-medium">อายุราชการรวม (คำนวณรวมวันทวีคูณอัตโนมัติ)</Label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ รวม: {editTotalYears} ปี {editTotalMonths} เดือน {editTotalDays} วัน
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          value={editTotalYears}
                          readOnly
                          className="h-8 text-xs pr-6 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">ปี</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={editTotalMonths}
                          readOnly
                          className="h-8 text-xs pr-8 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">เดือน</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={editTotalDays}
                          readOnly
                          className="h-8 text-xs pr-7 font-bold bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">วัน</span>
                      </div>
                    </div>
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
              </div>
            </div>

            {/* Workflow Info Callout */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3.5 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shrink-0">
                <Users2 className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs">
                  ระบบการบันทึกข้อมูลตามขั้นตอน Workflow (Tab 2, 3, 4, 5, 6)
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  เมื่อบันทึกทะเบียนกำลังพลแล้ว ท่านสามารถไปยัง <strong>แท็บ 3 (ข้อมูลครอบครัว)</strong>, <strong>แท็บ 4 (ข้อมูลทายาท)</strong>, <strong>แท็บ 5 (รายงานการสูญเสีย กพ.3/กพ.4)</strong> และ <strong>แท็บ 6 (คำนวณสิทธิ 4 หมวด)</strong> ได้อย่างเป็นอิสระและครบถ้วนตามลำดับ
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
