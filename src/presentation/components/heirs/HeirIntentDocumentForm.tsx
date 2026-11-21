"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Badge } from "@/presentation/components/ui/badge";
import {
  FileText,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Building,
  HeartHandshake,
  Percent,
  ArrowLeft,
  Users,
  Search,
  Sparkles,
  Download,
  Share2,
} from "lucide-react";

export interface HeirItem {
  id: string;
  fullName: string;
  relationship: string;
  nationalId: string;
  birthDateBE?: string;
  percentage: number;
  bankName: string;
  bankAccountNumber: string;
  address: string;
  phone: string;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const RELATION_OPTIONS = [
  "คู่สมรสชอบด้วยกฎหมาย",
  "บุตรโดยชอบด้วยกฎหมาย",
  "บิดา",
  "มารดา",
  "พี่น้องร่วมบิดามารดา",
  "พี่น้องร่วมบิดาหรือร่วมมารดา",
  "ปู่/ย่า/ตา/ยาย",
  "ลุง/ป้า/น้า/อา",
  "ทายาทผู้รับพินัยกรรม",
];

const BANK_OPTIONS = [
  "ธนาคารทหารไทยธนชาต (ttb)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารออมสิน (GSB)",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
];

export function HeirIntentDocumentForm() {
  const currentYearBE = new Date().getFullYear() + 543;
  const currentDay = new Date().getDate();
  const currentMonthIdx = new Date().getMonth();

  // Mode: "form" | "preview"
  const [viewMode, setViewMode] = useState<"form" | "preview">("form");

  // Personnel data from database for quick autofill
  const [dbPersonnelList, setDbPersonnelList] = useState<any[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("");

  // Document Info
  const [docPlace, setDocPlace] = useState("กองบังคับการ ฉก.นราธิวาส 30");
  const [docDay, setDocDay] = useState<number>(currentDay);
  const [docMonth, setDocMonth] = useState<string>(THAI_MONTHS[currentMonthIdx]);
  const [docYearBE, setDocYearBE] = useState<number>(currentYearBE);

  // Personnel Info (The Declarant)
  const [rankTitle, setRankTitle] = useState("พ.ท.");
  const [firstName, setFirstName] = useState("วีรชาติ");
  const [lastName, setLastName] = useState("ภักดีสยาม");
  const [militaryId, setMilitaryId] = useState("49021884");
  const [citizenId, setCitizenId] = useState("3100600492811");
  const [position, setPosition] = useState("ผบ.พัน.ร.1911");
  const [normalUnit, setNormalUnit] = useState("ร.19 พัน.1 (พล.ร.9)");
  const [fieldPosition, setFieldPosition] = useState("ผบ.ฉก.นราธิวาส 30");
  const [fieldUnit, setFieldUnit] = useState("ฉก.นราธิวาส (กกล.ทบ.)");
  const [orderNo, setOrderNo] = useState("คำสั่ง ศปก.ทบ. ที่ 421/2568");
  const [homeAddress, setHomeAddress] = useState("124/5 ค่ายสุรสีห์ ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี");
  const [phone, setPhone] = useState("081-456-7890");

  // Heir Items (Multiple heirs allowed)
  const [heirs, setHeirs] = useState<HeirItem[]>([
    {
      id: "h-1",
      fullName: "นางพิมพา ภักดีสยาม",
      relationship: "คู่สมรสชอบด้วยกฎหมาย",
      nationalId: "1100400289112",
      birthDateBE: "20 พ.ย. 2529",
      percentage: 50,
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      address: "124/5 ค่ายสุรสีห์ ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
      phone: "089-765-4321",
    },
    {
      id: "h-2",
      fullName: "ด.ช. นราธิป ภักดีสยาม",
      relationship: "บุตรโดยชอบด้วยกฎหมาย",
      nationalId: "1100400289113",
      birthDateBE: "10 มี.ค. 2558",
      percentage: 25,
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      address: "124/5 ค่ายสุรสีห์ ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
      phone: "089-765-4321",
    },
    {
      id: "h-3",
      fullName: "น.ส. กานดา ภักดีสยาม",
      relationship: "บุตรโดยชอบด้วยกฎหมาย",
      nationalId: "1100400289114",
      birthDateBE: "22 ก.ค. 2551",
      percentage: 25,
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      address: "124/5 ค่ายสุรสีห์ ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
      phone: "089-765-4321",
    },
  ]);

  // Witnesses & Commander
  const [witness1Name, setWitness1Name] = useState("ร.อ. ภาคิน ดำรงไทย");
  const [witness1Position, setWitness1Position] = useState("ผบ.ร้อย.ร.1512");
  const [witness2Name, setWitness2Name] = useState("ส.อ. อนุชา ชัยมงคล");
  const [witness2Position, setWitness2Position] = useState("เสมียนกำลังพล ฉก.นราธิวาส");
  const [commanderName, setCommanderName] = useState("พล.ต. วิทวัส สมานญาติ");
  const [commanderRank, setCommanderRank] = useState("พลตรี");
  const [commanderPosition, setCommanderPosition] = useState("ผู้บัญชาการกองกำลัง / ผู้บังคับการเฉพาะกิจ");

  // Load personnel list from database for quick autofill
  useEffect(() => {
    async function loadPersonnel() {
      try {
        const res = await fetch("/api/personnel");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDbPersonnelList(json.data);
        }
      } catch (err) {
        console.error("Failed to load personnel:", err);
      }
    }
    loadPersonnel();
  }, []);

  // Autofill form when personnel is selected
  const handleSelectPersonnel = (personnelId: string) => {
    setSelectedPersonnelId(personnelId);
    const p = dbPersonnelList.find((item) => item.id === personnelId || item.militaryId === personnelId);
    if (!p) return;

    setRankTitle(p.rankAbbr || "");
    setFirstName(p.firstName || "");
    setLastName(p.lastName || "");
    setMilitaryId(p.militaryId || "");
    setCitizenId(p.citizenId || "");
    setPosition(p.abbreviatedPosition || p.fullPosition || "");
    setNormalUnit(p.normalUnit || "");
    setFieldPosition(p.fieldPosition || "");
    setFieldUnit(p.fieldUnit || "");
    setOrderNo(p.fieldDutyOrderNo || "คำสั่ง ศปก.ทบ.");
    setPhone(p.phone || "");

    // Autofill heirs if available
    const newHeirs: HeirItem[] = [];
    if (p.spouse) {
      newHeirs.push({
        id: `h-spouse-${Date.now()}`,
        fullName: p.spouse.fullName || `${p.spouse.title || ""} ${p.spouse.firstName || ""} ${p.spouse.lastName || ""}`.trim(),
        relationship: "คู่สมรสชอบด้วยกฎหมาย",
        nationalId: p.spouse.nationalId || "",
        percentage: Number(p.spouse.allocationPercentage || 50),
        bankName: p.spouse.bankName || "ธนาคารทหารไทยธนชาต (ttb)",
        bankAccountNumber: p.spouse.bankAccountNumber || "",
        address: p.spouse.address || homeAddress,
        phone: p.spouse.phone || phone,
      });
    }

    if (Array.isArray(p.children) && p.children.length > 0) {
      p.children.forEach((c: any, idx: number) => {
        newHeirs.push({
          id: `h-child-${idx}-${Date.now()}`,
          fullName: c.fullName || `${c.title || ""} ${c.firstName || ""} ${c.lastName || ""}`.trim(),
          relationship: "บุตรโดยชอบด้วยกฎหมาย",
          nationalId: c.nationalId || "",
          percentage: Number(c.allocationPercentage || Math.floor(50 / p.children.length)),
          bankName: "ธนาคารทหารไทยธนชาต (ttb)",
          bankAccountNumber: "",
          address: homeAddress,
          phone: phone,
        });
      });
    }

    if (newHeirs.length > 0) {
      setHeirs(newHeirs);
    }
  };

  // Add new heir row
  const handleAddHeir = () => {
    const newItem: HeirItem = {
      id: `heir-${Date.now()}`,
      fullName: "",
      relationship: "บุตรโดยชอบด้วยกฎหมาย",
      nationalId: "",
      percentage: 0,
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "",
      address: homeAddress,
      phone: "",
    };
    setHeirs([...heirs, newItem]);
  };

  // Remove heir row
  const handleRemoveHeir = (id: string) => {
    if (heirs.length <= 1) {
      alert("ต้องระบุทายาทผู้รับผลประโยชน์อย่างน้อย 1 คน");
      return;
    }
    setHeirs(heirs.filter((h) => h.id !== id));
  };

  // Update specific heir property
  const handleUpdateHeir = (id: string, field: keyof HeirItem, value: any) => {
    setHeirs(
      heirs.map((h) => {
        if (h.id === id) {
          return { ...h, [field]: value };
        }
        return h;
      })
    );
  };

  // Distribute percentages equally among heirs
  const handleDistributeEqually = () => {
    if (heirs.length === 0) return;
    const count = heirs.length;
    const basePercent = Math.floor(100 / count);
    const remainder = 100 - basePercent * count;

    const updated = heirs.map((h, idx) => ({
      ...h,
      percentage: idx === 0 ? basePercent + remainder : basePercent,
    }));
    setHeirs(updated);
  };

  // Calculate total percentage
  const totalPercentage = heirs.reduce((acc, h) => acc + (Number(h.percentage) || 0), 0);
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Controls (Hidden on Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#283b5c] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/heirs" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#1877F2]" />
                หนังสือแสดงเจตนาระบุตัวผู้รับบำเหน็จตกทอด & เงินสงเคราะห์
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              แบบฟอร์มแสดงเจตนาระบุตัวทายาทผู้รับสิทธิประโยชน์ สามารถเพิ่มทายาทได้มากกว่า ๑ คน พร้อมพิมพ์เอกสารสำหรับลงลายมือชื่อ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={viewMode === "form" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("form")}
              className={`text-xs gap-1.5 ${
                viewMode === "form"
                  ? "bg-[#1877F2] hover:bg-[#166fe5] text-white"
                  : "border-[#283b5c] text-slate-200 hover:bg-[#1e2f4d]"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              กรอกข้อมูลทายาท ({heirs.length} คน)
            </Button>

            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className={`text-xs gap-1.5 ${
                viewMode === "preview"
                  ? "bg-[#1877F2] hover:bg-[#166fe5] text-white"
                  : "border-[#283b5c] text-slate-200 hover:bg-[#1e2f4d]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              ดูตัวอย่างเอกสาร
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              disabled={!isPercentageValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
              title={!isPercentageValid ? "สัดส่วนรวมต้องเท่ากับ 100% จึงจะพิมพ์เอกสารได้" : "พิมพ์เอกสารราชการ"}
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์เอกสาร (Print A4)
            </Button>
          </div>
        </div>

        {/* Validation Status Bar */}
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
            isPercentageValid
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-amber-950/40 border-amber-500/40 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {isPercentageValid ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <span>
              {isPercentageValid
                ? `สัดส่วนร้อยละของทายาทรวมครบ ${totalPercentage}% ถูกต้องตามระเบียบราชการแล้ว พร้อมสั่งพิมพ์เอกสาร`
                : `สัดส่วนรวมปัจจุบันเท่ากับ ${totalPercentage}% (ตามระเบียบราชการ ผลรวมสัดส่วนของทายาททุกคนต้องเท่ากับ 100% พอดี)`}
            </span>
          </div>

          {!isPercentageValid && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDistributeEqually}
              className="h-7 text-[11px] border-amber-500/50 text-amber-200 hover:bg-amber-950/60"
            >
              เฉลี่ยสัดส่วนเท่ากันอัตโนมัติ
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. FORM INPUT VIEW (When viewMode === "form")                   */}
      {/* ============================================================== */}
      {viewMode === "form" && (
        <div className="space-y-6 print:hidden">
          {/* Quick Autofill Selector */}
          {dbPersonnelList.length > 0 && (
            <Card className="border border-[#283b5c] bg-[#162136] p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    ดึงข้อมูลจากทะเบียนกำลังพล ทบ. (Autofill)
                  </p>
                  <p className="text-[11px] text-slate-300">
                    เลือกกำลังพลในระบบเพื่อกรอกข้อมูลส่วนบุคคลและข้อมูลครอบครัวอัตโนมัติ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedPersonnelId}
                    onChange={(e) => handleSelectPersonnel(e.target.value)}
                    className="h-8 rounded-md bg-[#0d1526] border border-[#283b5c] text-xs text-white px-2.5 font-sans"
                  >
                    <option value="">-- เลือกกำลังพลเพื่อดึงข้อมูล --</option>
                    {dbPersonnelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.rankAbbr || ""} {p.firstName} {p.lastName} (ทบ. {p.militaryId}) - {p.normalUnit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          )}

          {/* Section 1: Personnel Info */}
          <Card className="border border-[#283b5c] bg-[#162136]">
            <CardHeader className="pb-3 border-b border-[#243656]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-[#1877F2]" />
                ข้อมูลกำลังพลผู้แสดงเจตนา (The Declarant)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>ทำที่ (สถานที่ทำหนังสือ)</Label>
                  <Input
                    value={docPlace}
                    onChange={(e) => setDocPlace(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="เช่น กองร้อย ร.1911 หรือ บก.ฉก."
                  />
                </div>
                <div className="space-y-1">
                  <Label>วันที่</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={docDay}
                    onChange={(e) => setDocDay(Number(e.target.value))}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>เดือน</Label>
                  <select
                    value={docMonth}
                    onChange={(e) => setDocMonth(e.target.value)}
                    className="w-full h-8 rounded-md bg-[#0d1526] border border-[#283b5c] text-xs text-white px-2"
                  >
                    {THAI_MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>พ.ศ.</Label>
                  <Input
                    type="number"
                    value={docYearBE}
                    onChange={(e) => setDocYearBE(Number(e.target.value))}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="space-y-1">
                  <Label>ยศ / คำนำหน้า</Label>
                  <Input
                    value={rankTitle}
                    onChange={(e) => setRankTitle(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="พ.ท. / ร.อ. / ส.อ. / พลฯ"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ชื่อ</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>นามสกุล</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>เลขประจำตัวทหาร (ทบ.)</Label>
                  <Input
                    value={militaryId}
                    onChange={(e) => setMilitaryId(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c] font-mono"
                    placeholder="เช่น 49021884"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>เลขประจำตัวประชาชน (๑๓ หลัก)</Label>
                  <Input
                    value={citizenId}
                    maxLength={13}
                    onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ""))}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c] font-mono"
                    placeholder="3100600492811"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ตำแหน่งปกติ</Label>
                  <Input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="ผบ.พัน.ร.1911"
                  />
                </div>
                <div className="space-y-1">
                  <Label>สังกัดปกติ</Label>
                  <Input
                    value={normalUnit}
                    onChange={(e) => setNormalUnit(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="ร.19 พัน.1 (พล.ร.9)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>ตำแหน่งในสนาม (ถ้ามี)</Label>
                  <Input
                    value={fieldPosition}
                    onChange={(e) => setFieldPosition(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="ผบ.ฉก.นราธิวาส 30"
                  />
                </div>
                <div className="space-y-1">
                  <Label>หน่วยสนาม (ถ้ามี)</Label>
                  <Input
                    value={fieldUnit}
                    onChange={(e) => setFieldUnit(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="ฉก.นราธิวาส (กกล.ทบ.)"
                  />
                </div>
                <div className="space-y-1">
                  <Label>คำสั่งปฏิบัติหน้าที่สนาม (ศปก.ทบ.)</Label>
                  <Input
                    value={orderNo}
                    onChange={(e) => setOrderNo(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                    placeholder="คำสั่ง ศปก.ทบ. ที่ 421/2568"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label>ภูมิลำเนา / ที่อยู่ตามทะเบียนบ้าน</Label>
                  <Input
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
                <div className="space-y-1">
                  <Label>เบอร์โทรศัพท์ติดต่อ</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs bg-[#0d1526] border-[#283b5c]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Dynamic Heirs List */}
          <Card className="border border-[#283b5c] bg-[#162136]">
            <CardHeader className="pb-3 border-b border-[#243656]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-[#1877F2]" />
                    รายการทายาทผู้รับผลประโยชน์ (ระบุได้มากกว่า ๑ คน)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    ระบุชื่อ สัดส่วนร้อยละ (%) และบัญชีธนาคารสำหรับโอนเงินสงเคราะห์/บำเหน็จตกทอด
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  onClick={handleAddHeir}
                  className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold gap-1.5 h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มทายาทคนที่ {heirs.length + 1}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {heirs.map((h, idx) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-lg border border-[#283b5c] bg-[#0d1526]/70 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-[#243656] pb-2">
                    <span className="text-xs font-bold text-[#4599ff] flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-[11px] font-mono">
                        {idx + 1}
                      </span>
                      ทายาทลำดับที่ {idx + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Label htmlFor={`pct-${h.id}`} className="text-xs font-semibold text-slate-300">
                          สัดส่วน:
                        </Label>
                        <div className="relative w-20">
                          <Input
                            id={`pct-${h.id}`}
                            type="number"
                            min={1}
                            max={100}
                            value={h.percentage}
                            onChange={(e) => handleUpdateHeir(h.id, "percentage", Number(e.target.value))}
                            className="h-7 text-xs bg-[#162136] border-[#283b5c] font-bold text-amber-300 pr-5 text-right"
                          />
                          <span className="absolute right-2 top-1 text-xs text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      {heirs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveHeir(h.id)}
                          className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                          title="ลบรายการทายาทนี้"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label>ชื่อ - สกุล ทายาท</Label>
                      <Input
                        value={h.fullName}
                        onChange={(e) => handleUpdateHeir(h.id, "fullName", e.target.value)}
                        className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                        placeholder="เช่น นางพิมพา ภักดีสยาม"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>ความสัมพันธ์</Label>
                      <select
                        value={h.relationship}
                        onChange={(e) => handleUpdateHeir(h.id, "relationship", e.target.value)}
                        className="w-full h-8 rounded-md bg-[#162136] border border-[#283b5c] text-xs text-white px-2"
                      >
                        {RELATION_OPTIONS.map((rel) => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label>เลขประจำตัวประชาชน (๑๓ หลัก)</Label>
                      <Input
                        value={h.nationalId}
                        maxLength={13}
                        onChange={(e) => handleUpdateHeir(h.id, "nationalId", e.target.value.replace(/\D/g, ""))}
                        className="h-8 text-xs bg-[#162136] border-[#283b5c] font-mono"
                        placeholder="1100400289112"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label>ธนาคาร</Label>
                      <select
                        value={h.bankName}
                        onChange={(e) => handleUpdateHeir(h.id, "bankName", e.target.value)}
                        className="w-full h-8 rounded-md bg-[#162136] border border-[#283b5c] text-xs text-white px-2"
                      >
                        {BANK_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label>เลขที่บัญชีเงินฝาก</Label>
                      <Input
                        value={h.bankAccountNumber}
                        onChange={(e) => handleUpdateHeir(h.id, "bankAccountNumber", e.target.value)}
                        className="h-8 text-xs bg-[#162136] border-[#283b5c] font-mono"
                        placeholder="เช่น 099-2-45812-4"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>เบอร์โทรศัพท์ทายาท</Label>
                      <Input
                        value={h.phone}
                        onChange={(e) => handleUpdateHeir(h.id, "phone", e.target.value)}
                        className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                        placeholder="089-xxx-xxxx"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: Witnesses & Commander Signatures info */}
          <Card className="border border-[#283b5c] bg-[#162136]">
            <CardHeader className="pb-3 border-b border-[#243656]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#1877F2]" />
                ข้อมูลพยานและผู้บังคับบัญชารับรอง
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-[#0d1526] border border-[#283b5c] space-y-2">
                  <p className="font-bold text-blue-300">พยานที่ ๑</p>
                  <div className="space-y-1">
                    <Label>ยศ - ชื่อ - สกุล</Label>
                    <Input
                      value={witness1Name}
                      onChange={(e) => setWitness1Name(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ตำแหน่ง</Label>
                    <Input
                      value={witness1Position}
                      onChange={(e) => setWitness1Position(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-md bg-[#0d1526] border border-[#283b5c] space-y-2">
                  <p className="font-bold text-blue-300">พยานที่ ๒</p>
                  <div className="space-y-1">
                    <Label>ยศ - ชื่อ - สกุล</Label>
                    <Input
                      value={witness2Name}
                      onChange={(e) => setWitness2Name(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ตำแหน่ง</Label>
                    <Input
                      value={witness2Position}
                      onChange={(e) => setWitness2Position(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#0d1526] border border-[#283b5c] space-y-2">
                <p className="font-bold text-amber-300">ผู้บังคับบัญชาระดับ ผบ.พัน / ผบ.ฉก. ผู้รับรอง</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>ยศ - ชื่อ - สกุล ผู้บังคับบัญชา</Label>
                    <Input
                      value={commanderName}
                      onChange={(e) => setCommanderName(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>ตำแหน่งผู้บังคับบัญชา</Label>
                    <Input
                      value={commanderPosition}
                      onChange={(e) => setCommanderPosition(e.target.value)}
                      className="h-8 text-xs bg-[#162136] border-[#283b5c]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Bottom Action */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("preview")}
              className="text-xs gap-1.5 border-[#283b5c] text-slate-200 hover:bg-[#162136]"
            >
              ดูตัวอย่างหน้าพิมพ์ (Preview)
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              disabled={!isPercentageValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm px-6"
            >
              <Printer className="h-4 w-4" />
              พิมพ์หนังสือแสดงเจตนา (Print A4)
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. OFFICIAL PRINTABLE DOCUMENT VIEW (A4 Page Style)             */}
      {/* ============================================================== */}
      <div className={viewMode === "preview" ? "block" : "hidden print:block"}>
        <div className="bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm max-w-[210mm] mx-auto min-h-[297mm] font-serif leading-relaxed text-[14px] border border-slate-300 print:border-0 print:shadow-none print:p-0 print:m-0">
          {/* Header with Garuda / Army Emblem */}
          <div className="text-center space-y-1 mb-6">
            <div className="relative h-20 w-20 mx-auto mb-2">
              <Image
                src="/images/logo.png"
                alt="ตราสัญลักษณ์กองทัพบก"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-black">
              หนังสือแสดงเจตนาระบุตัวผู้รับบำเหน็จตกทอด และเงินสงเคราะห์กำลังพล
            </h2>
            <p className="text-xs text-slate-800">
              กองทัพบก (ศูนย์ปฏิบัติการกองทัพบก • กรมกำลังพลทหารบก)
            </p>
          </div>

          {/* Date & Place */}
          <div className="text-right space-y-1 mb-5 text-[13px]">
            <p>ทำที่ {docPlace || "..........................................................."}</p>
            <p>
              วันที่ <b>{docDay}</b> เดือน <b>{docMonth}</b> พ.ศ. <b>{docYearBE}</b>
            </p>
          </div>

          {/* Declarant Statement */}
          <div className="space-y-3 mb-5 text-justify text-[13px] leading-relaxed">
            <p className="indent-8">
              ข้าพเจ้า <b>{rankTitle} {firstName} {lastName}</b> หมายเลขประจำตัวทหาร <b>{militaryId || "......................"}</b>{" "}
              หมายเลขประจำตัวประชาชน <b>{citizenId || "...................................."}</b>{" "}
              ตำแหน่ง <b>{position || "......................................."}</b>{" "}
              สังกัดปกติ <b>{normalUnit || "......................................."}</b>{" "}
              {fieldUnit && (
                <>
                  ปฏิบัติหน้าที่สนามในตำแหน่ง <b>{fieldPosition}</b> สังกัดสนาม <b>{fieldUnit}</b>{" "}
                </>
              )}
              {orderNo && (
                <>
                  ตาม <b>{orderNo}</b>{" "}
                </>
              )}
              ภูมิลำเนา/ที่อยู่ <b>{homeAddress || "...................................................................................................."}</b>{" "}
              โทรศัพท์ <b>{phone || "........................"}</b>
            </p>

            <p className="indent-8">
              ขอแสดงเจตนาระบุตัวบุคคลผู้มีสิทธิได้รับเงินบำเหน็จตกทอด เงินสินไหมทดแทนประกันภัยสงคราม เงินชดเชยการปฏิบัติหน้าที่ราชการสนาม และเงินสงเคราะห์ผู้ประสบภัยของกองทัพบก ในกรณีที่ข้าพเจ้าถึงแก่ความตายหรือสูญเสียเนื่องจากการปฏิบัติหน้าที่ราชการสนาม ดังมีรายชื่อและสัดส่วนร้อยละต่อไปนี้:
            </p>
          </div>

          {/* Heirs Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-black text-[12px]">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-black p-1.5 w-10">ลำดับ</th>
                  <th className="border border-black p-1.5">ชื่อ - สกุล ผู้รับผลประโยชน์</th>
                  <th className="border border-black p-1.5 w-28">ความสัมพันธ์</th>
                  <th className="border border-black p-1.5 w-32">เลขประจำตัวประชาชน</th>
                  <th className="border border-black p-1.5">ธนาคาร / เลขที่บัญชี</th>
                  <th className="border border-black p-1.5 w-20">สัดส่วน (%)</th>
                </tr>
              </thead>
              <tbody>
                {heirs.map((h, idx) => (
                  <tr key={h.id} className="text-center">
                    <td className="border border-black p-1.5 font-mono">{idx + 1}</td>
                    <td className="border border-black p-1.5 text-left font-semibold">{h.fullName || "-"}</td>
                    <td className="border border-black p-1.5">{h.relationship || "-"}</td>
                    <td className="border border-black p-1.5 font-mono">{h.nationalId || "-"}</td>
                    <td className="border border-black p-1.5 text-left text-[11px]">
                      {h.bankName ? `${h.bankName} ${h.bankAccountNumber}` : "-"}
                    </td>
                    <td className="border border-black p-1.5 font-bold font-mono">{h.percentage}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-center">
                  <td colSpan={5} className="border border-black p-1.5 text-right pr-4">
                    รวมทั้งสิ้น (Total Percentage)
                  </td>
                  <td className="border border-black p-1.5 font-mono text-[13px]">{totalPercentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Declaration Confirmation */}
          <div className="mb-8 text-justify text-[13px] leading-relaxed">
            <p className="indent-8">
              ข้าพเจ้าขอรับรองว่าการแสดงเจตนาระบุตัวบุคคลผู้มีสิทธิรับเงินสงเคราะห์และสิทธิประโยชน์ข้างต้น เป็นไปด้วยความสมัครใจของข้าพเจ้าเองโดยบริบูรณ์ มิได้ถูกบุคคลใดบังคับ ขู่เข็ญ หรือหลอกลวงแต่ประการใด จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้าพยาน
            </p>
          </div>

          {/* Signatures Area (4 Positions) */}
          <div className="grid grid-cols-2 gap-8 text-center text-[12px] pt-4 mb-6">
            {/* 1. Declarant Signature */}
            <div className="space-y-1">
              <p>ลายมือชื่อ ..................................................... ผู้แสดงเจตนา</p>
              <p>( <b>{rankTitle} {firstName} {lastName}</b> )</p>
              <p>ตำแหน่ง {position || "..................................................."}</p>
            </div>

            {/* 2. Witness 1 Signature */}
            <div className="space-y-1">
              <p>ลายมือชื่อ ..................................................... พยานที่ ๑</p>
              <p>( <b>{witness1Name || "..................................................."}</b> )</p>
              <p>ตำแหน่ง {witness1Position || "..................................................."}</p>
            </div>

            {/* 3. Witness 2 Signature */}
            <div className="space-y-1 pt-4">
              <p>ลายมือชื่อ ..................................................... พยานที่ ๒</p>
              <p>( <b>{witness2Name || "..................................................."}</b> )</p>
              <p>ตำแหน่ง {witness2Position || "..................................................."}</p>
            </div>

            {/* 4. Commander Verification Signature */}
            <div className="space-y-1 pt-4">
              <p>ลายมือชื่อ ..................................................... ผู้บังคับบัญชารับรอง</p>
              <p>( <b>{commanderName || "..................................................."}</b> )</p>
              <p>ตำแหน่ง {commanderPosition || "..................................................."}</p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-400 pt-3 text-[10px] text-slate-600 flex justify-between items-center">
            <span>แบบฟอร์มแสดงเจตนาระบุตัวทายาทผู้รับสิทธิประโยชน์ กองทัพบก (กพ.ทบ. • ศปก.ทบ.)</span>
            <span>วันที่พิมพ์: {new Date().toLocaleDateString("th-TH")} • ระบบ WeR-RTA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
