"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Search,
  Shield,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Banknote,
  FileCheck,
  PackageCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  User,
} from "lucide-react";
import { formatCurrency, formatThaiDate } from "../../lib/utils";

interface TimelineStep {
  step: number;
  key: string;
  title: string;
  description: string;
  date: string | null;
  status: "completed" | "current" | "pending";
}

interface TrackingItem {
  id: string;
  trackingNumber: string;
  benefitName: string;
  benefitCategory: string;
  categoryLabel: string;
  requestedAmount: number;
  approvedAmount: number | null;
  disbursedAmount: number | null;
  paymentMethod: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  paymentReference?: string | null;
  currentStatus: string;
  statusLabel: string;
  notes?: string | null;
  timeline: TimelineStep[];
}

interface PersonInfo {
  fullName: string;
  nationalId: string;
  rankAbbr?: string;
  relationship?: string;
  militaryId?: string;
  fieldUnit?: string;
  normalUnit?: string;
  orderNo?: string;
  lossType?: string;
  personnelId?: string;
}

const THAI_MONTHS_FULL = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

const CURRENT_BE_YEAR = new Date().getFullYear() + 543;
const BE_YEAR_OPTIONS = Array.from(
  { length: CURRENT_BE_YEAR - 2460 + 1 },
  (_, idx) => String(CURRENT_BE_YEAR - idx)
);

function getDaysInMonth(monthStr: string, yearBEStr: string): number {
  const month = parseInt(monthStr, 10);
  if (!month) return 31;
  const yearCE = yearBEStr ? parseInt(yearBEStr, 10) - 543 : 2000;
  return new Date(yearCE, month, 0).getDate();
}

export function PublicBenefitTrackingWidget() {
  const [nationalId, setNationalId] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYearBE, setBirthYearBE] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personInfo, setPersonInfo] = useState<PersonInfo | null>(null);
  const [trackingList, setTrackingList] = useState<TrackingItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const maxDaysInMonth = getDaysInMonth(birthMonth, birthYearBE);
  const dayOptions = Array.from({ length: maxDaysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));

  const birthDate =
    birthDay && birthMonth && birthYearBE
      ? `${parseInt(birthYearBE, 10) - 543}-${birthMonth}-${birthDay}`
      : "";

  // Auto-format 13-digit Thai national ID input
  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
    setNationalId(raw);
    if (error) setError(null);
  };

  const formatNationalIdDisplay = (id: string) => {
    if (!id || id.length !== 13) return id;
    return `${id.slice(0, 1)}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id.slice(12)}`;
  };

  const maskNationalId = (id: string) => {
    if (!id || id.length !== 13) return id;
    return `${id.slice(0, 1)}-${id.slice(1, 5)}-${id.slice(5, 9)}x-xx-${id.slice(12)}`;
  };

  // Sample quick-fill buttons for instant testing (accepts ISO C.E. YYYY-MM-DD and converts to B.E.)
  const setSampleData = (sampleId: string, sampleDobISO: string) => {
    setNationalId(sampleId);
    const [y, m, d] = sampleDobISO.split("-");
    if (y && m && d) {
      setBirthYearBE(String(parseInt(y, 10) + 543));
      setBirthMonth(m.padStart(2, "0"));
      setBirthDay(d.padStart(2, "0"));
    }
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId || nationalId.length !== 13) {
      setError("กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ครบถ้วน");
      return;
    }
    if (!birthDay || !birthMonth || !birthYearBE) {
      setError("กรุณาเลือกวัน เดือน และปี พ.ศ. เกิดให้ครบถ้วน");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId, birthDate }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "ไม่พบข้อมูลที่ตรงกับเงื่อนไข กรุณาตรวจสอบเลขบัตร ปชช. และวันเกิด");
        setPersonInfo(null);
        setTrackingList([]);
      } else {
        setPersonInfo(json.data.person);
        setTrackingList(json.data.items || []);
        setError(null);
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
      setPersonInfo(null);
      setTrackingList([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const handleReset = () => {
    setNationalId("");
    setBirthDay("");
    setBirthMonth("");
    setBirthYearBE("");
    setPersonInfo(null);
    setTrackingList([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <div id="benefit-tracking-inquiry" className="w-full max-w-5xl mx-auto space-y-6">
      {/* Search Container Card */}
      <Card className="border border-[#283b5c] bg-[#162136] shadow-md rounded-lg overflow-hidden">
        {/* Official Government Blue & Gold Top Banner Stripe */}
        <div className="h-1.5 w-full bg-[#1877F2] flex">
          <div className="h-full w-32 bg-amber-400" />
        </div>

        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="army" className="text-[11px] font-semibold py-0.5 px-2">
                  ระบบ WeR-RTA Tracking
                </Badge>
                <span className="text-xs text-blue-300/80">
                  ศปก.ทบ. • กพ.ทบ.
                </span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-center gap-2">
                <Search className="h-5 w-5 text-[#1877F2]" />
                ติดตามสถานะสิทธิและสวัสดิการกำลังพล
              </CardTitle>
              <CardDescription className="text-xs text-slate-300 mt-1">
                ตรวจสอบความคืบหน้าการพิจารณาสิทธิ เงินสงเคราะห์ บำนาญพิเศษ และทุนการศึกษา ด้วยเลขบัตรประชาชนและวันเกิด
              </CardDescription>
            </div>

            {hasSearched && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                ค้นหาใหม่
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Inquiry Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* National ID (13 Digits) */}
              <div className="space-y-1.5">
                <Label htmlFor="tracking-national-id" className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                  เลขประจำตัวประชาชน 13 หลัก <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="tracking-national-id"
                  type="text"
                  maxLength={13}
                  value={nationalId}
                  onChange={handleNationalIdChange}
                  placeholder="เช่น 3100600492811 หรือ 1100400289112"
                  className="font-mono text-sm tracking-wide h-10 bg-[#0d1526] border-[#283b5c] text-white placeholder:text-slate-500 focus-visible:ring-[#1877F2]"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  {nationalId ? `รูปแบบ: ${formatNationalIdDisplay(nationalId)} (${nationalId.length}/13 หลัก)` : "ระบุตัวเลข 13 หลักของกำลังพลหรือทายาทผู้มีสิทธิ"}
                </p>
              </div>

              {/* Date of Birth (Thai Buddhist Era พ.ศ.) */}
              <div className="space-y-1.5">
                <Label htmlFor="tracking-birth-day" className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  วันเดือนปีเกิด (พ.ศ.) <span className="text-rose-400">*</span>
                </Label>
                <div className="grid grid-cols-12 gap-2">
                  {/* วัน */}
                  <select
                    id="tracking-birth-day"
                    aria-label="วันเกิด"
                    value={birthDay}
                    onChange={(e) => {
                      setBirthDay(e.target.value);
                      if (error) setError(null);
                    }}
                    className="col-span-3 h-10 rounded-md border border-[#283b5c] bg-[#0d1526] text-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                    required
                  >
                    <option value="">วัน</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        {parseInt(d, 10)}
                      </option>
                    ))}
                  </select>

                  {/* เดือน */}
                  <select
                    id="tracking-birth-month"
                    aria-label="เดือนเกิด"
                    value={birthMonth}
                    onChange={(e) => {
                      const nextMonth = e.target.value;
                      setBirthMonth(nextMonth);
                      const maxD = getDaysInMonth(nextMonth, birthYearBE);
                      if (birthDay && parseInt(birthDay, 10) > maxD) {
                        setBirthDay(String(maxD).padStart(2, "0"));
                      }
                      if (error) setError(null);
                    }}
                    className="col-span-5 h-10 rounded-md border border-[#283b5c] bg-[#0d1526] text-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                    required
                  >
                    <option value="">เดือน</option>
                    {THAI_MONTHS_FULL.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {/* ปี พ.ศ. */}
                  <select
                    id="tracking-birth-year"
                    aria-label="ปี พ.ศ. เกิด"
                    value={birthYearBE}
                    onChange={(e) => {
                      const nextYearBE = e.target.value;
                      setBirthYearBE(nextYearBE);
                      const maxD = getDaysInMonth(birthMonth, nextYearBE);
                      if (birthDay && parseInt(birthDay, 10) > maxD) {
                        setBirthDay(String(maxD).padStart(2, "0"));
                      }
                      if (error) setError(null);
                    }}
                    className="col-span-4 h-10 rounded-md border border-[#283b5c] bg-[#0d1526] text-white px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1877F2]"
                    required
                  >
                    <option value="">ปี พ.ศ.</option>
                    {BE_YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        พ.ศ. {y}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  {birthDate
                    ? `วันเกิดที่เลือก: ${parseInt(birthDay, 10)} ${THAI_MONTHS_FULL.find((m) => m.value === birthMonth)?.label || ""} พ.ศ. ${birthYearBE}`
                    : "เลือกวัน เดือน และปี พ.ศ. เกิดเพื่อยืนยันตัวตนเจ้าของสิทธิ"}
                </p>
              </div>
            </div>

            {/* Quick Testing Presets */}
            <div className="rounded-md bg-[#111b2e] p-3 border border-[#243656] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                ตัวอย่างข้อมูลทดสอบระบบ:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSampleData("3100600492811", "1984-08-15")}
                  className="px-2.5 py-1 rounded border border-[#2e446b] bg-[#1a2942] hover:bg-[#1877F2] text-blue-100 hover:text-white font-medium text-[11px] transition-colors"
                >
                  กำลังพล จชต. (พ.ท. วีรชาติ)
                </button>
                <button
                  type="button"
                  onClick={() => setSampleData("1100400289112", "1986-11-20")}
                  className="px-2.5 py-1 rounded border border-[#2e446b] bg-[#1a2942] hover:bg-[#1877F2] text-blue-100 hover:text-white font-medium text-[11px] transition-colors"
                >
                  ทายาทคู่สมรส (นางพิมพา)
                </button>
                <button
                  type="button"
                  onClick={() => setSampleData("3940100284712", "1990-03-24")}
                  className="px-2.5 py-1 rounded border border-[#2e446b] bg-[#1a2942] hover:bg-[#1877F2] text-blue-100 hover:text-white font-medium text-[11px] transition-colors"
                >
                  กำลังพลทุพพลภาพ (ร.อ. ธนากร)
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs sm:text-sm font-semibold h-10 px-6 gap-2 shadow-sm border-0"
              >
                {loading ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    กำลังค้นหาและตรวจสอบสิทธิ...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 text-amber-300" />
                    ตรวจสอบสถานะและขั้นตอนสิทธิ
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Results: Verified Person & Tracking Timeline */}
          {personInfo && (
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Person Summary Card */}
              <div className="rounded-lg border border-[#1877F2]/40 bg-[#111e36] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#243656] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-md bg-[#1877F2] text-white">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {personInfo.fullName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        สถานะ: <strong className="text-blue-200">{personInfo.relationship || "ผู้มีสิทธิ"}</strong>
                        {personInfo.militaryId ? ` • เลขทหาร ${personInfo.militaryId}` : ""}
                      </p>
                    </div>
                  </div>

                  <Badge variant="army" className="text-xs self-start sm:self-auto py-1 px-2.5">
                    ยืนยันตัวตนถูกต้อง
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">เลขประจำตัวประชาชน:</span>
                    <span className="font-mono font-semibold text-white">
                      {maskNationalId(personInfo.nationalId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">หน่วยปฏิบัติราชการสนาม (ศปก.ทบ.):</span>
                    <span className="font-semibold text-blue-300 flex items-center gap-1">
                      <Shield className="h-3 w-3 shrink-0 text-[#1877F2]" />
                      {personInfo.fieldUnit || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">คำสั่งรับรองราชการสนาม:</span>
                    <span className="font-medium text-slate-100">
                      {personInfo.orderNo || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tracking Items & Step-by-Step Timelines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-[#1877F2]" />
                    รายการสิทธิประโยชน์ที่อยู่ในขั้นตอนการดำเนินงาน ({trackingList.length} รายการ)
                  </h4>
                  <span className="text-xs text-slate-400">
                    อัปเดตล่าสุด: วันนี้
                  </span>
                </div>

                {trackingList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-[#283b5c] rounded-md">
                    ไม่พบรายการสิทธิที่อยู่ระหว่างการติดตาม
                  </div>
                ) : (
                  trackingList.map((item, idx) => (
                    <Card
                      key={item.id || idx}
                      className="border border-[#283b5c] shadow-sm rounded-lg overflow-hidden bg-[#111b2e]"
                    >
                      {/* Item Header */}
                      <div className="p-4 bg-[#16233b] border-b border-[#243656] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1877F2]/20 border border-[#1877F2]/40 text-blue-200">
                              {item.trackingNumber}
                            </span>
                            <span className="text-[11px] font-semibold text-blue-300">
                              {item.categoryLabel}
                            </span>
                          </div>
                          <h5 className="font-bold text-sm text-white mt-1">
                            {item.benefitName}
                          </h5>
                          {item.notes && (
                            <p className="text-xs text-slate-300">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <Badge
                            className={`text-xs font-medium py-1 px-2.5 border-0 ${
                              item.currentStatus === "RECEIVED"
                                ? "bg-emerald-600 text-white"
                                : item.currentStatus === "DISBURSED"
                                ? "bg-[#1877F2] text-white"
                                : item.currentStatus === "APPROVED"
                                ? "bg-blue-600 text-white"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {item.statusLabel}
                          </Badge>
                          {item.approvedAmount ? (
                            <div className="font-mono font-bold text-sm text-white mt-1">
                              {formatCurrency(item.approvedAmount)} บาท
                            </div>
                          ) : item.requestedAmount > 0 ? (
                            <div className="font-mono text-xs text-slate-300 mt-1">
                              วงเงินขอ: {formatCurrency(item.requestedAmount)} บาท
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-5">
                        {/* 5-Step Visual Timeline */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-blue-200">
                            ขั้นตอนการดำเนินการ (Tracking Timeline):
                          </div>

                          <div className="relative">
                            {/* Horizontal Line for Desktop */}
                            <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-[#283b5c] z-0" />

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
                              {item.timeline.map((step) => {
                                const isCompleted = step.status === "completed";
                                const isCurrent = step.status === "current";

                                return (
                                  <div
                                    key={step.step}
                                    className={`flex md:flex-col items-start gap-3 md:gap-2 p-2.5 rounded-md transition-all ${
                                      isCurrent
                                        ? "bg-[#1877F2]/15 border border-[#1877F2]"
                                        : "bg-[#162136] border border-[#243656]"
                                    }`}
                                  >
                                    {/* Step Circle Badge */}
                                    <div
                                      className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isCompleted
                                          ? "bg-[#1877F2] text-white shadow-xs"
                                          : isCurrent
                                          ? "bg-amber-500 text-white ring-4 ring-amber-500/30"
                                          : "bg-[#1f2e4a] text-slate-400"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                      ) : (
                                        step.step
                                      )}
                                    </div>

                                    {/* Step Info */}
                                    <div className="space-y-0.5 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`font-bold text-xs ${
                                            isCurrent
                                              ? "text-blue-200"
                                              : isCompleted
                                              ? "text-white"
                                              : "text-slate-400"
                                          }`}
                                        >
                                          {step.title}
                                        </span>
                                        {isCurrent && (
                                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-semibold animate-pulse">
                                            ปัจจุบัน
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-300 leading-snug">
                                        {step.description}
                                      </p>
                                      {step.date && (
                                        <span className="text-[10px] text-blue-300/80 font-mono block pt-0.5">
                                          {step.date}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Payment / Disbursement Details (if available) */}
                        {item.paymentMethod && (
                          <div className="rounded bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 block">วิธีการจ่ายเงิน:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{item.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">ธนาคาร & เลขที่บัญชี:</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {item.bankName || "ธนาคารกรุงไทย"} ({item.bankAccountNumber || "xxx-x-xx789-0"})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">เลขอ้างอิงคำสั่งจ่าย:</span>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {item.paymentReference || "อยู่ระหว่างออกคำสั่งจ่าย"}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
