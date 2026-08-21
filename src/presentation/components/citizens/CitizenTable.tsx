"use client";

import React, { useState } from "react";
import { CitizenEntity, calculateAge } from "../../../core/domain/entities/Citizen";
import { VulnerabilityLevel } from "../../../core/domain/value-objects/enums";
import { formatCurrency, formatThaiDate, formatNationalId } from "../../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Search, UserCheck, ShieldAlert, HeartPulse, Sparkles, MapPin, Phone, Home, Eye } from "lucide-react";
import Link from "next/link";

interface CitizenTableProps {
  citizens: CitizenEntity[];
}

export function CitizenTable({ citizens }: CitizenTableProps) {
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("ALL");
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenEntity | null>(null);

  const filteredCitizens = citizens.filter((c) => {
    const s = search.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(s) ||
      c.nationalId.includes(s) ||
      c.province.toLowerCase().includes(s) ||
      c.district.toLowerCase().includes(s);

    const matchesProvince = provinceFilter === "ALL" || c.province === provinceFilter;

    return matchesSearch && matchesProvince;
  });

  const vulnerabilityBadges: Record<VulnerabilityLevel, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
    [VulnerabilityLevel.LOW]: { label: "ปกติ (Low)", variant: "success" },
    [VulnerabilityLevel.MODERATE]: { label: "ปานกลาง (Moderate)", variant: "info" },
    [VulnerabilityLevel.HIGH]: { label: "เปราะบางสูง (High)", variant: "warning" },
    [VulnerabilityLevel.CRITICAL]: { label: "วิกฤต/เร่งด่วน (Critical)", variant: "destructive" },
  };

  const provinces = Array.from(new Set(citizens.map((c) => c.province)));

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ-นามสกุล, เลขประจำตัว 13 หลัก, จังหวัด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">จังหวัด:</span>
          <Button
            variant={provinceFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setProvinceFilter("ALL")}
            className="text-xs"
          >
            ทั้งหมด ({citizens.length})
          </Button>
          {provinces.slice(0, 4).map((p) => (
            <Button
              key={p}
              variant={provinceFilter === p ? "default" : "outline"}
              size="sm"
              onClick={() => setProvinceFilter(p)}
              className="text-xs whitespace-nowrap"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขประจำตัวประชาชน</TableHead>
              <TableHead>ชื่อ - นามสกุล</TableHead>
              <TableHead className="text-center">อายุ (ปี)</TableHead>
              <TableHead>ภูมิลำเนา (จังหวัด)</TableHead>
              <TableHead className="text-right">รายได้เฉลี่ย/ด.</TableHead>
              <TableHead className="text-center">ดัชนีความเปราะบาง</TableHead>
              <TableHead className="text-right">การจัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCitizens.map((c) => {
              const age = calculateAge(new Date(c.dateOfBirth));
              const vuln = vulnerabilityBadges[c.vulnerabilityLevel] || {
                label: c.vulnerabilityLevel,
                variant: "secondary",
              };

              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formatNationalId(c.nationalId)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {c.title}{c.firstName} {c.lastName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {c.hasStateWelfareCard && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">• บัตรสวัสดิการแห่งรัฐ</span>
                        )}
                        {c.isDisabilityRegistered && (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">• คนพิการ</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    {age} ปี
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                    {c.district}, {c.province}
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs">
                    {formatCurrency(c.monthlyIncome)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={vuln.variant} className="text-[10px]">
                      {c.vulnerabilityScore}/100 ({vuln.label.split(" ")[0]})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCitizen(c)}
                      className="text-xs h-8 px-2.5 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      ดูประวัติ & ประเมิน
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Citizen Profile & Benefit Launcher Modal */}
      <Dialog open={Boolean(selectedCitizen)} onOpenChange={(open) => !open && setSelectedCitizen(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                ID: {selectedCitizen?.nationalId ? formatNationalId(selectedCitizen.nationalId) : ""}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold">
              ข้อมูลประวัติผู้สูงอายุและสิทธิสวัสดิการ
            </DialogTitle>
            <DialogDescription className="text-xs">
              ระบบทะเบียนสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ
            </DialogDescription>
          </DialogHeader>

          {selectedCitizen && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedCitizen.title}{selectedCitizen.firstName} {selectedCitizen.lastName}
                    </h4>
                    <p className="text-muted-foreground">
                      เกิดวันที่ {formatThaiDate(selectedCitizen.dateOfBirth)} (อายุ {calculateAge(new Date(selectedCitizen.dateOfBirth))} ปี)
                    </p>
                  </div>
                  <Badge variant={vulnerabilityBadges[selectedCitizen.vulnerabilityLevel]?.variant}>
                    ความเปราะบาง: {selectedCitizen.vulnerabilityScore}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block">ที่อยู่ตามทะเบียนราษฎร์:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedCitizen.address} ต.{selectedCitizen.subdistrict} อ.{selectedCitizen.district} จ.{selectedCitizen.province} {selectedCitizen.postalCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">รายได้เฉลี่ย:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(selectedCitizen.monthlyIncome)}/เดือน</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    <span className="text-muted-foreground block">สถานะบัตรสวัสดิการแห่งรัฐ:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {selectedCitizen.hasStateWelfareCard ? "✓ มีสิทธิในโครงการ" : "✗ ไม่มีบัตร"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">สถานะคนพิการ:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {selectedCitizen.isDisabilityRegistered ? `✓ จดทะเบียน (${selectedCitizen.disabilityType || "ระบุความพิการ"})` : "✗ ไม่ได้จดทะเบียน"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCitizen(null)}>
              ปิดหน้าต่าง
            </Button>
            <Link href="/calculator">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5">
                <Sparkles className="h-4 w-4" />
                เริ่มคำนวณประมาณการสิทธิให้รายนี้
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
