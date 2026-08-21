"use client";

import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Progress } from "@/presentation/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  Save,
  ArrowRight,
  ArrowLeft,
  Users,
  Shield,
  Sliders,
  Filter,
  FileText,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface ImportErrorItem {
  sheet: "Personnel" | "Family" | "Benefits" | "General";
  rowNumber: number;
  column: string;
  invalidValue: any;
  severity: "ERROR" | "WARNING";
  message: string;
  suggestedFix: string;
}

interface ValidationData {
  fileName: string;
  isValid: boolean;
  sheetsFound: string[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  warningsCount: number;
  errors: ImportErrorItem[];
  parsedData: {
    personnel: any[];
    family: any[];
    benefits: any[];
  };
  committed?: boolean;
  commitResult?: {
    personnelSaved: number;
    familyLinked: number;
    benefitsSaved: number;
  };
}

export function ExcelImportWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "ERROR" | "WARNING">("ALL");
  const [filterSheet, setFilterSheet] = useState<string>("ALL");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("commit", "false");

      const res = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setValidationData(json.data);
        setStep(2);
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการตรวจสอบไฟล์");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("commit", "true");

      const res = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setValidationData(json.data);
        setStep(3);
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!validationData || validationData.errors.length === 0) return;

    const reportData = validationData.errors.map((e, idx) => ({
      ลำดับ: idx + 1,
      Sheet: e.sheet,
      แถวที่: e.rowNumber,
      คอลัมน์: e.column,
      ระดับความรุนแรง: e.severity === "ERROR" ? "ข้อผิดพลาดร้ายแรง (Error)" : "ข้อควรระวัง (Warning)",
      ข้อความแจ้งเตือน: e.message,
      ค่าที่ไม่ถูกต้อง: String(e.invalidValue || ""),
      คำแนะนำในการแก้ไข: e.suggestedFix,
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Error_Report");
    XLSX.writeFile(wb, `Error_Report_${validationData.fileName.replace(/\.[^/.]+$/, "")}.xlsx`);
  };

  const filteredErrors = (validationData?.errors || []).filter((e) => {
    const matchSeverity = filterSeverity === "ALL" || e.severity === filterSeverity;
    const matchSheet = filterSheet === "ALL" || e.sheet === filterSheet;
    return matchSeverity && matchSheet;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ระบบนำเข้าข้อมูล Excel (Excel Import Module)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            รองรับข้อมูล 3 ส่วน: 1.ทะเบียนกำลังพล (Personnel) 2.ข้อมูลครอบครัว (Family) 3.กฎเกณฑ์สิทธิประโยชน์ (Benefits)
          </p>
        </div>

        <a href="/api/import/excel?action=template" download="sittidop_import_template.xlsx">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 shadow-xs">
            <Download className="h-4 w-4 text-emerald-600" />
            ดาวน์โหลดไฟล์แม่แบบ Excel Template
          </Button>
        </a>
      </div>

      {/* Step Indicator */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {step === 1 && "ขั้นตอนที่ 1: เลือกและอัพโหลดไฟล์ Excel (.xlsx, .xls)"}
            {step === 2 && "ขั้นตอนที่ 2: ตรวจสอบความถูกต้องและรายงานข้อผิดพลาด (Validate before save)"}
            {step === 3 && "ขั้นตอนที่ 3: บันทึกข้อมูลเข้าสู่ระบบสำเร็จ (Committed & Saved)"}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600">
            {step === 1 ? "33%" : step === 2 ? "66%" : "100%"}
          </span>
        </div>
        <Progress value={step === 1 ? 33 : step === 2 ? 66 : 100} className="h-2" />
      </div>

      {/* Step 1: Upload & Drag Drop */}
      {step === 1 && (
        <Card className="border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                : file
                ? "border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10"
                : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-4">
              <UploadCloud className="h-8 w-8" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  ไฟล์ที่เลือก: {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  ขนาด: {(file.size / 1024).toFixed(1)} KB • คลิกเพื่อเปลี่ยนไฟล์
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  ลากไฟล์ Excel มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-xs text-muted-foreground">
                  รองรับไฟล์รูปแบบ .xlsx, .xls (ระบบตรวจสอบ Sheet: Personnel, Family, Benefits อัตโนมัติ)
                </p>
              </div>
            )}
          </div>

          {/* 3 Supported Sheets Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>1. ทะเบียนกำลังพล (Personnel)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                เลขทหาร, บัตรประชาชน, ยศ, ชื่อ-สกุล, เงินเดือน, อายุราชการทวีคูณ, ความสูญเสีย
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Users className="h-4 w-4 text-blue-600" />
                <span>2. ข้อมูลครอบครัว (Family)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                คู่สมรส, บุตร, บิดามารดา, สถานะการศึกษา, สัดส่วนการจัดสรรสิทธิ %
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Sliders className="h-4 w-4 text-amber-600" />
                <span>3. กฎเกณฑ์สิทธิ (Benefits)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                รหัสกฎเกณฑ์, ชื่อสิทธิประโยชน์ 4 หมวด, สูตรคำนวณ, ตัวคูณ, ฐานเงินคงที่
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-sm"
              onClick={handleValidate}
              disabled={!file || loading}
            >
              <FileCheck className="h-4 w-4" />
              {loading ? "กำลังตรวจสอบข้อมูลในไฟล์..." : "ตรวจสอบความถูกต้องของข้อมูล (Validate)"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Validation Results & Error Report */}
      {step === 2 && validationData && (
        <div className="space-y-6">
          {/* Top Validation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-slate-800 shadow-xs space-y-0.5">
              <span className="text-[11px] text-muted-foreground">จำนวนแถวข้อมูลทั้งหมด</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {validationData.totalRows} แถว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 shadow-xs space-y-0.5">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                แถวที่ถูกต้องสมบูรณ์
              </span>
              <p className="text-2xl font-black text-emerald-600 font-mono">
                {validationData.validRowsCount} แถว
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900 shadow-xs space-y-0.5">
              <span className="text-[11px] text-red-800 dark:text-red-300 font-semibold">
                ข้อผิดพลาดร้ายแรง (Error)
              </span>
              <p className="text-2xl font-black text-red-600 font-mono">
                {validationData.errors.filter((e) => e.severity === "ERROR").length} รายการ
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 shadow-xs space-y-0.5">
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                ข้อควรระวัง (Warning)
              </span>
              <p className="text-2xl font-black text-amber-600 font-mono">
                {validationData.warningsCount} รายการ
              </p>
            </div>
          </div>

          {/* Validation Status Banner */}
          {validationData.isValid ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">ไฟล์ผ่านการตรวจสอบความถูกต้องเรียบร้อยแล้ว (Ready to Save)</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    ข้อมูลทั้งหมดพร้อมบันทึกเข้าสู่ระบบฐานข้อมูลกำลังพลและสิทธิประโยชน์
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-red-900 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold">พบข้อผิดพลาดในไฟล์ Excel (Validation Failed)</p>
                  <p className="text-[11px] text-red-700 dark:text-red-300">
                    กรุณาตรวจสอบและแก้ไขข้อผิดพลาดตามรายงานด้านล่าง หรือส่งออกรายงานเพื่อแก้ไขใน Excel
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1.5 border-red-300 text-red-700 dark:border-red-800 dark:text-red-300 hover:bg-red-100"
                onClick={handleDownloadErrorReport}
              >
                <Download className="h-4 w-4" />
                ดาวน์โหลดรายงานข้อผิดพลาด (Error Report)
              </Button>
            </div>
          )}

          {/* Error & Warning Table Report */}
          {validationData.errors.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    รายงานรายละเอียดข้อผิดพลาด (Error & Warning Report)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    แสดงรายการแถวและคอลัมน์ที่ไม่ผ่านเกณฑ์การตรวจสอบพร้อมคำแนะนำในการแก้ไข
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterSeverity}
                    onChange={(e: any) => setFilterSeverity(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="ALL">ทุกระดับความรุนแรง</option>
                    <option value="ERROR">เฉพาะ Error</option>
                    <option value="WARNING">เฉพาะ Warning</option>
                  </select>

                  <select
                    value={filterSheet}
                    onChange={(e) => setFilterSheet(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="ALL">ทุก Sheet</option>
                    <option value="Personnel">Sheet: Personnel</option>
                    <option value="Family">Sheet: Family</option>
                    <option value="Benefits">Sheet: Benefits</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                    <TableRow>
                      <TableHead className="text-xs font-bold w-16">ระดับ</TableHead>
                      <TableHead className="text-xs font-bold w-24">Sheet / แถว</TableHead>
                      <TableHead className="text-xs font-bold w-28">คอลัมน์</TableHead>
                      <TableHead className="text-xs font-bold">ข้อความแจ้งเตือน</TableHead>
                      <TableHead className="text-xs font-bold">คำแนะนำในการแก้ไข</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.map((err, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                        <TableCell>
                          {err.severity === "ERROR" ? (
                            <Badge className="bg-red-600 text-white text-[9px]">ERROR</Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white text-[9px]">WARNING</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold">
                          {err.sheet} (แถว {err.rowNumber})
                        </TableCell>
                        <TableCell className="text-xs font-mono">{err.column}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {err.message}
                          {err.invalidValue && (
                            <span className="block text-[10px] text-red-600 font-mono">
                              ค่าที่พบ: "{String(err.invalidValue)}"
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{err.suggestedFix}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep(1);
                setValidationData(null);
              }}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              เลือกไฟล์ใหม่
            </Button>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-md"
              onClick={handleCommit}
              disabled={!validationData.isValid || loading}
            >
              <Save className="h-4 w-4" />
              {loading ? "กำลังบันทึกข้อมูล..." : "ยืนยันและบันทึกข้อมูลเข้าสู่ระบบ (Commit & Save)"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {step === 3 && validationData && (
        <Card className="border border-emerald-300 dark:border-emerald-800 p-8 space-y-6 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              นำเข้าข้อมูลจาก Excel เข้าสู่ระบบสำเร็จเรียบร้อยแล้ว
            </h2>
            <p className="text-xs text-muted-foreground">
              บันทึกข้อมูลลงฐานข้อมูลและพร้อมใช้งานในระบบคำนวณและออกหนังสือรับรองทันที
            </p>
          </div>

          {validationData.commitResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground">กำลังพลที่เพิ่มใหม่</span>
                <p className="text-2xl font-black text-emerald-600">
                  {validationData.commitResult.personnelSaved} นาย
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground">ข้อมูลครอบครัว/ทายาท</span>
                <p className="text-2xl font-black text-blue-600">
                  {validationData.commitResult.familyLinked} รายการ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground">กฎเกณฑ์สิทธิประโยชน์</span>
                <p className="text-2xl font-black text-purple-600">
                  {validationData.commitResult.benefitsSaved} กฎ
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFile(null);
                setValidationData(null);
                setStep(1);
              }}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              นำเข้าไฟล์อื่นเพิ่มเติม
            </Button>

            <Link href="/personnel">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                <Shield className="h-4 w-4" />
                ดูทะเบียนกำลังพล (Personnel)
              </Button>
            </Link>

            <Link href="/calculator">
              <Button size="sm" variant="secondary" className="text-xs gap-1.5">
                <FileCheck className="h-4 w-4" />
                เปิดเครื่องมือคำนวณสิทธิ 4 หมวด
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
