"use client";

import React, { useState, useEffect } from "react";
import { GeneratedDocumentRecord, MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  FileText,
  Printer,
  QrCode,
  CheckCircle2,
  Download,
  Plus,
  Shield,
  Award,
  Users,
  Search,
  Coins,
  Calendar,
  CalendarDays,
  Gift,
} from "lucide-react";

export function DocumentGenerator() {
  const [documents, setDocuments] = useState<GeneratedDocumentRecord[]>([]);
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/personnel").then((r) => r.json()),
    ]).then(([docsRes, personnelRes]) => {
      if (docsRes.success) {
        setDocuments(docsRes.data);
        if (docsRes.data.length > 0) setSelectedDoc(docsRes.data[0]);
      }
      if (personnelRes.success) {
        setPersonnelList(personnelRes.data);
      }
      setLoading(false);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ระบบสร้างหนังสือรับรองสิทธิทางการ (Document Generator)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            หนังสือสรุปรายการประมาณการสิทธิกำลังพล 4 หมวดเสนอผู้บังคับบัญชา พร้อม QR Code e-Verification
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            พิมพ์หนังสือรับรอง (Print Certificate)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Document List Selection */}
        <div className="space-y-3 print:hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            รายการหนังสือรับรองที่ออกแล้ว ({documents.length})
          </h3>
          <div className="space-y-2.5">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-600">
                      {doc.docNumber}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[9px]">
                      ออกอย่างเป็นทางการ
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {doc.personnelName} ({doc.rankWithAbbr})
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{doc.unit}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1 font-mono">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      เงินก้อน: {formatCurrency(doc.totalLumpSum)}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 font-bold">
                      รายเดือน: {formatCurrency(doc.monthlyPension)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Printable Official Document Preview */}
        <div className="lg:col-span-2">
          {selectedDoc ? (
            <div className="rounded-3xl border border-slate-300 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-12 shadow-xl print:border-none print:shadow-none print:p-0 space-y-6">
              {/* Official Header */}
              <div className="text-center space-y-2 border-b-2 border-slate-900 dark:border-slate-100 pb-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-900 text-white flex items-center justify-center font-bold text-xl mb-2">
                  กห
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  กระทรวงกลาโหม • กองทัพบก
                </h2>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                  หนังสือสรุปรายการประมาณการสิทธิกำลังพลและทายาท 4 หมวด
                </h3>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
                  <span>เลขที่เอกสาร: {selectedDoc.docNumber}</span>
                  <span>•</span>
                  <span>วันที่ออกหนังสือ: {selectedDoc.issuedDate}</span>
                </div>
              </div>

              {/* Personnel Subject Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">ชื่อกำลังพลผู้รับสิทธิ:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedDoc.personnelName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">ยศและตำแหน่งปูนบำเหน็จ:</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {selectedDoc.rankWithAbbr}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">สังกัดและหน่วยงาน:</span>
                  <span className="font-medium">{selectedDoc.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">ประเภทความสูญเสีย:</span>
                  <span className="font-bold text-red-600">{selectedDoc.lossType}</span>
                </div>
              </div>

              {/* Summary Table across 4 Categories */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  สรุปรายการสิทธิประโยชน์ 4 หมวด (4 Benefit Categories)
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
                            (บำเหน็จตกทอด, ชดเชย พ.ร.บ. สงเคราะห์ 30 เท่า, ประกันชีวิตทหาร, ปูนบำเหน็จ, กองทุน ทบ., ค่าทำศพ)
                          </span>
                        </td>
                        <td className="p-2.5">เงินก้อนครั้งเดียว</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(selectedDoc.totalLumpSum)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5">
                          <strong>หมวด 2: รับเงินรายเดือน (Monthly Payment)</strong>
                          <span className="text-[10px] text-muted-foreground block">
                            (บำนาญพิเศษรายเดือนตาม พ.ร.บ. บำเหน็จบำนาญ, เงินเลี้ยงชีพทุพพลภาพ)
                          </span>
                        </td>
                        <td className="p-2.5">จ่ายรายเดือนตลอดชีพ</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(selectedDoc.monthlyPension)} / เดือน
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
                          {formatCurrency(selectedDoc.annualScholarship)} / ปี
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5">
                          <strong>หมวด 4: สิทธิมิใช่ตัวเงิน (Non-Monetary Rights)</strong>
                          <span className="text-[10px] text-muted-foreground block">
                            (สิทธิบรรจุทายาททดแทน 1 อัตรา, สิทธิโควตาเตรียมทหาร/พยาบาล, สิทธิรักษาพยาบาล, พระราชทานเพลิงศพ)
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
                          {formatCurrency(selectedDoc.totalLumpSum)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QR Verification & Signatures */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-6 items-end text-xs">
                {/* QR Code Block */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="h-14 w-14 bg-white p-1 rounded-lg border flex items-center justify-center shrink-0">
                    <QrCode className="h-12 w-12 text-slate-900" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 block">
                      e-Verification Token
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground block break-all">
                      {selectedDoc.qrVerifyCode}
                    </span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300">
                      ระบบราชการกลาโหม ปลอดภัย
                    </Badge>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="text-center space-y-1">
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-44"></div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-2">
                    ({selectedDoc.commandingOfficer})
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedDoc.officerPosition}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-muted-foreground">
              กรุณาเลือกหนังสือรับรองจากรายการทางซ้าย
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
