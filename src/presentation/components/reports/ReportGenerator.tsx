"use client";

import React, { useState } from "react";
import { DashboardMetrics } from "../../../core/domain/value-objects/types";
import { formatCurrency, formatNumber, formatThaiDate, formatThaiDateTime } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  Award,
  Shield,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";

interface ReportGeneratorProps {
  metrics?: DashboardMetrics;
}

export function ReportGenerator({ metrics }: ReportGeneratorProps) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2569");
  const [certificateView, setCertificateView] = useState(false);

  const armyCategories = [
    {
      categoryLabel: "หมวด 1: รับเงินครั้งเดียว (Lump Sum Grants)",
      category: "LUMP_SUM_PAYMENT",
      totalAmount: 18250000,
      beneficiaryCount: 4,
      items: "สินไหมภัยสงคราม, บำเหน็จตกทอด, ชดเชย 30 เท่า, เงินกองทุน ทบ.",
    },
    {
      categoryLabel: "หมวด 2: รับเงินรายเดือน (Monthly Recurring)",
      category: "MONTHLY_PAYMENT",
      totalAmount: 4140000,
      beneficiaryCount: 4,
      items: "บำนาญพิเศษทายาท, เงิน พ.ช.ท. รายเดือน, บำนาญทุพพลภาพ ทบ.",
    },
    {
      categoryLabel: "หมวด 3: รับเงินรายปี (Annual Education Grants)",
      category: "ANNUAL_PAYMENT",
      totalAmount: 2220000,
      beneficiaryCount: 6,
      items: "ทุนการศึกษาบุตร ทบ. (สก.ทบ.), ทุนมูลนิธิ พล.อ.เปรม ติณสูลานนท์",
    },
    {
      categoryLabel: "หมวด 4: สิทธิประโยชน์มิใช่ตัวเงิน (Non-Monetary)",
      category: "NON_MONETARY_BENEFIT",
      totalAmount: 240000,
      beneficiaryCount: 4,
      items: "สิทธิบรรจุทายาททดแทน 1 อัตรา, สิทธิรักษาพยาบาล รพ.ค่าย, เหรียญเกียรติยศ",
    },
  ];

  const handleExportCSV = () => {
    const headers = ["ลำดับ,หมวดหมู่สิทธิประโยชน์ กองทัพบก,รหัสหมวด,งบประมาณการจัดสรร (บาท),จำนวนกำลังพล/ทายาท (ราย)"];
    const rows = armyCategories.map((cat, idx) =>
      `${idx + 1},"${cat.categoryLabel}","${cat.category}",${cat.totalAmount},${cat.beneficiaryCount}`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `รายงานสิทธิกำลังพล_กองทัพบก_${selectedFiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      fiscalYear: selectedFiscalYear,
      militaryBranch: "ROYAL_THAI_ARMY",
      department: "กรมกำลังพลทหารบก (กพ.ทบ.) / กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล",
      categories: armyCategories,
      totalBudget: 24850000,
      timestamp: new Date().toISOString(),
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rta_benefit_report_${selectedFiscalYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-700 dark:text-amber-400" />
            รายงานสถิติและหนังสือรับรองประมาณการสิทธิประโยชน์กำลังพล ทบ.
          </h2>
          <p className="text-xs text-muted-foreground">
            ปีงบประมาณ พ.ศ. {selectedFiscalYear} • กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล กองทัพบก
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={certificateView ? "default" : "outline"}
            size="sm"
            onClick={() => setCertificateView(!certificateView)}
            className="text-xs gap-1.5"
          >
            <Award className="h-4 w-4" />
            {certificateView ? "ดูรายงานสถิติตารางสรุป" : "ตัวอย่างหนังสือรับรองสิทธิ (กพ.ทบ.)"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            ส่งออก CSV (Excel)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="text-xs gap-1.5"
          >
            <FileCode className="h-4 w-4 text-blue-600" />
            ส่งออก JSON
          </Button>

          <Button
            variant="navy"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            พิมพ์รายงาน / PDF
          </Button>
        </div>
      </div>

      {!certificateView ? (
        /* Standard Summary Report Table */
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                ตารางสรุปงบประมาณการจัดสรรสิทธิประโยชน์กำลังพล กองทัพบก 4 หมวดหลัก
              </CardTitle>
              <CardDescription className="text-xs">
                ข้อมูลสถานะ ณ วันที่ {formatThaiDate(new Date())} ตามเกณฑ์ระเบียบ กห. และ พ.ร.บ. สงเคราะห์ผู้ประสบภัย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-3">ลำดับ</th>
                      <th className="p-3">หมวดหมู่สิทธิประโยชน์</th>
                      <th className="p-3">รายการสิทธิและเงินสงเคราะห์หลัก</th>
                      <th className="p-3 text-right">จำนวนกำลังพล/ทายาท (ราย)</th>
                      <th className="p-3 text-right">ยอดประมาณการจัดสรร (บาท)</th>
                      <th className="p-3 text-center">สถานะการเบิกจ่าย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {armyCategories.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {item.categoryLabel}
                        </td>
                        <td className="p-3 text-muted-foreground text-[11px]">
                          {item.items}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800 dark:text-slate-200">
                          {formatNumber(item.beneficiaryCount)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="success" className="text-[10px]">
                            อนุมัติและเบิกจ่ายปกติ
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-900 dark:text-slate-100">
                        รวมทั้งสิ้น (4 หมวดหมู่สิทธิประโยชน์ กองทัพบก)
                      </td>
                      <td className="p-3 text-right text-slate-900 dark:text-slate-100">
                        4 นาย / 18 สิทธิ
                      </td>
                      <td className="p-3 text-right text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                        {formatCurrency(24850000)}
                      </td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Printable Official Certificate of Benefit Entitlement for Army Personnel */
        <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-xl max-w-3xl mx-auto space-y-6 print:border-none print:shadow-none">
          <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-emerald-900 text-amber-400 items-center justify-center font-bold text-lg mb-1 border border-emerald-700">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
              หนังสือรับรองผลการประมาณการสิทธิประโยชน์และเงินสงเคราะห์กำลังพล
            </h3>
            <p className="text-xs font-semibold text-slate-700">
              กองทัพบก (Royal Thai Army) • กรมกำลังพลทหารบก (กพ.ทบ.)
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              เลขที่เอกสาร: กห-0401/2569-00142 (ชั้นความลับ: ปกปิด)
            </p>
          </div>

          <div className="text-xs leading-relaxed space-y-3">
            <p className="text-right">
              ออกให้ ณ วันที่ {formatThaiDate(new Date())}
            </p>
            <p>
              หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า <strong className="text-sm">พ.ท. วีรชาติ ภักดีสยาม</strong> หมายเลขประจำตัวทหาร <strong>MIL-49021884</strong> สังกัด <strong>ร.19 พัน.1 (พล.ร.9) / ฉก.นราธิวาส 30</strong> ปฏิบัติหน้าที่ราชการสนามและเสียชีวิตจากการสู้รบ (KIA) เมื่อวันที่ 12 มี.ค. 2569 ได้รับการปูนบำเหน็จพิเศษ 7 ชั้นยศ เป็น <strong>พล.อ.</strong> และได้รับการประมาณการสิทธิประโยชน์ 4 หมวดของกองทัพบก ดังนี้:
            </p>

            <div className="rounded-lg border border-slate-300 overflow-hidden my-3">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2 text-left">หมวดหมู่สิทธิประโยชน์</th>
                    <th className="p-2 text-left">รายการสิทธิที่ได้รับ</th>
                    <th className="p-2 text-right">ยอดประมาณการสุทธิ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-bold">1. รับเงินครั้งเดียว (Lump Sum)</td>
                    <td className="p-2">สินไหมภัยสงคราม, บำเหน็จตกทอด, ชดเชย 30 เท่า, กองทุน ทบ.</td>
                    <td className="p-2 text-right font-bold text-amber-700 font-mono">7,491,500 บาท</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">2. รับเงินรายเดือน (Recurring)</td>
                    <td className="p-2">บำนาญพิเศษทายาท (พล.อ.) + เงินเพิ่ม พ.ช.ท. รายเดือน</td>
                    <td className="p-2 text-right font-bold text-blue-700 font-mono">32,880 บาท/เดือน</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">3. รับเงินรายปี (Annual Grant)</td>
                    <td className="p-2">ทุนการศึกษาบุตรกำลังพล ทบ. (2 คน จนจบปริญญาตรี)</td>
                    <td className="p-2 text-right font-bold text-emerald-700 font-mono">47,000 บาท/ปี</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold">4. สิทธิมิใช่ตัวเงิน (Non-Monetary)</td>
                    <td className="p-2">สิทธิบรรจุทายาททดแทน 1 อัตรา + สิทธิรักษาพยาบาลตลอดชีพ</td>
                    <td className="p-2 text-right font-bold text-purple-700">ได้รับสิทธิ</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-600">
              * ข้อมูลข้างต้นเป็นผลการประมาณการสิทธิประโยชน์ตามระเบียบกองทัพบกและกระทรวงกลาโหม ออกโดยระบบสารสนเทศอัตโนมัติ กพ.ทบ.
            </p>
          </div>

          <div className="pt-6 flex justify-between items-end text-xs">
            <div className="space-y-1">
              <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-mono">
                [ QR e-Verify ]
              </div>
              <p className="text-[10px] text-slate-400">ตรวจสอบความถูกต้องทางออนไลน์</p>
            </div>

            <div className="text-center space-y-1">
              <div className="h-8" />
              <p className="font-bold">พลโท สมโชค ชัยชนะ</p>
              <p className="text-slate-600">เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
