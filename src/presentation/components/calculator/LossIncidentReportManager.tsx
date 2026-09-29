"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as mgrs from "mgrs";
import dynamic from "next/dynamic";
import { searchAddressByProvince, ThaiAddressEntry } from "thai-address-database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Badge } from "@/presentation/components/ui/badge";
import { ThaiBuddhistDatePicker } from "./ThaiBuddhistDatePicker";
import {
  Crosshair,
  FileDown,
  FileText,
  MapPinned,
  PencilLine,
  Plus,
  Search,
  Trash2,
  Eye,
  Send,
  Printer,
  X,
} from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import type { IncidentCasualty, LossType, LossReportDispatchMeta } from "@/infrastructure/database/repositories/LossIncidentReportRepository";

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
  casualties?: IncidentCasualty[];
}

interface Props {
  personnelId?: string;
  militaryId?: string;
  rankAbbr?: string;
  firstName?: string;
  lastName?: string;
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
  () => import("./MgrsPickerMap").then((mod) => mod.MgrsPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-md border bg-white dark:bg-slate-950 flex items-center justify-center text-xs text-muted-foreground px-3 text-center">
        กำลังโหลดแผนที่...
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

export function LossIncidentReportManager({ personnelId, militaryId, rankAbbr, firstName, lastName }: Props) {
  const [reports, setReports] = useState<LossIncidentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [previewModal, setPreviewModal] = useState<{ open: boolean; template: "KP3" | "KP4"; reportId: string } | null>(null);

  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const [incidentHour = "00", incidentMinute = "00"] = /^\d{2}:\d{2}$/.test(form.incidentTime)
    ? form.incidentTime.split(":")
    : ["00", "00"];

  const updateIncidentTime = (part: "hour" | "minute", value: string) => {
    const nextHour = part === "hour" ? value : incidentHour;
    const nextMinute = part === "minute" ? value : incidentMinute;
    setForm((prev) => ({ ...prev, incidentTime: `${nextHour}:${nextMinute}` }));
  };

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
        text: `ปักหมุดสำเร็จ: ${lat.toFixed(6)}, ${lon.toFixed(6)} -> ${nextMgrs}`,
      });
    } catch {
      setMessage({ type: "error", text: "ไม่สามารถแปลงพิกัดจากแผนที่เป็น MGRS ได้" });
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return reports;
    return reports.filter((r) =>
      [
        r.militaryId,
        r.fullName,
        r.mgrsCoordinate,
        r.province,
        r.district,
        r.subdistrict,
        r.eventSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [reports, search]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = personnelId ? `?personnelId=${encodeURIComponent(personnelId)}` : "";
      const res = await fetch(`/api/loss-reports${query}`);
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
    fetchReports();
  }, [personnelId]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.incidentDate || !form.incidentTime || !form.mgrsCoordinate.trim() || !form.eventSummary.trim()) {
      setMessage({ type: "error", text: "กรุณากรอกข้อมูลสำคัญให้ครบ: วันเกิดเหตุ เวลา MGRS และรายละเอียดเหตุการณ์" });
      return;
    }

    if (!editingId && reports.length > 0) {
      const existing = reports[0];
      setMessage({
        type: "error",
        text: `กำลังพลท่านนี้มีรายงานการสูญเสียในระบบแล้ว (วันที่เกิดเหตุ: ${formatThaiDate(existing.incidentDate)}) ไม่สามารถรายงานซ้ำได้ หากต้องการปรับปรุงข้อมูลกรุณากดปุ่ม "แก้ไข" ในรายการด้านล่าง`,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        personnelId: personnelId || undefined,
        militaryId: militaryId || undefined,
        rankAbbr: rankAbbr || undefined,
        fullName: fullName || undefined,
        ...form,
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
        setMessage({ type: "success", text: editingId ? "บันทึกการแก้ไขรายงานการสูญเสียสำเร็จ" : "บันทึกรายงานการสูญเสียสำเร็จ" });
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
  };

  const deleteReport = async (id: string) => {
    if (!confirm("ยืนยันการลบรายงานการสูญเสียรายการนี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(`/api/loss-reports/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "ลบรายงานการสูญเสียสำเร็จ" });
        await fetchReports();
      } else {
        setMessage({ type: "error", text: json.error || "ลบรายงานการสูญเสียไม่สำเร็จ" });
      }
    } catch {
      setMessage({ type: "error", text: "ลบรายงานการสูญเสียไม่สำเร็จ" });
    }
  };

  const downloadReport = (id: string, template: "KP3" | "KP4", format: "docx" | "pdf") => {
    window.open(`/api/loss-reports/${id}/export?template=${template}&format=${format}`, "_blank");
  };

  const locationLine = [form.village && `หมู่บ้าน ${form.village}`, form.houseNo && `เลขที่ ${form.houseNo}`, form.road && `ถนน${form.road}`]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-emerald-600" />
          ระบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.3 / กพ.4)
        </CardTitle>
        <CardDescription className="text-xs">
          บันทึก แก้ไข และพิมพ์รายงานการสูญเสีย พร้อมแสดงพิกัด MGRS บนแผนที่ดิจิตอล
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {message && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            {message.text}
          </div>
        )}

        {!editingId && reports.length > 0 && (
          <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <span className="text-amber-600 font-bold text-base leading-none">⚠️</span>
            <div className="flex-1 space-y-1">
              <p className="font-bold text-amber-800 dark:text-amber-300">
                กำลังพลนี้มีบันทึกรายงานการสูญเสียในระบบแล้ว (ไม่สามารถรายงานซ้ำได้)
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                พบรายงานเมื่อวันที่ <strong>{formatThaiDate(reports[0].incidentDate)}</strong> เวลา {reports[0].incidentTime} น. หากต้องการแก้ไขข้อมูล กรุณากดปุ่ม <strong>"แก้ไข"</strong> ในตารางประวัติรายงานด้านล่าง
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ThaiBuddhistDatePicker
                label="วันเดือนปีที่เกิดเหตุสูญเสีย"
                value={form.incidentDate}
                onChange={(v) => setForm((prev) => ({ ...prev, incidentDate: v || "" }))}
                required
              />

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">เวลาที่เกิดเหตุ</Label>
                <div className="flex items-center gap-2">
                  <select
                    value={incidentHour}
                    onChange={(e) => updateIncidentTime("hour", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-mono"
                  >
                    {HOUR_OPTIONS.map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <span className="text-xs font-semibold text-slate-500">:</span>
                  <select
                    value={incidentMinute}
                    onChange={(e) => updateIncidentTime("minute", e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-mono"
                  >
                    {MINUTE_OPTIONS.map((minute) => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">รูปแบบเวลา 24 ชั่วโมง (HH:mm)</p>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">พิกัดที่เกิดเหตุ (MGRS)</Label>
                <Input
                  value={form.mgrsCoordinate}
                  onChange={(e) => setForm((prev) => ({ ...prev, mgrsCoordinate: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
                  className="text-xs font-mono"
                  placeholder="เช่น 47QPU1234567890"
                />
                {mapPoint ? (
                  <p className="text-[11px] text-emerald-700">พิกัดแปลงได้: {mapPoint.lat.toFixed(6)}, {mapPoint.lon.toFixed(6)} (คลิกบนแผนที่เพื่ออัปเดต MGRS อัตโนมัติ)</p>
                ) : (
                  <p className="text-[11px] text-amber-700">ยังไม่สามารถแปลงพิกัด MGRS ได้ (ตรวจรูปแบบอีกครั้ง หรือคลิกปักหมุดในแผนที่)</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">หมู่บ้าน</Label>
                <Input value={form.village} onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">เลขที่</Label>
                <Input value={form.houseNo} onChange={(e) => setForm((p) => ({ ...p, houseNo: e.target.value }))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ถนน</Label>
                <Input value={form.road} onChange={(e) => setForm((p) => ({ ...p, road: e.target.value }))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">จังหวัด</Label>
                <select
                  value={form.province}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      province: e.target.value,
                      district: "",
                      subdistrict: "",
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">-- เลือกจังหวัด (77 จังหวัด) --</option>
                  {provinceOptions.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">อำเภอ</Label>
                <select
                  value={form.district}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      district: e.target.value,
                      subdistrict: "",
                    }))
                  }
                  disabled={!form.province}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
                >
                  <option value="">-- เลือกอำเภอ --</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ตำบล</Label>
                <select
                  value={form.subdistrict}
                  onChange={(e) => setForm((p) => ({ ...p, subdistrict: e.target.value }))}
                  disabled={!form.province || !form.district}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-60"
                >
                  <option value="">-- เลือกตำบล --</option>
                  {subdistrictOptions.map((subdistrict) => (
                    <option key={subdistrict} value={subdistrict}>{subdistrict}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">รายละเอียดเหตุการณ์ พฤติกรรมโดยย่อ</Label>
                <textarea
                  rows={4}
                  value={form.eventSummary}
                  onChange={(e) => setForm((p) => ({ ...p, eventSummary: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">หมายเหตุเพิ่มเติม</Label>
                <textarea
                  rows={2}
                  value={form.behaviorSummary}
                  onChange={(e) => setForm((p) => ({ ...p, behaviorSummary: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">พฤติกรรม</Label>
                <select
                  value={form.engagementBehavior}
                  onChange={(e) => setForm((p) => ({ ...p, engagementBehavior: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="ปะทะ+ยิงต่อสู้">ปะทะ+ยิงต่อสู้</option>
                  <option value="ไม่ปะทะ">ไม่ปะทะ</option>
                  <option value="ปะทะแต่ไม่ยิงตอบโต้">ปะทะแต่ไม่ยิงตอบโต้</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">การถูกกระทำโดย</Label>
                <select
                  value={form.enemyAction}
                  onChange={(e) => setForm((p) => ({ ...p, enemyAction: e.target.value as "ENEMY" | "NO_ENEMY" }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="ENEMY">ข้าศึก</option>
                  <option value="NO_ENEMY">ไม่มีข้าศึก</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {editingId ? "บันทึกการแก้ไข" : "บันทึกรายงานการสูญเสีย"}
              </Button>
              <Button variant="outline" onClick={resetForm} className="text-xs">ล้างฟอร์ม</Button>
              <Button variant="outline" onClick={fetchReports} className="text-xs">รีเฟรชรายการ</Button>
              {personnelId && (
                <Badge variant="outline" className="text-[10px]">อ้างอิงกำลังพลปัจจุบัน: {rankAbbr} {fullName || "-"}</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Crosshair className="h-4 w-4 text-emerald-600" />
                แผนที่จริงสำหรับปักหมุด (คลิกเพื่อแปลงเป็น MGRS)
              </div>
              <MgrsPickerMap point={mapPoint} onPick={handleMapPick} />

              <div className="text-[11px] text-muted-foreground">
                {locationLine || "ยังไม่ได้ระบุสถานที่ย่อย"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-bold">รายการรายงานที่บันทึกแล้ว ({filtered.length})</div>
            <div className="relative w-full max-w-sm">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="text-xs h-8 pl-7" placeholder="ค้นหาเลขทหาร/ชื่อ/จังหวัด/MGRS" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                  <th className="py-2 pr-2">วันเกิดเหตุ</th>
                  <th className="py-2 pr-2">เวลา</th>
                  <th className="py-2 pr-2">กำลังพล</th>
                  <th className="py-2 pr-2">MGRS</th>
                  <th className="py-2 pr-2">สถานที่</th>
                  <th className="py-2 pr-2">พฤติกรรม</th>
                  <th className="py-2 pr-2">พิมพ์ กพ.3/กพ.4</th>
                  <th className="py-2">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-muted-foreground">กำลังโหลด...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-muted-foreground">ยังไม่มีข้อมูลรายงานการสูญเสีย</td>
                  </tr>
                ) : (
                  filtered.map((report) => (
                    <tr key={report.id} className="border-b border-slate-100 dark:border-slate-900 align-top">
                      <td className="py-2 pr-2 whitespace-nowrap">{formatThaiDate(report.incidentDate)}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">{report.incidentTime}</td>
                      <td className="py-2 pr-2">
                        <div className="font-semibold">{report.rankAbbr} {report.fullName}</div>
                        <div className="text-[10px] text-muted-foreground">{report.militaryId}</div>
                      </td>
                      <td className="py-2 pr-2 font-mono">{report.mgrsCoordinate}</td>
                      <td className="py-2 pr-2">
                        {[report.village && `หมู่บ้าน ${report.village}`, report.subdistrict && `ต.${report.subdistrict}`, report.district && `อ.${report.district}`, report.province && `จ.${report.province}`].filter(Boolean).join(" ") || "-"}
                      </td>
                      <td className="py-2 pr-2">
                        <div>{report.engagementBehavior}</div>
                        <Badge variant="outline" className="mt-1 text-[10px]">{report.enemyAction === "ENEMY" ? "ข้าศึก" : "ไม่มีข้าศึก"}</Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] px-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-800 flex items-center gap-1"
                            onClick={() => setPreviewModal({ open: true, template: "KP3", reportId: report.id })}
                            title="ดูตัวอย่าง กพ.3"
                          >
                            <Eye className="h-3 w-3" /> กพ.3
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 flex items-center gap-1"
                            onClick={() => setPreviewModal({ open: true, template: "KP4", reportId: report.id })}
                            title="ดูตัวอย่าง กพ.4"
                          >
                            <Eye className="h-3 w-3" /> กพ.4
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => downloadReport(report.id, "KP3", "docx")}>กพ.3 DOCX</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => downloadReport(report.id, "KP3", "pdf")}>กพ.3 PDF</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => downloadReport(report.id, "KP4", "docx")}>กพ.4 DOCX</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => downloadReport(report.id, "KP4", "pdf")}>กพ.4 PDF</Button>
                        </div>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-blue-600" onClick={() => editReport(report)} title="แก้ไข">
                            <PencilLine className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-rose-600" onClick={() => deleteReport(report.id)} title="ลบ">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => downloadReport(report.id, "KP3", "docx")} title="ดาวน์โหลด">
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      {/* ─── Document Preview Modal ─── */}
      {previewModal?.open && (() => {
        const previewReport = reports.find((r) => String(r.id) === String(previewModal.reportId));
        if (!previewReport) return null;

        const rawCasualties: IncidentCasualty[] =
          previewReport.casualties && previewReport.casualties.length > 0
            ? previewReport.casualties
            : previewReport.fullName || previewReport.militaryId
            ? [
                {
                  id: previewReport.personnelId || previewReport.id || "cas-1",
                  personnelId: previewReport.personnelId || null,
                  militaryId: previewReport.militaryId || "-",
                  rankAbbr: previewReport.rankAbbr || "",
                  fullName: previewReport.fullName || "-",
                  lossType: (previewReport.enemyAction === "ENEMY" ? "DECEASED" : "INJURED") as LossType,
                  lossSeverity: "บาดเจ็บจากการปฏิบัติหน้าที่ราชการ",
                  injuryDetails: previewReport.eventSummary || "",
                  hospital: "ค่ายสุรนารี",
                },
              ]
            : [];

        const casualties = rawCasualties;
        const loc = [
          previewReport.village && `หมู่บ้าน ${previewReport.village}`,
          previewReport.subdistrict && `ต.${previewReport.subdistrict}`,
          previewReport.district && `อ.${previewReport.district}`,
          previewReport.province && `จ.${previewReport.province}`,
        ]
          .filter(Boolean)
          .join(" ");

        const dateStr = formatThaiDate(previewReport.incidentDate);
        const totalCas = casualties.length;
        const deadC = casualties.filter((c) => c.lossType === "DECEASED").length;
        const injC = casualties.filter((c) => c.lossType === "INJURED").length;
        const disC = casualties.filter((c) => c.lossType === "DISABLED").length;

        const firstCas = casualties[0];
        const meta = {
          urgency: "ด่วนที่สุด",
          classification: "ลับมาก",
          fromUnit: firstCas?.fieldUnit || firstCas?.normalUnit || (previewReport.province ? `ฉก.${previewReport.province}` : "ร.6 พัน.2"),
          toUnit: "ผบ.ศปก.ทบ.",
          infoUnits: "ศปก.ทบ., กกล.สุรนารี, พล.ร.6, ฉก.1, ร.6, ร.6 พัน.1, ร.6 พัน.2",
          referenceNumber: `กห 0482.2.372/${previewReport.id ? previewReport.id.slice(-4) : "001"}`,
          missionForce: `ชุดปฏิบัติการ ${totalCas > 0 ? totalCas + 8 : 10} นาย`,
          writerName: "จ.ส.อ. สมเกียรติ มั่นคง",
          writerUnit: "ฝกร.พล.ร.6",
          writerPhone: "045-312-456 ต่อ 102",
          approverRank: "พ.อ.",
          approverName: "วีระยุทธ สุริยะวงศ์",
          equipmentDamage: "ไม่มีรายการยุทโธปกรณ์เสียหาย",
          commanderKP3Name: "เกรียงไกร ชัยชาญ",
          commanderKP3Rank: "ร.อ.",
          commanderKP3Pos: "ผู้บังคับกองร้อยอาวุธเบาที่ ๑",
          commander2KP3Name: "ชาญชัย มิ่งขวัญ",
          commander2KP3Rank: "พ.ท.",
          commander2KP3Pos: "ผู้บังคับกองพันทหารราบที่ ๒",
          commander3KP3Name: "วีระยุทธ สุริยะวงศ์",
          commander3KP3Rank: "พ.อ.",
          commander3KP3Pos: "ผู้บังคับหน่วยเฉพาะกิจที่ ๑",
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewModal(null);
            }}
          >
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full my-2 sm:my-4 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
              {/* Header */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 p-4 border-b ${
                  previewModal.template === "KP4"
                    ? "bg-gradient-to-r from-red-700 via-rose-800 to-red-950 text-white"
                    : "bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-950 text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-2.5 shadow-inner">
                    {previewModal.template === "KP4" ? (
                      <Send className="h-6 w-6 text-amber-300" />
                    ) : (
                      <FileText className="h-6 w-6 text-sky-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base sm:text-lg">
                        {previewModal.template === "KP4"
                          ? "กพ.๔ — กระดาษเขียนข่าว แบบ สส.๒"
                          : "กพ.๓ — แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ"}
                      </h2>
                      <span className="bg-white/20 text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/30">
                        {previewReport.mgrsCoordinate}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs mt-0.5">
                      {previewModal.template === "KP4"
                        ? "รายงานด่วนการสูญเสียกำลังพล (โทรพิมพ์ทางยุทธการ)"
                        : "แบบฟอร์มรายงานทางการฉบับสมบูรณ์ (เสนอผู้บังคับบัญชา ๓ ชั้น)"}
                      {" • "}
                      วันที่ {dateStr}
                    </p>
                  </div>
                </div>

                {/* Tabs & Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-black/30 p-1 rounded-lg flex items-center gap-1 border border-white/20">
                    <button
                      type="button"
                      onClick={() => setPreviewModal((prev) => (prev ? { ...prev, template: "KP3" } : null))}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        previewModal.template === "KP3"
                          ? "bg-white text-blue-900 shadow-md"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      )}
                    >
                      กพ.๓
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewModal((prev) => (prev ? { ...prev, template: "KP4" } : null))}
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
                        previewModal.template === "KP4"
                          ? "bg-white text-red-900 shadow-md"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      )}
                    >
                      กพ.๔
                    </button>
                  </div>

                  <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 text-xs h-8 px-2.5 flex items-center gap-1 bg-white/10"
                    onClick={() => {
                      window.open(
                        `/api/loss-reports/${previewModal.reportId}/export?template=${previewModal.template}&format=pdf`,
                        "_blank"
                      );
                    }}
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/20 text-xs h-8 px-2.5 flex items-center gap-1 bg-white/10"
                    onClick={() => {
                      window.open(
                        `/api/loss-reports/${previewModal.reportId}/export?template=${previewModal.template}&format=docx`,
                        "_blank"
                      );
                    }}
                  >
                    <FileDown className="h-3.5 w-3.5" /> Word
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs h-8 px-3 flex items-center gap-1 shadow"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" /> พิมพ์
                  </Button>
                  <button
                    onClick={() => setPreviewModal(null)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all ml-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Paper area */}
              <div className="p-4 sm:p-8 bg-slate-200 dark:bg-slate-950 overflow-y-auto flex-1 print:p-0 print:bg-white print:max-h-none">
                <div
                  className="bg-white text-slate-900 shadow-2xl mx-auto rounded-sm print:shadow-none print:m-0 print:p-0"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "20mm 20mm",
                    fontFamily: "'TH Sarabun New', 'Sarabun', 'Noto Sans Thai', serif",
                    fontSize: "14pt",
                    lineHeight: 1.6,
                    color: "#0f172a",
                    boxSizing: "border-box",
                  }}
                >
                  {previewModal.template === "KP4" ? (
                    <div style={{ color: "#0f172a" }}>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "22pt", marginBottom: 2 }}>
                        กระดาษเขียนข่าว
                      </div>
                      <div style={{ textAlign: "center", fontSize: "16pt", marginBottom: 10, color: "#334155" }}>
                        แบบ สส.๒
                      </div>

                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, border: "1.5px solid #334155", fontSize: "12pt", color: "#0f172a" }}>
                        <tbody>
                          <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", fontWeight: "bold", width: "25%" }}>ความเร่งด่วน<br />ผู้รับปฏิบัติ</td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", fontWeight: "bold", width: "25%" }}>ความเร่งด่วน<br />ผู้รับทราบ</td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", fontWeight: "bold", width: "22%" }}>หมู่ วัน/เวลา</td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", fontWeight: "bold", width: "28%" }}>คำแนะนำ</td>
                          </tr>
                          <tr style={{ height: 50 }}>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", textAlign: "center" }}>
                              <span style={{ color: "#b91c1c", fontWeight: "bold", fontSize: "20pt" }}>{meta.urgency}</span>
                            </td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>ด่วน</td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px", fontSize: "11pt", textAlign: "center" }}>{previewReport.incidentTime} น.<br />{dateStr}</td>
                            <td style={{ border: "1px solid #475569", padding: "4px 8px" }}></td>
                          </tr>
                        </tbody>
                      </table>

                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1.5px solid #334155", fontSize: "12pt", color: "#0f172a" }}>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", width: "16%", background: "#f8fafc" }}>จาก</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px" }} colSpan={3}>{meta.fromUnit}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", background: "#f8fafc" }} rowSpan={2}>ถึง</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", width: "18%", background: "#f8fafc" }}>ผู้รับปฏิบัติ</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px" }} colSpan={2}>{meta.toUnit}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", background: "#f8fafc" }}>ผู้รับทราบ</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontSize: "11pt" }} colSpan={2}>{meta.infoUnits}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", background: "#f8fafc" }}>หมู่คำ</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px" }} colSpan={3}>ประเภทเอกสาร {meta.classification}</td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px", fontWeight: "bold", background: "#f8fafc" }}>ที่ผู้ให้ข่าว</td>
                            <td style={{ border: "1px solid #475569", padding: "3px 8px" }} colSpan={3}>{meta.referenceNumber}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16pt", margin: "12px 0 8px" }}>
                        รายงานการสูญเสีย (กพ.๔)
                      </div>

                      <p style={{ margin: "0 0 6px", textIndent: "2.5em", textAlign: "justify" }}>
                        ๑. เมื่อ {previewReport.incidentTime} น. {dateStr} โดย {meta.fromUnit} ได้จัดกำลัง {meta.missionForce} ทำการ{previewReport.engagementBehavior} บริเวณ {loc || previewReport.mgrsCoordinate} พิกัด MGRS: {previewReport.mgrsCoordinate}&nbsp;
                        {previewReport.enemyAction === "ENEMY" ? "ถูกฝ่ายตรงข้าม / ข้าศึก ใช้อาวุธลอบโจมตี" : "เกิดเหตุการณ์ขณะปฏิบัติหน้าที่ราชการ"} ทำให้มีกำลังพลสูญเสียรวม {totalCas} นาย
                        {deadC > 0 ? ` (เสียชีวิต ${deadC} นาย` : ""}{injC > 0 ? `, บาดเจ็บ ${injC} นาย` : ""}{disC > 0 ? `, พิการ ${disC} นาย` : ""}{(deadC > 0 || injC > 0 || disC > 0) ? ")" : ""} ดังนี้
                      </p>

                      {casualties.map((c, idx) => (
                        <div key={c.id || idx} style={{ margin: "6px 0", paddingLeft: "2.5em" }}>
                          <p style={{ margin: "0 0 2px" }}>
                            <strong>๑.{idx + 1} {c.rankAbbr} {c.fullName}</strong> หมายเลขประจำตัวทหาร {c.militaryId || "-"}
                            {c.citizenId ? ` หมายเลขประจำตัวประชาชน ${c.citizenId}` : ""}
                            {c.bloodGroup ? <> กรุ๊ปเลือด <strong>{c.bloodGroup}</strong></> : ""}
                          </p>
                          <p style={{ margin: "0 0 2px", paddingLeft: "1.5em" }}>
                            <strong>ตำแหน่งปกติ</strong> {c.normalPosition || c.unit || "-"}&nbsp;&nbsp;
                            <strong>สังกัด</strong> {c.normalUnit || c.unit || "-"}
                          </p>
                          {(c.fieldPosition || c.fieldUnit) && (
                            <p style={{ margin: "0 0 2px", paddingLeft: "1.5em" }}>
                              <strong>ตำแหน่งในสนาม</strong> {c.fieldPosition || "-"}&nbsp;&nbsp;
                              <strong>หน่วย</strong> {c.fieldUnit || "-"}
                            </p>
                          )}
                          <p style={{ margin: "0", paddingLeft: "1.5em" }}>
                            <span style={{ color: c.lossType === "DECEASED" ? "#0f172a" : c.lossType === "DISABLED" ? "#b91c1c" : "#15803d", fontWeight: "bold" }}>
                              {c.lossType === "DECEASED" ? "เสียชีวิต" : c.lossType === "DISABLED" ? "พิการทุพพลภาพ" : "บาดเจ็บ"}
                            </span>
                            {c.lossSeverity ? ` (${c.lossSeverity})` : ""}
                            {c.injuryDetails ? ` ${c.injuryDetails}` : ""}
                            {c.hospital ? ` ปัจจุบัน นำส่ง รพ.${c.hospital}` : (c.lossType === "DECEASED" ? " เสียชีวิตในที่เกิดเหตุ" : "")}
                          </p>
                        </div>
                      ))}

                      {previewReport.eventSummary && (
                        <p style={{ margin: "10px 0 4px", textIndent: "2.5em", textAlign: "justify" }}>
                          ๒. {previewReport.eventSummary}
                        </p>
                      )}

                      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: "12pt" }}>
                        <div>
                          <div>ชื่อผู้เขียนข่าว {meta.writerName}</div>
                          <div>หน่วย {meta.writerUnit}</div>
                          <div>โทร {meta.writerPhone}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div>ลงชื่อ .................................................</div>
                          <div>({meta.approverRank} {meta.approverName})</div>
                          <div style={{ color: "#475569" }}>ผู้รับรองข่าว</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#0f172a" }}>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20pt", marginBottom: 4 }}>
                        แบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ
                      </div>
                      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "18pt", marginBottom: 4, color: "#1e3a8a" }}>
                        (กพ.๓)
                      </div>
                      <hr style={{ borderColor: "#94a3b8", marginBottom: 16 }} />

                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: "12pt", border: "1.5px solid #cbd5e1" }}>
                        <tbody>
                          {[
                            ["เลขที่รายงาน", previewReport.id],
                            ["วันที่เกิดเหตุ", dateStr],
                            ["เวลา", `${previewReport.incidentTime} น.`],
                            ["พิกัด MGRS", previewReport.mgrsCoordinate],
                            ["สถานที่เกิดเหตุ", loc || "-"],
                            ["พฤติการณ์การปะทะ", previewReport.engagementBehavior],
                            ["การกระทำโดย", previewReport.enemyAction === "ENEMY" ? "ฝ่ายตรงข้าม / ข้าศึก" : "ไม่มีข้าศึก (อุบัติเหตุ)"],
                            ["ยอดกำลังพลสูญเสียรวม", `${totalCas} นาย (เสียชีวิต ${deadC}, บาดเจ็บ ${injC}, พิการ ${disC})`],
                          ].map(([label, value]) => (
                            <tr key={String(label)}>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 8px", fontWeight: "bold", background: "#f1f5f9", width: "35%" }}>{label}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 8px" }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 8px" }}>
                        หมวดที่ ๒ บัญชีรายนามกำลังพลผู้ประสบความสูญเสีย ({totalCas} นาย)
                      </p>
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: "11pt", border: "1.5px solid #94a3b8" }}>
                        <thead>
                          <tr style={{ background: "#1e3a8a", color: "white" }}>
                            {["ลำดับ", "ยศ ชื่อ-สกุล", "เลขทหาร / ปชช.", "ตำแหน่ง / สังกัด", "กรุ๊ปเลือด", "ประเภท / อาการ", "รพ."].map((h) => (
                              <th key={h} style={{ border: "1px solid #64748b", padding: "5px 6px", textAlign: "center", color: "white" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {casualties.map((c, idx) => (
                            <tr key={c.id || idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", textAlign: "center" }}>{idx + 1}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", fontWeight: "bold" }}>{c.rankAbbr} {c.fullName}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", fontSize: "10pt" }}>ทหาร: {c.militaryId}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", fontSize: "10pt" }}>{c.normalPosition || c.unit || "-"}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px", textAlign: "center" }}>{c.bloodGroup || "-"}</td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>
                                <span style={{ color: c.lossType === "DECEASED" ? "#0f172a" : c.lossType === "DISABLED" ? "#b91c1c" : "#15803d", fontWeight: "bold" }}>
                                  {c.lossType === "DECEASED" ? "เสียชีวิต" : c.lossType === "DISABLED" ? "พิการทุพพลภาพ" : "บาดเจ็บ"}
                                </span>
                                {c.lossSeverity ? ` (${c.lossSeverity})` : ""}
                              </td>
                              <td style={{ border: "1px solid #cbd5e1", padding: "4px 6px" }}>{c.hospital ? `รพ.${c.hospital}` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 4px" }}>หมวดที่ ๓ พฤติการณ์เหตุการณ์</p>
                      <p style={{ paddingLeft: "2em", margin: "0 0 12px", textAlign: "justify" }}>{previewReport.eventSummary || "-"}</p>

                      <p style={{ fontWeight: "bold", fontSize: "14pt", margin: "12px 0 4px" }}>หมวดที่ ๔ ลายเซ็นผู้บังคับบัญชา</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt", border: "1.5px solid #cbd5e1" }}>
                        <tbody>
                          <tr>
                            {[
                              ["ผู้บังคับบัญชา ชั้นที่ ๑ (ผบ.ร้อย)", meta.commanderKP3Rank, meta.commanderKP3Name, meta.commanderKP3Pos],
                              ["ผู้บังคับบัญชา ชั้นที่ ๒ (ผบ.พัน)", meta.commander2KP3Rank, meta.commander2KP3Name, meta.commander2KP3Pos],
                              ["ผู้บังคับบัญชา ชั้นที่ ๓ (ผบ.ฉก.)", meta.commander3KP3Rank, meta.commander3KP3Name, meta.commander3KP3Pos],
                            ].map(([title, rank, name, pos]) => (
                              <td key={String(title)} style={{ border: "1px solid #cbd5e1", padding: "8px 10px", verticalAlign: "top", width: "33%", textAlign: "center" }}>
                                <div style={{ fontWeight: "bold", fontSize: "11pt", marginBottom: 8, color: "#1e3a8a" }}>{title}</div>
                                <div style={{ height: 45 }}></div>
                                <div>ลงชื่อ ...............................................</div>
                                <div style={{ fontWeight: "bold", marginTop: 2 }}>({rank || ""} {name || "........................................"})</div>
                                <div style={{ color: "#475569", fontSize: "10pt", marginTop: 2 }}>{pos}</div>
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
    </Card>
  );
}
