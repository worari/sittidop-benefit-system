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
  Award,
  AlertTriangle,
  CheckCircle2,
  Users,
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
  const [loading, setLoading] = useState(true);

  // New Personnel Form State
  const [newRank, setNewRank] = useState("LIEUTENANT_COLONEL");
  const [newRankAbbr, setNewRankAbbr] = useState("พ.ท.");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMilitaryId, setNewMilitaryId] = useState("");
  const [newCitizenId, setNewCitizenId] = useState("");
  const [newNormalUnit, setNewNormalUnit] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState("");
  const [newSalary, setNewSalary] = useState(35000);
  const [newTotalYears, setNewTotalYears] = useState(15);
  const [newLossType, setNewLossType] = useState("KIA_COMBAT_DEATH");
  const [newPromotionSteps, setNewPromotionSteps] = useState(7);

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
          militaryBranch: "ROYAL_THAI_ARMY",
          abbreviatedPosition: "นายทหารยุทธการ",
          normalUnit: newNormalUnit || "พล.ร.9",
          fieldPosition: "ผบ.มว.ปล. สน.",
          fieldUnit: newFieldUnit || "ฉก.นราธิวาส",
          salary: Number(newSalary),
          salaryLevel: "น.3",
          salaryStep: 18.5,
          compensationAmount: 3000,
          additionalPay: 2500,
          appointmentDate: "2015-05-01",
          serviceYearsNormal: Math.max(1, newTotalYears - 5),
          serviceYearsMultiplier: 5,
          totalServiceYears: Number(newTotalYears),
          missionType: "COUNTER_INSURGENCY",
          actionType: "DIRECT_COMBAT",
          incidentType: "COMBAT_ENGAGEMENT",
          lossType: newLossType,
          promotionSteps: Number(newPromotionSteps),
          promotedRankAbbr: "พล.อ.",
          promotedSalary: Math.round(Number(newSalary) * 1.5),
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
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="ALL">ทุกเหล่าทัพ (All Branches)</option>
            <option value="ROYAL_THAI_ARMY">กองทัพบก (ทบ.)</option>
            <option value="ROYAL_THAI_NAVY">กองทัพเรือ (ทร.)</option>
            <option value="ROYAL_THAI_AIR_FORCE">กองทัพอากาศ (ทอ.)</option>
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

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              ปิดหน้าต่าง
            </Button>
            {selectedPersonnel && (
              <Link href={`/calculator?personnelId=${selectedPersonnel.id}`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Calculator className="h-4 w-4" />
                  เปิดเครื่องมือคำนวณสิทธิ 4 หมวด
                </Button>
              </Link>
            )}
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

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ยศทหาร</Label>
                <select
                  value={newRank}
                  onChange={(e) => {
                    setNewRank(e.target.value);
                    if (e.target.value === "COLONEL") setNewRankAbbr("พ.อ.");
                    else if (e.target.value === "LIEUTENANT_COLONEL") setNewRankAbbr("พ.ท.");
                    else if (e.target.value === "CAPTAIN") setNewRankAbbr("ร.อ.");
                    else if (e.target.value === "MASTER_SERGEANT_1ST") setNewRankAbbr("จ.ส.อ.");
                    else setNewRankAbbr("ส.อ.");
                  }}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="LIEUTENANT_COLONEL">พันโท (พ.ท.)</option>
                  <option value="COLONEL">พันเอก (พ.อ.)</option>
                  <option value="MAJOR">พันตรี (พ.ต.)</option>
                  <option value="CAPTAIN">ร้อยเอก (ร.อ.)</option>
                  <option value="FIRST_LIEUTENANT">ร้อยโท (ร.ท.)</option>
                  <option value="MASTER_SERGEANT_1ST">จ่าสิบเอก (จ.ส.อ.)</option>
                  <option value="SERGEANT">สิบเอก (ส.อ.)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">เลขประจำตัวทหาร 10 หลัก</Label>
                <Input
                  value={newMilitaryId}
                  onChange={(e) => setNewMilitaryId(e.target.value)}
                  placeholder="MIL-xxxxxxx"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ชื่อ</Label>
                <Input
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="ชื่อกำลังพล"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">นามสกุล</Label>
                <Input
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="นามสกุล"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">สังกัดปกติ (ต้นสังกัด)</Label>
                <Input
                  value={newNormalUnit}
                  onChange={(e) => setNewNormalUnit(e.target.value)}
                  placeholder="เช่น ร.19 พัน.1 (พล.ร.9)"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">สังกัดสนาม / หน่วยเฉพาะกิจ</Label>
                <Input
                  value={newFieldUnit}
                  onChange={(e) => setNewFieldUnit(e.target.value)}
                  placeholder="เช่น ฉก.นราธิวาส"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">เงินเดือนปัจจุบัน (บาท)</Label>
                <Input
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">อายุราชการรวม (ปี)</Label>
                <Input
                  type="number"
                  value={newTotalYears}
                  onChange={(e) => setNewTotalYears(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ชั้นยศปูนบำเหน็จ</Label>
                <Input
                  type="number"
                  value={newPromotionSteps}
                  onChange={(e) => setNewPromotionSteps(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ประเภทความสูญเสีย</Label>
              <select
                value={newLossType}
                onChange={(e) => setNewLossType(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="KIA_COMBAT_DEATH">เสียชีวิตจากการสู้รบ (KIA)</option>
                <option value="DUTY_DEATH">เสียชีวิตขณะปฏิบัติหน้าที่สนาม</option>
                <option value="TOTAL_PERMANENT_DISABILITY">ทุพพลภาพถาวรจากการรบ</option>
              </select>
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
