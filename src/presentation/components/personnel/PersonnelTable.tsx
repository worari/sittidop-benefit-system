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
  CheckCircle2,
  Users,
  Users2,
  HeartHandshake,
  ArrowRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

export function PersonnelTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [lossFilter, setLossFilter] = useState("ALL");
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnelRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [editingPersonnel, setEditingPersonnel] = useState<Partial<MilitaryPersonnelRecord> | null>(null);
  const [loading, setLoading] = useState(true);

  // New Personnel Form State
  const [newRank, setNewRank] = useState("PRIVATE");
  const [newRankAbbr, setNewRankAbbr] = useState("พลทหาร");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDateOfBirth, setNewDateOfBirth] = useState("");
  const [newAge, setNewAge] = useState(30);
  const [newMaritalStatus, setNewMaritalStatus] = useState("โสด");
  const [newReligion, setNewReligion] = useState("พุทธ");
  const [newEducationLevel, setNewEducationLevel] = useState("ปริญญาตรี");
  const [newPhone, setNewPhone] = useState("");
  const [newMilitaryId, setNewMilitaryId] = useState("");
  const [newCitizenId, setNewCitizenId] = useState("");
  const [newNormalUnit, setNewNormalUnit] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newFieldPosition, setNewFieldPosition] = useState("");
  const [newFieldDutyOrderNo, setNewFieldDutyOrderNo] = useState("");
  const [newFieldDutyOrderDate, setNewFieldDutyOrderDate] = useState("");
  const [newFieldDutyOrderIssuer, setNewFieldDutyOrderIssuer] = useState("");
  const [newMissionCategory, setNewMissionCategory] = useState("COUNTER_INSURGENCY");
  const [newSalary, setNewSalary] = useState(35000);
  const [newSalaryLevel, setNewSalaryLevel] = useState("น.3");
  const [newCompensationAmount, setNewCompensationAmount] = useState(3000);
  const [newAdditionalPay, setNewAdditionalPay] = useState(2500);
  const [newTotalYears, setNewTotalYears] = useState(15);
  const [newLossType, setNewLossType] = useState("KIA_COMBAT_DEATH");
  const [newPromotionSteps, setNewPromotionSteps] = useState(7);
  const [newAppointmentDate, setNewAppointmentDate] = useState("");
  const [newHospitalAdmissionDate, setNewHospitalAdmissionDate] = useState("");
  const [newHospitalDischargeDate, setNewHospitalDischargeDate] = useState("");
  const [newProfilePhotoUrl, setNewProfilePhotoUrl] = useState<string>("");
  const [newDocumentAttachments, setNewDocumentAttachments] = useState<Array<{ name: string; type: string; size: number; dataUrl?: string }>>([]);

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

  const filteredList = personnelList.filter((p) => {
    const matchSearch =
      search === "" ||
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.militaryId.includes(search) ||
      p.citizenId.includes(search) ||
      p.normalUnit.toLowerCase().includes(search.toLowerCase());

    const matchBranch = branchFilter === "ALL" || p.militaryBranch === branchFilter;
    const matchLoss = lossFilter === "ALL" || p.lossType === lossFilter;

    return matchSearch && matchBranch && matchLoss;
  });

  const handleCreatePersonnel = async () => {
    if (!newFirstName || !newLastName || !newMilitaryId) return;

    try {
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          militaryId: newMilitaryId,
          citizenId: newCitizenId || `3100${Date.now().toString().slice(-9)}`,
          rank: newRank,
          rankAbbr: newRankAbbr,
          firstName: newFirstName,
          lastName: newLastName,
          dateOfBirth: newDateOfBirth || undefined,
          age: newAge,
          maritalStatus: newMaritalStatus,
          religion: newReligion,
          educationLevel: newEducationLevel,
          phone: newPhone,
          profilePhotoUrl: newProfilePhotoUrl || undefined,
          militaryBranch: "ROYAL_THAI_ARMY",
          abbreviatedPosition: "นายทหารยุทธการ",
          normalUnit: newNormalUnit || "พล.ร.9",
          fieldPosition: newFieldPosition || "ผบ.มว.ปล. สน.",
          fieldUnit: newFieldUnit || "ฉก.นราธิวาส",
          fieldDutyOrderNo: newFieldDutyOrderNo,
          fieldDutyOrderDate: newFieldDutyOrderDate || undefined,
          fieldDutyOrderIssuer: newFieldDutyOrderIssuer,
          missionCategory: newMissionCategory,
          salary: Number(newSalary),
          salaryLevel: newSalaryLevel,
          salaryStep: 18.5,
          compensationAmount: Number(newCompensationAmount),
          additionalPay: Number(newAdditionalPay),
          appointmentDate: newAppointmentDate || "2015-05-01",
          serviceYearsNormal: Math.max(1, newTotalYears - 5),
          serviceYearsMultiplier: 5,
          totalServiceYears: Number(newTotalYears),
          missionType: newMissionCategory,
          actionType: "DIRECT_COMBAT",
          incidentType: "COMBAT_ENGAGEMENT",
          lossType: newLossType,
          promotionSteps: Number(newPromotionSteps),
          promotedRankAbbr: "พล.อ.",
          promotedSalary: Math.round(Number(newSalary) * 1.5),
          hospitalAdmissionDate: newHospitalAdmissionDate || undefined,
          hospitalDischargeDate: newHospitalDischargeDate || undefined,
          documentAttachments: newDocumentAttachments,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        fetchPersonnel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (personnel: MilitaryPersonnelRecord) => {
    setEditingPersonnelId(personnel.id);
    setEditingPersonnel({
      ...personnel,
      salary: Number(personnel.salary),
      totalServiceYears: Number(personnel.totalServiceYears),
      promotionSteps: Number(personnel.promotionSteps),
      hospitalAdmissionDate: personnel.hospitalAdmissionDate ?? "",
      hospitalDischargeDate: personnel.hospitalDischargeDate ?? "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePersonnel = async () => {
    if (!editingPersonnelId || !editingPersonnel) return;

    try {
      const payload = {
        ...editingPersonnel,
        salary: Number(editingPersonnel.salary ?? 0),
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
        setIsEditModalOpen(false);
        setEditingPersonnelId(null);
        setEditingPersonnel(null);
        fetchPersonnel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePersonnel = async (personnel: MilitaryPersonnelRecord) => {
    if (!window.confirm(`ยืนยันการลบข้อมูลกำลังพล ${personnel.rankAbbr} ${personnel.firstName} ${personnel.lastName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/personnel/${personnel.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPersonnelList((prev) => prev.filter((item) => item.id !== personnel.id));
      }
    } catch (err) {
      console.error(err);
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

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, เลขประจำตัวทหาร, สังกัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            aria-label="ตัวกรองกองทัพภาคและหน่วยสังกัด ทบ."
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">ทุกหน่วยสังกัด กองทัพบก (All RTA Units)</option>
            <option value="ROYAL_THAI_ARMY">กองทัพบก (ทบ.) - ทุกหน่วย</option>
          </select>
        </div>

        <div>
          <select
            value={lossFilter}
            onChange={(e) => setLossFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">ทุกประเภทความสูญเสีย (All Loss Types)</option>
            <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบ (KIA)</option>
            <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่สนาม</option>
            <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ</option>
          </select>
        </div>
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {p.rankAbbr} {p.firstName} {p.lastName}
                          </span>
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
                          onClick={() => handleDeletePersonnel(p)}
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
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ยศทหาร</Label>
                  <select
                    value={editingPersonnel.rank ?? "PRIVATE"}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, rank: e.target.value, rankAbbr: e.target.value === "PRIVATE" ? "พลทหาร" : e.target.value === "CORPORAL" ? "ส.ต.กองฯ" : e.target.value === "RANGER" ? "พล.อส." : e.target.value === "VOLUNTEER_RANGER" ? "อส.ทพ." : e.target.value === "SERGEANT" ? "ส.ต." : e.target.value === "FIRST_LIEUTENANT" ? "ร.ท." : e.target.value === "CAPTAIN" ? "ร.อ." : e.target.value === "MASTER_SERGEANT_1ST" ? "จ.ส.อ." : e.target.value === "MAJOR" ? "พ.ต." : e.target.value === "LIEUTENANT_COLONEL" ? "พ.ท." : e.target.value === "COLONEL" ? "พ.อ." : e.target.value === "GENERAL" ? "พล.อ." : "ส.อ." }))}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="PRIVATE">พลทหาร (พลทหาร)</option>
                    <option value="CORPORAL">ส.ต.กองฯ (ส.ต.กองฯ)</option>
                    <option value="RANGER">พล.อส. (พล.อส.)</option>
                    <option value="VOLUNTEER_RANGER">อส.ทพ. (อส.ทพ.)</option>
                    <option value="SERGEANT">ส.ต. (ส.ต.)</option>
                    <option value="FIRST_LIEUTENANT">ร้อยโท (ร.ท.)</option>
                    <option value="CAPTAIN">ร้อยเอก (ร.อ.)</option>
                    <option value="MASTER_SERGEANT_1ST">จ่าสิบเอก (จ.ส.อ.)</option>
                    <option value="MAJOR">พันตรี (พ.ต.)</option>
                    <option value="LIEUTENANT_COLONEL">พันโท (พ.ท.)</option>
                    <option value="COLONEL">พันเอก (พ.อ.)</option>
                    <option value="GENERAL">พล.อ. (พล.อ.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เลขประจำตัวทหาร</Label>
                  <Input
                    value={editingPersonnel.militaryId ?? ""}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, militaryId: e.target.value }))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อ</Label>
                  <Input
                    value={editingPersonnel.firstName ?? ""}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">นามสกุล</Label>
                  <Input
                    value={editingPersonnel.lastName ?? ""}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">สังกัดปกติ</Label>
                  <Input
                    value={editingPersonnel.normalUnit ?? ""}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, normalUnit: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">สังกัดสนาม</Label>
                  <Input
                    value={editingPersonnel.fieldUnit ?? ""}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, fieldUnit: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">เงินเดือน</Label>
                  <Input
                    type="number"
                    value={editingPersonnel.salary ?? 0}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, salary: Number(e.target.value) }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">รวมปีราชการ</Label>
                  <Input
                    type="number"
                    value={editingPersonnel.totalServiceYears ?? 0}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, totalServiceYears: Number(e.target.value) }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ชั้นปูนบำเหน็จ</Label>
                  <Input
                    type="number"
                    value={editingPersonnel.promotionSteps ?? 0}
                    onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, promotionSteps: Number(e.target.value) }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">ประเภทความสูญเสีย</Label>
                <select
                  value={editingPersonnel.lossType ?? "KIA_COMBAT_DEATH"}
                  onChange={(e) => setEditingPersonnel((prev) => ({ ...prev, lossType: e.target.value }))}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบ (KIA)</option>
                  <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่สนาม</option>
                  <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ</option>
                  <option value="SEVERE_WOUND_WIA">บาดเจ็บสาหัสจากการสู้รบ (WIA)</option>
                  <option value="MODERATE_INJURY">บาดเจ็บปานกลาง</option>
                  <option value="MINOR_INJURY">บาดเจ็บเล็กน้อย</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleUpdatePersonnel}
            >
              <CheckCircle2 className="h-4 w-4" />
              บันทึกการแก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Personnel Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              ลงทะเบียนข้อมูลกำลังพลใหม่ (Add Personnel)
            </DialogTitle>
            <DialogDescription className="text-xs">
              กรอกข้อมูลเพื่อบันทึกเข้าสู่ระบบฐานข้อมูลกำลังพลและประมาณการสิทธิประโยชน์
            </DialogDescription>
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
                      setNewRank(e.target.value);
                      if (e.target.value === "PRIVATE") setNewRankAbbr("พลทหาร");
                      else if (e.target.value === "CORPORAL") setNewRankAbbr("ส.ต.กองฯ");
                      else if (e.target.value === "RANGER") setNewRankAbbr("พล.อส.");
                      else if (e.target.value === "VOLUNTEER_RANGER") setNewRankAbbr("อส.ทพ.");
                      else if (e.target.value === "SERGEANT") setNewRankAbbr("ส.ต.");
                      else if (e.target.value === "FIRST_LIEUTENANT") setNewRankAbbr("ร.ท.");
                      else if (e.target.value === "CAPTAIN") setNewRankAbbr("ร.อ.");
                      else if (e.target.value === "MASTER_SERGEANT_1ST") setNewRankAbbr("จ.ส.อ.");
                      else if (e.target.value === "MAJOR") setNewRankAbbr("พ.ต.");
                      else if (e.target.value === "LIEUTENANT_COLONEL") setNewRankAbbr("พ.ท.");
                      else if (e.target.value === "COLONEL") setNewRankAbbr("พ.อ.");
                      else if (e.target.value === "GENERAL") setNewRankAbbr("พล.อ.");
                      else setNewRankAbbr("ส.อ.");
                    }}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="PRIVATE">พลทหาร (พลทหาร)</option>
                    <option value="CORPORAL">ส.ต.กองฯ (ส.ต.กองฯ)</option>
                    <option value="RANGER">พล.อส. (พล.อส.)</option>
                    <option value="VOLUNTEER_RANGER">อส.ทพ. (อส.ทพ.)</option>
                    <option value="SERGEANT">ส.ต. (ส.ต.)</option>
                    <option value="FIRST_LIEUTENANT">ร้อยโท (ร.ท.)</option>
                    <option value="CAPTAIN">ร้อยเอก (ร.อ.)</option>
                    <option value="MASTER_SERGEANT_1ST">จ่าสิบเอก (จ.ส.อ.)</option>
                    <option value="MAJOR">พันตรี (พ.ต.)</option>
                    <option value="LIEUTENANT_COLONEL">พันโท (พ.ท.)</option>
                    <option value="COLONEL">พันเอก (พ.อ.)</option>
                    <option value="GENERAL">พล.อ. (พล.อ.)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก</Label>
                  <Input value={newMilitaryId} onChange={(e) => setNewMilitaryId(e.target.value)} placeholder="MIL-xxxxxxx" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อ</Label>
                  <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="ชื่อกำลังพล" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">นามสกุล</Label>
                  <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="นามสกุล" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ว/ด/ป. เกิด</Label>
                  <Input type="date" value={newDateOfBirth} onChange={(e) => setNewDateOfBirth(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">อายุ</Label>
                  <Input type="number" value={newAge} onChange={(e) => setNewAge(Number(e.target.value || 0))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">สถานภาพ</Label>
                  <select value={newMaritalStatus} onChange={(e) => setNewMaritalStatus(e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="โสด">โสด</option>
                    <option value="สมรส">สมรส</option>
                    <option value="หย่าร้าง">หย่าร้าง</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ศาสนา</Label>
                  <Input value={newReligion} onChange={(e) => setNewReligion(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เลขบัตรประชาชน</Label>
                  <Input value={newCitizenId} onChange={(e) => setNewCitizenId(e.target.value)} placeholder="13 หลัก" className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ระดับการศึกษา</Label>
                  <Input value={newEducationLevel} onChange={(e) => setNewEducationLevel(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เบอร์โทร</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ประเภทกำลังพล</Label>
                  <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="OFFICER">นายทหารสัญญาบัตร</option>
                    <option value="NCO">นายทหารประทวน</option>
                    <option value="RANGER">พล.อส.</option>
                    <option value="ENLISTED">ทหารกองประจำการ</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">ข้อมูลปกติ / สายสนาม</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อตำแหน่งปกติคำย่อ</Label>
                  <Input value={newFieldPosition} onChange={(e) => setNewFieldPosition(e.target.value)} placeholder="เช่น ผบ.มว.ปล. สน." className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">สังกัดปกติคำย่อ</Label>
                  <Input value={newNormalUnit} onChange={(e) => setNewNormalUnit(e.target.value)} placeholder="เช่น ร.19 พัน.1" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ตำแหน่งในสนาม</Label>
                  <Input value={newFieldPosition} onChange={(e) => setNewFieldPosition(e.target.value)} placeholder="เช่น ผบ.กองร้อย" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">สังกัดในสนาม</Label>
                  <Input value={newFieldUnit} onChange={(e) => setNewFieldUnit(e.target.value)} placeholder="เช่น ฉก.นราธิวาส" className="h-8 text-xs" />
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
                  <Input value={newFieldDutyOrderIssuer} onChange={(e) => setNewFieldDutyOrderIssuer(e.target.value)} placeholder="เช่น กรมทหารราบ" className="h-8 text-xs" />
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
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">ข้อมูลเงินเดือน / การคำนวณสิทธิ</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ระดับเงินเดือน</Label>
                  <Input value={newSalaryLevel} onChange={(e) => setNewSalaryLevel(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ยอดรับเงินเดือน</Label>
                  <Input type="number" value={newSalary} onChange={(e) => setNewSalary(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ยอดเงินเยียวยา</Label>
                  <Input type="number" value={newCompensationAmount} onChange={(e) => setNewCompensationAmount(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">เงินเพิ่ม (พ.ส.ร. + ฝ่าอันตราย)</Label>
                  <Input type="number" value={newAdditionalPay} onChange={(e) => setNewAdditionalPay(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">วันทวีคูณ</Label>
                  <Input type="date" className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ว.ด.ป./บรรจุ</Label>
                  <Input type="date" value={newAppointmentDate} onChange={(e) => setNewAppointmentDate(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">อายุราชการรวม (ปี)</Label>
                  <Input type="number" value={newTotalYears} onChange={(e) => setNewTotalYears(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ชั้นยศปูนบำเหน็จ</Label>
                  <Input type="number" value={newPromotionSteps} onChange={(e) => setNewPromotionSteps(Number(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ประเภทความสูญเสีย</Label>
                  <select value={newLossType} onChange={(e) => setNewLossType(e.target.value)} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบ (KIA)</option>
                    <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่สนาม</option>
                    <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ</option>
                    <option value="SEVERE_WOUND_WIA">บาดเจ็บสาหัสจากการสู้รบ (WIA)</option>
                    <option value="MODERATE_INJURY">บาดเจ็บปานกลาง</option>
                    <option value="MINOR_INJURY">บาดเจ็บเล็กน้อย</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Photo Upload */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">รูปประจำตัวกำลังพล</p>
              <div className="space-y-2">
                <Input type="file" accept="image/*" onChange={async (e) => {
                  const files = e.target.files ?? [];
                  if (!files[0]) return;
                  const dataUrl = await readFileToDataUrl(files[0]);
                  setNewProfilePhotoUrl(dataUrl);
                }} className="h-8 text-xs" />
                {newProfilePhotoUrl ? <img src={newProfilePhotoUrl} alt="profile" className="h-16 w-16 rounded-md object-cover border" /> : null}
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">เอกสารแนบ / ไฟล์ประกอบ</p>
              <div className="space-y-2">
                <Input type="file" multiple accept=".pdf,image/png,image/jpeg,.png,.jpg,.jpeg" onChange={handleAttachmentUpload} className="h-8 text-xs" />
                {newDocumentAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {newDocumentAttachments.map((item, index) => (
                      <span key={`${item.name}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">{item.name}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">วันที่เข้ารักษาพยาบาล</Label>
              <Input type="date" value={newHospitalAdmissionDate} onChange={(e) => setNewHospitalAdmissionDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">วันที่ออกจากโรงพยาบาล</Label>
              <Input type="date" value={newHospitalDischargeDate} onChange={(e) => setNewHospitalDischargeDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleCreatePersonnel}
            >
              <CheckCircle2 className="h-4 w-4" />
              บันทึกข้อมูลกำลังพล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
