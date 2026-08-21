"use client";

import React, { useState, useEffect } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import { formatCurrency } from "@/presentation/lib/utils";
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  FileCheck,
  Building,
  User,
  PieChart,
  Percent,
} from "lucide-react";

export function HeirTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPersonnelList(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const allHeirs = personnelList.flatMap((p) =>
    (p.heirs || []).map((h) => ({
      ...h,
      personnelId: p.id,
      personnelMilitaryId: p.militaryId,
      personnelName: `${p.rankAbbr} ${p.firstName} ${p.lastName}`,
      personnelUnit: p.normalUnit,
      lossType: p.lossType,
      estimatedLumpSum: p.lossType === "KIA_COMBAT_DEATH" ? 7491500 : 4890000,
    }))
  );

  const filteredHeirs = allHeirs.filter(
    (h) =>
      search === "" ||
      h.fullName.toLowerCase().includes(search.toLowerCase()) ||
      h.personnelName.toLowerCase().includes(search.toLowerCase()) ||
      h.nationalId.includes(search) ||
      h.personnelMilitaryId.includes(search)
  );

  const getRelationshipBadge = (rel: string) => {
    switch (rel) {
      case "SPOUSE_LEGAL":
        return <Badge className="bg-purple-600 text-white">คู่สมรสตามกฎหมาย</Badge>;
      case "CHILD_LEGITIMATE":
        return <Badge className="bg-blue-600 text-white">บุตรชอบด้วยกฎหมาย</Badge>;
      case "FATHER":
        return <Badge className="bg-amber-600 text-white">บิดา</Badge>;
      case "MOTHER":
        return <Badge className="bg-pink-600 text-white">มารดา</Badge>;
      default:
        return <Badge variant="secondary">ทายาทอื่น</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ทะเบียนข้อมูลทายาทและการจัดสรรสิทธิ (Heir Information)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            การจัดสรรสัดส่วนร้อยละของเงินบำเหน็จตกทอด เงินสงเคราะห์ตามกฎหมาย และบัญชีรับโอนเงิน
          </p>
        </div>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนคู่สมรสตามกฎหมาย</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">50% ของยอดเงินรวม</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนบุตรชอบด้วยกฎหมาย</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">25% (แบ่งเท่ากัน)</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">สัดส่วนบิดา-มารดา</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">25% (บิดา/มารดา)</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อทายาท, ชื่อกำลังพล, เลขบัตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Heirs Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold">ชื่อทายาท / เลขบัตรประชาชน</TableHead>
                <TableHead className="text-xs font-bold">ความสัมพันธ์</TableHead>
                <TableHead className="text-xs font-bold">กำลังพลผู้รับสิทธิ</TableHead>
                <TableHead className="text-xs font-bold">สัดส่วนที่ได้รับ (%)</TableHead>
                <TableHead className="text-xs font-bold">ประมาณการเงินจัดสรร</TableHead>
                <TableHead className="text-xs font-bold text-right">สถานะเอกสาร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลทายาท...
                  </TableCell>
                </TableRow>
              ) : filteredHeirs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    ไม่พบข้อมูลทายาท
                  </TableCell>
                </TableRow>
              ) : (
                filteredHeirs.map((h, idx) => {
                  const shareAmount = Math.round(h.estimatedLumpSum * (h.allocationPercentage / 100));
                  return (
                    <TableRow key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      <TableCell className="py-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {h.fullName}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            {h.nationalId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{getRelationshipBadge(h.relationship)}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {h.personnelName}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            ID: {h.personnelMilitaryId} ({h.personnelUnit})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold">
                        <Badge variant="outline" className="text-xs font-bold">
                          {h.allocationPercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-emerald-600">
                        {formatCurrency(shareAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>ตรวจสอบแล้ว</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
