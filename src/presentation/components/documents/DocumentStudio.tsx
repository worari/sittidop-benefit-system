"use client";

import React, { useState, useEffect } from "react";
import { MilitaryPersonnelRecord, initialMilitaryPersonnel } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { DocumentTemplateType, OfficialDocumentService } from "@/core/use-cases/documents/OfficialDocumentService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  QrCode,
  CheckCircle2,
  Shield,
  Award,
  Users,
  Building,
  KeyRound,
  FileCheck,
  RotateCcw,
  Sparkles,
  Sliders,
  FileBadge,
} from "lucide-react";

export function DocumentStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateType>("BENEFIT_SUMMARY");
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>(initialMilitaryPersonnel);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>("mil-001");
  const [loading, setLoading] = useState(false);

  // Customization Toggles
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const [docNumber, setDocNumber] = useState(`กห-0201/2569-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issuedDate, setIssuedDate] = useState("21 สิงหาคม 2569");
  const [officerName, setOfficerName] = useState("พลโท สมโชค ชัยชนะ");
  const [officerPosition, setOfficerPosition] = useState("เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)");

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  useEffect(() => {
    fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setPersonnelList(json.data);
          setSelectedPersonnelId(json.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    OfficialDocumentService.generateQrCodeDataUrl(docNumber).then((url) => {
      setQrCodeDataUrl(url);
    });
  }, [docNumber]);

  const selectedPersonnel = personnelList.find((p) => p.id === selectedPersonnelId) || personnelList[0];

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    if (!selectedPersonnel) return;
    setDownloadingDocx(true);

    const url = `/api/documents/export?template=${selectedTemplate}&personnelId=${selectedPersonnel.id}&officerName=${encodeURIComponent(
      officerName
    )}&officerPosition=${encodeURIComponent(officerPosition)}&issuedDate=${encodeURIComponent(issuedDate)}`;

    window.open(url, "_blank");
    setTimeout(() => setDownloadingDocx(false), 1500);
  };

  const templates: {
    id: DocumentTemplateType;
    name: string;
    description: string;
    icon: any;
    badge: string;
  }[] = [
    {
      id: "BENEFIT_SUMMARY",
      name: "1. หนังสือสรุปรายการประมาณการสิทธิ 4 หมวด",
      description: "Benefit Summary Report",
      icon: FileText,
      badge: "สรุป 4 หมวด",
    },
    {
      id: "BENEFIT_CERTIFICATE",
      name: "2. หนังสือรับรองสิทธิประโยชน์ทางการ",
      description: "Official Benefit Certificate",
      icon: FileBadge,
      badge: "รับรองทางการ",
    },
    {
      id: "HEIR_REPORT",
      name: "3. รายงานบัญชีการจัดสรรสิทธิประโยชน์ทายาท",
      description: "Legal Heir Distribution Report",
      icon: Users,
      badge: "สัดส่วน % ทายาท",
    },
    {
      id: "CLAIM_FORM",
      name: "4. แบบคำขอรับเงินสงเคราะห์และสิทธิประโยชน์",
      description: "Official Benefit Claim Form",
      icon: FileCheck,
      badge: "แบบฟอร์มยื่นคำขอ",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ระบบสร้างและส่งออกเอกสารทางการ (Document Generator Studio)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            รองรับ 4 แม่แบบมาตรฐานกลาโหม: PDF Export, DOCX Word Export, ตราสัญลักษณ์, QR Code e-Verification, และ e-Signature
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 shadow-xs"
            onClick={handleDownloadDocx}
            disabled={downloadingDocx}
          >
            <Download className="h-4 w-4 text-blue-600" />
            {downloadingDocx ? "กำลังสร้างไฟล์..." : "ส่งออก Word (DOCX)"}
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs"
            onClick={handlePrintPdf}
          >
            <Printer className="h-4 w-4" />
            พิมพ์ / ส่งออก PDF (Print PDF)
          </Button>
        </div>
      </div>

      {/* 4 Template Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {templates.map((t) => {
          const isSelected = selectedTemplate === t.id;
          const Icon = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-600"
                  : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>
                <Badge variant={isSelected ? "default" : "secondary"} className="text-[9px]">
                  {t.badge}
                </Badge>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {t.name}
                </h4>
                <p className="text-[10px] text-muted-foreground">{t.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Control Panel (Hidden on print) */}
        <Card className="p-5 space-y-4 print:hidden border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              การปรับแต่งเอกสาร (Customization)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Select Personnel */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">เลือกกำลังพลผู้รับสิทธิ</Label>
              <select
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {personnelList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.rankAbbr} {p.firstName} {p.lastName} ({p.militaryId})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Number & Date */}
            <div className="space-y-1">
              <Label className="text-xs">เลขที่หนังสือราชการ</Label>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">วันที่ออกหนังสือ</Label>
              <Input
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Signer Info */}
            <div className="space-y-1">
              <Label className="text-xs">ชื่อผู้ลงนาม / ผู้บังคับบัญชา</Label>
              <Input
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">ตำแหน่งผู้ลงนาม</Label>
              <Input
                value={officerPosition}
                onChange={(e) => setOfficerPosition(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs">ตราสัญลักษณ์กลาโหม (Official Logo)</span>
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs">QR Code e-Verification</span>
                <input
                  type="checkbox"
                  checked={includeQrCode}
                  onChange={(e) => setIncludeQrCode(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs">ลายมือชื่ออิเล็กทรอนิกส์ (e-Signature)</span>
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Right Side: Live Printable Official Document View */}
        <div className="lg:col-span-2">
          {selectedPersonnel ? (
            <div className="rounded-3xl border border-slate-300 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-12 shadow-xl print:border-none print:shadow-none print:p-0 space-y-6">
              {/* Header with Emblem */}
              <div className="text-center space-y-2 border-b-2 border-slate-900 dark:border-slate-100 pb-5">
                {includeLogo && (
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-900 text-white flex items-center justify-center font-bold text-xl mb-1 shadow-xs">
                    กห
                  </div>
                )}
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  กระทรวงกลาโหม • กองทัพบก
                </h2>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                  {selectedTemplate === "BENEFIT_SUMMARY" && "หนังสือสรุปรายการประมาณการสิทธิกำลังพล 4 หมวด"}
                  {selectedTemplate === "BENEFIT_CERTIFICATE" && "หนังสือรับรองสิทธิประโยชน์กำลังพลและทายาททางการ"}
                  {selectedTemplate === "HEIR_REPORT" && "รายงานบัญชีการจัดสรรสิทธิประโยชน์ทายาทตามกฎหมาย"}
                  {selectedTemplate === "CLAIM_FORM" && "แบบคำขอรับเงินสงเคราะห์และสิทธิประโยชน์กำลังพล"}
                </h3>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>เลขที่เอกสาร: {docNumber}</span>
                  <span>•</span>
                  <span>วันที่ออกหนังสือ: {issuedDate}</span>
                </div>
              </div>

              {/* Personnel Subject Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">ชื่อกำลังพลผู้รับสิทธิ:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedPersonnel.rankAbbr} {selectedPersonnel.firstName} {selectedPersonnel.lastName}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground block">
                    ID: {selectedPersonnel.militaryId}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">ยศและชั้นยศปูนบำเหน็จ:</span>
                  <span className="font-bold text-sm text-amber-700 dark:text-amber-400">
                    {selectedPersonnel.promotedRankAbbr || "พล.อ."} (ปูนบำเหน็จ {selectedPersonnel.promotionSteps || 7} ชั้นยศ)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">สังกัดและหน่วยงาน:</span>
                  <span className="font-medium">{selectedPersonnel.normalUnit}</span>
                  {selectedPersonnel.fieldUnit && (
                    <span className="block text-[11px] text-emerald-600 font-semibold">{selectedPersonnel.fieldUnit}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">ประเภทความสูญเสีย:</span>
                  <span className="font-bold text-red-600">{selectedPersonnel.lossType}</span>
                </div>
              </div>

              {/* Template Dynamic Content */}
              {/* Template 1 & 2: 4 Categories Summary */}
              {(selectedTemplate === "BENEFIT_SUMMARY" || selectedTemplate === "BENEFIT_CERTIFICATE") && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    สรุปรายการสิทธิประโยชน์ 4 หมวด (4 Categories Entitlement Breakdown)
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2.5">หมวดสิทธิประโยชน์</th>
                          <th className="p-2.5">ลักษณะการจ่าย</th>
                          <th className="p-2.5 text-right">จำนวนเงินประมาณการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="p-2.5">
                            <strong>หมวด 1: รับเงินครั้งเดียว (One-Time Lump Sum)</strong>
                            <span className="text-[10px] text-muted-foreground block">
                              (บำเหน็จตกทอด, ชดเชย พ.ร.บ. สงเคราะห์ 30 เท่า, ประกันชีวิตทหาร, ปูนบำเหน็จ, กองทุน ทบ.)
                            </span>
                          </td>
                          <td className="p-2.5">เงินก้อนครั้งเดียว</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(7491500)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5">
                            <strong>หมวด 2: รับเงินรายเดือน (Monthly Payment)</strong>
                            <span className="text-[10px] text-muted-foreground block">
                              (บำนาญพิเศษรายเดือนตาม พ.ร.บ. บำเหน็จบำนาญข้าราชการ พ.ศ. 2494)
                            </span>
                          </td>
                          <td className="p-2.5">จ่ายรายเดือนตลอดชีพ</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(32880)} / เดือน
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5">
                            <strong>หมวด 3: รับเงินรายปี (Annual Grants)</strong>
                            <span className="text-[10px] text-muted-foreground block">
                              (ทุนการศึกษาบุตรระดับประถม มัธยม และปริญญาตรีจนสำเร็จการศึกษา)
                            </span>
                          </td>
                          <td className="p-2.5">จ่ายรายปีต่อเนื่อง</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(47000)} / ปี
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5">
                            <strong>หมวด 4: สิทธิมิใช่ตัวเงิน (Non-Monetary Rights)</strong>
                            <span className="text-[10px] text-muted-foreground block">
                              (สิทธิบรรจุทายาททดแทน 1 อัตรา, สิทธิโควตาเตรียมทหาร, สิทธิรักษาพยาบาล, พระราชทานเพลิงศพ)
                            </span>
                          </td>
                          <td className="p-2.5">สิทธิคุ้มครองทางราชการ</td>
                          <td className="p-2.5 text-right font-bold text-purple-600">
                            มีสิทธิได้รับตามระเบียบ
                          </td>
                        </tr>
                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold">
                          <td className="p-2.5 text-slate-900 dark:text-slate-100">
                            ยอดรวมเงินก้อนสุทธิ (หมวด 1)
                          </td>
                          <td className="p-2.5">เงินก้อนสุทธิ</td>
                          <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-300 text-sm">
                            {formatCurrency(7491500)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Template 3: Heir Distribution Report */}
              {selectedTemplate === "HEIR_REPORT" && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    บัญชีรายละเอียดการจัดสรรสิทธิประโยชน์แก่ทายาทตามกฎหมาย (50% / 25% / 25%)
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-2.5">ชื่อ-สกุล ทายาท</th>
                          <th className="p-2.5">ความสัมพันธ์</th>
                          <th className="p-2.5 text-center">สัดส่วน (%)</th>
                          <th className="p-2.5 text-right">เงินก้อนจัดสรร</th>
                          <th className="p-2.5 text-right">บำนาญรายเดือน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedPersonnel.heirs && selectedPersonnel.heirs.length > 0 ? (
                          selectedPersonnel.heirs.map((h, idx) => {
                            const lump = Math.round(7491500 * (h.allocationPercentage / 100));
                            const monthly = Math.round(32880 * (h.allocationPercentage / 100));
                            return (
                              <tr key={idx}>
                                <td className="p-2.5 font-semibold">{h.fullName}</td>
                                <td className="p-2.5">{h.relationship}</td>
                                <td className="p-2.5 text-center font-mono font-bold">{h.allocationPercentage}%</td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{formatCurrency(lump)}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-blue-600">{formatCurrency(monthly)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-muted-foreground">ไม่มีข้อมูลทายาท</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Template 4: Claim Form */}
              {selectedTemplate === "CLAIM_FORM" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      รายการเอกสารหลักฐานประกอบการยื่นขอรับเงินสงเคราะห์ (Required Documents)
                    </h4>
                    <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>สำเนาใบมรณบัตร หรือหนังสือรับรองการบาดเจ็บ/ทุพพลภาพจากการปฏิบัติราชการสนาม</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>สำเนาทะเบียนบ้าน และสำเนาบัตรประจำตัวประชาชนของผู้รับสิทธิและทายาททุกคน</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>สำเนาทะเบียนสมรส (กรณีคู่สมรสจดทะเบียนตามกฎหมาย)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>สำเนาสูติบัตรบุตร และหนังสือรับรองสถานภาพการศึกษาจากสถานศึกษา</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>สำเนาสมุดบัญชีเงินฝากธนาคารสำหรับรับโอนเงินสงเคราะห์</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Verification & e-Signature Stamp */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-6 items-end text-xs">
                {/* QR Code Block */}
                {includeQrCode && qrCodeDataUrl ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <img src={qrCodeDataUrl} alt="QR Code Verification" className="h-16 w-16 rounded border bg-white p-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 block">
                        e-Verification Token
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground block break-all">
                        SHA-256: 7f8a92b3c4e5f6...
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300">
                        สแกนตรวจสอบความถูกต้อง
                      </Badge>
                    </div>
                  </div>
                ) : <div />}

                {/* Signature Block */}
                <div className="text-center space-y-1">
                  {includeSignature ? (
                    <div className="space-y-1">
                      <div className="inline-block border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                        [ Digitally Signed by {officerName} ]
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 pt-1">
                        ({officerName})
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {officerPosition}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-44"></div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 mt-2">
                        ({officerName})
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {officerPosition}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-muted-foreground">
              กำลังโหลดข้อมูลเอกสาร...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
