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
  Building2,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface ReportGeneratorProps {
  metrics: DashboardMetrics;
}

export function ReportGenerator({ metrics }: ReportGeneratorProps) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2569");
  const [certificateView, setCertificateView] = useState(false);

  const handleExportCSV = () => {
    const headers = ["ลำดับ,โครงการสวัสดิการ,หมวดหมู่,งบประมาณรวม (บาท),จำนวนผู้รับสิทธิ (คน)"];
    const rows = metrics.disbursementsByCategory.map((cat, idx) =>
      `${idx + 1},"${cat.categoryLabel}","${cat.category}",${cat.totalAmount},${cat.beneficiaryCount}`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `รายงานสิทธิสวัสดิการ_DOP_${selectedFiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sittidop_metrics_report_${selectedFiscalYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            ระบบรายงานสถิติและหนังสือรับรองประมาณการสิทธิ (Reports & Certificate)
          </h2>
          <p className="text-xs text-muted-foreground">
            ปีงบประมาณ พ.ศ. {selectedFiscalYear} • กรมกิจการผู้สูงอายุ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
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
            {certificateView ? "ดูรายงานตารางสรุป" : "ตัวอย่างหนังสือรับรองสิทธิ (Certificate)"}
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
            className="text-xs gap-1.5"
          >
            <Printer className="h-4 w-4" />
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
                ตารางสรุปงบประมาณและการเบิกจ่ายสวัสดิการจำแนกตามโครงการหลัก
              </CardTitle>
              <CardDescription className="text-xs">
                ข้อมูลสถานะ ณ วันที่ {formatThaiDate(new Date())}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-3">ลำดับ</th>
                      <th className="p-3">ชื่อโครงการสวัสดิการ</th>
                      <th className="p-3 text-right">จำนวนผู้รับสิทธิ (คน)</th>
                      <th className="p-3 text-right">ยอดเบิกจ่ายสะสม (บาท)</th>
                      <th className="p-3 text-center">สถานะโครงการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {metrics.disbursementsByCategory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-3 font-semibold text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {item.categoryLabel}
                        </td>
                        <td className="p-3 text-right font-medium text-slate-800 dark:text-slate-200">
                          {formatNumber(item.beneficiaryCount)}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="success" className="text-[10px]">
                            เปิดรับและจ่ายปกติ
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={2} className="p-3 text-slate-900 dark:text-slate-100">
                        รวมทั้งสิ้น (7 โครงการหลัก)
                      </td>
                      <td className="p-3 text-right text-slate-900 dark:text-slate-100">
                        {formatNumber(metrics.totalBeneficiariesCount)}
                      </td>
                      <td className="p-3 text-right text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(metrics.totalDisbursedAmount)}
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
        /* Printable Official Certificate of Benefit Entitlement */
        <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-xl max-w-3xl mx-auto space-y-6 print:border-none print:shadow-none">
          <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
            <div className="inline-flex h-14 w-14 rounded-full bg-emerald-800 text-white items-center justify-center font-bold text-lg mb-1">
              DOP
            </div>
            <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">
              หนังสือรับรองผลการประมาณการสิทธิสวัสดิการผู้สูงอายุ
            </h3>
            <p className="text-xs text-slate-600">
              กรมกิจการผู้สูงอายุ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              เลขที่เอกสาร: DOP-CERT-{new Date().getFullYear() + 543}-00892
            </p>
          </div>

          <div className="text-xs leading-relaxed space-y-3">
            <p className="text-right">
              ออกให้ ณ วันที่ {formatThaiDate(new Date())}
            </p>
            <p>
              หนังสือฉบับนี้ให้ไว้เพื่อรับรองว่า <strong className="text-sm">นายสมศักดิ์ มั่นคง</strong> เลขประจำตัวประชาชน <strong>1-1004-00289-11-2</strong> มีภูมิลำเนาในเขตกรุงเทพมหานคร ได้รับการประมาณการสิทธิสวัสดิการและเงินสงเคราะห์ผู้สูงอายุตามกฎหมายและระเบียบของกรมกิจการผู้สูงอายุ ประจำปีงบประมาณ 2569 ปรากฏผลดังนี้:
            </p>

            <div className="rounded-lg border border-slate-300 overflow-hidden my-3">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                  <tr>
                    <th className="p-2 text-left">รายการสิทธิสวัสดิการ</th>
                    <th className="p-2 text-center">เกณฑ์อายุ/เงื่อนไข</th>
                    <th className="p-2 text-right">อัตราประมาณการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium">1. เบี้ยยังชีพผู้สูงอายุแห่งชาติ (แบบขั้นบันได)</td>
                    <td className="p-2 text-center">อายุ 72 ปีบริบูรณ์</td>
                    <td className="p-2 text-right font-bold">700 บาท/เดือน</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">2. สิทธิสวัสดิการแห่งรัฐเสริมสำหรับผู้สูงอายุ</td>
                    <td className="p-2 text-center">ผู้ถือบัตรสวัสดิการแห่งรัฐ</td>
                    <td className="p-2 text-right font-bold">400 บาท/เดือน</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">3. สิทธิขอรับเงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก</td>
                    <td className="p-2 text-center">ดัชนีความเปราะบาง 55/100</td>
                    <td className="p-2 text-right font-bold">3,000 บาท/ครั้ง</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-600">
              * ข้อมูลข้างต้นเป็นผลการประมาณการสิทธิเบื้องต้นตามเกณฑ์ของระบบสารสนเทศ การรับเงินสิทธิประโยชน์จริงขึ้นอยู่กับการตรวจสอบคุณสมบัติขั้นสุดท้ายและการจัดสรรงบประมาณขององค์กรปกครองส่วนท้องถิ่นและกรมบัญชีกลาง
            </p>
          </div>

          <div className="pt-8 flex justify-between items-end text-xs">
            <div className="space-y-1">
              <div className="h-16 w-16 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-mono">
                [ QR Code e-Verify ]
              </div>
              <p className="text-[10px] text-slate-400">ตรวจสอบความถูกต้องทางออนไลน์</p>
            </div>

            <div className="text-center space-y-1">
              <div className="h-8" />
              <p className="font-bold">( นายทะเบียนสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ )</p>
              <p className="text-slate-500">นายทะเบียนผู้รับรองสิทธิทางอิเล็กทรอนิกส์</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
