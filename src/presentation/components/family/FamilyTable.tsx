"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

export interface ChildFormState {
  nationalId: string;
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
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

    // Populate Spouse
    if (p.spouse) {
      const parts = (p.spouse.fullName || "").trim().split(" ");
      const title = parts[0] || "นาง";
      const fName = parts[1] || "";
      const lName = parts.slice(2).join(" ") || "";
      setSpouseData({
        hasSpouse: true,
        nationalId: p.spouse.nationalId || "",
        title: title,
        firstName: fName,
        lastName: lName,
        dateOfBirth: "",
        age: 35,
        isAlive: true,
        isLegallyMarried: p.spouse.isLegallyMarried ?? true,
        marriageCertNumber: "",
        phone: "",
        address: "",
        bankName: "กรุงไทย",
        bankAccountNumber: "",
        hasPensionRights: p.spouse.hasPensionRights ?? true,
        allocationPercentage: p.spouse.allocationPercentage || 50,
      });
    } else {
      setSpouseData({
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
    }

    // Populate Children
    if (p.children && p.children.length > 0) {
      const mapped = p.children.map((c) => {
        const parts = (c.fullName || "").trim().split(" ");
        const title = parts[0] || "ด.ช.";
        const fName = parts[1] || "";
        const lName = parts.slice(2).join(" ") || "";
        const age = Number(c.age || 0);
        return {
          nationalId: c.nationalId || "",
          title,
          firstName: fName,
          lastName: lName,
          dateOfBirth: "",
          age,
          isAlive: true,
          isStudying: c.isStudying ?? true,
          educationLevel: c.educationLevel || "PRIMARY",
          phone: "",
          scholarshipEligible: c.isStudying ?? true,
          annualScholarship: c.educationLevel === "BACHELOR" ? 35000 : 15000,
          hasSuccessorRight: age >= 18 && age <= 35,
          allocationPercentage: c.allocationPercentage || 25,
        };
      });
      setChildrenList(mapped);
    } else {
      setChildrenList([]);
    }

    setIsModalOpen(true);
  };

  // Add a blank child
  const handleAddChild = () => {
    setChildrenList((prev) => [
      ...prev,
      {
        nationalId: "",
        title: "ด.ช.",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        age: 8,
        isAlive: true,
        isStudying: true,
        educationLevel: "PRIMARY",
        phone: "",
        scholarshipEligible: true,
        annualScholarship: 15000,
        hasSuccessorRight: false,
        allocationPercentage: 25,
      },
    ]);
  };

  const handleRemoveChild = (index: number) => {
    setChildrenList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof ChildFormState, value: any) => {
    setChildrenList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto update age if birthDate changes
      if (field === "dateOfBirth" && value) {
        const birthYear = new Date(value).getFullYear();
        const curYear = new Date().getFullYear();
        const calculatedAge = Math.max(0, curYear - birthYear);
        updated[index].age = calculatedAge;
        updated[index].hasSuccessorRight = calculatedAge >= 18 && calculatedAge <= 35;
      }

      if (field === "age") {
        const numAge = Number(value || 0);
        updated[index].hasSuccessorRight = numAge >= 18 && numAge <= 35;
      }

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
            allocationPercentage: Number(spouseData.allocationPercentage || 50),
          }
          : null,
        children: childrenList.map((c) => ({
          nationalId: c.nationalId,
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
          allocationPercentage: Number(c.allocationPercentage || 25),
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

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อกำลังพล, เลขประจำตัวทหาร, คู่สมรส, หรือบุตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Family Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-xs text-muted-foreground">
            กำลังโหลดข้อมูลครอบครัว...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-xs text-muted-foreground">
            ไม่พบข้อมูลครอบครัวตามคำค้นหา
          </div>
        ) : (
          filtered.map((p) => {
            const hasSuccessor = p.children?.some((c) => c.age >= 18 && c.age <= 35);
            return (
              <Card
                key={p.id}
                className="border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-500/40 transition-all space-y-4 p-5"
              >
                {/* Personnel Top Line */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                        {p.militaryId}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {p.lossType === "KIA_COMBAT_DEATH" ? "เสียชีวิตในการรบ" : "ทุพพลภาพ"}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {p.rankAbbr} {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{p.normalUnit}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] px-2.5 gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => openFamilyModalForPersonnel(p)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      บันทึก/แก้ไขครอบครัว
                    </Button>
                    <Link href={`/heirs?personnelId=${p.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] px-2 gap-1 text-blue-600 hover:bg-blue-50"
                        title="ไปยังข้อมูลทายาท (Tab 4)"
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        ทายาท
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Spouse Section */}
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                      คู่สมรสตามกฎหมาย (Spouse)
                    </span>
                    {p.spouse ? (
                      <Badge className="bg-purple-600 text-white text-[9px]">จดทะเบียนสมรส</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">ไม่มีข้อมูลคู่สมรส</Badge>
                    )}
                  </div>
                  {p.spouse ? (
                    <div className="text-xs space-y-0.5 pt-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.spouse.fullName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        เลขบัตร: {p.spouse.nationalId}
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                        สิทธิการจัดสรรเงินบำเหน็จตกทอด: {p.spouse.allocationPercentage}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">โสด / ยังไม่ได้บันทึกข้อมูลคู่สมรส</p>
                  )}
                </div>

                {/* Children Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      บุตรในอุปการะ ({p.children?.length || 0} คน)
                    </span>
                    {hasSuccessor && (
                      <Badge className="bg-emerald-600 text-white text-[9px] gap-1">
                        <UserCheck className="h-3 w-3" />
                        มีบุตรเกณฑ์บรรจุทดแทน (18-35 ปี)
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {p.children && p.children.length > 0 ? (
                      p.children.map((child, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold">{child.fullName}</span>
                            <span className="text-[10px] text-muted-foreground block">
                              อายุ {child.age} ปี • ระดับ {child.educationLevel || "ประถมศึกษา"}
                            </span>
                          </div>
                          <div className="text-right space-y-0.5">
                            {child.isStudying ? (
                              <Badge className="bg-blue-600 text-white text-[9px]">
                                รับทุน {child.educationLevel === "BACHELOR" ? "฿35,000/ปี" : "฿12,000-15,000/ปี"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px]">จบการศึกษาแล้ว</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground p-2 text-center">ไม่มีบุตร / ยังไม่ได้บันทึกข้อมูล</p>
                    )}
                  </div>
                </div>

                {/* Card Footer Quick Link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-muted-foreground">บันทึกข้อมูลเพื่อส่งต่อสิทธิทายาท</span>
                  <Link href={`/heirs?personnelId=${p.id}`} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                    จัดสรรสัดส่วนทายาท (Tab 4) <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>

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
                  <div className="space-y-1">
                    <Label className="text-xs">เลขบัตรประชาชน 13 หลัก</Label>
                    <Input
                      value={spouseData.nationalId}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, nationalId: e.target.value }))}
                      placeholder="เลข 13 หลัก"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">วัน/เดือน/ปี เกิด</Label>
                    <Input
                      type="date"
                      value={spouseData.dateOfBirth}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">อายุ (ปี)</Label>
                    <Input
                      type="number"
                      value={spouseData.age}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, age: Number(e.target.value || 0) }))}
                      className="h-8 text-xs"
                    />
                  </div>
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
                  <div className="space-y-1">
                    <Label className="text-xs">เบอร์โทรศัพท์</Label>
                    <Input
                      value={spouseData.phone}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="08x-xxx-xxxx"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">สิทธิบำนาญตกทอด (%)</Label>
                    <Input
                      type="number"
                      value={spouseData.allocationPercentage}
                      onChange={(e) => setSpouseData((prev) => ({ ...prev, allocationPercentage: Number(e.target.value || 0) }))}
                      className="h-8 text-xs font-bold text-purple-700"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">ธนาคาร & เลขที่บัญชีสำหรับรับเงิน</Label>
                    <div className="flex gap-2">
                      <Input
                        value={spouseData.bankName}
                        onChange={(e) => setSpouseData((prev) => ({ ...prev, bankName: e.target.value }))}
                        placeholder="ธนาคาร เช่น กรุงไทย"
                        className="h-8 text-xs w-1/3"
                      />
                      <Input
                        value={spouseData.bankAccountNumber}
                        onChange={(e) => setSpouseData((prev) => ({ ...prev, bankAccountNumber: e.target.value }))}
                        placeholder="เลขที่บัญชีธนาคาร"
                        className="h-8 text-xs flex-1 font-mono"
                      />
                    </div>
                  </div>
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
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  กำลังพลไม่มีคู่สมรส หรือยังไม่ได้ระบุข้อมูลคู่สมรส
                </p>
              )}
            </div>

            {/* Section 3: Children Information */}
            <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 pb-2">
                <div>
                  <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    3. ข้อมูลบุตรในอุปการะ ({childrenList.length} คน)
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ตรวจสิทธิรับทุนการศึกษา และคุณสมบัติทายาทบรรจุทดแทน (18-35 ปี)
                  </p>
                </div>
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

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[11px]">คำนำหน้า</Label>
                          <Input
                            value={child.title}
                            onChange={(e) => handleChildChange(index, "title", e.target.value)}
                            placeholder="ด.ช. / ด.ญ. / นาย / น.ส."
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">ชื่อบุตร</Label>
                          <Input
                            value={child.firstName}
                            onChange={(e) => handleChildChange(index, "firstName", e.target.value)}
                            placeholder="ชื่อ"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">นามสกุล</Label>
                          <Input
                            value={child.lastName}
                            onChange={(e) => handleChildChange(index, "lastName", e.target.value)}
                            placeholder="นามสกุล"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">เลขบัตร ปชช. 13 หลัก</Label>
                          <Input
                            value={child.nationalId}
                            onChange={(e) => handleChildChange(index, "nationalId", e.target.value)}
                            placeholder="เลข 13 หลัก"
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">วัน/เดือน/ปี เกิด</Label>
                          <Input
                            type="date"
                            value={child.dateOfBirth}
                            onChange={(e) => handleChildChange(index, "dateOfBirth", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">อายุ (ปี)</Label>
                          <Input
                            type="number"
                            value={child.age}
                            onChange={(e) => handleChildChange(index, "age", Number(e.target.value || 0))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">สถานะการศึกษา</Label>
                          <select
                            value={child.isStudying ? "STUDYING" : "NOT_STUDYING"}
                            onChange={(e) => handleChildChange(index, "isStudying", e.target.value === "STUDYING")}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="STUDYING">กำลังศึกษาอยู่</option>
                            <option value="NOT_STUDYING">ไม่ได้ศึกษา / จบแล้ว</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">ระดับชั้นการศึกษา</Label>
                          <select
                            value={child.educationLevel}
                            onChange={(e) => handleChildChange(index, "educationLevel", e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="PRIMARY">ประถมศึกษา</option>
                            <option value="SECONDARY">มัธยมศึกษา</option>
                            <option value="VOCATIONAL">อาชีวศึกษา / ปวช. / ปวส.</option>
                            <option value="BACHELOR">อุดมศึกษา / ปริญญาตรี</option>
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
