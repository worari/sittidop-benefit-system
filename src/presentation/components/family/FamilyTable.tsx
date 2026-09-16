"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import {
  Users2,
  Search,
  GraduationCap,
  HeartHandshake,
  Heart,
  Plus,
  CheckCircle2,
  Award,
  UserCheck,
  Edit,
  Trash2,
  ArrowRight,
  Shield,
  Building,
  UserPlus,
  AlertCircle,
  Phone,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { toThaiDateParts, formatThaiBE } from "@/presentation/lib/military-date-utils";
import { formatNationalId } from "../../lib/utils";

export interface ChildFormState {
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
  isAlive: boolean;
  isStudying: boolean;
  educationLevel: string;
  phone: string;
  scholarshipEligible: boolean;
  annualScholarship: number;
  hasSuccessorRight: boolean;
  allocationPercentage: number;
}

export interface SpouseFormState {
  hasSpouse: boolean;
  nationalId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  isAlive: boolean;
  isLegallyMarried: boolean;
  marriageCertNumber: string;
  phone: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  hasPensionRights: boolean;
  allocationPercentage: number;
}

// ── Thai months / Buddhist year constants & validation helpers ──
const THAI_MONTHS = [
  { value: 1, label: "มกราคม" }, { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" }, { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" }, { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" }, { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" }, { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" }, { value: 12, label: "ธันวาคม" },
];

const currentBE = new Date().getFullYear() + 543;
const BE_YEARS = Array.from({ length: 81 }, (_, i) => currentBE - 80 + i).reverse();

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

const validateMobilePhone = (phone: string): boolean => /^0[689]\d{8}$/.test(phone);

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

export function FamilyTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Target Personnel Selection
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");

  // Spouse Birth Date (วัน / เดือนไทย / ปี พ.ศ.)
  const [spouseBirthDay, setSpouseBirthDay] = useState<number>(1);
  const [spouseBirthMonth, setSpouseBirthMonth] = useState<number>(1);
  const [spouseBirthYear, setSpouseBirthYear] = useState<number>(currentBE - 35);

  // Spouse Validation Errors
  const [spouseCitizenIdError, setSpouseCitizenIdError] = useState<string>("");
  const [spousePhoneError, setSpousePhoneError] = useState<string>("");
  const [spouseBankError, setSpouseBankError] = useState<string>("");

  // Spouse State
  const [spouseData, setSpouseData] = useState<SpouseFormState>({
    hasSpouse: false,
    nationalId: "",
    title: "นาง",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    age: 0,
    isAlive: true,
    isLegallyMarried: true,
    marriageCertNumber: "",
    phone: "",
    address: "",
    bankName: "กรุงไทย",
    bankAccountNumber: "",
    hasPensionRights: true,
    allocationPercentage: 50,
  });

  // Children State
  const [childrenList, setChildrenList] = useState<ChildFormState[]>([]);

  // Auto-calculate spouse age & ISO dateOfBirth from Thai date parts
  useEffect(() => {
    if (!isModalOpen || !spouseData.hasSpouse) return;
    const age = calcAgeFromBE(spouseBirthDay, spouseBirthMonth, spouseBirthYear);
    const iso = thaiDateToISO(spouseBirthDay, spouseBirthMonth, spouseBirthYear);
    setSpouseData((prev) => ({
      ...prev,
      age,
      dateOfBirth: iso,
    }));
  }, [spouseBirthDay, spouseBirthMonth, spouseBirthYear, isModalOpen, spouseData.hasSpouse]);

  const fetchPersonnel = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/personnel");
      const json = await res.json();
      if (json.success) {
        setPersonnelList(json.data);
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

  // Check URL query for auto-opening modal with personnel
  useEffect(() => {
    if (typeof window !== "undefined" && personnelList.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const pId = urlParams.get("personnelId");
      if (pId) {
        const found = personnelList.find((p) => p.id === pId);
        if (found) {
          openFamilyModalForPersonnel(found);
        }
      }
    }
  }, [personnelList]);

  // Open modal and load existing family data of selected personnel
  const openFamilyModalForPersonnel = (p: MilitaryPersonnelRecord) => {
    setSelectedPersonnelId(p.id);
    setPersonnelSearchTerm(`${p.rankAbbr} ${p.firstName} ${p.lastName}`);
    setErrorMessage("");
    setSaveSuccess(false);

    setSpouseCitizenIdError("");
    setSpousePhoneError("");
    setSpouseBankError("");

    // Populate Spouse
    if (p.spouse) {
      const parts = (p.spouse.fullName || "").trim().split(" ");
      const title = parts[0] || "นาง";
      const fName = parts[1] || "";
      const lName = parts.slice(2).join(" ") || "";

      const bParts = toThaiDateParts(p.spouse.dateOfBirth);
      const defaultYearBE = p.spouse.age ? currentBE - p.spouse.age : currentBE - 35;
      const bDay = bParts ? bParts.day : 1;
      const bMonth = bParts ? bParts.month : 1;
      const bYear = bParts ? bParts.yearBE : defaultYearBE;

      setSpouseBirthDay(bDay);
      setSpouseBirthMonth(bMonth);
      setSpouseBirthYear(bYear);

      const calculatedAge = bParts ? calcAgeFromBE(bDay, bMonth, bYear) : (p.spouse.age || 35);
      const isoDate = thaiDateToISO(bDay, bMonth, bYear);

      setSpouseData({
        hasSpouse: true,
        nationalId: p.spouse.nationalId || "",
        title: title,
        firstName: fName,
        lastName: lName,
        dateOfBirth: isoDate,
        age: calculatedAge,
        isAlive: true,
        isLegallyMarried: p.spouse.isLegallyMarried ?? true,
        marriageCertNumber: "",
        phone: p.spouse.phone || "",
        address: "",
        bankName: p.spouse.bankName || "กรุงไทย",
        bankAccountNumber: p.spouse.bankAccountNumber || "",
        hasPensionRights: p.spouse.hasPensionRights ?? true,
        allocationPercentage: p.spouse.allocationPercentage || 50,
      });
    } else {
      setSpouseBirthDay(1);
      setSpouseBirthMonth(1);
      setSpouseBirthYear(currentBE - 35);

      setSpouseData({
        hasSpouse: false,
        nationalId: "",
        title: "นาง",
        firstName: "",
        lastName: "",
        dateOfBirth: thaiDateToISO(1, 1, currentBE - 35),
        age: calcAgeFromBE(1, 1, currentBE - 35),
        isAlive: true,
        isLegallyMarried: true,
        marriageCertNumber: "",
        phone: "",
        address: "",
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        hasPensionRights: true,
        allocationPercentage: 50,
      });
    }

    // Populate Children (โควตารวมบุตรชอบด้วยกฎหมาย 25% ทศนิยม 2 หลัก)
    if (p.children && p.children.length > 0) {
      const defaultChildShare = Math.round((25 / p.children.length) * 100) / 100;
      const mapped = p.children.map((c) => {
        const parts = (c.fullName || "").trim().split(" ");
        const title = parts[0] || "ด.ช.";
        const fName = parts[1] || "";
        const lName = parts.slice(2).join(" ") || "";
        
        const bParts = toThaiDateParts(c.dateOfBirth);
        const defaultYearBE = c.age ? currentBE - c.age : currentBE - 8;
        const bDay = bParts ? bParts.day : 1;
        const bMonth = bParts ? bParts.month : 1;
        const bYear = bParts ? bParts.yearBE : defaultYearBE;
        const calculatedAge = bParts ? calcAgeFromBE(bDay, bMonth, bYear) : Number(c.age || 8);
        const isoDate = thaiDateToISO(bDay, bMonth, bYear);

        const cleanDigits = (c.nationalId || "").replace(/\D/g, "").slice(0, 13);
        const formattedId = formatThaiCitizenId(cleanDigits);
        let idError = "";
        if (cleanDigits.length > 0 && cleanDigits.length < 13) {
          idError = `กรอกแล้ว ${cleanDigits.length}/13 หลัก (เฉพาะตัวเลข)`;
        } else if (cleanDigits.length === 13 && !validateThaiCitizenId(cleanDigits)) {
          idError = "เลขบัตรประชาชนไม่ผ่าน check digit";
        }

        // หากบันทึกไว้เดิมเป็น 25 แต่มีบุตรหลายคน หรือยังไม่มีสัดส่วน ให้เกลี่ย 25% ตามจำนวนบุตร
        const existingAlloc = c.allocationPercentage !== undefined && c.allocationPercentage !== null ? Number(c.allocationPercentage) : null;
        const alloc = (existingAlloc !== null && ((p.children?.length ?? 0) === 1 || existingAlloc !== 25))
          ? existingAlloc
          : defaultChildShare;

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
          isAlive: true,
          isStudying: c.isStudying ?? true,
          educationLevel: c.educationLevel || "PRIMARY",
          phone: "",
          scholarshipEligible: c.isStudying ?? true,
          annualScholarship: c.educationLevel === "BACHELOR" ? 35000 : 15000,
          hasSuccessorRight: calculatedAge >= 18 && calculatedAge <= 35,
          allocationPercentage: alloc,
        };
      });
      setChildrenList(mapped);
    } else {
      setChildrenList([]);
    }

    setIsModalOpen(true);
  };

  // แบ่งสัดส่วนบุตร 25% เฉลี่ยเท่ากันทุกคน เป็นทศนิยม 2 หลัก (เช่น 2 คน = คนละ 12.50%)
  const distributeChildrenAllocation = (list: ChildFormState[]): ChildFormState[] => {
    if (list.length === 0) return [];
    const share = Math.round((25 / list.length) * 100) / 100;
    return list.map((c) => ({
      ...c,
      allocationPercentage: share,
    }));
  };

  // Add a blank child and re-balance 25% share
  const handleAddChild = () => {
    const defaultAge = 8;
    const defaultYearBE = currentBE - defaultAge;
    setChildrenList((prev) => {
      const newList = [
        ...prev,
        {
          nationalId: "",
          nationalIdError: "",
          title: "ด.ช.",
          firstName: "",
          lastName: "",
          birthDay: 1,
          birthMonth: 1,
          birthYearBE: defaultYearBE,
          dateOfBirth: thaiDateToISO(1, 1, defaultYearBE),
          age: defaultAge,
          isAlive: true,
          isStudying: true,
          educationLevel: "PRIMARY",
          phone: "",
          scholarshipEligible: true,
          annualScholarship: 15000,
          hasSuccessorRight: false,
          allocationPercentage: 0,
        },
      ];
      return distributeChildrenAllocation(newList);
    });
  };

  const handleRemoveChild = (index: number) => {
    setChildrenList((prev) => {
      const remaining = prev.filter((_, i) => i !== index);
      return distributeChildrenAllocation(remaining);
    });
  };

  const handleChildBirthDateChange = (index: number, part: "day" | "month" | "yearBE", value: number) => {
    setChildrenList((prev) => {
      const updated = [...prev];
      const cur = updated[index];
      const bDay = part === "day" ? value : (cur.birthDay || 1);
      const bMonth = part === "month" ? value : (cur.birthMonth || 1);
      const bYear = part === "yearBE" ? value : (cur.birthYearBE || currentBE - (cur.age || 8));

      const calculatedAge = calcAgeFromBE(bDay, bMonth, bYear);
      const isoDate = thaiDateToISO(bDay, bMonth, bYear);

      updated[index] = {
        ...cur,
        birthDay: bDay,
        birthMonth: bMonth,
        birthYearBE: bYear,
        dateOfBirth: isoDate,
        age: calculatedAge,
        hasSuccessorRight: calculatedAge >= 18 && calculatedAge <= 35,
      };
      return updated;
    });
  };

  const handleChildNationalIdChange = (index: number, rawVal: string) => {
    const cleanDigits = rawVal.replace(/\D/g, "").slice(0, 13);
    const formatted = formatThaiCitizenId(cleanDigits);

    let error = "";
    if (cleanDigits.length > 0 && cleanDigits.length < 13) {
      error = `กรอกแล้ว ${cleanDigits.length}/13 หลัก (เฉพาะตัวเลข)`;
    } else if (cleanDigits.length === 13) {
      if (!validateThaiCitizenId(cleanDigits)) {
        error = "เลขบัตรประชาชนไม่ผ่าน check digit";
      }
    }

    setChildrenList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        nationalId: formatted,
        nationalIdError: error,
      };
      return updated;
    });
  };

  const handleChildChange = (index: number, field: keyof ChildFormState, value: any) => {
    setChildrenList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "educationLevel") {
        if (value === "BACHELOR") updated[index].annualScholarship = 35000;
        else if (value === "VOCATIONAL") updated[index].annualScholarship = 20000;
        else if (value === "SECONDARY") updated[index].annualScholarship = 15000;
        else updated[index].annualScholarship = 12000;
      }

      return updated;
    });
  };

  const handleSaveFamily = async () => {
    if (!selectedPersonnelId) {
      setErrorMessage("กรุณาเลือกกำลังพลที่ต้องการบันทึกข้อมูลครอบครัว");
      return;
    }

    if (spouseData.hasSpouse) {
      let hasError = false;
      if (!spouseData.firstName.trim() || !spouseData.lastName.trim()) {
        setErrorMessage("กรุณาระบุชื่อและนามสกุลของคู่สมรส");
        return;
      }
      if (spouseData.nationalId) {
        if (!validateThaiCitizenId(spouseData.nationalId)) {
          setSpouseCitizenIdError("เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลัก และ Check Digit ถูกต้อง)");
          hasError = true;
        } else {
          setSpouseCitizenIdError("");
        }
      }
      if (spouseData.phone) {
        if (!validateMobilePhone(spouseData.phone)) {
          setSpousePhoneError("เบอร์โทรไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก เริ่มต้นด้วย 06, 08 หรือ 09)");
          hasError = true;
        } else {
          setSpousePhoneError("");
        }
      }
      if (spouseData.bankAccountNumber) {
        if (!/^\d{10,15}$/.test(spouseData.bankAccountNumber)) {
          setSpouseBankError("หมายเลขบัญชีธนาคารต้องเป็นตัวเลข 10-15 หลัก");
          hasError = true;
        } else {
          setSpouseBankError("");
        }
      }
      if (hasError) {
        setErrorMessage("กรุณาตรวจสอบข้อมูลคู่สมรสให้ถูกต้องก่อนบันทึก");
        return;
      }
    }

    // Validate Children
    for (let i = 0; i < childrenList.length; i++) {
      const c = childrenList[i];
      if (!c.firstName.trim() || !c.lastName.trim()) {
        setErrorMessage(`บุตรคนที่ ${i + 1}: กรุณาระบุชื่อและนามสกุล`);
        return;
      }
      const cleanDigits = (c.nationalId || "").replace(/\D/g, "");
      if (cleanDigits.length > 0) {
        if (cleanDigits.length !== 13 || !validateThaiCitizenId(cleanDigits)) {
          setErrorMessage(`บุตรคนที่ ${i + 1}: เลขบัตรประชาชนไม่ถูกต้อง (ต้องเป็นตัวเลข 13 หลักและผ่าน Check Digit)`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        spouse: spouseData.hasSpouse
          ? {
            nationalId: spouseData.nationalId,
            title: spouseData.title,
            firstName: spouseData.firstName,
            lastName: spouseData.lastName,
            dateOfBirth: spouseData.dateOfBirth || undefined,
            age: Number(spouseData.age || 0),
            isAlive: spouseData.isAlive,
            isLegallyMarried: spouseData.isLegallyMarried,
            marriageCertNumber: spouseData.marriageCertNumber,
            phone: spouseData.phone,
            address: spouseData.address,
            bankName: spouseData.bankName,
            bankAccountNumber: spouseData.bankAccountNumber,
            hasPensionRights: spouseData.hasPensionRights,
            allocationPercentage: Number(Number(spouseData.allocationPercentage ?? 50).toFixed(2)),
          }
          : null,
        children: childrenList.map((c) => ({
          nationalId: (c.nationalId || "").replace(/\D/g, ""),
          title: c.title,
          firstName: c.firstName,
          lastName: c.lastName,
          dateOfBirth: c.dateOfBirth || undefined,
          age: Number(c.age || 0),
          isAlive: c.isAlive,
          isStudying: c.isStudying,
          educationLevel: c.educationLevel,
          phone: c.phone,
          scholarshipEligible: c.scholarshipEligible,
          annualScholarship: Number(c.annualScholarship || 0),
          hasSuccessorRight: c.hasSuccessorRight,
          allocationPercentage: Number(
            Number(
              c.allocationPercentage !== undefined
                ? c.allocationPercentage
                : Math.round((25 / Math.max(1, childrenList.length)) * 100) / 100
            ).toFixed(2)
          ),
        })),
      };

      const res = await fetch(`/api/personnel/${selectedPersonnelId}/family`, {
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
  const filtered = personnelList.filter((p) => {
    return (
      search === "" ||
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.militaryId.toLowerCase().includes(search.toLowerCase()) ||
      (p.spouse && p.spouse.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (p.children && p.children.some((c) => c.fullName.toLowerCase().includes(search.toLowerCase())))
    );
  });

  // ── Pagination State (แสดงหน้าละ 4 แถว/รายการ พร้อม pagination นำไปหน้าและย้อนหลัง) ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [viewMode, setViewMode] = useState<"row" | "grid">("row");

  // รีเซ็ตหน้ากลับเป็นหน้า 1 เสมอเมื่อมีการค้นหาหรือเปลี่ยนขนาดหน้า
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

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

  // Filter Personnel for Modal Search
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ข้อมูลครอบครัวกำลังพล (Family Information - Tab 3)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            บันทึกข้อมูลคู่สมรสจดทะเบียน บุตรในอุปการะ สิทธิทุนการศึกษา และคุณสมบัติทายาทบรรจุทดแทน
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm"
            onClick={() => {
              if (personnelList.length > 0) {
                openFamilyModalForPersonnel(personnelList[0]);
              } else {
                setIsModalOpen(true);
              }
            }}
          >
            <UserPlus className="h-4 w-4" />
            บันทึกข้อมูลครอบครัวใหม่
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

        <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-100/70 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200">
          <div className="h-6 w-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <div className="truncate">
            <p className="font-bold truncate">Tab 3: ครอบครัว (ใช้งาน)</p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 truncate">คู่สมรส, บุตร</p>
          </div>
        </div>

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

      {/* Search & Layout Controls Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อกำลังพล, เลขประจำตัวทหาร, คู่สมรส, หรือบุตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end text-xs">
          <div className="text-muted-foreground hidden md:block">
            พบข้อมูลครอบครัว <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> นาย
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              size="sm"
              variant={viewMode === "row" ? "default" : "ghost"}
              className={`h-7 px-2.5 text-[11px] gap-1 ${viewMode === "row" ? "bg-purple-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("row")}
              title="แสดงผลแบบ 4 แถวต่อหน้า (แนวนอนเต็มพื้นที่)"
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>4 แถว</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
              className={`h-7 px-2.5 text-[11px] gap-1 ${viewMode === "grid" ? "bg-purple-600 text-white" : "text-muted-foreground hover:text-foreground"}`}
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

      {/* Family Cards Container */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            กำลังโหลดข้อมูลครอบครัว...
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            ไม่พบข้อมูลครอบครัวตามคำค้นหา
          </div>
        ) : viewMode === "row" ? (
          /* ── 4 แถวต่อหน้า (Horizontal Row Cards) ── */
          <div className="space-y-3.5">
            {paginatedList.map((p) => {
              const hasSuccessor = p.children?.some((c) => c.age >= 18 && c.age <= 35);
              const totalAllocation =
                (p.spouse?.allocationPercentage || 0) +
                (p.children?.reduce((sum, c) => sum + (c.allocationPercentage || 0), 0) || 0);
              const totalScholarship =
                p.children?.reduce((sum, c) => {
                  if (!c.isStudying) return sum;
                  if (c.annualScholarship) return sum + c.annualScholarship;
                  if (c.educationLevel === "BACHELOR") return sum + 35000;
                  if (c.educationLevel === "VOCATIONAL") return sum + 20000;
                  if (c.educationLevel === "SECONDARY") return sum + 15000;
                  return sum + 12000;
                }, 0) || 0;

              return (
                <Card
                  key={p.id}
                  className="border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-purple-400/50 hover:shadow-sm transition-all p-4 rounded-2xl bg-white dark:bg-slate-900"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                    {/* ส่วนที่ 1: ข้อมูลกำลังพล (lg:col-span-3) */}
                    <div className="lg:col-span-3 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-3 lg:pb-0 lg:pr-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                            {p.militaryId}
                          </span>
                          {p.spouse ? (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900 text-[10px]">
                              มีคู่สมรส
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              โสด
                            </Badge>
                          )}
                          {p.children && p.children.length > 0 ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px]">
                              บุตร {p.children.length} คน
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              ไม่มีบุตร
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {p.rankAbbr} {p.firstName} {p.lastName}
                          </h3>
                          <p className="text-xs text-muted-foreground">{p.normalUnit}</p>
                          <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                            เลขบัตร: {formatNationalId(p.citizenId)}
                          </p>
                        </div>

                        {/* สรุปสิทธิบำเหน็จตกทอดรวม */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">สิทธิบำเหน็จตกทอดรวม:</span>
                            <span className={`font-bold ${Math.abs(totalAllocation - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                              {totalAllocation.toFixed(2)}%
                            </span>
                          </div>
                          {totalScholarship > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">ทุนการศึกษาบุตรรวม:</span>
                              <span className="font-bold text-blue-600">฿{totalScholarship.toLocaleString()}/ปี</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2.5 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 flex-1"
                          onClick={() => openFamilyModalForPersonnel(p)}
                        >
                          <Edit className="h-3 w-3" />
                          แก้ไข (Tab 3)
                        </Button>
                        <Link href={`/heirs?personnelId=${p.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] px-2 gap-1 text-blue-600 hover:bg-blue-50"
                            title="ไปยังข้อมูลทายาท (Tab 4)"
                          >
                            <HeartHandshake className="h-3.5 w-3.5" />
                            Tab 4
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* ส่วนที่ 2: ข้อมูลคู่สมรส (lg:col-span-4) */}
                    <div className="lg:col-span-4 p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                          คู่สมรสตามกฎหมาย
                        </span>
                        <div className="flex items-center gap-1">
                          {p.spouse ? (
                            <>
                              {p.spouse.isLegallyMarried ? (
                                <Badge className="bg-purple-600 text-white text-[9px]">จดทะเบียนสมรส</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[9px]">ไม่ได้จดทะเบียน</Badge>
                              )}
                              {p.spouse.isAlive ? (
                                <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[9px]">มีชีวิต</Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-300 text-[9px]">ถึงแก่กรรม</Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-[9px]">ไม่มีข้อมูลคู่สมรส</Badge>
                          )}
                        </div>
                      </div>

                      {p.spouse ? (
                        <div className="text-xs space-y-1 pt-0.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.spouse.fullName} {p.spouse.age ? `(อายุ ${p.spouse.age} ปี)` : ""}
                            {p.spouse.dateOfBirth && (
                              <span className="text-[10px] text-muted-foreground font-normal ml-1.5">
                                • เกิด {formatThaiBE(p.spouse.dateOfBirth)}
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            เลขบัตร: {formatNationalId(p.spouse.nationalId)} {p.spouse.phone ? `| โทร: ${p.spouse.phone}` : ""}
                          </p>
                          {p.spouse.bankAccountNumber && (
                            <p className="text-[10px] text-muted-foreground">
                              บัญชี: {p.spouse.bankName ? `${p.spouse.bankName} ` : ""}{p.spouse.bankAccountNumber}
                            </p>
                          )}
                          {p.spouse.marriageCertNumber && (
                            <p className="text-[10px] text-muted-foreground">
                              ทะเบียนสมรส: {p.spouse.marriageCertNumber}
                            </p>
                          )}
                          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold pt-0.5">
                            สิทธิจัดสรรบำเหน็จตกทอด: {Number(p.spouse.allocationPercentage ?? 50).toFixed(2)}%
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-4">โสด / ยังไม่ได้บันทึกข้อมูลคู่สมรส</p>
                      )}
                    </div>

                    {/* ส่วนที่ 3: ข้อมูลบุตรในอุปการะ (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                          บุตรในอุปการะ ({p.children?.length || 0} คน)
                        </span>
                        {hasSuccessor && (
                          <Badge className="bg-emerald-600 text-white text-[9px] gap-1">
                            <UserCheck className="h-3 w-3" />
                            มีเกณฑ์บรรจุทดแทน (18-35 ปี)
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {p.children && p.children.length > 0 ? (
                          p.children.map((child, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs space-y-0.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {child.fullName} (อายุ {child.age} ปี)
                                </span>
                                <div className="flex items-center gap-1">
                                  {child.age >= 18 && child.age <= 35 && (
                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[8px] px-1 py-0">
                                      บรรจุทดแทน
                                    </Badge>
                                  )}
                                  {child.isStudying ? (
                                    <Badge className="bg-blue-600 text-white text-[8px] px-1 py-0">
                                      ทุน {child.educationLevel === "BACHELOR" ? "฿35,000" : child.educationLevel === "VOCATIONAL" ? "฿20,000" : child.educationLevel === "SECONDARY" ? "฿15,000" : "฿12,000"}/ปี
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0">จบแล้ว</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                <span>{child.nationalId ? `เลขบัตร: ${formatNationalId(child.nationalId)}` : ""}</span>
                                <span className="font-sans">
                                  {child.educationLevel === "BACHELOR" ? "ป.ตรี" : child.educationLevel === "VOCATIONAL" ? "อาชีวะ" : child.educationLevel === "SECONDARY" ? "มัธยม" : "ประถม"}
                                  {child.allocationPercentage !== undefined && child.allocationPercentage !== null ? ` • สิทธิ ${Number(child.allocationPercentage).toFixed(2)}%` : ""}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic py-4 text-center">ไม่มีบุตร / ยังไม่ได้บันทึกข้อมูลบุตร</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ── การ์ดคู่ (2 Columns Grid) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedList.map((p) => {
              const hasSuccessor = p.children?.some((c) => c.age >= 18 && c.age <= 35);
              const totalAllocation =
                (p.spouse?.allocationPercentage || 0) +
                (p.children?.reduce((sum, c) => sum + (c.allocationPercentage || 0), 0) || 0);

              return (
                <Card
                  key={p.id}
                  className="border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition-all space-y-3.5 p-4 rounded-2xl"
                >
                  {/* Personnel Top Line */}
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                          {p.militaryId}
                        </span>
                        {p.spouse ? (
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 text-[9px]">มีคู่สมรส</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">โสด</Badge>
                        )}
                        {p.children && p.children.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[9px]">บุตร {p.children.length} คน</Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {p.rankAbbr} {p.firstName} {p.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{p.normalUnit}</p>
                      <p className="font-mono text-[10px] text-slate-500">เลขบัตร: {formatNationalId(p.citizenId)}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => openFamilyModalForPersonnel(p)}
                      >
                        <Edit className="h-3 w-3" />
                        แก้ไข
                      </Button>
                      <Link href={`/heirs?personnelId=${p.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] px-2 gap-1 text-blue-600 hover:bg-blue-50"
                          title="ไปยังข้อมูลทายาท (Tab 4)"
                        >
                          <HeartHandshake className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Spouse Section */}
                  <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                        คู่สมรสตามกฎหมาย
                      </span>
                      {p.spouse ? (
                        <Badge className="bg-purple-600 text-white text-[8px]">จดทะเบียนสมรส</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[8px]">ไม่มีคู่สมรส</Badge>
                      )}
                    </div>
                    {p.spouse ? (
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.spouse.fullName} {p.spouse.age ? `(อายุ ${p.spouse.age} ปี)` : ""}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          เลขบัตร: {formatNationalId(p.spouse.nationalId)} {p.spouse.phone ? `| โทร: ${p.spouse.phone}` : ""}
                        </p>
                        {p.spouse.bankAccountNumber && (
                          <p className="text-[10px] text-muted-foreground">
                            บัญชี: {p.spouse.bankName ? `${p.spouse.bankName} ` : ""}{p.spouse.bankAccountNumber}
                          </p>
                        )}
                        <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                          สิทธิบำเหน็จตกทอด: {Number(p.spouse.allocationPercentage ?? 50).toFixed(2)}%
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic py-1">โสด / ยังไม่ได้บันทึกข้อมูลคู่สมรส</p>
                    )}
                  </div>

                  {/* Children Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                        บุตรในอุปการะ ({p.children?.length || 0} คน)
                      </span>
                      {hasSuccessor && (
                        <Badge className="bg-emerald-600 text-white text-[8px] gap-1">
                          <UserCheck className="h-2.5 w-2.5" />
                          เกณฑ์บรรจุทดแทน
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 max-h-[120px] overflow-y-auto pr-0.5">
                      {p.children && p.children.length > 0 ? (
                        p.children.map((child, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <span className="font-medium text-[11px]">
                                {child.fullName} (อายุ {child.age} ปี)
                                {child.allocationPercentage !== undefined && child.allocationPercentage !== null && (
                                  <span className="text-[9px] text-purple-600 font-semibold ml-1">
                                    • {Number(child.allocationPercentage).toFixed(2)}%
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-muted-foreground block font-mono">
                                {child.nationalId ? `${formatNationalId(child.nationalId)} ` : ""}
                              </span>
                            </div>
                            <div className="text-right">
                              {child.isStudying ? (
                                <Badge className="bg-blue-600 text-white text-[8px]">
                                  ทุน {child.educationLevel === "BACHELOR" ? "฿35k" : "฿12-15k"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px]">จบแล้ว</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-muted-foreground p-1 text-center">ไม่มีบุตร</p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-muted-foreground">
                      สิทธิรวม: <strong className={Math.abs(totalAllocation - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"}>{totalAllocation.toFixed(2)}%</strong>
                    </span>
                    <Link href={`/heirs?personnelId=${p.id}`} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                      จัดสรรทายาท (Tab 4) <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls (4 แถวต่อหน้า มี pagination หน้า-ก่อนหลัง) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-xs">
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
                        ? "bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
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
      )}

      {/* Record / Edit Family Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
                <Users2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg font-bold">
                บันทึกและแก้ไขข้อมูลครอบครัวกำลังพล (Tab 3)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              ค้นหากำลังพลเพื่อบันทึกข้อมูลคู่สมรสจดทะเบียน บุตรในอุปการะ และสิทธิทุนการศึกษา
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* Section 1: Personnel Search / Select */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 space-y-3">
              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                1. เลือกกำลังพลที่ต้องการบันทึกข้อมูลครอบครัว
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
                      if (p) openFamilyModalForPersonnel(p);
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
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {selectedPersonnelRecord.rankAbbr} {selectedPersonnelRecord.firstName} {selectedPersonnelRecord.lastName}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-2">
                      สังกัด: {selectedPersonnelRecord.normalUnit}
                    </span>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px]">
                    {selectedPersonnelRecord.militaryId}
                  </Badge>
                </div>
              )}
            </div>

            {/* Section 2: Spouse Information */}
            <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/30 dark:border-purple-900/50 dark:bg-purple-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/50 pb-2">
                <Label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-purple-600 fill-purple-600" />
                  2. ข้อมูลคู่สมรสตามกฎหมาย (Spouse)
                </Label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spouseData.hasSpouse}
                    onChange={(e) => setSpouseData((prev) => ({ ...prev, hasSpouse: e.target.checked }))}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    มีคู่สมรสตามกฎหมาย
                  </span>
                </label>
              </div>

              {spouseData.hasSpouse ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">คำนำหน้า</Label>
                    <Input
                      value={spouseData.title}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="นาง / นางสาว"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ชื่อคู่สมรส</Label>
                    <Input
                      value={spouseData.firstName}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="ชื่อ"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">นามสกุล</Label>
                    <Input
                      value={spouseData.lastName}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="นามสกุล"
                      className="h-8 text-xs"
                    />
                  </div>
                  {/* ── 1. เลขบัตรประชาชน 13 หลัก (ให้กรอกได้แค่ตัวเลข 13หลักตามรูปแบบบัตร ปชช.) ── */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">เลขบัตรประชาชน 13 หลัก (เฉพาะตัวเลข) <span className="text-red-500">*</span></Label>
                    <Input
                      value={spouseData.nationalId}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                        setSpouseData((prev) => ({ ...prev, nationalId: v }));
                        if (v.length === 13) {
                          setSpouseCitizenIdError(validateThaiCitizenId(v) ? "" : "เลขบัตรประชาชนไม่ผ่าน check digit");
                        } else if (v.length > 0) {
                          setSpouseCitizenIdError(`กรอกแล้ว ${v.length}/13 หลัก (เฉพาะตัวเลขเท่านั้น)`);
                        } else {
                          setSpouseCitizenIdError("");
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
                      maxLength={13}
                      placeholder="0000000000000"
                      className={`h-8 text-xs font-mono ${spouseCitizenIdError ? "border-red-400 focus:ring-red-400" : spouseData.nationalId.length === 13 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                    />
                    {spouseCitizenIdError && <p className="text-[10px] text-red-500 mt-0.5">{spouseCitizenIdError}</p>}
                    {!spouseCitizenIdError && spouseData.nationalId.length === 13 && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">✓ เลขบัตรประชาชนถูกต้อง</p>
                    )}
                  </div>

                  {/* ── 4. เบอร์โทรศัพท์ (กรอกตัวเลข 10หลักตามรูปแบบเบอร์มือถือ) ── */}
                  <div className="space-y-1">
                    <Label className="text-xs">เบอร์โทรศัพท์มือถือ 10 หลัก</Label>
                    <Input
                      value={spouseData.phone}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setSpouseData((prev) => ({ ...prev, phone: v }));
                        if (v.length === 10) {
                          setSpousePhoneError(validateMobilePhone(v) ? "" : "เบอร์ต้องขึ้นต้นด้วย 06, 08 หรือ 09");
                        } else if (v.length > 0) {
                          setSpousePhoneError(`กรอกแล้ว ${v.length}/10 หลัก (เฉพาะตัวเลข)`);
                        } else {
                          setSpousePhoneError("");
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
                      maxLength={10}
                      placeholder="08XXXXXXXX"
                      className={`h-8 text-xs font-mono ${spousePhoneError ? "border-red-400 focus:ring-red-400" : spouseData.phone.length === 10 ? "border-emerald-400 focus:ring-emerald-400" : ""}`}
                    />
                    {spousePhoneError && <p className="text-[10px] text-red-500 mt-0.5">{spousePhoneError}</p>}
                    {!spousePhoneError && spouseData.phone.length === 10 && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">✓ เบอร์โทรถูกต้อง</p>
                    )}
                  </div>

                  {/* ── 2. วัน/เดือน/ปี เกิด (แบบ date picker เดือนไทย ปีแบบ พ.ศ.) ── */}
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">วัน/เดือน/ปี เกิด (วัน / เดือนไทย / ปี พ.ศ.)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={spouseBirthDay}
                        onChange={(e) => setSpouseBirthDay(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={spouseBirthMonth}
                        onChange={(e) => setSpouseBirthMonth(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {THAI_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={spouseBirthYear}
                        onChange={(e) => setSpouseBirthYear(Number(e.target.value))}
                        className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {BE_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── 3. อายุ (คำนวณอัตโนมัติจากวันเกิด) ── */}
                  <div className="space-y-1">
                    <Label className="text-xs">อายุ (คำนวณอัตโนมัติ)</Label>
                    <Input
                      type="number"
                      value={spouseData.age}
                      readOnly
                      className="h-8 text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-bold"
                    />
                    <p className="text-[10px] text-muted-foreground">คำนวณจากวันเกิดที่เลือก</p>
                  </div>

                  {/* สถานะการสมรส */}
                  <div className="space-y-1">
                    <Label className="text-xs">สถานะการสมรส</Label>
                    <select
                      value={spouseData.isLegallyMarried ? "YES" : "NO"}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, isLegallyMarried: e.target.value === "YES" }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="YES">จดทะเบียนสมรสตามกฎหมาย</option>
                      <option value="NO">ไม่ได้จดทะเบียนสมรส</option>
                    </select>
                  </div>

                  {/* สิทธิบำเหน็จตกทอด (%) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">สิทธิบำเหน็จตกทอด (%)</Label>
                      <span className="text-[10px] text-purple-700 font-mono font-bold">
                        {Number(spouseData.allocationPercentage || 0).toFixed(2)}%
                      </span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={spouseData.allocationPercentage}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, allocationPercentage: parseFloat(e.target.value) || 0 }))}
                      className="h-8 text-xs font-bold text-purple-700"
                    />
                  </div>

                  {/* สถานะการมีชีวิต */}
                  <div className="space-y-1">
                    <Label className="text-xs">สถานะการมีชีวิต</Label>
                    <select
                      value={spouseData.isAlive ? "ALIVE" : "DECEASED"}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, isAlive: e.target.value === "ALIVE" }))}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="ALIVE">มีชีวิต</option>
                      <option value="DECEASED">ถึงแก่กรรม</option>
                    </select>
                  </div>

                  {/* ── 5. ช่องเลขบัญชี (ให้กรอกได้แค่ตัวเลข 15 หลัก) ── */}
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">ธนาคาร & เลขที่บัญชีสำหรับรับเงิน (เฉพาะตัวเลข สูงสุด 15 หลัก)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        value={spouseData.bankName}
                        onChange={(e) => setSpouseData((prev) => ({ ...prev, bankName: e.target.value }))}
                        placeholder="ธนาคาร เช่น กรุงไทย"
                        className="h-8 text-xs"
                      />
                      <div className="sm:col-span-2 space-y-1">
                        <Input
                          value={spouseData.bankAccountNumber}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 15);
                            setSpouseData((prev) => ({ ...prev, bankAccountNumber: v }));
                            if (v.length > 0 && v.length < 10) {
                              setSpouseBankError(`กรอกแล้ว ${v.length}/15 หลัก (เลขบัญชีควรมี 10-15 หลัก)`);
                            } else {
                              setSpouseBankError("");
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
                          maxLength={15}
                          placeholder="เลขที่บัญชีธนาคาร (เฉพาะตัวเลข สูงสุด 15 หลัก)"
                          className={`h-8 text-xs font-mono ${spouseBankError ? "border-amber-400 focus:ring-amber-400" : ""}`}
                        />
                        {spouseBankError && <p className="text-[10px] text-amber-600 mt-0.5">{spouseBankError}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  กำลังพลไม่มีคู่สมรส หรือยังไม่ได้ระบุข้อมูลคู่สมรส
                </p>
              )}
            </div>

            {/* Section 3: Children Information */}
            <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-blue-100 dark:border-blue-900/50 pb-2 gap-2">
                <div>
                  <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    3. ข้อมูลบุตรในอุปการะ ({childrenList.length} คน)
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    สัดส่วนบุตรชอบด้วยกฎหมายรวม 25% (หารเฉลี่ยทศนิยม 2 หลัก เช่น 2 คน = คนละ 12.50%)
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {childrenList.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => setChildrenList((prev) => distributeChildrenAllocation(prev))}
                      className="h-7 text-[11px] gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
                      title="แบ่งสัดส่วนบุตร 25% เฉลี่ยเท่ากันทุกคนเป็นทศนิยม 2 หลัก"
                    >
                      แบ่ง 25% เท่ากัน ({childrenList.length} คน = คนละ {(25 / childrenList.length).toFixed(2)}%)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddChild}
                    className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มบุตร
                  </Button>
                </div>
              </div>

              {childrenList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground space-y-2">
                  <p className="text-xs">ยังไม่มีรายการบุตรในอุปการะ</p>
                  <Button size="sm" variant="outline" onClick={handleAddChild} className="text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    กดเพิ่มข้อมูลบุตรคนแรก
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {childrenList.map((child, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          บุตรคนที่ {index + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {child.hasSuccessorRight && (
                            <Badge className="bg-emerald-600 text-white text-[9px] gap-1">
                              <UserCheck className="h-3 w-3" />
                              เกณฑ์บรรจุทดแทน (18-35 ปี)
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveChild(index)}
                            className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        {/* คำนำหน้า */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px]">คำนำหน้า</Label>
                          <Input
                            value={child.title}
                            onChange={(e) => handleChildChange(index, "title", e.target.value)}
                            placeholder="ด.ช. / ด.ญ. / นาย / น.ส."
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* ชื่อบุตร */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">ชื่อบุตร <span className="text-red-500">*</span></Label>
                          <Input
                            value={child.firstName}
                            onChange={(e) => handleChildChange(index, "firstName", e.target.value)}
                            placeholder="ชื่อ"
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* นามสกุล */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">นามสกุล <span className="text-red-500">*</span></Label>
                          <Input
                            value={child.lastName}
                            onChange={(e) => handleChildChange(index, "lastName", e.target.value)}
                            placeholder="นามสกุล"
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* เลขบัตร ปชช. 13 หลัก */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">เลขบัตร ปชช. 13 หลัก (รูปแบบบัตร ปชช.)</Label>
                          <Input
                            value={child.nationalId}
                            onChange={(e) => handleChildNationalIdChange(index, e.target.value)}
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
                              child.nationalIdError
                                ? "border-red-400 focus:ring-red-400"
                                : child.nationalId && child.nationalId.replace(/\D/g, "").length === 13
                                ? "border-emerald-400 focus:ring-emerald-400"
                                : ""
                            }`}
                          />
                          {child.nationalIdError && (
                            <p className="text-[10px] text-red-500 mt-0.5">{child.nationalIdError}</p>
                          )}
                          {!child.nationalIdError && child.nationalId && child.nationalId.replace(/\D/g, "").length === 13 && (
                            <p className="text-[10px] text-emerald-600 mt-0.5">✓ เลขบัตรประชาชนถูกต้อง</p>
                          )}
                        </div>

                        {/* วัน/เดือน/ปี เกิด (วัน / เดือนไทย / ปี พ.ศ.) */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px]">วัน/เดือน/ปี เกิด (วัน / เดือนไทย / ปี พ.ศ.)</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            <select
                              value={child.birthDay || 1}
                              onChange={(e) => handleChildBirthDateChange(index, "day", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                            <select
                              value={child.birthMonth || 1}
                              onChange={(e) => handleChildBirthDateChange(index, "month", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                            >
                              {THAI_MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            <select
                              value={child.birthYearBE || currentBE - (child.age || 8)}
                              onChange={(e) => handleChildBirthDateChange(index, "yearBE", Number(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                            >
                              {BE_YEARS.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* อายุ (คำนวณอัตโนมัติ) */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px]">อายุ (คำนวณอัตโนมัติ)</Label>
                          <Input
                            type="number"
                            value={child.age}
                            readOnly
                            className="h-8 text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-bold"
                          />
                          <p className="text-[9px] text-muted-foreground mt-0.5">คำนวณจากวันเกิด</p>
                        </div>

                        {/* สิทธิบำเหน็จตกทอด (%) ทศนิยม 2 หลัก เช่น 12.50% */}
                        <div className="sm:col-span-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px]">สิทธิบำเหน็จตกทอด (%)</Label>
                            <span className="text-[10px] text-purple-700 font-mono font-bold">
                              {Number(child.allocationPercentage || 0).toFixed(2)}%
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={child.allocationPercentage !== undefined ? child.allocationPercentage : ""}
                            onChange={(e) => handleChildChange(index, "allocationPercentage", parseFloat(e.target.value) || 0)}
                            placeholder="12.50"
                            className="h-8 text-xs font-bold text-purple-700"
                          />
                          <p className="text-[9px] text-muted-foreground mt-0.5">ทศนิยม 2 หลัก (โควตารวม 25%)</p>
                        </div>

                        {/* สถานะการศึกษา */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px]">สถานะการศึกษา</Label>
                          <select
                            value={child.isStudying ? "STUDYING" : "NOT_STUDYING"}
                            onChange={(e) => handleChildChange(index, "isStudying", e.target.value === "STUDYING")}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="STUDYING">กำลังศึกษาอยู่ (มีสิทธิรับทุน)</option>
                            <option value="NOT_STUDYING">ไม่ได้ศึกษา / จบแล้ว</option>
                          </select>
                        </div>

                        {/* ระดับชั้นการศึกษา */}
                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px]">ระดับชั้นการศึกษา</Label>
                          <select
                            value={child.educationLevel}
                            onChange={(e) => handleChildChange(index, "educationLevel", e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="PRIMARY">ประถมศึกษา (ทุน ฿12,000/ปี)</option>
                            <option value="SECONDARY">มัธยมศึกษา (ทุน ฿15,000/ปี)</option>
                            <option value="VOCATIONAL">อาชีวศึกษา / ปวช. / ปวส. (ทุน ฿20,000/ปี)</option>
                            <option value="BACHELOR">อุดมศึกษา / ปริญญาตรี (ทุน ฿35,000/ปี)</option>
                            <option value="OTHER">อื่นๆ</option>
                          </select>
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
                  <span>บันทึกข้อมูลครอบครัวสำเร็จเรียบร้อยแล้ว</span>
                </div>
                {selectedPersonnelId && (
                  <Link href={`/heirs?personnelId=${selectedPersonnelId}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 gap-1">
                      ไปยัง Tab 4: บันทึกข้อมูลทายาท <ArrowRight className="h-3 w-3" />
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
              onClick={handleSaveFamily}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลครอบครัว"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
