"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import * as mgrs from "mgrs";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { ThaiBuddhistDatePicker } from "@/presentation/components/calculator/ThaiBuddhistDatePicker";
import { searchAddressByProvince, type ThaiAddressEntry } from "thai-address-database";
import type { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import type { IncidentCasualty, LossType, LossReportDispatchMeta } from "@/infrastructure/database/repositories/LossIncidentReportRepository";
import {
  FileDown,
  Trash2,
  Edit2,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
  MapPinned,
  Shield,
  Search,
  User,
  Users,
  ChevronRight,
  Sparkles,
  Building,
  AlertTriangle,
  UserPlus,
  PlusCircle,
  HeartCrack,
  Activity,
  UserX,
  Cross,
  Printer,
  X,
  Eye,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface LossIncidentReport {
  id: string;
  personnelId?: string | null;
  militaryId?: string | null;
  rankAbbr?: string | null;
  fullName?: string | null;
  incidentDate: string;
  incidentTime: string;
  mgrsCoordinate: string;
  latitude?: number | null;
  longitude?: number | null;
  village?: string | null;
  houseNo?: string | null;
  road?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  eventSummary: string;
  behaviorSummary?: string | null;
  engagementBehavior: string;
  enemyAction: "ENEMY" | "NO_ENEMY";
  casualties: IncidentCasualty[];
}

const DEFAULT_FORM = {
  incidentDate: "",
  incidentTime: "00:00",
  mgrsCoordinate: "",
  village: "",
  houseNo: "",
  road: "",
  subdistrict: "",
  district: "",
  province: "",
  eventSummary: "",
  behaviorSummary: "",
  engagementBehavior: "ปะทะ+ยิงต่อสู้",
  enemyAction: "ENEMY" as "ENEMY" | "NO_ENEMY",
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

const MgrsPickerMap = dynamic(
  () => import("@/presentation/components/calculator/MgrsPickerMap").then((mod) => mod.MgrsPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-md border bg-white dark:bg-slate-950 flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
        กำลังโหลดแผนที่ดิจิตอล...
      </div>
    ),
  }
);

function formatThaiDate(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const DEFAULT_DISPATCH_META: LossReportDispatchMeta = {
  urgency: "ด่วนที่สุด",
  classification: "ลับมาก",
  fromUnit: "",
  toUnit: "ผบ.ศปก.ทบ.",
  infoUnits: "ศปก.ทบ., กกล.สุรนารี, พล.ร.6, ฉก.1, ร.6, ร.6 พัน.1, ร.6 พัน.2",
  referenceNumber: "",
  missionForce: "",
  writerName: "",
  writerUnit: "",
  writerPhone: "",
  approverName: "",
  equipmentDamage: "",
  commanderKP3Name: "",
  commanderKP3Rank: "",
  commanderKP3Pos: "ผู้บังคับหมวด / ผู้บังคับร้อย",
  commander2KP3Name: "",
  commander2KP3Rank: "",
  commander2KP3Pos: "ผู้บังคับกองพัน",
  commander3KP3Name: "",
  commander3KP3Rank: "",
  commander3KP3Pos: "ผู้บังคับหน่วยเฉพาะกิจ",
};

export function LossIncidentReportTable() {
  // Personnel list state
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");
  const [selectedPersonnelToAdd, setSelectedPersonnelToAdd] = useState<string>("");

  // Casualties in the current form (1:N)
  const [formCasualties, setFormCasualties] = useState<IncidentCasualty[]>([]);

  // Dispatch meta (กพ.4 / สส.2 header)
  const [dispatchMeta, setDispatchMeta] = useState<LossReportDispatchMeta>(DEFAULT_DISPATCH_META);
  const [showDispatchForm, setShowDispatchForm] = useState(false);

  // Document preview modal
  const [previewModal, setPreviewModal] = useState<{ open: boolean; template: "KP3" | "KP4"; reportId: string } | null>(null);

  // Reports state
  const [reports, setReports] = useState<LossIncidentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [lossTypeFilter, setLossTypeFilter] = useState<string>("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const fetchPersonnel = async () => {
    try {
      const res = await fetch("/api/personnel");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPersonnelList(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch personnel:", err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loss-reports`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } catch {
      setMessage({ type: "error", text: "โหลดรายการรายงานการสูญเสียไม่สำเร็จ" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
    fetchReports();
  }, []);

  // Time parsing
  const [incidentHour = "00", incidentMinute = "00"] = /^\d{2}:\d{2}$/.test(form.incidentTime)
    ? form.incidentTime.split(":")
    : ["00", "00"];

  const updateIncidentTime = (part: "hour" | "minute", value: string) => {
    const nextHour = part === "hour" ? value : incidentHour;
    const nextMinute = part === "minute" ? value : incidentMinute;
    setForm((prev) => ({ ...prev, incidentTime: `${nextHour}:${nextMinute}` }));
  };

  // MGRS map
  const mapPoint = useMemo(() => {
    try {
      if (!form.mgrsCoordinate.trim()) return null;
      const [lon, lat] = mgrs.toPoint(form.mgrsCoordinate.trim());
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { lat: Number(lat), lon: Number(lon) };
    } catch {
      return null;
    }
  }, [form.mgrsCoordinate]);

  // Thai Address
  const thaiAddressRows = useMemo<ThaiAddressEntry[]>(() => {
    return searchAddressByProvince(".", 200000);
  }, []);

  const provinceOptions = useMemo(() => {
    const unique = Array.from(new Set(thaiAddressRows.map((item) => item.province)));
    return unique.sort((a, b) => a.localeCompare(b, "th"));
  }, [thaiAddressRows]);

  const districtOptions = useMemo(() => {
    if (!form.province) return [] as string[];
    const unique = Array.from(
      new Set(
        thaiAddressRows
          .filter((item) => item.province === form.province)
          .map((item) => item.amphoe)
      )
    );
    const sorted = unique.sort((a, b) => a.localeCompare(b, "th"));
    if (form.district && !sorted.includes(form.district)) sorted.unshift(form.district);
    return sorted;
  }, [thaiAddressRows, form.province, form.district]);

  const subdistrictOptions = useMemo(() => {
    if (!form.province || !form.district) return [] as string[];
    const unique = Array.from(
      new Set(
        thaiAddressRows
          .filter((item) => item.province === form.province && item.amphoe === form.district)
          .map((item) => item.district)
      )
    );
    const sorted = unique.sort((a, b) => a.localeCompare(b, "th"));
    if (form.subdistrict && !sorted.includes(form.subdistrict)) sorted.unshift(form.subdistrict);
    return sorted;
  }, [thaiAddressRows, form.province, form.district, form.subdistrict]);

  const handleMapPick = (lat: number, lon: number) => {
    try {
      const nextMgrs = mgrs.forward([lon, lat], 5).toUpperCase();
      setForm((prev) => ({ ...prev, mgrsCoordinate: nextMgrs }));
      setMessage({
        type: "success",
        text: `ปักหมุดสำเร็จ: ${lat.toFixed(6)}, ${lon.toFixed(6)} -> พิกัด MGRS: ${nextMgrs}`,
      });
    } catch {
      setMessage({ type: "error", text: "ไม่สามารถแปลงพิกัดจากแผนที่เป็น MGRS ได้" });
    }
  };

  // Search filtered personnel for selection
  const searchResultsPersonnel = useMemo(() => {
    if (!personnelSearchTerm.trim()) return personnelList.slice(0, 30);
    const term = personnelSearchTerm.toLowerCase();
    return personnelList.filter(
      (p) =>
        p.firstName.toLowerCase().includes(term) ||
        p.lastName.toLowerCase().includes(term) ||
        p.militaryId.toLowerCase().includes(term) ||
        p.citizenId.toLowerCase().includes(term) ||
        (p.rankAbbr && p.rankAbbr.toLowerCase().includes(term)) ||
        (p.normalUnit && p.normalUnit.toLowerCase().includes(term))
    );
  }, [personnelList, personnelSearchTerm]);

  // Add casualty to form with auto-fill from personnel registry
  const handleAddCasualty = (personnelId: string) => {
    if (!personnelId) return;
    const p = personnelList.find((item) => item.id === personnelId);
    if (!p) return;

    // Check if already in formCasualties
    if (formCasualties.some((c) => c.personnelId === p.id || c.militaryId === p.militaryId)) {
      setMessage({
        type: "error",
        text: `กำลังพล ${p.rankAbbr || ""} ${p.firstName} ${p.lastName} มีรายชื่ออยู่ในเหตุการณ์นี้แล้ว`,
      });
      return;
    }

    // Build salary level string from personnel data
    const salaryLevelStr = p.salaryLevel && p.salaryStep
      ? `${p.salaryLevel} ชั้น ${p.salaryStep}`
      : p.salaryLevel || "";

    const newCasualty: IncidentCasualty = {
      id: `cas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      personnelId: p.id,
      militaryId: p.militaryId,
      citizenId: (p as any).citizenId || "",
      rankAbbr: p.rankAbbr || "",
      fullName: `${p.firstName} ${p.lastName}`.trim(),
      unit: p.normalUnit || "-",
      normalPosition: p.abbreviatedPosition || "",
      normalUnit: p.normalUnit || "",
      fieldPosition: p.fieldPosition || "",
      fieldUnit: p.fieldUnit || "",
      bloodGroup: (p as any).bloodGroup || "",
      salaryLevel: salaryLevelStr,
      salaryAmount: p.salary || null,
      lossType: "DECEASED",
      lossSeverity: "เสียชีวิตทันทีในสนามรบ",
      injuryDetails: "",
      hospital: "",
      dutyStatus: "ปฏิบัติหน้าที่ในสนาม",
    };

    // Auto-fill dispatch meta fromUnit if not set
    if (!dispatchMeta.fromUnit && p.fieldUnit) {
      setDispatchMeta((prev) => ({ ...prev, fromUnit: p.fieldUnit || prev.fromUnit || "" }));
    }

    setFormCasualties((prev) => [...prev, newCasualty]);
    setSelectedPersonnelToAdd("");
    setPersonnelSearchTerm("");
    setMessage({
      type: "success",
      text: `เพิ่ม ${newCasualty.rankAbbr} ${newCasualty.fullName} ในรายชื่อผู้สูญเสียเรียบร้อย (Auto-fill ข้อมูลทหารจากทะเบียนแล้ว)`,
    });
  };

  // Update a casualty in form
  const handleUpdateCasualty = (id: string, updates: Partial<IncidentCasualty>) => {
    setFormCasualties((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        // Auto set default severity if lossType changed
        if (updates.lossType && updates.lossType !== c.lossType) {
          if (updates.lossType === "DECEASED") {
            updated.lossSeverity = "เสียชีวิตทันทีในสนามรบ";
          } else if (updates.lossType === "DISABLED") {
            updated.lossSeverity = "พิการทุพพลภาพขนาดหนัก";
          } else if (updates.lossType === "INJURED") {
            updated.lossSeverity = "บาดเจ็บสาหัส (อาการวิกฤต)";
          }
        }
        return updated;
      })
    );
  };

  // Remove a casualty from form
  const handleRemoveCasualty = (id: string) => {
    setFormCasualties((prev) => prev.filter((c) => c.id !== id));
  };

  // Form Reset
  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setFormCasualties([]);
    setDispatchMeta(DEFAULT_DISPATCH_META);
    setEditingId(null);
    setSelectedPersonnelToAdd("");
    setPersonnelSearchTerm("");
  };

  // Submit Incident Report
  const submit = async () => {
    if (!form.incidentDate || !form.incidentTime || !form.mgrsCoordinate.trim() || !form.eventSummary.trim()) {
      setMessage({
        type: "error",
        text: "กรุณากรอกข้อมูลสำคัญให้ครบ: วันเกิดเหตุ เวลา พิกัดทางทหาร MGRS และรายละเอียดเหตุการณ์",
      });
      return;
    }

    if (formCasualties.length === 0) {
      setMessage({
        type: "error",
        text: "กรุณาเพิ่มกำลังพลที่สูญเสียอย่างน้อย 1 นาย ในเหตุการณ์นี้ (ค้นหาและเลือกจากทะเบียนกำลังพล)",
      });
      return;
    }

    setSaving(true);
    try {
      const primary = formCasualties[0];
      const payload = {
        ...form,
        personnelId: primary?.personnelId || null,
        militaryId: primary?.militaryId || null,
        rankAbbr: primary?.rankAbbr || null,
        fullName: primary?.fullName || null,
        casualties: formCasualties,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/loss-reports/${editingId}` : "/api/loss-reports";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMessage({
          type: "success",
          text: editingId
            ? "บันทึกการแก้ไขรายงานการสูญเสียเรียบร้อยแล้ว"
            : `บันทึกรายงานการสูญเสียสำเร็จ (กำลังพลสูญเสีย ${formCasualties.length} นาย)`,
        });
        resetForm();
        await fetchReports();
      } else {
        setMessage({ type: "error", text: json.error || "บันทึกรายงานการสูญเสียไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "บันทึกรายงานการสูญเสียไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };

  // Edit an existing report
  const editReport = (report: LossIncidentReport) => {
    setEditingId(report.id);
    setForm({
      incidentDate: report.incidentDate,
      incidentTime: report.incidentTime,
      mgrsCoordinate: report.mgrsCoordinate,
      village: report.village || "",
      houseNo: report.houseNo || "",
      road: report.road || "",
      subdistrict: report.subdistrict || "",
      district: report.district || "",
      province: report.province || "",
      eventSummary: report.eventSummary,
      behaviorSummary: report.behaviorSummary || "",
      engagementBehavior: report.engagementBehavior,
      enemyAction: report.enemyAction,
    });

    if (report.casualties && report.casualties.length > 0) {
      setFormCasualties(report.casualties);
    } else if (report.militaryId || report.fullName) {
      setFormCasualties([
        {
          id: `cas-loaded-1`,
          personnelId: report.personnelId || null,
          militaryId: report.militaryId || "-",
          rankAbbr: report.rankAbbr || "",
          fullName: report.fullName || "-",
          lossType: "DECEASED",
          lossSeverity: "",
          injuryDetails: "",
          hospital: "",
        },
      ]);
    } else {
      setFormCasualties([]);
    }

    // Scroll up smoothly to form
    window.scrollTo({ top: 350, behavior: "smooth" });
    setMessage({
      type: "success",
      text: `กำลังแก้ไขรายงานเลขที่: ${report.id} (สามารถเพิ่ม/ลบ/แก้ไขกำลังพลและรายละเอียดเหตุการณ์ได้)`,
    });
  };

  // Delete a report
  const deleteReport = async (id: string) => {
    if (!confirm("ยืนยันการลบรายงานการสูญเสียรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      const res = await fetch(`/api/loss-reports/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "ลบรายงานการสูญเสียสำเร็จ" });
        if (editingId === id) resetForm();
        await fetchReports();
      } else {
        setMessage({ type: "error", text: json.error || "ลบรายงานการสูญเสียไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "ลบรายงานการสูญเสียไม่สำเร็จ" });
    }
  };

  // Download official documents
  const downloadReport = (id: string, template: "KP3" | "KP4", format: "docx" | "pdf") => {
    window.open(`/api/loss-reports/${id}/export?template=${template}&format=${format}`, "_blank");
  };

  // Filtered reports for table
  const filteredReports = useMemo(() => {
    let result = reports;

    // Filter by search text
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter((r) => {
        const casualtyMatch = (r.casualties || []).some(
          (c) =>
            c.fullName.toLowerCase().includes(s) ||
            c.militaryId.toLowerCase().includes(s) ||
            (c.injuryDetails && c.injuryDetails.toLowerCase().includes(s)) ||
            (c.hospital && c.hospital.toLowerCase().includes(s)) ||
            (c.lossSeverity && c.lossSeverity.toLowerCase().includes(s))
        );

        return (
          casualtyMatch ||
          (r.militaryId && r.militaryId.toLowerCase().includes(s)) ||
          (r.fullName && r.fullName.toLowerCase().includes(s)) ||
          r.mgrsCoordinate.toLowerCase().includes(s) ||
          (r.province && r.province.toLowerCase().includes(s)) ||
          (r.district && r.district.toLowerCase().includes(s)) ||
          (r.subdistrict && r.subdistrict.toLowerCase().includes(s)) ||
          r.eventSummary.toLowerCase().includes(s)
        );
      });
    }

    // Filter by loss type
    if (lossTypeFilter !== "ALL") {
      result = result.filter((r) =>
        (r.casualties || []).some((c) => c.lossType === lossTypeFilter)
      );
    }

    return result;
  }, [reports, search, lossTypeFilter]);

  // Overall statistics metrics
  const totalIncidents = reports.length;
  const totalCasualties = useMemo(() => {
    return reports.reduce((acc, r) => acc + (r.casualties?.length || (r.militaryId ? 1 : 0)), 0);
  }, [reports]);

  const deceasedCount = useMemo(() => {
    return reports.reduce((acc, r) => {
      const count = (r.casualties || []).filter((c) => c.lossType === "DECEASED").length;
      return acc + (count > 0 ? count : (r.casualties?.length === 0 && r.militaryId ? 1 : 0));
    }, 0);
  }, [reports]);

  const disabledCount = useMemo(() => {
    return reports.reduce((acc, r) => {
      return acc + (r.casualties || []).filter((c) => c.lossType === "DISABLED").length;
    }, 0);
  }, [reports]);

  const injuredCount = useMemo(() => {
    return reports.reduce((acc, r) => {
      return acc + (r.casualties || []).filter((c) => c.lossType === "INJURED").length;
    }, 0);
  }, [reports]);

  // Count casualties in current form
  const formDeceasedCount = formCasualties.filter((c) => c.lossType === "DECEASED").length;
  const formDisabledCount = formCasualties.filter((c) => c.lossType === "DISABLED").length;
  const formInjuredCount = formCasualties.filter((c) => c.lossType === "INJURED").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-rose-900/40 dark:text-rose-300">
              Tab 5
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MapPinned className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              ระบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.3 / กพ.4)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            บันทึกรายงานเหตุการณ์สูญเสีย 1 เหตุการณ์ รองรับกำลังพลสูญเสียหลายนาย (เสียชีวิต, พิการทุพพลภาพ, บาดเจ็บ)
            พร้อมพิกัดทหาร MGRS และการส่งออกเอกสารราชการ
          </p>
        </div>
      </div>

      {/* 2. Step Flow Navigation Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <a
          href="/personnel"
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">2</div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-200">Tab 2: ทะเบียนกำลังพล</div>
            <div className="text-[10px] text-muted-foreground">ประวัติรับราชการ</div>
          </div>
        </a>

        <a
          href="/family"
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">3</div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-200">Tab 3: ข้อมูลครอบครัว</div>
            <div className="text-[10px] text-muted-foreground">คู่สมรส, บุตร</div>
          </div>
        </a>

        <a
          href="/heirs"
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">4</div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-200">Tab 4: ข้อมูลทายาท</div>
            <div className="text-[10px] text-muted-foreground">สัดส่วน % ทายาท</div>
          </div>
        </a>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-600 text-white shadow-sm font-semibold">
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center font-bold">5</div>
          <div>
            <div className="text-white">Tab 5: รายงานสูญเสีย (กำลังใช้งาน)</div>
            <div className="text-[10px] text-rose-100">กพ.3 / กพ.4 หลายกำลังพล</div>
          </div>
        </div>

        <a
          href="/calculator"
          className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
        >
          <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold">6</div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-200">Tab 6: คำนวณสิทธิ 4 หมวด</div>
            <div className="text-[10px] text-muted-foreground">ประมาณการสิทธิ</div>
          </div>
        </a>
      </div>

      {/* 3. Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/40 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">เหตุการณ์สูญเสียทั้งหมด</p>
              <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100">{totalIncidents} เหตุการณ์</h3>
            </div>
            <MapPinned className="h-8 w-8 text-rose-500/50" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/30 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">ยอดรวมกำลังพลสูญเสีย</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalCasualties} นาย</h3>
            </div>
            <Users className="h-8 w-8 text-slate-500/50" />
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">เสียชีวิต</p>
              <h3 className="text-xl font-bold text-red-700 dark:text-red-300">{deceasedCount} นาย</h3>
            </div>
            <HeartCrack className="h-8 w-8 text-red-500/50" />
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">พิการทุพพลภาพ</p>
              <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">{disabledCount} นาย</h3>
            </div>
            <Activity className="h-8 w-8 text-purple-500/50" />
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">บาดเจ็บ</p>
              <h3 className="text-xl font-bold text-amber-700 dark:text-amber-300">{injuredCount} นาย</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500/50" />
          </CardContent>
        </Card>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-lg border text-sm flex items-center justify-between shadow-sm transition-all ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessage(null)} className="h-6 w-6 p-0 text-current">
            ✕
          </Button>
        </div>
      )}

      {/* 4. Form Section: Multi-Casualty Incident Entry */}
      <Card className="border-rose-200 dark:border-rose-900/50 shadow-md">
        <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-slate-900 border-b border-rose-100 dark:border-rose-900/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-rose-900 dark:text-rose-200">
                <Shield className="h-5 w-5 text-rose-600" />
                {editingId ? "แก้ไขรายงานเหตุการณ์การสูญเสีย" : "บันทึกรายงานเหตุการณ์การสูญเสียใหม่"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5 text-rose-800/80 dark:text-rose-300/80">
                1 เหตุการณ์สามารถบันทึกกำลังพลผู้สูญเสียได้หลายนาย โดยเลือกประเภทการสูญเสีย (เสียชีวิต / พิการ / บาดเจ็บ) แต่ละบุคคล
              </CardDescription>
            </div>
            {editingId && (
              <Badge variant="outline" className="border-rose-500 text-rose-700 bg-rose-100 dark:bg-rose-900/50 px-3 py-1 self-start">
                กำลังอยู่ในโหมดแก้ไข (ID: {editingId})
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* SECTION 1: CASUALTIES LIST (กำลังพลที่สูญเสียในเหตุการณ์นี้) */}
          <div className="space-y-3 p-4 rounded-xl border-2 border-rose-200/80 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-900 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-sm text-foreground">
                  ส่วนที่ 1: รายนามกำลังพลที่สูญเสียในเหตุการณ์นี้
                </h3>
                <Badge className="bg-rose-600 text-white hover:bg-rose-700 text-xs">
                  {formCasualties.length} นาย
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-red-700 dark:text-red-400">เสียชีวิต {formDeceasedCount}</span>
                <span>•</span>
                <span className="text-purple-700 dark:text-purple-400">พิการ {formDisabledCount}</span>
                <span>•</span>
                <span className="text-amber-700 dark:text-amber-400">บาดเจ็บ {formInjuredCount}</span>
              </div>
            </div>

            {/* Personnel Selector from Registry */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="md:col-span-4 space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  ค้นหากำลังพลจากทะเบียน:
                </label>
                <Input
                  placeholder="พิมพ์ชื่อ, สกุล, เลขทหาร, หรือหน่วย..."
                  value={personnelSearchTerm}
                  onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="md:col-span-6 space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  เลือกกำลังพลเพื่อเพิ่มในเหตุการณ์นี้ ({searchResultsPersonnel.length} รายการ):
                </label>
                <Select value={selectedPersonnelToAdd} onValueChange={setSelectedPersonnelToAdd}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="-- คลิกเลือกกำลังพล --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {searchResultsPersonnel.map((p) => {
                      const alreadyAdded = formCasualties.some((c) => c.personnelId === p.id || c.militaryId === p.militaryId);
                      return (
                        <SelectItem key={p.id} value={p.id} disabled={alreadyAdded}>
                          <span className={alreadyAdded ? "text-muted-foreground line-through" : "font-medium"}>
                            {p.rankAbbr || ""} {p.firstName} {p.lastName} (เลขทหาร: {p.militaryId}) - {p.normalUnit || "ไม่ระบุหน่วย"}
                            {alreadyAdded && " (เพิ่มแล้ว)"}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={() => handleAddCasualty(selectedPersonnelToAdd)}
                  disabled={!selectedPersonnelToAdd}
                  className="w-full h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  เพิ่มในเหตุการณ์
                </Button>
              </div>
            </div>

            {/* Casualties Card List */}
            {formCasualties.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-rose-200 dark:border-rose-900 rounded-lg bg-white/50 dark:bg-slate-900/50">
                <UserX className="h-8 w-8 mx-auto text-rose-400 mb-1.5" />
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  ยังไม่ได้เพิ่มกำลังพลที่สูญเสียในเหตุการณ์นี้
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  กรุณาค้นหาและเลือกกำลังพลจากทะเบียนด้านบน แล้วกดปุ่ม &quot;เพิ่มในเหตุการณ์&quot; (เพิ่มได้มากกว่า 1 นาย)
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {formCasualties.map((cas, index) => (
                  <div
                    key={cas.id}
                    className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 shadow-sm space-y-3 transition-all hover:border-rose-300 dark:hover:border-rose-800"
                  >
                    {/* Casualty Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-foreground">
                            {cas.rankAbbr} {cas.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (เลขทหาร: <span className="font-mono">{cas.militaryId}</span>)
                          </span>
                          {cas.unit && (
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded ml-2">
                              {cas.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cas.lossType === "DECEASED" && (
                          <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1">
                            <HeartCrack className="h-3 w-3" /> เสียชีวิต
                          </Badge>
                        )}
                        {cas.lossType === "DISABLED" && (
                          <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-1">
                            <Activity className="h-3 w-3" /> พิการทุพพลภาพ
                          </Badge>
                        )}
                        {cas.lossType === "INJURED" && (
                          <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> บาดเจ็บ
                          </Badge>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCasualty(cas.id)}
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="ลบกำลังพลนายนี้ออกจากเหตุการณ์"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Casualty Loss Details Form */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                      {/* Loss Type Selector */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="font-semibold text-foreground flex items-center gap-1">
                          <span className="text-rose-500">*</span> ประเภ�                      {/* Citizen ID */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">เลขประจำตัวประชาชน ๑๓ หลัก:</label>
                        <Input
                          placeholder="เช่น 3100600492811"
                          value={cas.citizenId || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { citizenId: e.target.value })}
                          className="h-8 text-xs font-mono"
                          maxLength={13}
                        />
                      </div>

                      {/* Normal Position */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">ตำแหน่งปกติ:</label>
                        <Input
                          placeholder="เช่น ผบ.พัน.ร.1911"
                          value={cas.normalPosition || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { normalPosition: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Normal Unit */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">สังกัดปกติ:</label>
                        <Input
                          placeholder="เช่น ร.19 พัน.1 (พล.ร.9)"
                          value={cas.normalUnit || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { normalUnit: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Field Position */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">ตำแหน่งในสนาม:</label>
                        <Input
                          placeholder="เช่น ผบ.ฉก.นราธิวาส 30"
                          value={cas.fieldPosition || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { fieldPosition: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Field Unit */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">หน่วยสนาม:</label>
                        <Input
                          placeholder="เช่น ฉก.นราธิวาส (กกล.ทบ.)"
                          value={cas.fieldUnit || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { fieldUnit: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Salary Level */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">ระดับ/ชั้นเงินเดือน:</label>
                        <Input
                          placeholder="เช่น พ.1 ชั้น 16"
                          value={cas.salaryLevel || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { salaryLevel: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Salary Amount */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="font-semibold text-foreground">จำนวนเงินเดือน (บาท):</label>
                        <Input
                          type="number"
                          placeholder="เช่น 43500"
                          value={cas.salaryAmount ?? ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { salaryAmount: e.target.value ? Number(e.target.value) : null })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Injury / Loss Details */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="font-semibold text-foreground">รายละเอียดบาดแผล / อาการ (สำหรับ กพ.4):</label>
                        <Input
                          placeholder="เช่น มีอาการแน่นหน้าอกจากแรงระเบิด, ถูกกระสุนเข้าที่ลำตัว..."
                          value={cas.injuryDetails || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { injuryDetails: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Hospital / Facility */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">รพ.ที่ส่งรักษา:</label>
                        <Input
                          placeholder="เช่น รพ.ค่ายวชิราวุธ"
                          value={cas.hospital || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { hospital: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>                  {/* Injury / Loss Details */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="font-semibold text-foreground">รายละเอียดบาดแผล / อาการ (สำหรับ กพ.4):</label>
                        <Input
                          placeholder="เช่น มีอาการแน่นหน้าอกจากแรงระเบิด, ถูกกระสุนเข้าที่ลำตัว..."
                          value={cas.injuryDetails || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { injuryDetails: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Hospital / Facility */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">รพ.ที่ส่งรักษา:</label>
                        <Input
                          placeholder="เช่น รพ.ค่ายวชิราวุธ"
                          value={cas.hospital || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { hospital: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>                   </SelectItem>
                            <SelectItem value="INJURED" className="text-amber-600 font-bold">
                              🟡 บาดเจ็บ (Injured)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Loss Severity */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="font-semibold text-foreground">ระดับความรุนแรง / สภาพ:</label>
                        <Select
                          value={cas.lossSeverity || ""}
                          onValueChange={(val) => handleUpdateCasualty(cas.id, { lossSeverity: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="-- เลือกระดับความรุนแรง --" />
                          </SelectTrigger>
                          <SelectContent>
                            {cas.lossType === "DECEASED" && (
                              <>
                                <SelectItem value="เสียชีวิตทันทีในสนามรบ">เสียชีวิตทันทีในสนามรบ</SelectItem>
                                <SelectItem value="เสียชีวิตระหว่างส่งต่อรักษา">เสียชีวิตระหว่างส่งต่อรักษา</SelectItem>
                                <SelectItem value="เสียชีวิตขณะรับการรักษาที่โรงพยาบาล">เสียชีวิตขณะรับการรักษาที่โรงพยาบาล</SelectItem>
                              </>
                            )}
                            {cas.lossType === "DISABLED" && (
                              <>
                                <SelectItem value="พิการทุพพลภาพขนาดหนัก">พิการทุพพลภาพขนาดหนัก (ขนาด 1)</SelectItem>
                                <SelectItem value="พิการทุพพลภาพจนปลดประจำการ">พิการทุพพลภาพจนปลดประจำการ (ขนาด 2)</SelectItem>
                                <SelectItem value="สูญเสียอวัยวะสำคัญถาวร">สูญเสียอวัยวะสำคัญถาวร</SelectItem>
                              </>
                            )}
                            {cas.lossType === "INJURED" && (
                              <>
                                <SelectItem value="บาดเจ็บสาหัส (อาการวิกฤต)">บาดเจ็บสาหัส (อาการวิกฤต)</SelectItem>
                                <SelectItem value="บาดเจ็บปานกลาง">บาดเจ็บปานกลาง (ต้องพักฟื้น)</SelectItem>
                                <SelectItem value="บาดเจ็บเล็กน้อย">บาดเจ็บเล็กน้อย (ส่งตัวกลับหน่วยได้)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Injury / Loss Details */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="font-semibold text-foreground">รายละเอียดบาดแผล / อาการ:</label>
                        <Input
                          placeholder="เช่น ถูกสะเก็ดระเบิดที่ขาขวา, ถูกกระสุนปืนเข้าที่ลำตัว..."
                          value={cas.injuryDetails || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { injuryDetails: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Hospital / Facility */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-semibold text-foreground">รพ.ที่ส่งรักษา:</label>
                        <Input
                          placeholder="เช่น รพ.ค่ายวชิราวุธ..."
                          value={cas.hospital || ""}
                          onChange={(e) => handleUpdateCasualty(cas.id, { hospital: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: INCIDENT DATE, TIME & LOCATION */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
              <MapPin className="h-4 w-4 text-rose-600" />
              ส่วนที่ 2: วันเวลาและพิกัดสถานที่เกิดเหตุ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              {/* Date */}
              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-rose-500">*</span> วันเกิดเหตุ (พ.ศ.):
                </label>
                <ThaiBuddhistDatePicker
                  value={form.incidentDate}
                  onChange={(nextDate) => setForm((prev) => ({ ...prev, incidentDate: nextDate || "" }))}
                  placeholder="เลือกวันเกิดเหตุ..."
                  className="h-9 text-xs"
                />
              </div>

              {/* Time */}
              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-rose-500">*</span> เวลาที่เกิดเหตุ (24 ชม.):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Select value={incidentHour} onValueChange={(val) => updateIncidentTime("hour", val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="ชม." />
                    </SelectTrigger>
                    <SelectContent>
                      {HOUR_OPTIONS.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h} น.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={incidentMinute} onValueChange={(val) => updateIncidentTime("minute", val)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="นาที" />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTE_OPTIONS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m} นาที
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* MGRS Coordinates */}
              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <MapPinned className="h-3.5 w-3.5 text-rose-600" />
                  <span className="text-rose-500">*</span> พิกัดทางทหาร (MGRS):
                </label>
                <Input
                  value={form.mgrsCoordinate}
                  onChange={(e) => setForm((prev) => ({ ...prev, mgrsCoordinate: e.target.value.toUpperCase() }))}
                  placeholder="เช่น 47PNT12345678"
                  className="h-9 text-xs font-mono uppercase font-bold"
                />
              </div>

              {/* Address Cascade */}
              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">จังหวัด:</label>
                <Select
                  value={form.province}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, province: val, district: "", subdistrict: "" }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="-- เลือกจังหวัด --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {provinceOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">อำเภอ/เขต:</label>
                <Select
                  value={form.district}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, district: val, subdistrict: "" }))}
                  disabled={!form.province}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="-- เลือกอำเภอ --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {districtOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">ตำบล/แขวง:</label>
                <Select
                  value={form.subdistrict}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, subdistrict: val }))}
                  disabled={!form.district}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="-- เลือกตำบล --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {subdistrictOptions.map((sd) => (
                      <SelectItem key={sd} value={sd}>
                        {sd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">หมู่บ้าน / ชุมชน:</label>
                <Input
                  value={form.village}
                  onChange={(e) => setForm((prev) => ({ ...prev, village: e.target.value }))}
                  placeholder="เช่น บ้านโคกสูง หมู่ที่ 4"
                  className="h-8 text-xs"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">ถนน / ซอย:</label>
                <Input
                  value={form.road}
                  onChange={(e) => setForm((prev) => ({ ...prev, road: e.target.value }))}
                  placeholder="เช่น ถนนทางหลวงชนบท..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="font-semibold text-foreground">เลขที่บ้าน / อาคาร:</label>
                <Input
                  value={form.houseNo}
                  onChange={(e) => setForm((prev) => ({ ...prev, houseNo: e.target.value }))}
                  placeholder="เช่น 123/4"
                  className="h-8 text-xs"
                />
              </div>

              {/* Digital Map Picker */}
              <div className="md:col-span-12 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPinned className="h-3.5 w-3.5 text-rose-600" />
                    ปักหมุดบนแผนที่ดิจิตอลเพื่อหาพิกัด MGRS อัตโนมัติ:
                  </label>
                  {mapPoint && (
                    <span className="text-xs text-muted-foreground font-mono">
                      พิกัดภูมิศาสตร์: {mapPoint.lat.toFixed(6)}, {mapPoint.lon.toFixed(6)}
                    </span>
                  )}
                </div>
                <MgrsPickerMap
                  point={mapPoint}
                  onPick={handleMapPick}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ENGAGEMENT BEHAVIOR & EVENT SUMMARY */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
              <Shield className="h-4 w-4 text-rose-600" />
              ส่วนที่ 3: พฤติการณ์และรายละเอียดเหตุการณ์
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
              <div className="md:col-span-6 space-y-1">
                <label className="font-semibold text-foreground">พฤติกรรม / ลักษณะการปะทะ:</label>
                <Select
                  value={form.engagementBehavior}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, engagementBehavior: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ปะทะ+ยิงต่อสู้">ปะทะและยิงต่อสู้กับข้าศึก</SelectItem>
                    <SelectItem value="ถูกลอบยิง/ลอบวางระเบิด">ถูกลอบยิง / ถูกลอบวางระเบิด</SelectItem>
                    <SelectItem value="เหยียบกับระเบิด">เหยียบกับระเบิดขณะลาดตระเวน</SelectItem>
                    <SelectItem value="การรบประชิด/ซุ่มโจมตี">การรบประชิด / ถูกซุ่มโจมตี</SelectItem>
                    <SelectItem value="อุบัติเหตุจากการปฏิบัติหน้าที่ราชการ">อุบัติเหตุจากการปฏิบัติหน้าที่ราชการสนาม</SelectItem>
                    <SelectItem value="ช่วยเหลือประชาชนในภาวะสงคราม">ช่วยเหลือประชาชนในภาวะสงคราม/การรบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-6 space-y-1">
                <label className="font-semibold text-foreground">การกระทำของฝ่ายตรงข้าม:</label>
                <Select
                  value={form.enemyAction}
                  onValueChange={(val: "ENEMY" | "NO_ENEMY") => setForm((prev) => ({ ...prev, enemyAction: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENEMY">ข้าศึก / ผู้ก่อการร้าย / ผู้ก่อความไม่สงบ</SelectItem>
                    <SelectItem value="NO_ENEMY">อุบัติเหตุ / ภัยธรรมชาติ / ไม่มีข้าศึก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-12 space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <span className="text-rose-500">*</span> รายละเอียดเหตุการณ์ พฤติกรรมโดยย่อ (สำหรับออก กพ.3/กพ.4):
                </label>
                <textarea
                  value={form.eventSummary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, eventSummary: e.target.value }))}
                  placeholder="ระบุเหตุการณ์โดยละเอียด เช่น ขณะปฏิบัติหน้าที่ลาดตระเวนเส้นทาง ได้เกิดเหตุคนร้ายไม่ทราบจำนวนลอบวางระเบิดแสวงเครื่องและใช้อาวุธปืนสงครามยิงเข้าใส่..."
                  rows={3}
                  className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="md:col-span-12 space-y-1">
                <label className="font-semibold text-foreground">หมายเหตุเพิ่มเติม / ข้อมูลทางการแพทย์:</label>
                <Input
                  value={form.behaviorSummary}
                  onChange={(e) => setForm((prev) => ({ ...prev, behaviorSummary: e.target.value }))}
                  placeholder="ข้อมูลเพิ่มเติม เช่น ผลการสอบสวนข้อเท็จจริงเบื้องต้น หรือข้อสังเกตเพิ่มเติม..."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: DISPATCH META (กพ.4 / สส.2 Header) */}
          <div className="space-y-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
            <button
              type="button"
              className="w-full flex items-center justify-between text-sm font-bold text-blue-900 dark:text-blue-200 pb-2 border-b border-blue-200 dark:border-blue-900"
              onClick={() => setShowDispatchForm((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                ส่วนที่ 4: ข้อมูลหัวกระดาษเขียนข่าว สส.๒ (สำหรับ กพ.๔ ด่วน)
                <Badge className="bg-blue-600 text-white text-[10px] hover:bg-blue-700">กพ.๔ Dispatch Meta</Badge>
              </span>
              {showDispatchForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDispatchForm && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1">
                <div className="md:col-span-3 space-y-1">
                  <label className="font-semibold text-foreground">ความเร่งด่วน:</label>
                  <Select value={dispatchMeta.urgency || "ด่วนที่สุด"} onValueChange={(v) => setDispatchMeta((p) => ({ ...p, urgency: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ด่วนที่สุด">🔴 ด่วนที่สุด</SelectItem>
                      <SelectItem value="ด่วนมาก">🟠 ด่วนมาก</SelectItem>
                      <SelectItem value="ด่วน">🟡 ด่วน</SelectItem>
                      <SelectItem value="ปกติ">⚪ ปกติ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="font-semibold text-foreground">ชั้นความลับ:</label>
                  <Select value={dispatchMeta.classification || "ลับมาก"} onValueChange={(v) => setDispatchMeta((p) => ({ ...p, classification: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ลับที่สุด">🔴 ลับที่สุด</SelectItem>
                      <SelectItem value="ลับมาก">🟠 ลับมาก</SelectItem>
                      <SelectItem value="ลับ">🟡 ลับ</SelectItem>
                      <SelectItem value="ปกปิด">⚪ ปกปิด</SelectItem>
                      <SelectItem value="ไม่จัด">ไม่จัด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="font-semibold text-foreground">ที่ของผู้ให้ข่าว (เลขที่หนังสือ):</label>
                  <Input placeholder="เช่น กห 0482.2.372/575" value={dispatchMeta.referenceNumber || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, referenceNumber: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="font-semibold text-foreground">จาก (หน่วยต้นสาร):</label>
                  <Input placeholder="เช่น ผบ.พัน.ร.202 (RDF)" value={dispatchMeta.fromUnit || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, fromUnit: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="font-semibold text-foreground">ถึง ผู้รับปฏิบัติ:</label>
                  <Input placeholder="เช่น ผบ.ศปก.ทบ." value={dispatchMeta.toUnit || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, toUnit: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-12 space-y-1">
                  <label className="font-semibold text-foreground">ผู้รับทราบ (คั่นด้วย ,):</label>
                  <Input placeholder="เช่น ศปก.ทบ., กกล.สุรนารี, พล.ร.6, ฉก.1, ร.6, ร.6 พัน.1, ร.6 พัน.2" value={dispatchMeta.infoUnits || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, infoUnits: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="font-semibold text-foreground">ชุดปฏิบัติการ (กำลังพลที่จัด):</label>
                  <Input placeholder="เช่น ชุดปฏิบัติการ 14 นาย" value={dispatchMeta.missionForce || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, missionForce: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="font-semibold text-foreground">ผู้รับรองข่าว / อนุมัติ:</label>
                  <Input placeholder="เช่น พ.ต.วีรชาติ ภักดีสยาม" value={dispatchMeta.approverName || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, approverName: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="font-semibold text-foreground">ชื่อผู้เขียนข่าว:</label>
                  <Input placeholder="ชื่อ-สกุล" value={dispatchMeta.writerName || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, writerName: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="font-semibold text-foreground">หน่วยผู้เขียน:</label>
                  <Input placeholder="เช่น ร้อย.ซกร.พัน.ร.202" value={dispatchMeta.writerUnit || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, writerUnit: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="font-semibold text-foreground">โทร.ผู้เขียน:</label>
                  <Input placeholder="เช่น 08x-xxx-xxxx" value={dispatchMeta.writerPhone || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, writerPhone: e.target.value }))} className="h-8 text-xs" />
                </div>
                {/* KP3 Commander fields */}
                <div className="md:col-span-12 pt-1">
                  <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3 text-slate-500" /> ลายเซ็นผู้บังคับบัญชา (สำหรับ กพ.๓ ฉบับสมบูรณ์)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5 p-2 bg-white/60 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-[11px] text-muted-foreground">ชั้นที่ ๑ ผบ.ร้อย</p>
                      <Input placeholder="ยศ ชื่อ" value={dispatchMeta.commanderKP3Rank || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commanderKP3Rank: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ชื่อ-สกุล" value={dispatchMeta.commanderKP3Name || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commanderKP3Name: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ตำแหน่ง" value={dispatchMeta.commanderKP3Pos || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commanderKP3Pos: e.target.value }))} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1.5 p-2 bg-white/60 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-[11px] text-muted-foreground">ชั้นที่ ๒ ผบ.พัน</p>
                      <Input placeholder="ยศ ชื่อ" value={dispatchMeta.commander2KP3Rank || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander2KP3Rank: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ชื่อ-สกุล" value={dispatchMeta.commander2KP3Name || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander2KP3Name: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ตำแหน่ง" value={dispatchMeta.commander2KP3Pos || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander2KP3Pos: e.target.value }))} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1.5 p-2 bg-white/60 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-[11px] text-muted-foreground">ชั้นที่ ๓ ผบ.ฉก.</p>
                      <Input placeholder="ยศ ชื่อ" value={dispatchMeta.commander3KP3Rank || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander3KP3Rank: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ชื่อ-สกุล" value={dispatchMeta.commander3KP3Name || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander3KP3Name: e.target.value }))} className="h-7 text-xs" />
                      <Input placeholder="ตำแหน่ง" value={dispatchMeta.commander3KP3Pos || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, commander3KP3Pos: e.target.value }))} className="h-7 text-xs" />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-12 space-y-1">
                  <label className="font-semibold text-foreground">ความเสียหายยุทโธปกรณ์ (กพ.๓):</label>
                  <Input placeholder="เช่น รถยนต์ทหาร 1 คัน สภาพเสียหายทั้งคัน, อาวุธปืน M16A1 จำนวน 1 กระบอก" value={dispatchMeta.equipmentDamage || ""} onChange={(e) => setDispatchMeta((p) => ({ ...p, equipmentDamage: e.target.value }))} className="h-8 text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} className="text-xs h-9">
                ยกเลิกการแก้ไข
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="text-xs h-9"
              disabled={saving}
            >
              ล้างฟอร์ม
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 px-6 shadow-sm flex items-center gap-1.5"
            >
              {saving ? (
                <>กำลังบันทึก...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {editingId ? "บันทึกการแก้ไขรายงาน" : "บันทึกรายงานการสูญเสีย"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Loss Reports Table & Search */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-rose-600" />
                ตารางรายการรายงานการสูญเสียทั้งหมด ({filteredReports.length} ฉบับ)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                สามารถค้นหาตามชื่อกำลังพล, เลขทหาร, พิกัด MGRS, สถานที่เกิดเหตุ และสั่งพิมพ์/ส่งออก กพ.3 และ กพ.4
              </CardDescription>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <Select value={lossTypeFilter} onValueChange={setLossTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ประเภทสูญเสีย: ทั้งหมด</SelectItem>
                  <SelectItem value="DECEASED">🔴 เสียชีวิต</SelectItem>
                  <SelectItem value="DISABLED">🟣 พิการทุพพลภาพ</SelectItem>
                  <SelectItem value="INJURED">🟡 บาดเจ็บ</SelectItem>
                </SelectContent>
              </Select>

              {/* Search Box */}
              <div className="relative w-56">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารายงาน, ชื่อ, เลขทหาร..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-xs pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-900/50">
                  <TableHead className="text-xs font-bold w-12 text-center">ลำดับ</TableHead>
                  <TableHead className="text-xs font-bold w-36">วันเวลาเกิดเหตุ</TableHead>
                  <TableHead className="text-xs font-bold w-48">พิกัด MGRS & สถานที่</TableHead>
                  <TableHead className="text-xs font-bold min-w-[260px]">กำลังพลที่สูญเสีย</TableHead>
                  <TableHead className="text-xs font-bold min-w-[200px]">พฤติการณ์เหตุการณ์</TableHead>
                  <TableHead className="text-xs font-bold text-center w-48">เอกสาร & จัดการ</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      กำลังโหลดข้อมูลรายงานการสูญเสีย...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      {search || lossTypeFilter !== "ALL"
                        ? "ไม่พบข้อมูลรายงานการสูญเสียที่ตรงกับเงื่อนไขการค้นหา"
                        : "ยังไม่มีประวัติการบันทึกรายงานการสูญเสียในระบบ"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((row, idx) => {
                    const casualties = row.casualties || [];
                    const loc = [row.subdistrict && `ต.${row.subdistrict}`, row.district && `อ.${row.district}`, row.province && `จ.${row.province}`]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <TableCell className="text-center text-xs text-muted-foreground font-mono">
                          {idx + 1}
                        </TableCell>

                        {/* Date & Time */}
                        <TableCell className="text-xs">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatThaiDate(row.incidentDate)}
                          </div>
                          <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            เวลา {row.incidentTime} น.
                          </div>
                        </TableCell>

                        {/* MGRS & Location */}
                        <TableCell className="text-xs">
                          <div className="font-mono font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {row.mgrsCoordinate}
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5 line-clamp-1" title={loc}>
                            {loc || "-"}
                          </div>
                        </TableCell>

                        {/* Casualties List */}
                        <TableCell className="text-xs">
                          {casualties.length === 0 ? (
                            <div className="text-muted-foreground">
                              {row.fullName ? `${row.rankAbbr || ""} ${row.fullName}` : "-"}
                            </div>
                          ) : (
                            <div className="space-y-1.5 py-1">
                              <div className="text-[11px] font-semibold text-muted-foreground">
                                ยอดสูญเสียรวม {casualties.length} นาย:
                              </div>
                              <div className="flex flex-col gap-1">
                                {casualties.map((c, cIdx) => (
                                  <div
                                    key={c.id || cIdx}
                                    className="flex items-center gap-1.5 p-1 rounded bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px]"
                                  >
                                    {/* Loss Badge */}
                                    {c.lossType === "DECEASED" && (
                                      <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0">
                                        เสียชีวิต
                                      </span>
                                    )}
                                    {c.lossType === "DISABLED" && (
                                      <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0">
                                        พิการ
                                      </span>
                                    )}
                                    {c.lossType === "INJURED" && (
                                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0">
                                        บาดเจ็บ
                                      </span>
                                    )}

                                    <span className="font-semibold text-foreground">
                                      {c.rankAbbr} {c.fullName}
                                    </span>
                                    <span className="text-muted-foreground font-mono text-[10px]">
                                      ({c.militaryId})
                                    </span>
                                    {c.injuryDetails && (
                                      <span className="text-muted-foreground text-[10px] italic truncate max-w-[120px]" title={c.injuryDetails}>
                                        - {c.injuryDetails}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        {/* Engagement & Summary */}
                        <TableCell className="text-xs">
                          <div className="font-medium text-foreground">
                            {row.engagementBehavior}
                            <span className="text-[10px] text-muted-foreground ml-1.5">
                              ({row.enemyAction === "ENEMY" ? "ข้าศึก" : "ไม่มีข้าศึก"})
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5 line-clamp-2" title={row.eventSummary}>
                            {row.eventSummary}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-xs text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {/* Document Preview + Export Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {/* KP3 */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-800 flex items-center gap-0.5"
                                onClick={() => setPreviewModal({ open: true, template: "KP3", reportId: row.id })}
                                title="ดูตัวอย่าง/พิมพ์ กพ.3"
                              >
                                <Eye className="h-3 w-3" />
                                กพ.3
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                                onClick={() => downloadReport(row.id, "KP3", "docx")}
                                title="ดาวน์โหลด กพ.3 Word"
                              >
                                .doc
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                                onClick={() => downloadReport(row.id, "KP3", "pdf")}
                                title="ดาวน์โหลด กพ.3 PDF"
                              >
                                .pdf
                              </Button>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-1">
                              {/* KP4 */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 flex items-center gap-0.5"
                                onClick={() => setPreviewModal({ open: true, template: "KP4", reportId: row.id })}
                                title="ดูตัวอย่าง/พิมพ์ กพ.4 (สส.2)"
                              >
                                <Eye className="h-3 w-3" />
                                กพ.4
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800"
                                onClick={() => downloadReport(row.id, "KP4", "docx")}
                                title="ดาวน์โหลด กพ.4 Word"
                              >
                                .doc
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800"
                                onClick={() => downloadReport(row.id, "KP4", "pdf")}
                                title="ดาวน์โหลด กพ.4 PDF"
                              >
                                .pdf
                              </Button>
                            </div>

                            {/* Edit / Delete Buttons */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs px-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => editReport(row)}
                              >
                                <Edit2 className="h-3 w-3 mr-1 text-slate-500" />
                                แก้ไข
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                onClick={() => deleteReport(row.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1 text-rose-500" />
                                ลบ
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Document Preview Modal ─── */}
      {previewModal?.open && (() => {
        const previewReport = reports.find((r) => r.id === previewModal.reportId);
        if (!previewReport) return null;
        const casualties = previewReport.casualties || [];
        const loc = [previewReport.subdistrict && `ต.${previewReport.subdistrict}`, previewReport.district && `อ.${previewReport.district}`, previewReport.province && `จ.${previewReport.province}`].filter(Boolean).join(" ");
        const dateStr = formatThaiDate(previewReport.incidentDate);
        const totalCas = casualties.length;
        const deadC = casualties.filter((c) => c.lossType === "DECEASED").length;
        const injC = casualties.filter((c) => c.lossType === "INJURED").length;
        const disC = casualties.filter((c) => c.lossType === "DISABLED").length;
        const meta = dispatchMeta;

        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setPreviewModal(null); }}
          >
            {/* Modal container */}
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full my-4">
              {/* Modal header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                previewModal.template === "KP4"
                  ? "bg-gradient-to-r from-red-700 to-red-900 text-white"
                  : "bg-gradient-to-r from-blue-800 to-blue-950 text-white"
              } rounded-t-xl`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    {previewModal.template === "KP4" ? <Send className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">
                      {previewModal.template === "KP4"
                        ? "กพ.๔ — กระดาษเขียนข่าว แบบ สส.๒ (รายงานด่วนการสูญเสีย)"
                        : "กพ.๓ — แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (ฉบับสมบูรณ์)"}
                    </h2>
                    <p className="text-white/70 text-xs">ตัวอย่างเอกสาร A4 — {previewReport.mgrsCoordinate} — {dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 text-xs flex items-center gap-1"
                    onClick={() => { window.open(`/api/loss-reports/${previewModal.reportId}/export?template=${previewModal.template}&format=pdf`, "_blank"); }}
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 text-xs flex items-center gap-1"
                    onClick={() => { window.open(`/api/loss-reports/${previewModal.reportId}/export?template=${previewModal.template}&format=docx`, "_blank"); }}
                  >
                    <FileDown className="h-3.5 w-3.5" /> Word
                  </Button>
                  <Button
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs flex items-center gap-1"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" /> พิมพ์
                  </Button>
                  <button onClick={() => setPreviewModal(null)} className="text-white/80 hover:text-white ml-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* A4 Paper preview area */}
              <div className="p-6 bg-gray-100 dark:bg-slate-800 overflow-y-auto max-h-[calc(100vh-180px)] print:p-0 print:bg-white print:max-h-none">
                <div className="bg-white shadow-lg mx-auto print:shadow-none" style={{ width: "210mm", minHeight: "297mm", padding: "15mm 20mm", fontFamily: "'TH Sarabun New', 'Sarabun', 'Noto Sans Thai', serif", fontSize: "14pt", lineHeight: 1.8 }}>

                  {previewModal.template === "KP4" ? (
                    // ─── KP4 / สส.2 Template ─────────────────────────────────
                    <div>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "22pt", marginBottom: 4 }}>กระดาษเขียนข่าว</div>
                      <div style={{ textAlign: "center", fontSize: "16pt", marginBottom: 12 }}>แบบ สส.๒</div>

                      {/* Header table */}
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, border: "1px solid #888", fontSize: "12pt" }}>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", background: "#f0f0f0", fontWeight: "bold", width: "25%" }}>ความเร่งด่วน<br/>ผู้รับปฏิบัติ</td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", background: "#f0f0f0", fontWeight: "bold", width: "25%" }}>ความเร่งด่วน<br/>ผู้รับทราบ</td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", background: "#f0f0f0", fontWeight: "bold", width: "20%" }}>หมู่ วัน/เวลา</td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", background: "#f0f0f0", fontWeight: "bold", width: "30%" }}>คำแนะนำ</td>
                          </tr>
                          <tr style={{ height: 60 }}>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", textAlign: "center" }}>
                              <span style={{ color: "#CC0000", fontWeight: "bold", fontSize: "24pt" }}>{meta.urgency || "ด่วนที่สุด"}</span>
                            </td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px" }}>ด่วน</td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px", fontSize: "11pt" }}>{previewReport.incidentTime} น.<br/>{dateStr}</td>
                            <td style={{ border: "1px solid #888", padding: "4px 8px" }}></td>
                          </tr>
                        </tbody>
                      </table>

                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, border: "1px solid #888", fontSize: "12pt" }}>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", width: "18%", background: "#f8f8f8" }}>จาก</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px" }} colSpan={3}>{meta.fromUnit || "............................................"}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", background: "#f8f8f8" }} rowSpan={2}>ถึง</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", width: "20%", background: "#f8f8f8" }}>ผู้รับปฏิบัติ</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px" }} colSpan={2}>{meta.toUnit || "ผบ.ศปก.ทบ."}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", background: "#f8f8f8" }}>ผู้รับทราบ</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontSize: "11pt" }} colSpan={2}>{meta.infoUnits || "-"}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", background: "#f8f8f8" }}>หมู่คำ</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px" }} colSpan={3}>ประเภทเอกสาร {meta.classification || "ลับมาก"}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #888", padding: "3px 8px", fontWeight: "bold", background: "#f8f8f8" }}>ที่ผู้ให้ข่าว</td>
                            <td style={{ border: "1px solid #888", padding: "3px 8px" }} colSpan={3}>{meta.referenceNumber || `กห ${previewReport.id.slice(-6)}`}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16pt", margin: "12px 0 8px" }}>รายงานการสูญเสีย (กพ.๔)</div>

                      {/* Body content */}
                      <p style={{ margin: "0 0 4px", textIndent: "2em" }}>
                        ๑. เมื่อ {previewReport.incidentTime} น. {dateStr} โดย {meta.fromUnit || previewReport.mgrsCoordinate} ได้จัดกำลัง{meta.missionForce || `ชุดปฏิบัติการ ${totalCas + 8} นาย`} ทำการ{previewReport.engagementBehavior} บริเวณ {loc || previewReport.mgrsCoordinate} พิกัด MGRS: {previewReport.mgrsCoordinate}&nbsp;
                        {previewReport.enemyAction === "ENEMY" ? "ถูกฝ่ายตรงข้ามซุ่มโจมตี" : "เกิดเหตุ"} ทำให้มีกำลังพลสูญเสีย {totalCas} นาย
                        {deadC > 0 ? ` (เสียชีวิต ${deadC} นาย` : ""}{injC > 0 ? `, บาดเจ็บ ${injC} นาย` : ""}{disC > 0 ? `, พิการ ${disC} นาย` : ""}{(deadC > 0 || injC > 0 || disC > 0) ? ")" : ""} ดังนี้
                      </p>

                      {casualties.map((c, idx) => {
                        const lossMap: Record<string, string> = { DECEASED: "เสียชีวิต", INJURED: "บาดเจ็บ", DISABLED: "พิการทุพพลภาพ" };
                        const lossLabel = lossMap[c.lossType] || c.lossType;
                        return (
                          <div key={c.id} style={{ margin: "6px 0", paddingLeft: "2em" }}>
                            <p style={{ margin: "0 0 2px" }}>
                              <strong>๑.{idx + 1} {c.rankAbbr} {c.fullName}</strong>
                              {" "}หมายเลขประจำตัวทหาร {c.militaryId || "-"}
                              {c.citizenId ? <>  หมายเลขประจำตัวประชาชน {c.citizenId}</> : ""}
                              {c.bloodGroup ? <>  กรุ๊ปเลือด <strong>{c.bloodGroup}</strong></> : ""}
                            </p>
                            <p style={{ margin: "0 0 2px", paddingLeft: "2em" }}>
                              <strong>ตำแหน่งปกติ</strong> {c.normalPosition || c.unit || "-"}&nbsp;&nbsp;
                              <strong>สังกัด</strong> {c.normalUnit || c.unit || "-"}
                            </p>
                            {(c.fieldPosition || c.fieldUnit) && (
                              <p style={{ margin: "0 0 2px", paddingLeft: "2em" }}>
                                <strong>ตำแหน่งในสนาม</strong> {c.fieldPosition || "-"}&nbsp;&nbsp;
                                <strong>หน่วย</strong> {c.fieldUnit || "-"}
                              </p>
                            )}
                            {c.salaryLevel && (
                              <p style={{ margin: "0 0 2px", paddingLeft: "2em" }}>
                                รับเงินเดือน{c.salaryLevel}{c.salaryAmount ? ` (${c.salaryAmount.toLocaleString("th-TH")} บาท)` : ""}
                              </p>
                            )}
                            <p style={{ margin: "0", paddingLeft: "2em" }}>
                              <span style={{ color: c.lossType === "DECEASED" ? "#CC0000" : c.lossType === "INJURED" ? "#B35C00" : "#6600CC", fontWeight: "bold" }}>{lossLabel}</span>
                              {c.lossSeverity ? ` (${c.lossSeverity})` : ""}
                              {c.injuryDetails ? `  ${c.injuryDetails}` : ""}
                              {c.hospital ? `  ปัจจุบัน นำส่ง รพ.${c.hospital}` : (c.lossType === "DECEASED" ? "  เสียชีวิตในพื้นที่เหตุการณ์" : "")}
                            </p>
                          </div>
                        );
                      })}

                      {previewReport.eventSummary && (
                        <p style={{ margin: "10px 0 4px", textIndent: "2em" }}>
                          ๒. {previewReport.eventSummary}
                        </p>
                      )}

                      {previewReport.behaviorSummary && (
                        <p style={{ margin: "4px 0", textIndent: "2em" }}>
                          ๓. {previewReport.behaviorSummary}
                        </p>
                      )}

                      {/* Signature */}
                      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: "12pt" }}>
                        <div>
                          <div>ชื่อผู้เขียนข่าว {meta.writerName || "................................."}</div>
                          <div>หน่วย {meta.writerUnit || "................................."}</div>
                          <div>โทร {meta.writerPhone || "................................."}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div>ลงชื่อ .................................................</div>
                          <div>({meta.approverName || "........................................"})</div>
                          <div style={{ color: "#555" }}>ผู้รับรองข่าว</div>
                        </div>
                      </div>

                      {/* Comms table */}
                      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, border: "1px solid #888", fontSize: "10pt" }}>
                        <thead>
                          <tr style={{ background: "#eee" }}>
                            <th rowSpan={2} style={{ border: "1px solid #888", padding: "3px 6px" }}>สถานภาพ</th>
                            <th colSpan={4} style={{ border: "1px solid #888", padding: "3px 6px" }}>อ้างถึงข่าว</th>
                            <th colSpan={4} style={{ border: "1px solid #888", padding: "3px 6px" }}>ชื่อผู้เขียนข่าว</th>
                          </tr>
                          <tr style={{ background: "#eee" }}>
                            {["วันที่", "เวลา", "เครื่องสื่อสาร", "ชื่อพนักงาน", "วันที่", "เวลา", "เครื่องสื่อสาร", "ชื่อพนักงาน"].map((h, i) => (
                              <th key={i} style={{ border: "1px solid #888", padding: "2px 4px" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {["รับเมื่อ", "ส่งเสร็จ"].map((label) => (
                            <tr key={label} style={{ height: 36 }}>
                              <td style={{ border: "1px solid #888", padding: "2px 6px", background: "#f8f8f8", fontWeight: "bold", textAlign: "center" }}>{label}</td>
                              {Array(8).fill(null).map((_, i) => (
                                <td key={i} style={{ border: "1px solid #888", padding: "2px 4px" }}></td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // ─── KP3 Full Official Template ──────────────────────────
                    <div>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20pt", marginBottom: 4 }}>แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ</div>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "18pt", marginBottom: 4 }}>(กพ.๓)</div>
                      <hr style={{ borderColor: "#aaa", marginBottom: 16 }} />

                      {/* Meta table */}
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: "12pt", border: "1px solid #ccc" }}>
                        <tbody>
                          {[
                            ["เลขที่รายงาน", previewReport.id],
                            ["วันที่เกิดเหตุ", dateStr],
                            ["เวลา", `${previewReport.incidentTime} น.`],
                            ["พิกัด MGRS", previewReport.mgrsCoordinate],
                            ["Lat/Long", previewReport.latitude ? `${previewReport.latitude.toFixed(6)}, ${previewReport.longitude?.toFixed(6)}` : "-"],
                            ["สถานที่เกิดเหตุ", loc || "-"],
                            ["พฤติการณ์การปะทะ", previewReport.engagementBehavior],
                            ["การกระทำโดย", previewReport.enemyAction === "ENEMY" ? "ฝ่ายตรงข้าม / ข้าศึก" : "ไม่มีข้าศึก (อุบัติเหตุ)"],
                            ["ยอดกำลังพลสูญเสียรวม", `${totalCas} นาย (เสียชีวิต ${deadC}, บาดเจ็บ ${injC}, พิการ ${disC})`],
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <td style={{ border: "1px solid #ccc", padding: "4px 8px", fontWeight: "bold", background: "#f0f4f8", width: "35%" }}>{label}</td>
                              <td style={{ border: "1px solid #ccc", padding: "4px 8px" }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 8px" }}>หมวดที่ ๒  บัญชีรายนามกำลังพลผู้ประสบความสูญเสีย ({totalCas} นาย)</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: "11pt", border: "1px solid #ccc" }}>
                        <thead>
                          <tr style={{ background: "#1A3A6B", color: "white" }}>
                            {["ลำดับ", "ยศ ชื่อ-สกุล", "เลขทหาร / ปชช.", "ตำแหน่ง / สังกัด", "กรุ๊ปเลือด", "เงินเดือน", "ประเภท / อาการ", "รพ."].map((h) => (
                              <th key={h} style={{ border: "1px solid #999", padding: "4px 6px", textAlign: "center" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {casualties.map((c, idx) => {
                            const lossMap: Record<string, string> = { DECEASED: "เสียชีวิต", INJURED: "บาดเจ็บ", DISABLED: "พิการทุพพลภาพ" };
                            const lossLabel = lossMap[c.lossType] || c.lossType;
                            return (
                              <tr key={c.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8f8f8" }}>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", textAlign: "center" }}>{idx + 1}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", fontWeight: "bold" }}>{c.rankAbbr} {c.fullName}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", fontSize: "10pt" }}>ทหาร: {c.militaryId}<br/>{c.citizenId ? `ปชช.: ${c.citizenId}` : ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", fontSize: "10pt" }}>{c.normalPosition || c.unit || "-"}<br/>{c.normalUnit || ""}{c.fieldPosition ? <><br/>สนาม: {c.fieldPosition}</> : ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", textAlign: "center" }}>{c.bloodGroup || "-"}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px", fontSize: "10pt" }}>{c.salaryLevel || "-"}{c.salaryAmount ? <><br/>{c.salaryAmount.toLocaleString("th-TH")} บ.</> : ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px" }}>
                                  <span style={{ color: c.lossType === "DECEASED" ? "#CC0000" : c.lossType === "INJURED" ? "#B35C00" : "#6600CC", fontWeight: "bold" }}>{lossLabel}</span>
                                  {c.lossSeverity ? <><br/>{c.lossSeverity}</> : ""}
                                  {c.injuryDetails ? <><br/><span style={{ color: "#555", fontSize: "10pt" }}>{c.injuryDetails}</span></> : ""}
                                </td>
                                <td style={{ border: "1px solid #ccc", padding: "3px 6px" }}>{c.hospital ? `รพ.${c.hospital}` : "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 4px" }}>หมวดที่ ๓  พฤติการณ์เหตุการณ์</p>
                      <p style={{ paddingLeft: "2em", margin: "0 0 12px" }}>{previewReport.eventSummary || "-"}</p>

                      {previewReport.behaviorSummary && (
                        <><p style={{ fontWeight: "bold", margin: "8px 0 4px" }}>พฤติกรรมเพิ่มเติม / หมายเหตุ</p>
                        <p style={{ paddingLeft: "2em", margin: "0 0 12px" }}>{previewReport.behaviorSummary}</p></>
                      )}

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 4px" }}>หมวดที่ ๔  ความเสียหายยุทโธปกรณ์</p>
                      <p style={{ paddingLeft: "2em", margin: "0 0 12px" }}>{meta.equipmentDamage || "ไม่มีรายการยุทโธปกรณ์เสียหาย"}</p>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 4px" }}>หมวดที่ ๕  สิทธิที่กำลังพลพึงได้รับ</p>
                      <p style={{ paddingLeft: "2em" }}>กำลังพลที่สูญเสียจากการปฏิบัติหน้าที่ราชการมีสิทธิตามกฎหมาย ได้แก่ บำเหน็จตกทอด/เงินช่วยเหลือพิเศษ, เบี้ยหวัด/บำนาญ, ทุนการศึกษาบุตร และสิทธิมิใช่ตัวเงิน (เครื่องราชฯ/ปูนบำเหน็จพิเศษ)</p>

                      {/* Commander Sign */}
                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "16px 0 8px" }}>หมวดที่ ๖  ลายเซ็นผู้บังคับบัญชา</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt", border: "1px solid #ccc" }}>
                        <tbody>
                          <tr>
                            {[
                              ["ผู้บังคับบัญชา ชั้นที่ ๑ (ผบ.ร้อย)", meta.commanderKP3Rank, meta.commanderKP3Name, meta.commanderKP3Pos || "ผู้บังคับหมวด/ร้อย"],
                              ["ผู้บังคับบัญชา ชั้นที่ ๒ (ผบ.พัน)", meta.commander2KP3Rank, meta.commander2KP3Name, meta.commander2KP3Pos || "ผู้บังคับกองพัน"],
                              ["ผู้บังคับบัญชา ชั้นที่ ๓ (ผบ.ฉก.)", meta.commander3KP3Rank, meta.commander3KP3Name, meta.commander3KP3Pos || "ผู้บังคับหน่วยเฉพาะกิจ"],
                            ].map(([title, rank, name, pos]) => (
                              <td key={String(title)} style={{ border: "1px solid #ccc", padding: "8px 10px", verticalAlign: "top", width: "33%", textAlign: "center" }}>
                                <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: 8 }}>{title}</div>
                                <div style={{ height: 50 }}></div>
                                <div>ลงชื่อ ...............................................</div>
                                <div>({name || "........................................"})</div>
                                <div style={{ color: "#555", fontSize: "10pt" }}>{rank || ""} {pos}</div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
