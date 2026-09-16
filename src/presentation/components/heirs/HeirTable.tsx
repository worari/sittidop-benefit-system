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
  HeartHandshake,
  Search,
  CheckCircle2,
  FileCheck,
  Building,
  User,
  PieChart,
  Percent,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Shield,
  AlertCircle,
  Sparkles,
  UserPlus,
  Phone,
  CreditCard,
  Users2,
  Calculator,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { HeirValidation } from "@/core/validation/HeirValidation";
import { FamilyValidation } from "@/core/validation/FamilyValidation";

export interface HeirFormState {
  nationalId: string;
  nationalIdError?: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  birthDay?: number;
  birthMonth?: number;
  birthYearBE?: number;
  age: number;
  relationship: string;
  phone: string;
  phoneError?: string;
  address: string;
  isAlive: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountError?: string;
  allocationPercentage: number;
  isDesignatedSuccessor: boolean;
  documentsVerified: boolean;
  // Additional optional fields for blood relatives (siblings, cousins, etc.)
  isBloodRelative?: boolean;
  familyConnection?: string; // e.g., "ELDER_BROTHER", "YOUNGER_SISTER"
}

// ── Helpers สำหรับ พ.ศ., เลขบัตร ปชช., เบอร์โทร และอายุ ──
const currentBE = new Date().getFullYear() + 543;
const THAI_MONTHS = [
  { value: 1, label: "มกราคม (ม.ค.)" },
  { value: 2, label: "กุมภาพันธ์ (ก.พ.)" },
  { value: 3, label: "มีนาคม (มี.ค.)" },
  { value: 4, label: "เมษายน (เม.ย.)" },
  { value: 5, label: "พฤษภาคม (พ.ค.)" },
  { value: 6, label: "มิถุนายน (มิ.ย.)" },
  { value: 7, label: "กรกฎาคม (ก.ค.)" },
  { value: 8, label: "สิงหาคม (ส.ค.)" },
  { value: 9, label: "กันยายน (ก.ย.)" },
  { value: 10, label: "ตุลาคม (ต.ค.)" },
  { value: 11, label: "พฤศจิกายน (พ.ย.)" },
  { value: 12, label: "ธันวาคม (ธ.ค.)" },
];
const BE_YEARS = Array.from({ length: 101 }, (_, i) => currentBE - 100 + i).reverse();

const validateThaiCitizenId = (id: string): boolean => {
  const clean = id.replace(/\D/g, "");
  if (!/^\d{13}$/.test(clean)) return false;
  const digits = clean.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
  const check = (11 - (sum % 11)) % 10;
  return check === digits[12];
};

const formatThaiCitizenId = (val: string): string => {
  const digits = val.replace(/\D/g, "").slice(0, 13);
  if (digits.length === 0) return "";
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;
  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
};

const formatMobilePhone = (val: string): string => {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const calcAgeFromBE = (day: number, month: number, yearBE: number): number => {
  const yearCE = yearBE - 543;
  const birthDate = new Date(yearCE, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
};

const thaiDateToISO = (day: number, month: number, yearBE: number): string => {
  const yearCE = yearBE - 543;
  return `${yearCE}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const toThaiDateParts = (isoDateStr?: string | Date | null): { day: number; month: number; yearBE: number } | null => {
  if (!isoDateStr) return null;
  const d = typeof isoDateStr === "string" ? new Date(isoDateStr) : isoDateStr;
  if (isNaN(d.getTime())) return null;
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    yearBE: d.getFullYear() + 543,
  };
};

export function HeirTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [lossReportsList, setLossReportsList] = useState<any[]>([]);
  const [calculationsMap, setCalculationsMap] = useState<
    Record<string, { grandTotalLumpSum: number; grandTotalMonthlyPension: number; isCalculated: boolean }>
  >({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination & View Mode State (4 แถวต่อหน้า)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [viewMode, setViewMode] = useState<"row" | "grid">("row");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Target Personnel Selection
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");

  // Heirs Form State
  const [heirsList, setHeirsList] = useState<HeirFormState[]>([]);

  const fetchPersonnel = async () => {
    try {
      const res = await fetch("/api/personnel");
      const json = await res.json();
      if (json.success) {
        setPersonnelList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLossReports = async () => {
    try {
      const res = await fetch("/api/loss-reports");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLossReportsList(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch loss reports:", err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchPersonnel(), fetchLossReports()]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Helper หาข้อมูลรายงานการสูญเสียของกำลังพลแต่ละนาย
  const getLossReportForPersonnel = (p: MilitaryPersonnelRecord) => {
    return lossReportsList.find(
      (lr) =>
        (lr.personnelId && lr.personnelId === p.id) ||
        (lr.militaryId && lr.militaryId === p.militaryId) ||
        lr.casualties?.some(
          (c: any) =>
            (c.militaryId && c.militaryId === p.militaryId) ||
            (c.citizenId && p.citizenId && c.citizenId === p.citizenId) ||
            (c.fullName && p.lastName && c.fullName.includes(p.lastName))
        )
    );
  };

  // คำนวณประมาณการสิทธิสำหรับกำลังพลที่มีรายงานการสูญเสีย
  useEffect(() => {
    if (personnelList.length === 0 || lossReportsList.length === 0) return;

    const calcMap: Record<string, { grandTotalLumpSum: number; grandTotalMonthlyPension: number; isCalculated: boolean }> = {};

    const calculateForEligiblePersonnel = async () => {
      for (const p of personnelList) {
        const lr = getLossReportForPersonnel(p);
        if (!lr) {
          calcMap[p.id] = { grandTotalLumpSum: 0, grandTotalMonthlyPension: 0, isCalculated: false };
          continue;
        }

        // กำลังพลมีรายงานการสูญเสียจากการปฏิบัติหน้าที่แล้ว -> เรียกคำนวณประมาณการสิทธิ
        try {
          const rawLoss = lr.casualties?.find(
            (c: any) => c.militaryId === p.militaryId || (c.fullName && p.lastName && c.fullName.includes(p.lastName))
          )?.lossType || p.lossType || "KIA_COMBAT_DEATH";

          const payload = {
            ...p,
            lossType: rawLoss,
            incidentDate: lr.incidentDate ? new Date(lr.incidentDate).toISOString().split("T")[0] : p.incidentDate,
            actionCause: lr.enemyAction === "ENEMY" ? "ENEMY_ACTION" : "NON_ENEMY_ACTION",
          };

          const res = await fetch("/api/rules/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json.success && json.data) {
            calcMap[p.id] = {
              grandTotalLumpSum: json.data.grandTotalLumpSum || 0,
              grandTotalMonthlyPension: json.data.grandTotalMonthlyPension || 0,
              isCalculated: true,
            };
          } else {
            calcMap[p.id] = { grandTotalLumpSum: 0, grandTotalMonthlyPension: 0, isCalculated: false };
          }
        } catch (e) {
          calcMap[p.id] = { grandTotalLumpSum: 0, grandTotalMonthlyPension: 0, isCalculated: false };
        }
      }
      setCalculationsMap({ ...calcMap });
    };

    calculateForEligiblePersonnel();
  }, [personnelList, lossReportsList]);

  // Check URL query for auto-opening modal with personnel
  useEffect(() => {
    if (typeof window !== "undefined" && personnelList.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const pId = urlParams.get("personnelId");
      if (pId) {
        const found = personnelList.find((p) => p.id === pId);
        if (found) {
          openHeirModalForPersonnel(found);
        }
      }
    }
  }, [personnelList]);

  const openHeirModalForPersonnel = (p: MilitaryPersonnelRecord) => {
    setSelectedPersonnelId(p.id);
    setPersonnelSearchTerm(`${p.rankAbbr} ${p.firstName} ${p.lastName}`);
    setErrorMessage("");
    setSaveSuccess(false);

    if (p.heirs && p.heirs.length > 0) {
      const mapped = p.heirs.map((h) => {
        const title = h.title || (h.fullName ? (h.fullName.trim().split(" ")[0] || "นาย") : "นาย");
        const fName = h.firstName || (h.fullName ? (h.fullName.trim().split(" ")[1] || "") : "");
        const lName = h.lastName || (h.fullName ? (h.fullName.trim().split(" ").slice(2).join(" ") || "") : "");

        const bParts = toThaiDateParts(h.dateOfBirth);
        const defaultYearBE = h.age ? currentBE - h.age : currentBE - 40;
        const bDay = bParts ? bParts.day : 1;
        const bMonth = bParts ? bParts.month : 1;
        const bYear = bParts ? bParts.yearBE : defaultYearBE;
        const calculatedAge = bParts ? calcAgeFromBE(bDay, bMonth, bYear) : Number(h.age || 40);
        const isoDate = thaiDateToISO(bDay, bMonth, bYear);

        const cleanId = (h.nationalId || "").replace(/\D/g, "").slice(0, 13);
        const formattedId = formatThaiCitizenId(cleanId);
        let idError = "";
        if (cleanId.length > 0 && cleanId.length < 13) {
          idError = `กรอกแล้ว ${cleanId.length}/13 หลัก (เฉพาะตัวเลข)`;
        } else if (cleanId.length === 13 && !validateThaiCitizenId(cleanId)) {
          idError = "เลขบัตรประชาชนไม่ผ่าน check digit";
        }

        const cleanPhone = (h.phone || "").replace(/\D/g, "").slice(0, 10);
        const formattedPhone = formatMobilePhone(cleanPhone);
        let pError = "";
        if (cleanPhone.length > 0 && cleanPhone.length < 10) {
          pError = `กรอกแล้ว ${cleanPhone.length}/10 หลัก (เฉพาะตัวเลข)`;
        } else if (cleanPhone.length === 10 && !cleanPhone.startsWith("0")) {
          pError = "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0";
        }

        const cleanBank = (h.bankAccountNumber || "").replace(/\D/g, "").slice(0, 15);
        let bError = "";
        if (cleanBank.length > 0 && cleanBank.length < 10) {
          bError = `กรอกแล้ว ${cleanBank.length}/15 หลัก (เลขบัญชีควรมี 10-15 หลัก)`;
        }

        return {
          nationalId: formattedId,
          nationalIdError: idError,
          title,
          firstName: fName,
          lastName: lName,
          dateOfBirth: isoDate,
          birthDay: bDay,
          birthMonth: bMonth,
          birthYearBE: bYear,
          age: calculatedAge,
          relationship: h.relationship || "OTHER_HEIR",
          phone: formattedPhone,
          phoneError: pError,
          address: "",
          isAlive: true,
          bankName: h.bankName || "กรุงไทย",
          bankAccountNumber: cleanBank,
          bankAccountError: bError,
          allocationPercentage: Number(h.allocationPercentage || 0),
          isDesignatedSuccessor: false,
          documentsVerified: true,
          isBloodRelative: ["FATHER","MOTHER","SIBLING_ELDER_BROTHER","SIBLING_YOUNGER_BROTHER","SIBLING_ELDER_SISTER","SIBLING_YOUNGER_SISTER"].includes(h.relationship || ""),
          familyConnection: h.relationship || "",
        };
      });
      setHeirsList(mapped);
    } else {
      // If no heirs yet, auto populate from spouse & children if available
      autoPopulateFromFamily(p);
    }

    setIsModalOpen(true);
  };

  const autoPopulateFromFamily = (p: MilitaryPersonnelRecord) => {
    const generated: HeirFormState[] = [];

    // Add Spouse if exists
    if (p.spouse) {
      const parts = (p.spouse.fullName || "").trim().split(" ");
      const bParts = toThaiDateParts(p.spouse.dateOfBirth);
      const defaultYearBE = p.spouse.age ? currentBE - p.spouse.age : currentBE - 35;
      const bDay = bParts ? bParts.day : 1;
      const bMonth = bParts ? bParts.month : 1;
      const bYear = bParts ? bParts.yearBE : defaultYearBE;
      const calculatedAge = bParts ? calcAgeFromBE(bDay, bMonth, bYear) : Number(p.spouse.age || 35);
      const isoDate = thaiDateToISO(bDay, bMonth, bYear);

      const cleanId = (p.spouse.nationalId || "").replace(/\D/g, "").slice(0, 13);
      const formattedId = formatThaiCitizenId(cleanId);
      let idError = "";
      if (cleanId.length > 0 && cleanId.length < 13) {
        idError = `กรอกแล้ว ${cleanId.length}/13 หลัก (เฉพาะตัวเลข)`;
      } else if (cleanId.length === 13 && !validateThaiCitizenId(cleanId)) {
        idError = "เลขบัตรประชาชนไม่ผ่าน check digit";
      }

      const cleanPhone = (p.spouse.phone || "").replace(/\D/g, "").slice(0, 10);
      const formattedPhone = formatMobilePhone(cleanPhone);
      const cleanBank = (p.spouse.bankAccountNumber || "").replace(/\D/g, "").slice(0, 15);

      generated.push({
        nationalId: formattedId,
        nationalIdError: idError,
        title: parts[0] || "นาง",
        firstName: parts[1] || "",
        lastName: parts.slice(2).join(" ") || "",
        dateOfBirth: isoDate,
        birthDay: bDay,
        birthMonth: bMonth,
        birthYearBE: bYear,
        age: calculatedAge,
        relationship: "SPOUSE_LEGAL",
        phone: formattedPhone,
        phoneError: "",
        address: "",
        isAlive: true,
        bankName: p.spouse.bankName || "กรุงไทย",
        bankAccountNumber: cleanBank,
        bankAccountError: "",
        allocationPercentage: p.spouse.allocationPercentage || 50,
        isDesignatedSuccessor: false,
        documentsVerified: true,
        isBloodRelative: false,
        familyConnection: "SPOUSE",
      });
    }

    // Add Children if exists (แบ่งโควตารวม 25% เป็นทศนิยม 2 หลัก เช่น 2 คน = คนละ 12.50%)
    if (p.children && p.children.length > 0) {
      const defaultChildShare = Math.round((25 / p.children.length) * 100) / 100;
      p.children.forEach((c) => {
        const parts = (c.fullName || "").trim().split(" ");
        const bParts = toThaiDateParts(c.dateOfBirth);
        const defaultYearBE = c.age ? currentBE - c.age : currentBE - 10;
        const bDay = bParts ? bParts.day : 1;
        const bMonth = bParts ? bParts.month : 1;
        const bYear = bParts ? bParts.yearBE : defaultYearBE;
        const calculatedAge = bParts ? calcAgeFromBE(bDay, bMonth, bYear) : Number(c.age || 10);
        const isoDate = thaiDateToISO(bDay, bMonth, bYear);

        const cleanId = (c.nationalId || "").replace(/\D/g, "").slice(0, 13);
        const formattedId = formatThaiCitizenId(cleanId);
        let idError = "";
        if (cleanId.length > 0 && cleanId.length < 13) {
          idError = `กรอกแล้ว ${cleanId.length}/13 หลัก (เฉพาะตัวเลข)`;
        } else if (cleanId.length === 13 && !validateThaiCitizenId(cleanId)) {
          idError = "เลขบัตรประชาชนไม่ผ่าน check digit";
        }

        const childAlloc = (c.allocationPercentage !== undefined && c.allocationPercentage !== null && ((p.children?.length ?? 0) === 1 || c.allocationPercentage !== 25))
          ? Number(c.allocationPercentage)
          : defaultChildShare;

        generated.push({
          nationalId: formattedId,
          nationalIdError: idError,
          title: parts[0] || "ด.ช.",
          firstName: parts[1] || "",
          lastName: parts.slice(2).join(" ") || "",
          dateOfBirth: isoDate,
          birthDay: bDay,
          birthMonth: bMonth,
          birthYearBE: bYear,
          age: calculatedAge,
          relationship: "CHILD_LEGITIMATE",
          phone: "",
          phoneError: "",
          address: "",
          isAlive: true,
          bankName: "กรุงไทย",
          bankAccountNumber: "",
          bankAccountError: "",
          allocationPercentage: childAlloc,
          isDesignatedSuccessor: calculatedAge >= 18 && calculatedAge <= 35,
          documentsVerified: true,
          isBloodRelative: true,
          familyConnection: "CHILD",
        });
      });
    }

    // Add Father & Mother default entries if list is still small
    if (generated.length <= 1) {
      generated.push({
        nationalId: "",
        nationalIdError: "",
        title: "นาย",
        firstName: "",
        lastName: p.lastName,
        dateOfBirth: thaiDateToISO(1, 1, currentBE - 65),
        birthDay: 1,
        birthMonth: 1,
        birthYearBE: currentBE - 65,
        age: 65,
        relationship: "FATHER",
        phone: "",
        phoneError: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        bankAccountError: "",
        allocationPercentage: generated.some((h) => h.relationship === "SPOUSE_LEGAL") ? 12.5 : 50,
        isDesignatedSuccessor: false,
        documentsVerified: true,
        isBloodRelative: true,
        familyConnection: "FATHER",
      });
      generated.push({
        nationalId: "",
        nationalIdError: "",
        title: "นาง",
        firstName: "",
        lastName: p.lastName,
        dateOfBirth: thaiDateToISO(1, 1, currentBE - 63),
        birthDay: 1,
        birthMonth: 1,
        birthYearBE: currentBE - 63,
        age: 63,
        relationship: "MOTHER",
        phone: "",
        phoneError: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        bankAccountError: "",
        allocationPercentage: generated.some((h) => h.relationship === "SPOUSE_LEGAL") ? 12.5 : 50,
        isDesignatedSuccessor: false,
        documentsVerified: true,
        isBloodRelative: true,
        familyConnection: "MOTHER",
      });
    }

    setHeirsList(generated);
  };

  const handleAddHeir = () => {
    const defaultAge = 30;
    const defaultYearBE = currentBE - defaultAge;
    setHeirsList((prev) => [
      ...prev,
      {
        nationalId: "",
        nationalIdError: "",
        title: "นาย",
        firstName: "",
        lastName: "",
        dateOfBirth: thaiDateToISO(1, 1, defaultYearBE),
        birthDay: 1,
        birthMonth: 1,
        birthYearBE: defaultYearBE,
        age: defaultAge,
        relationship: "OTHER_HEIR",
        phone: "",
        phoneError: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        bankAccountError: "",
        allocationPercentage: 0,
        isDesignatedSuccessor: false,
        documentsVerified: false,
        isBloodRelative: false,
        familyConnection: "",
      },
    ]);
  };

  const handleRemoveHeir = (index: number) => {
    setHeirsList((prev) => prev.filter((_, i) => i !== index));
  };

  const BLOOD_RELATIVE_RELATIONSHIPS = [
    "FATHER", "MOTHER",
    "SIBLING_ELDER_BROTHER", "SIBLING_YOUNGER_BROTHER",
    "SIBLING_ELDER_SISTER", "SIBLING_YOUNGER_SISTER",
    "CHILD_LEGITIMATE", "CHILD_ADOPTED",
  ];

  const handleHeirChange = (index: number, field: keyof HeirFormState, value: any) => {
    setHeirsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "dateOfBirth" && value) {
        const birthYear = new Date(value).getFullYear();
        const curYear = new Date().getFullYear();
        updated[index].age = Math.max(0, curYear - birthYear);
      }

      // Auto-update isBloodRelative and familyConnection when relationship changes
      if (field === "relationship") {
        updated[index].isBloodRelative = BLOOD_RELATIVE_RELATIONSHIPS.includes(value);
        updated[index].familyConnection = value;
      }

      return updated;
    });
  };

  const handleHeirNationalIdChange = (index: number, val: string) => {
    const cleanDigits = val.replace(/\D/g, "").slice(0, 13);
    const formatted = formatThaiCitizenId(cleanDigits);
    let errorMsg = "";
    if (cleanDigits.length > 0 && cleanDigits.length < 13) {
      errorMsg = `กรอกแล้ว ${cleanDigits.length}/13 หลัก (เฉพาะตัวเลข)`;
    } else if (cleanDigits.length === 13 && !validateThaiCitizenId(cleanDigits)) {
      errorMsg = "เลขบัตรประชาชนไม่ผ่าน check digit";
    }

    setHeirsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        nationalId: formatted,
        nationalIdError: errorMsg,
      };
      return updated;
    });
  };

  const handleHeirBirthDateChange = (index: number, part: "day" | "month" | "yearBE", value: number) => {
    setHeirsList((prev) => {
      const updated = [...prev];
      const h = updated[index];
      const d = part === "day" ? value : (h.birthDay || 1);
      const m = part === "month" ? value : (h.birthMonth || 1);
      const yBE = part === "yearBE" ? value : (h.birthYearBE || currentBE - (h.age || 30));

      const newAge = calcAgeFromBE(d, m, yBE);
      const iso = thaiDateToISO(d, m, yBE);

      updated[index] = {
        ...h,
        birthDay: d,
        birthMonth: m,
        birthYearBE: yBE,
        dateOfBirth: iso,
        age: newAge,
      };
      return updated;
    });
  };

  const handleHeirBankAccountChange = (index: number, val: string) => {
    const cleanDigits = val.replace(/\D/g, "").slice(0, 15);
    let errorMsg = "";
    if (cleanDigits.length > 0 && cleanDigits.length < 10) {
      errorMsg = `กรอกแล้ว ${cleanDigits.length}/15 หลัก (เลขบัญชีควรมี 10-15 หลัก)`;
    }

    setHeirsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        bankAccountNumber: cleanDigits,
        bankAccountError: errorMsg,
      };
      return updated;
    });
  };

  const handleHeirPhoneChange = (index: number, val: string) => {
    const cleanDigits = val.replace(/\D/g, "").slice(0, 10);
    const formatted = formatMobilePhone(cleanDigits);
    let errorMsg = "";
    if (cleanDigits.length > 0 && cleanDigits.length < 10) {
      errorMsg = `กรอกแล้ว ${cleanDigits.length}/10 หลัก (เบอร์มือถือต้องมี 10 หลัก)`;
    } else if (cleanDigits.length === 10 && !cleanDigits.startsWith("0")) {
      errorMsg = "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0";
    }

    setHeirsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        phone: formatted,
        phoneError: errorMsg,
      };
      return updated;
    });
  };

  // Preset Allocation Rule: Spouse 50%, Children 25%, Parents 25%
  const applyStandardAllocationPreset = () => {
    setHeirsList((prev) => {
      const spouseCount = prev.filter((h) => h.relationship === "SPOUSE_LEGAL").length;
      const childrenCount = prev.filter((h) => h.relationship === "CHILD_LEGITIMATE" || h.relationship === "CHILD_ADOPTED").length;
      const parentsCount = prev.filter((h) => h.relationship === "FATHER" || h.relationship === "MOTHER").length;

      return prev.map((h) => {
        if (h.relationship === "SPOUSE_LEGAL") {
          return { ...h, allocationPercentage: Math.round((50 / (spouseCount || 1)) * 100) / 100 };
        }
        if (h.relationship === "CHILD_LEGITIMATE" || h.relationship === "CHILD_ADOPTED") {
          return { ...h, allocationPercentage: Math.round((25 / (childrenCount || 1)) * 100) / 100 };
        }
        if (h.relationship === "FATHER" || h.relationship === "MOTHER") {
          return { ...h, allocationPercentage: Math.round((25 / (parentsCount || 1)) * 100) / 100 };
        }
        // Siblings and others get 0% in standard preset (need manual allocation)
        return { ...h, allocationPercentage: 0 };
      });
    });
  };

  const applyEqualSplitPreset = () => {
    if (heirsList.length === 0) return;
    const equalShare = Math.round((100 / heirsList.length) * 100) / 100;
    setHeirsList((prev) => prev.map((h) => ({ ...h, allocationPercentage: equalShare })));
  };

  const totalPercentage = heirsList.reduce((sum, h) => sum + (Number(h.allocationPercentage) || 0), 0);

  const handleSaveHeirs = async () => {
    if (!selectedPersonnelId) {
      setErrorMessage("กรุณาเลือกกำลังพลที่ต้องการบันทึกข้อมูลทายาท");
      return;
    }

    // Client-side validation for ID, Phone, Bank Account
    for (let i = 0; i < heirsList.length; i++) {
      const h = heirsList[i];
      const cleanId = (h.nationalId || "").replace(/\D/g, "");
      if (cleanId.length > 0 && cleanId.length !== 13) {
        setErrorMessage(`ทายาทลำดับที่ ${i + 1} (${h.firstName || "ไม่ระบุชื่อ"}): เลขบัตร ปชช. ต้องมี 13 หลัก (ปัจจุบันมี ${cleanId.length} หลัก)`);
        return;
      }
      if (cleanId.length === 13 && !validateThaiCitizenId(cleanId)) {
        setErrorMessage(`ทายาทลำดับที่ ${i + 1} (${h.firstName || "ไม่ระบุชื่อ"}): เลขบัตร ปชช. ไม่ถูกต้องตามหลัก check digit`);
        return;
      }

      const cleanPhone = (h.phone || "").replace(/\D/g, "");
      if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
        setErrorMessage(`ทายาทลำดับที่ ${i + 1} (${h.firstName || "ไม่ระบุชื่อ"}): เบอร์โทรศัพท์ต้องมี 10 หลัก (ปัจจุบันมี ${cleanPhone.length} หลัก)`);
        return;
      }
      if (cleanPhone.length === 10 && !cleanPhone.startsWith("0")) {
        setErrorMessage(`ทายาทลำดับที่ ${i + 1} (${h.firstName || "ไม่ระบุชื่อ"}): เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0`);
        return;
      }

      const cleanBank = (h.bankAccountNumber || "").replace(/\D/g, "");
      if (cleanBank.length > 0 && cleanBank.length < 10) {
        setErrorMessage(`ทายาทลำดับที่ ${i + 1} (${h.firstName || "ไม่ระบุชื่อ"}): เลขที่บัญชีธนาคารต้องมี 10-15 หลัก (ปัจจุบันมี ${cleanBank.length} หลัก)`);
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        heirs: heirsList.map((h) => {
          const cleanNationalId = (h.nationalId || "").replace(/\D/g, "");
          const cleanPhone = (h.phone || "").replace(/\D/g, "");
          const cleanBankAcc = (h.bankAccountNumber || "").replace(/\D/g, "");
          const birthIso = h.dateOfBirth || (h.birthYearBE && h.birthMonth && h.birthDay ? thaiDateToISO(h.birthDay, h.birthMonth, h.birthYearBE) : undefined);

          return {
            nationalId: cleanNationalId,
            title: h.title,
            firstName: h.firstName,
            lastName: h.lastName,
            dateOfBirth: birthIso,
            age: Number(h.age || 0),
            relationship: h.relationship,
            phone: cleanPhone,
            address: h.address,
            isAlive: h.isAlive,
            bankName: h.bankName,
            bankAccountNumber: cleanBankAcc,
            allocationPercentage: Number(Number(h.allocationPercentage || 0).toFixed(2)),
            isDesignatedSuccessor: h.isDesignatedSuccessor,
            documentsVerified: h.documentsVerified,
          };
        }),
      };

      const res = await fetch(`/api/personnel/${selectedPersonnelId}/heirs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        await fetchPersonnel();
      } else {
        setErrorMessage(json.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  // Filter Personnel for Cards
  const filteredPersonnel = personnelList.filter((p) => {
    if (search === "") return true;
    const term = search.toLowerCase();
    const pMatches =
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.militaryId.toLowerCase().includes(term) ||
      (p.citizenId && p.citizenId.includes(term)) ||
      (p.normalUnit && p.normalUnit.toLowerCase().includes(term)) ||
      (p.fieldUnit && p.fieldUnit.toLowerCase().includes(term));
    const hMatches = p.heirs?.some((h) => {
      const name = h.fullName || `${h.title || ""} ${h.firstName || ""} ${h.lastName || ""}`.trim();
      return (
        name.toLowerCase().includes(term) ||
        (h.nationalId && h.nationalId.includes(term)) ||
        (h.bankAccountNumber && h.bankAccountNumber.includes(term)) ||
        (h.phone && h.phone.includes(term))
      );
    });
    return pMatches || hMatches;
  });

  // รีเซ็ตหน้ากลับเป็นหน้า 1 เสมอเมื่อมีการค้นหาหรือเปลี่ยนขนาดหน้า
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const totalItems = filteredPersonnel.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedPersonnel = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredPersonnel.slice(startIndex, startIndex + pageSize);
  }, [filteredPersonnel, safeCurrentPage, pageSize]);

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

  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case "SPOUSE_LEGAL":
        return <Badge className="bg-purple-600 text-white">คู่สมรสตามกฎหมาย</Badge>;
      case "SPOUSE_DE_FACTO":
        return <Badge className="bg-purple-500 text-white">คู่สมรสพฤตินัย</Badge>;
      case "CHILD_LEGITIMATE":
        return <Badge className="bg-blue-600 text-white">บุตรชอบด้วยกฎหมาย</Badge>;
      case "CHILD_ADOPTED":
        return <Badge className="bg-blue-500 text-white">บุตรบุญธรรม</Badge>;
      case "FATHER":
        return <Badge className="bg-amber-600 text-white">บิดา</Badge>;
      case "MOTHER":
        return <Badge className="bg-pink-600 text-white">มารดา</Badge>;
      case "SIBLING_ELDER_BROTHER":
        return <Badge className="bg-teal-600 text-white">พี่ชายร่วมสายเลือด</Badge>;
      case "SIBLING_YOUNGER_BROTHER":
        return <Badge className="bg-teal-500 text-white">น้องชายร่วมสายเลือด</Badge>;
      case "SIBLING_ELDER_SISTER":
        return <Badge className="bg-rose-500 text-white">พี่สาวร่วมสายเลือด</Badge>;
      case "SIBLING_YOUNGER_SISTER":
        return <Badge className="bg-rose-400 text-white">น้องสาวร่วมสายเลือด</Badge>;
      default:
        return <Badge variant="secondary">ทายาทอื่น</Badge>;
    }
  };

  const searchResultsPersonnel = personnelList.filter((p) => {
    if (!personnelSearchTerm) return true;
    const term = personnelSearchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.militaryId.toLowerCase().includes(term) ||
      p.citizenId.toLowerCase().includes(term)
    );
  });

  const selectedPersonnelRecord = personnelList.find((p) => p.id === selectedPersonnelId);

  // สถิติภาพรวม
  const totalHeirsCount = personnelList.reduce((sum, p) => sum + (p.heirs?.length || 0), 0);
  const reportedLossPersonnelCount = personnelList.filter((p) => !!getLossReportForPersonnel(p)).length;
  const calculatedPersonnelCount = Object.values(calculationsMap).filter((c) => c.isCalculated && c.grandTotalLumpSum > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ข้อมูลทายาทและการจัดสรรสิทธิ (Heir Information - Tab 4)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            บันทึกข้อมูลทายาทและการจัดสรรสัดส่วนร้อยละ (%) โดยยอดเงินประมาณการคำนวณให้เฉพาะกำลังพลที่ถูกรายงานการสูญเสียจากการปฏิบัติหน้าที่แล้ว
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
            onClick={() => {
              if (personnelList.length > 0) {
                openHeirModalForPersonnel(personnelList[0]);
              } else {
                setIsModalOpen(true);
              }
            }}
          >
            <UserPlus className="h-4 w-4" />
            บันทึก/จัดการข้อมูลทายาท
          </Button>
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

        <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
          <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            4
          </div>
          <div className="truncate">
            <p className="font-bold truncate">Tab 4: ทายาท (ใช้งาน)</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 truncate">สัดส่วน % ทายาท</p>
          </div>
        </div>

        <Link href="/loss-reports" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors col-span-2 sm:col-span-1">
          <div className="h-6 w-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            5
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 5: รายงานสูญเสีย</p>
            <p className="text-[10px] text-muted-foreground truncate">กพ.3 / กพ.4</p>
          </div>
        </Link>

        <Link href="/calculator" className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors col-span-2 sm:col-span-1">
          <div className="h-6 w-6 rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
            6
          </div>
          <div className="truncate">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">Tab 6: คำนวณสิทธิ 4 หมวด</p>
            <p className="text-[10px] text-muted-foreground truncate">ประมาณการสิทธิ</p>
          </div>
        </Link>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">บันทึกข้อมูลทายาทแล้ว</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">
              {totalHeirsCount} คน <span className="text-xs font-normal text-muted-foreground">({personnelList.filter((p) => p.heirs && p.heirs.length > 0).length} นาย)</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">รายงานการสูญเสีย (กพ.3/กพ.4)</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">
              {reportedLossPersonnelCount} นาย <span className="text-xs font-normal text-amber-600">(ผู้มีสิทธิรับเงิน)</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">คำนวณประมาณการสิทธิแล้ว</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {calculatedPersonnelCount} นาย <span className="text-xs font-normal text-muted-foreground">(พร้อมจัดสรรสิทธิ)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Search & Layout Controls Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อกำลังพล, เลขทหาร, ชื่อทายาท, เลขบัตร ปชช., เลขบัญชี..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end text-xs">
          <div className="text-muted-foreground hidden md:block">
            พบข้อมูลทายาทกำลังพล <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> นาย
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              size="sm"
              variant={viewMode === "row" ? "default" : "ghost"}
              className={`h-7 px-2.5 text-[11px] gap-1 ${viewMode === "row" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("row")}
              title="แสดงผลแบบ 4 แถวต่อหน้า (แนวนอนเต็มพื้นที่)"
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>4 แถว</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className={`h-7 px-2.5 text-[11px] gap-1 ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("grid")}
              title="แสดงผลแบบการ์ดคู่ (2 คอลัมน์)"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>การ์ดคู่</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[11px]">แสดง:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-background px-2 text-[11px] text-foreground font-medium"
            >
              <option value={4}>4 แถว/หน้า</option>
              <option value={8}>8 แถว/หน้า</option>
              <option value={12}>12 แถว/หน้า</option>
              <option value={20}>20 แถว/หน้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Heirs Cards Container */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            กำลังโหลดข้อมูลทายาทและการประมาณการสิทธิ...
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            ไม่พบข้อมูลทายาทตามคำค้นหา
          </div>
        ) : viewMode === "row" ? (
          /* ── โหมด 4 แถวต่อหน้า (Horizontal Row Cards) ── */
          <div className="space-y-3.5">
            {paginatedPersonnel.map((p) => {
              const lossReport = getLossReportForPersonnel(p);
              const hasLossReport = !!lossReport;
              const calc = calculationsMap[p.id];
              const isCalculated = !!(calc && calc.isCalculated && calc.grandTotalLumpSum > 0);
              const totalLumpSum = isCalculated ? calc.grandTotalLumpSum : 0;
              const totalMonthlyPension = isCalculated ? calc.grandTotalMonthlyPension : 0;
              const heirs = p.heirs || [];
              const totalAlloc = heirs.reduce((sum, h) => sum + (Number(h.allocationPercentage) || 0), 0);
              const isAllocComplete = Math.abs(totalAlloc - 100) < 0.01;

              return (
                <Card
                  key={p.id}
                  className="border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400/50 hover:shadow-sm transition-all p-4 rounded-2xl bg-white dark:bg-slate-900"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                    {/* ส่วนที่ 1: ข้อมูลกำลังพลผู้รับสิทธิ & สถานะสูญเสีย & ผลคำนวณ (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-2.5 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-3 lg:pb-0 lg:pr-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* รหัสและสถานะ */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                            {p.militaryId}
                          </span>
                          {p.citizenId && (
                            <span className="font-mono text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              ปชช: {formatThaiCitizenId(p.citizenId)}
                            </span>
                          )}
                        </div>

                        {/* ชื่อและสังกัด */}
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {p.rankAbbr} {p.firstName} {p.lastName}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            หน่วย: <span className="font-medium text-slate-700 dark:text-slate-300">{p.normalUnit}</span>
                            {p.fieldUnit && p.fieldUnit !== p.normalUnit && (
                              <span> | สนาม: <span className="font-medium text-slate-700 dark:text-slate-300">{p.fieldUnit}</span></span>
                            )}
                          </p>
                        </div>

                        {/* สถานะการรายงานสูญเสียจากการปฏิบัติหน้าที่ */}
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-600 dark:text-slate-300">รายงานการสูญเสีย:</span>
                            {hasLossReport ? (
                              <Badge className="bg-rose-600 text-white text-[9px] gap-1 py-0 h-5">
                                <FileCheck className="h-3 w-3" />
                                มีรายงานสูญเสียแล้ว (กพ.3/กพ.4)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] text-slate-500 py-0 h-5">
                                ยังไม่มีรายงานการสูญเสีย
                              </Badge>
                            )}
                          </div>
                          {lossReport && (
                            <p className="text-[10px] text-slate-500 truncate">
                              เหตุการณ์: {lossReport.eventSummary || "ปฏิบัติภารกิจราชการสนาม"} ({new Date(lossReport.incidentDate).toLocaleDateString("th-TH")})
                            </p>
                          )}
                        </div>

                        {/* สถานะการคำนวณประมาณการสิทธิ */}
                        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-blue-900 dark:text-blue-300">ประมาณการเงินรวม:</span>
                            {isCalculated ? (
                              <Badge className="bg-emerald-600 text-white text-[9px] gap-1 py-0 h-5">
                                <CheckCircle2 className="h-3 w-3" />
                                คำนวณสิทธิแล้ว
                              </Badge>
                            ) : hasLossReport ? (
                              <Badge className="bg-amber-600 text-white text-[9px] py-0 h-5">
                                รอคำนวณสิทธิใน Tab 6
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-slate-400 py-0 h-5">
                                รอรายงานสูญเสีย
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between pt-0.5">
                            <span className="text-[10px] text-muted-foreground">บำเหน็จตกทอดรวม:</span>
                            <span className={`font-mono font-black text-xs ${isCalculated ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}`}>
                              {isCalculated ? formatCurrency(totalLumpSum) : "— (รอรายงาน/คำนวณ)"}
                            </span>
                          </div>
                          {isCalculated && totalMonthlyPension > 0 && (
                            <div className="flex items-baseline justify-between text-[10px] text-muted-foreground">
                              <span>บำนาญพิเศษรายเดือน:</span>
                              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                                {formatCurrency(totalMonthlyPension)}/เดือน
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHeirModalForPersonnel(p)}
                          className="h-7 text-[11px] px-2 gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                        >
                          <Edit className="h-3 w-3" />
                          บันทึก/แก้ไขทายาท
                        </Button>
                        <Link href={`/calculator?personnelId=${p.id}`}>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            <Calculator className="h-3 w-3" />
                            {isCalculated ? "ดูรายละเอียดสิทธิ" : "คำนวณสิทธิ Tab 6"}
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* ส่วนที่ 2: รายชื่อทายาทและการจัดสรรสิทธิ (lg:col-span-8) */}
                    <div className="lg:col-span-8 space-y-2 flex flex-col justify-between">
                      {/* แถบหัวข้อและสัดส่วนรวม */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            ทายาทผู้มีสิทธิรับเงิน ({heirs.length} คน)
                          </span>
                          <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            isAllocComplete ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            สัดส่วนรวม: {totalAlloc.toFixed(2)}% / 100.00%
                          </span>
                        </div>

                        {!isAllocComplete && heirs.length > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            * ยังไม่ครบ 100% (ขาด { (100 - totalAlloc).toFixed(2) }%)
                          </span>
                        )}
                      </div>

                      {/* รายการทายาท */}
                      {heirs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          <p>ยังไม่มีการบันทึกข้อมูลทายาทสำหรับกำลังพลนายนี้</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHeirModalForPersonnel(p)}
                            className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            กดเพิ่มข้อมูลทายาทและสัดส่วนรับเงิน
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-muted-foreground font-semibold">
                                <th className="py-1 px-2">ลำดับ</th>
                                <th className="py-1 px-2">ชื่อ-นามสกุล / เลขบัตร ปชช.</th>
                                <th className="py-1 px-2">ความสัมพันธ์</th>
                                <th className="py-1 px-2">วันเกิด (พ.ศ.) / อายุ</th>
                                <th className="py-1 px-2">ธนาคาร / เลขที่บัญชี</th>
                                <th className="py-1 px-2 text-right">สัดส่วน (%)</th>
                                <th className="py-1 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">ยอดเงินประมาณการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {heirs.map((h, hIdx) => {
                                const allocPct = Number(h.allocationPercentage) || 0;
                                const heirAmount = isCalculated ? Math.round(totalLumpSum * (allocPct / 100)) : 0;
                                const name = h.fullName || `${h.title || ""} ${h.firstName || ""} ${h.lastName || ""}`.trim();
                                const bParts = toThaiDateParts(h.dateOfBirth);

                                return (
                                  <tr key={hIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="py-1.5 px-2 text-muted-foreground font-mono text-[11px]">{hIdx + 1}</td>
                                    <td className="py-1.5 px-2">
                                      <div className="font-semibold text-slate-900 dark:text-slate-100">{name}</div>
                                      <div className="text-[10px] font-mono text-muted-foreground">
                                        {formatThaiCitizenId(h.nationalId)}
                                      </div>
                                      {h.isDesignatedSuccessor && (
                                        <Badge className="bg-emerald-600 text-white text-[9px] py-0 h-4 mt-0.5">
                                          ทายาทบรรจุทดแทน
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2">
                                      {getRelationshipBadge(h.relationship)}
                                    </td>
                                    <td className="py-1.5 px-2 text-[11px]">
                                      {bParts ? (
                                        <span>
                                          {bParts.day} {THAI_MONTHS.find((m) => m.value === bParts.month)?.label.split(" ")[1] || ""} {bParts.yearBE}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                      <div className="text-[10px] text-muted-foreground">
                                        อายุ {h.age || "—"} ปี
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 text-[11px]">
                                      <div className="font-medium text-slate-700 dark:text-slate-300">
                                        {h.bankName || "กรุงไทย"}
                                      </div>
                                      <div className="text-[10px] font-mono text-muted-foreground">
                                        {h.bankAccountNumber || "—"}
                                      </div>
                                      {h.phone && (
                                        <div className="text-[10px] font-mono text-muted-foreground">
                                          โทร: {formatMobilePhone(h.phone)}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
                                      {allocPct.toFixed(2)}%
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono font-bold text-xs">
                                      {isCalculated ? (
                                        <span className="text-emerald-700 dark:text-emerald-400">
                                          {formatCurrency(heirAmount)}
                                        </span>
                                      ) : hasLossReport ? (
                                        <span className="text-[10px] text-amber-600 font-normal">
                                          — (รอคำนวณ)
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          — (รอรายงานสูญเสีย)
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ── โหมดการ์ดคู่ (Grid Cards) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedPersonnel.map((p) => {
              const lossReport = getLossReportForPersonnel(p);
              const hasLossReport = !!lossReport;
              const calc = calculationsMap[p.id];
              const isCalculated = !!(calc && calc.isCalculated && calc.grandTotalLumpSum > 0);
              const totalLumpSum = isCalculated ? calc.grandTotalLumpSum : 0;
              const heirs = p.heirs || [];
              const totalAlloc = heirs.reduce((sum, h) => sum + (Number(h.allocationPercentage) || 0), 0);

              return (
                <Card
                  key={p.id}
                  className="border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400/50 hover:shadow-sm transition-all p-4 rounded-2xl bg-white dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                          {p.militaryId}
                        </span>
                        {hasLossReport ? (
                          <Badge className="bg-rose-600 text-white text-[9px] py-0 h-4">
                            มีรายงานสูญเสีย
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] py-0 h-4 text-slate-500">
                            ยังไม่มีรายงานสูญเสีย
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {p.rankAbbr} {p.firstName} {p.lastName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        สังกัด: {p.normalUnit}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">บำเหน็จตกทอดรวม:</span>
                      <span className={`font-mono font-black text-xs ${isCalculated ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}`}>
                        {isCalculated ? formatCurrency(totalLumpSum) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Heirs mini list */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>ทายาท ({heirs.length} คน):</span>
                      <span className="font-mono text-blue-600">สัดส่วน {totalAlloc.toFixed(2)}%</span>
                    </div>

                    {heirs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic py-2 text-center">ยังไม่มีข้อมูลทายาท</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {heirs.map((h, idx) => {
                          const allocPct = Number(h.allocationPercentage) || 0;
                          const heirAmount = isCalculated ? Math.round(totalLumpSum * (allocPct / 100)) : 0;
                          const name = h.fullName || `${h.title || ""} ${h.firstName || ""} ${h.lastName || ""}`.trim();
                          return (
                            <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <span>{name}</span>
                                  {getRelationshipBadge(h.relationship)}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {formatThaiCitizenId(h.nationalId)} | {h.bankName || "กรุงไทย"} ({h.bankAccountNumber || "—"})
                                </div>
                              </div>
                              <div className="text-right font-mono shrink-0">
                                <span className="font-bold text-blue-600 block">{allocPct.toFixed(2)}%</span>
                                <span className="font-bold text-emerald-600 text-[10px]">
                                  {isCalculated ? formatCurrency(heirAmount) : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openHeirModalForPersonnel(p)}
                      className="h-7 text-[11px] px-2 gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-3 w-3" />
                      บันทึกทายาท
                    </Button>
                    <Link href={`/calculator?personnelId=${p.id}`}>
                      <Button
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Calculator className="h-3 w-3" />
                        คำนวณสิทธิ
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls Bar */}
      {totalPages > 1 && (
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-muted-foreground text-[11px]">
            แสดงรายการที่ <strong>{(safeCurrentPage - 1) * pageSize + 1}</strong> ถึง{" "}
            <strong>{Math.min(safeCurrentPage * pageSize, totalItems)}</strong> จากทั้งหมด{" "}
            <strong>{totalItems}</strong> นาย (หน้า {safeCurrentPage} / {totalPages})
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              title="หน้าแรกสุด"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] gap-1"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>ก่อนหน้า</span>
            </Button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((pg, idx) =>
                typeof pg === "number" ? (
                  <Button
                    key={idx}
                    size="sm"
                    variant={safeCurrentPage === pg ? "default" : "outline"}
                    className={`h-7 w-7 p-0 text-[11px] ${safeCurrentPage === pg ? "bg-blue-600 text-white font-bold" : ""}`}
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </Button>
                ) : (
                  <span key={idx} className="px-1 text-muted-foreground font-bold">
                    {pg}
                  </span>
                )
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] gap-1"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              <span>ถัดไป</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              title="หน้าสุดท้าย"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Record / Edit Heirs Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                บันทึกและจัดการข้อมูลทายาท / สัดส่วนรับเงิน (Tab 4)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              ระบุข้อมูลทายาท (บิดา มารดา คู่สมรส บุตร) และจัดสรรสัดส่วนร้อยละ (%) ให้ครบถ้วนตามหลักเกณฑ์
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* Section 1: Personnel Search / Select */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                1. เลือกกำลังพลที่ต้องการบันทึกข้อมูลทายาท
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">ค้นหากำลังพล (ชื่อ / เลขทหาร):</span>
                  <Input
                    placeholder="พิมพ์ชื่อ หรือ เลขประจำตัวทหาร..."
                    value={personnelSearchTerm}
                    onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">เลือกจากรายชื่อที่พบ:</span>
                  <select
                    value={selectedPersonnelId}
                    onChange={(e) => {
                      const p = personnelList.find((item) => item.id === e.target.value);
                      if (p) openHeirModalForPersonnel(p);
                    }}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">-- เลือกกำลังพล --</option>
                    {searchResultsPersonnel.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.rankAbbr} {p.firstName} {p.lastName} ({p.militaryId}) - {p.normalUnit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedPersonnelRecord && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedPersonnelRecord.rankAbbr} {selectedPersonnelRecord.firstName} {selectedPersonnelRecord.lastName}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-2">
                      สังกัด: {selectedPersonnelRecord.normalUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => autoPopulateFromFamily(selectedPersonnelRecord)}
                      className="h-7 text-[11px] gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                      title="ดึงข้อมูลคู่สมรสและบุตรจาก Tab 3 มาเป็นทายาท"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      ดึงข้อมูลอัตโนมัติจากครอบครัว
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Allocation Overview Meter & Presets */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Percent className="h-4 w-4 text-blue-600" />
                    2. การควบคุมสัดส่วนร้อยละ (%) ของทายาททั้งหมด
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    ยอดรวมสัดส่วนของทายาททุกคนต้องเท่ากับ 100% ตามระเบียบราชการ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applyStandardAllocationPreset}
                    className="h-7 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Preset มาตรฐาน (คู่สมรส 50%, บุตร 25%, บิดามารดา 25%)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={applyEqualSplitPreset}
                    className="h-7 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    แบ่งเท่ากัน
                  </Button>
                </div>
              </div>

              {/* Meter bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>ผลรวมสัดส่วนปัจจุบัน:</span>
                  <span className={`text-sm font-extrabold ${Math.abs(totalPercentage - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                    {totalPercentage.toFixed(2)}% / 100.00%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${Math.abs(totalPercentage - 100) < 0.01 ? "bg-emerald-500" : totalPercentage > 100 ? "bg-rose-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, totalPercentage)}%` }}
                  />
                </div>
                {Math.abs(totalPercentage - 100) >= 0.01 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    * กรุณาปรับสัดส่วนให้ครบ 100.00% (ปัจจุบัน {totalPercentage > 100 ? `เกินอยู่ ${(totalPercentage - 100).toFixed(2)}%` : `ขาดอยู่ ${(100 - totalPercentage).toFixed(2)}%`})
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Heirs List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. รายชื่อทายาทผู้มีสิทธิรับเงินบำเหน็จตกทอด ({heirsList.length} คน)
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddHeir}
                  className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มทายาท
                </Button>
              </div>

              {heirsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-xl p-4 space-y-2">
                  <p className="text-xs">ยังไม่มีข้อมูลทายาทสำหรับกำลังพลนายนี้</p>
                  <Button size="sm" variant="outline" onClick={handleAddHeir} className="text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    กดเพิ่มข้อมูลทายาท
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {heirsList.map((heir, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            ทายาทลำดับที่ {index + 1}
                          </span>
                          {getRelationshipBadge(heir.relationship)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveHeir(index)}
                          className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* 1. ความสัมพันธ์ตามกฎหมาย */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px]">ความสัมพันธ์ตามกฎหมาย</Label>
                          <select
                            value={heir.relationship}
                            onChange={(e) => handleHeirChange(index, "relationship", e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                          >
                            <optgroup label="── คู่สมรส ──">
                              <option value="SPOUSE_LEGAL">คู่สมรสตามกฎหมาย (SPOUSE_LEGAL)</option>
                              <option value="SPOUSE_DE_FACTO">คู่สมรสพฤตินัย (SPOUSE_DE_FACTO)</option>
                            </optgroup>
                            <optgroup label="── บุตร ──">
                              <option value="CHILD_LEGITIMATE">บุตรชอบด้วยกฎหมาย (CHILD_LEGITIMATE)</option>
                              <option value="CHILD_ADOPTED">บุตรบุญธรรม (CHILD_ADOPTED)</option>
                            </optgroup>
                            <optgroup label="── บิดา – มารดา ──">
                              <option value="FATHER">บิดา (FATHER)</option>
                              <option value="MOTHER">มารดา (MOTHER)</option>
                            </optgroup>
                            <optgroup label="── พี่/น้องร่วมสายเลือด ──">
                              <option value="SIBLING_ELDER_BROTHER">พี่ชายร่วมสายเลือด (SIBLING_ELDER_BROTHER)</option>
                              <option value="SIBLING_YOUNGER_BROTHER">น้องชายร่วมสายเลือด (SIBLING_YOUNGER_BROTHER)</option>
                              <option value="SIBLING_ELDER_SISTER">พี่สาวร่วมสายเลือด (SIBLING_ELDER_SISTER)</option>
                              <option value="SIBLING_YOUNGER_SISTER">น้องสาวร่วมสายเลือด (SIBLING_YOUNGER_SISTER)</option>
                            </optgroup>
                            <optgroup label="── ทายาทอื่น ──">
                              <option value="OTHER_HEIR">ทายาทอื่นตามพินัยกรรม (OTHER_HEIR)</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* 2. คำนำหน้า */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px]">คำนำหน้า</Label>
                          <Input
                            value={heir.title}
                            onChange={(e) => handleHeirChange(index, "title", e.target.value)}
                            placeholder="นาย / นาง / น.ส."
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* 3. ชื่อ */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px]">ชื่อ <span className="text-red-500">*</span></Label>
                          <Input
                            value={heir.firstName}
                            onChange={(e) => handleHeirChange(index, "firstName", e.target.value)}
                            placeholder="ชื่อ"
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* 4. นามสกุล */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px]">นามสกุล <span className="text-red-500">*</span></Label>
                          <Input
                            value={heir.lastName}
                            onChange={(e) => handleHeirChange(index, "lastName", e.target.value)}
                            placeholder="นามสกุล"
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* 5. เลขบัตร ปชช. 13 หลัก (กรอกตัวเลขได้แค่ 13 หลักตามรูปแบบบัตร ปชช.) */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px]">เลขบัตร ปชช. 13 หลัก (รูปแบบบัตร ปชช.)</Label>
                          <Input
                            value={heir.nationalId}
                            onChange={(e) => handleHeirNationalIdChange(index, e.target.value)}
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
                            maxLength={17}
                            placeholder="0-0000-00000-00-0"
                            className={`h-8 text-xs font-mono ${
                              heir.nationalIdError
                                ? "border-red-400 focus:ring-red-400"
                                : heir.nationalId && heir.nationalId.replace(/\D/g, "").length === 13
                                ? "border-emerald-400 focus:ring-emerald-400"
                                : ""
                            }`}
                          />
                          {heir.nationalIdError && (
                            <p className="text-[10px] text-red-500 mt-0.5">{heir.nationalIdError}</p>
                          )}
                          {!heir.nationalIdError && heir.nationalId && heir.nationalId.replace(/\D/g, "").length === 13 && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">✓ เลขบัตรประชาชนถูกต้อง</p>
                          )}
                        </div>

                        {/* 6. วัน/เดือน/ปี เกิด (ตัวเลือกปี เป็นรูปแบบ พ.ศ.) */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">วัน/เดือน/ปี เกิด (วัน / เดือนไทย / ปี พ.ศ.)</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <select
                              value={heir.birthDay || 1}
                              onChange={(e) => handleHeirBirthDateChange(index, "day", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <select
                              value={heir.birthMonth || 1}
                              onChange={(e) => handleHeirBirthDateChange(index, "month", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                            >
                              {THAI_MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            <select
                              value={heir.birthYearBE || currentBE - (heir.age || 30)}
                              onChange={(e) => handleHeirBirthDateChange(index, "yearBE", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                            >
                              {BE_YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 7. อายุ (คำนวณอัตโนมัติ) */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px]">อายุ (คำนวณอัตโนมัติ)</Label>
                          <Input
                            type="number"
                            value={heir.age}
                            readOnly
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-bold"
                          />
                          <p className="text-[9px] text-muted-foreground mt-0.5">คำนวณจากวันเกิด</p>
                        </div>

                        {/* 8. สัดส่วนร้อยละ (%) */}
                        <div className="sm:col-span-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold text-blue-700">สัดส่วนร้อยละ (%)</Label>
                            <span className="text-[10px] text-purple-700 font-mono font-bold">
                              {Number(heir.allocationPercentage || 0).toFixed(2)}%
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={heir.allocationPercentage}
                            onChange={(e) => handleHeirChange(index, "allocationPercentage", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs font-bold text-blue-700"
                          />
                        </div>

                        {/* 9. เลขที่บัญชีธนาคาร (กรอกตัวเลขได้แค่ 15 หลัก) */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">ธนาคาร & เลขที่บัญชี (ตัวเลขสูงสุด 15 หลัก)</Label>
                          <div className="grid grid-cols-5 gap-1.5">
                            <div className="col-span-2">
                              <Input
                                value={heir.bankName}
                                onChange={(e) => handleHeirChange(index, "bankName", e.target.value)}
                                placeholder="ธนาคาร เช่น กรุงไทย"
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="col-span-3 space-y-0.5">
                              <Input
                                value={heir.bankAccountNumber}
                                onChange={(e) => handleHeirBankAccountChange(index, e.target.value)}
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
                                maxLength={15}
                                placeholder="เลขบัญชี (สูงสุด 15 หลัก)"
                                className={`h-8 text-xs font-mono ${
                                  heir.bankAccountError ? "border-amber-400 focus:ring-amber-400" : ""
                                }`}
                              />
                              {heir.bankAccountError && (
                                <p className="text-[9px] text-amber-600 mt-0.5">{heir.bankAccountError}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 10. เบอร์โทรศัพท์ติดต่อ (กรอกได้แค่ตัวเลข 10 หลักตามรูปแบบเบอร์มือถือ) */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px]">เบอร์โทรศัพท์ (10 หลัก)</Label>
                          <Input
                            value={heir.phone}
                            onChange={(e) => handleHeirPhoneChange(index, e.target.value)}
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
                            maxLength={12}
                            placeholder="08x-xxx-xxxx"
                            className={`h-8 text-xs font-mono ${
                              heir.phoneError ? "border-red-400 focus:ring-red-400" : ""
                            }`}
                          />
                          {heir.phoneError && (
                            <p className="text-[10px] text-red-500 mt-0.5">{heir.phoneError}</p>
                          )}
                        </div>

                        {/* 11. ตัวเลือกเพิ่มเติม / เงื่อนไข */}
                        <div className="sm:col-span-12 flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-3">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={heir.isDesignatedSuccessor}
                                onChange={(e) => handleHeirChange(index, "isDesignatedSuccessor", e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                ทายาทบรรจุทดแทน
                              </span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={heir.documentsVerified}
                                onChange={(e) => handleHeirChange(index, "documentsVerified", e.target.checked)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                ตรวจสอบเอกสารแล้ว
                              </span>
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">สถานะ:</span>
                            <select
                              value={heir.isAlive ? "ALIVE" : "DECEASED"}
                              onChange={(e) => handleHeirChange(index, "isAlive", e.target.value === "ALIVE")}
                              className="h-7 rounded border border-input bg-background px-2 text-[11px]"
                            >
                              <option value="ALIVE">มีชีวิต</option>
                              <option value="DECEASED">ถึงแก่กรรม</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error and Success Alerts */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>บันทึกข้อมูลทายาทและการจัดสรรสัดส่วนสำเร็จเรียบร้อยแล้ว</span>
                </div>
                {selectedPersonnelId && (
                  <Link href={`/calculator?personnelId=${selectedPersonnelId}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 gap-1">
                      ไปยัง Tab 5: คำนวณประมาณการสิทธิ <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              ปิดหน้าต่าง
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSaveHeirs}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลทายาท"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
