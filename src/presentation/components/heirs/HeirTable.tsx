"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { HeirValidation } from "@/core/validation/HeirValidation";
import { FamilyValidation } from "@/core/validation/FamilyValidation";

export interface HeirFormState {
  nationalId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  relationship: string;
  phone: string;
  address: string;
  isAlive: boolean;
  bankName: string;
  bankAccountNumber: string;
  allocationPercentage: number;
  isDesignatedSuccessor: boolean;
  documentsVerified: boolean;
  // Additional optional fields for blood relatives (siblings, cousins, etc.)
  isBloodRelative?: boolean;
  familyConnection?: string; // e.g., "ELDER_BROTHER", "YOUNGER_SISTER"
}


export function HeirTable() {
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

  // Heirs Form State
  const [heirsList, setHeirsList] = useState<HeirFormState[]>([]);

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
        const parts = (h.fullName || "").trim().split(" ");
        const title = parts[0] || "นาย";
        const fName = parts[1] || "";
        const lName = parts.slice(2).join(" ") || "";
        return {
          nationalId: h.nationalId || "",
          title,
          firstName: fName,
          lastName: lName,
          dateOfBirth: "",
          age: 40,
          relationship: h.relationship || "OTHER_HEIR",
          phone: "",
          address: "",
          isAlive: true,
          bankName: "กรุงไทย",
          bankAccountNumber: "",
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
      generated.push({
        nationalId: p.spouse.nationalId || "",
        title: parts[0] || "นาง",
        firstName: parts[1] || "",
        lastName: parts.slice(2).join(" ") || "",
        dateOfBirth: "",
        age: 35,
        relationship: "SPOUSE_LEGAL",
        phone: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        allocationPercentage: p.spouse.allocationPercentage || 50,
        isDesignatedSuccessor: false,
        documentsVerified: true,
        isBloodRelative: false,
        familyConnection: "SPOUSE",
      });
    }

    // Add Children if exists
    if (p.children && p.children.length > 0) {
      const childAllocation = Math.floor(25 / p.children.length);
      p.children.forEach((c) => {
        const parts = (c.fullName || "").trim().split(" ");
        const age = Number(c.age || 0);
        generated.push({
          nationalId: c.nationalId || "",
          title: parts[0] || "ด.ช.",
          firstName: parts[1] || "",
          lastName: parts.slice(2).join(" ") || "",
          dateOfBirth: "",
          age,
          relationship: "CHILD_LEGITIMATE",
          phone: "",
          address: "",
          isAlive: true,
          bankName: "กรุงไทย",
          bankAccountNumber: "",
          allocationPercentage: childAllocation,
          isDesignatedSuccessor: age >= 18 && age <= 35,
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
        title: "นาย",
        firstName: "",
        lastName: p.lastName,
        dateOfBirth: "",
        age: 65,
        relationship: "FATHER",
        phone: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        allocationPercentage: generated.some((h) => h.relationship === "SPOUSE_LEGAL") ? 12.5 : 50,
        isDesignatedSuccessor: false,
        documentsVerified: true,
        isBloodRelative: true,
        familyConnection: "FATHER",
      });
      generated.push({
        nationalId: "",
        title: "นาง",
        firstName: "",
        lastName: p.lastName,
        dateOfBirth: "",
        age: 63,
        relationship: "MOTHER",
        phone: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
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
    setHeirsList((prev) => [
      ...prev,
      {
        nationalId: "",
        title: "นาย",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        age: 30,
        relationship: "OTHER_HEIR",
        phone: "",
        address: "",
        isAlive: true,
        bankName: "กรุงไทย",
        bankAccountNumber: "",
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

  // Preset Allocation Rule: Spouse 50%, Children 25%, Parents 25%
  const applyStandardAllocationPreset = () => {
    setHeirsList((prev) => {
      const spouseCount = prev.filter((h) => h.relationship === "SPOUSE_LEGAL").length;
      const childrenCount = prev.filter((h) => h.relationship === "CHILD_LEGITIMATE" || h.relationship === "CHILD_ADOPTED").length;
      const parentsCount = prev.filter((h) => h.relationship === "FATHER" || h.relationship === "MOTHER").length;

      return prev.map((h) => {
        if (h.relationship === "SPOUSE_LEGAL") {
          return { ...h, allocationPercentage: 50 / (spouseCount || 1) };
        }
        if (h.relationship === "CHILD_LEGITIMATE" || h.relationship === "CHILD_ADOPTED") {
          return { ...h, allocationPercentage: Math.round((25 / (childrenCount || 1)) * 10) / 10 };
        }
        if (h.relationship === "FATHER" || h.relationship === "MOTHER") {
          return { ...h, allocationPercentage: Math.round((25 / (parentsCount || 1)) * 10) / 10 };
        }
        // Siblings and others get 0% in standard preset (need manual allocation)
        return { ...h, allocationPercentage: 0 };
      });
    });
  };

  const applyEqualSplitPreset = () => {
    if (heirsList.length === 0) return;
    const equalShare = Math.round((100 / heirsList.length) * 10) / 10;
    setHeirsList((prev) => prev.map((h) => ({ ...h, allocationPercentage: equalShare })));
  };

  const totalPercentage = heirsList.reduce((sum, h) => sum + (Number(h.allocationPercentage) || 0), 0);

  const handleSaveHeirs = async () => {
    if (!selectedPersonnelId) {
      setErrorMessage("กรุณาเลือกกำลังพลที่ต้องการบันทึกข้อมูลทายาท");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const payload = {
        heirs: heirsList.map((h) => ({
          nationalId: h.nationalId,
          title: h.title,
          firstName: h.firstName,
          lastName: h.lastName,
          dateOfBirth: h.dateOfBirth || undefined,
          age: Number(h.age || 0),
          relationship: h.relationship,
          phone: h.phone,
          address: h.address,
          isAlive: h.isAlive,
          bankName: h.bankName,
          bankAccountNumber: h.bankAccountNumber,
          allocationPercentage: Number(h.allocationPercentage || 0),
          isDesignatedSuccessor: h.isDesignatedSuccessor,
          documentsVerified: h.documentsVerified,
        })),
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

  const allHeirs = personnelList.flatMap((p) =>
    (p.heirs || []).map((h) => ({
      ...h,
      personnelId: p.id,
      personnelMilitaryId: p.militaryId,
      personnelName: `${p.rankAbbr} ${p.firstName} ${p.lastName}`,
      personnelUnit: p.normalUnit,
      lossType: p.lossType,
      estimatedLumpSum: p.lossType === "KIA_COMBAT_DEATH" ? 7491500 : 4890000,
    }))
  );

  const filteredHeirs = allHeirs.filter(
    (h) =>
      search === "" ||
      h.fullName.toLowerCase().includes(search.toLowerCase()) ||
      h.personnelName.toLowerCase().includes(search.toLowerCase()) ||
      h.nationalId.includes(search) ||
      h.personnelMilitaryId.includes(search)
  );

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
            บันทึกข้อมูลทายาท (บิดา มารดา คู่สมรส บุตร) และการจัดสรรสัดส่วนร้อยละ (%) ของเงินบำเหน็จตกทอด
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
        <Link href="/personnel" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Tab 2: ทะเบียนกำลังพล</p>
            <p className="text-[10px] text-muted-foreground">บันทึกประวัติการรับราชการและสังกัด</p>
          </div>
        </Link>

        <Link href="/family" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors">
          <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">Tab 3: ข้อมูลครอบครัว</p>
            <p className="text-[10px] text-muted-foreground">คู่สมรส, บุตร, ทุนการศึกษา</p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
          <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <p className="font-bold">Tab 4: ข้อมูลทายาท (กำลังใช้งาน)</p>
            <p className="text-[10px] text-blue-700 dark:text-blue-300">จัดสรรสัดส่วนร้อยละ (%) บิดามารดาคู่สมรสบุตร</p>
          </div>
        </div>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนคู่สมรสตามกฎหมาย</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">50% ของยอดเงินรวม</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนบุตรชอบด้วยกฎหมาย</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">25% (แบ่งตามจำนวนบุตร)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนบิดา-มารดา</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">25% (บิดา/มารดา)</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อทายาท, ชื่อกำลังพล, เลขบัตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Heirs Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold">ชื่อทายาท / เลขบัตรประชาชน</TableHead>
                <TableHead className="text-xs font-bold">ความสัมพันธ์</TableHead>
                <TableHead className="text-xs font-bold">กำลังพลผู้รับสิทธิ</TableHead>
                <TableHead className="text-xs font-bold">สังกัด</TableHead>
                <TableHead className="text-xs font-bold">สัดส่วนรับเงิน</TableHead>
                <TableHead className="text-xs font-bold">ยอดเงินประมาณการ</TableHead>
                <TableHead className="text-xs font-bold text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลทายาท...
                  </TableCell>
                </TableRow>
              ) : filteredHeirs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                    ไม่พบข้อมูลทายาทตามเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredHeirs.map((h, idx) => {
                  const calculatedShare = (h.estimatedLumpSum * (h.allocationPercentage || 0)) / 100;
                  const targetPersonnel = personnelList.find((p) => p.id === h.personnelId);
                  return (
                    <TableRow key={`${h.personnelId}-${h.nationalId}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      <TableCell className="py-3 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{h.fullName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          เลขบัตร: {h.nationalId}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{getRelationshipBadge(h.relationship)}</TableCell>
                      <TableCell className="text-xs font-medium">
                        <div>{h.personnelName}</div>
                        <span className="font-mono text-[10px] text-emerald-600 block">
                          ID: {h.personnelMilitaryId}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.personnelUnit}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {h.allocationPercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-emerald-600">
                        {formatCurrency(calculatedShare)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {targetPersonnel && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] px-2 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => openHeirModalForPersonnel(targetPersonnel)}
                            >
                              <Edit className="h-3 w-3" />
                              แก้ไขสัดส่วน
                            </Button>
                          )}
                          <Link href={`/calculator?personnelId=${h.personnelId}`}>
                            <Button
                              size="sm"
                              className="h-7 text-[11px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Calculator className="h-3 w-3" />
                              คำนวณสิทธิ
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
                  <span className={`text-sm font-extrabold ${totalPercentage === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                    {totalPercentage}% / 100%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${totalPercentage === 100 ? "bg-emerald-500" : totalPercentage > 100 ? "bg-rose-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(100, totalPercentage)}%` }}
                  />
                </div>
                {totalPercentage !== 100 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    * กรุณาปรับสัดส่วนให้ครบ 100% (ปัจจุบัน {totalPercentage > 100 ? `เกินอยู่ ${totalPercentage - 100}%` : `ขาดอยู่ ${100 - totalPercentage}%`})
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

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="space-y-1">
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

                        <div className="space-y-1">
                          <Label className="text-[11px]">คำนำหน้า</Label>
                          <Input
                            value={heir.title}
                            onChange={(e) => handleHeirChange(index, "title", e.target.value)}
                            placeholder="นาย / นาง / น.ส."
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">ชื่อ</Label>
                          <Input
                            value={heir.firstName}
                            onChange={(e) => handleHeirChange(index, "firstName", e.target.value)}
                            placeholder="ชื่อ"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">นามสกุล</Label>
                          <Input
                            value={heir.lastName}
                            onChange={(e) => handleHeirChange(index, "lastName", e.target.value)}
                            placeholder="นามสกุล"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">เลขบัตร ปชช. 13 หลัก</Label>
                          <Input
                            value={heir.nationalId}
                            onChange={(e) => handleHeirChange(index, "nationalId", e.target.value)}
                            placeholder="เลข 13 หลัก"
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">วัน/เดือน/ปี เกิด</Label>
                          <Input
                            type="date"
                            value={heir.dateOfBirth}
                            onChange={(e) => handleHeirChange(index, "dateOfBirth", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">อายุ (ปี)</Label>
                          <Input
                            type="number"
                            value={heir.age}
                            onChange={(e) => handleHeirChange(index, "age", Number(e.target.value || 0))}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-blue-700">สัดส่วนร้อยละ (%)</Label>
                          <Input
                            type="number"
                            value={heir.allocationPercentage}
                            onChange={(e) => handleHeirChange(index, "allocationPercentage", Number(e.target.value || 0))}
                            className="h-8 text-xs font-bold text-blue-700"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-[11px]">ธนาคาร & เลขที่บัญชีรับเงิน</Label>
                          <div className="flex gap-2">
                            <Input
                              value={heir.bankName}
                              onChange={(e) => handleHeirChange(index, "bankName", e.target.value)}
                              placeholder="ธนาคาร เช่น กรุงไทย"
                              className="h-8 text-xs w-1/3"
                            />
                            <Input
                              value={heir.bankAccountNumber}
                              onChange={(e) => handleHeirChange(index, "bankAccountNumber", e.target.value)}
                              placeholder="เลขที่บัญชีธนาคาร"
                              className="h-8 text-xs flex-1 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">เบอร์โทรศัพท์ติดต่อ</Label>
                          <Input
                            value={heir.phone}
                            onChange={(e) => handleHeirChange(index, "phone", e.target.value)}
                            placeholder="08x-xxx-xxxx"
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1 flex items-end pb-1">
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
