"use client";

import React, { useState, useEffect } from "react";
import { MilitaryPersonnelRecord } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import {
  Users2,
  Search,
  GraduationCap,
  HeartHandshake,
  Heart,
  Plus,
  CheckCircle2,
  Award,
  UserCheck,
} from "lucide-react";

export function FamilyTable() {
  const [personnelList, setPersonnelList] = useState<MilitaryPersonnelRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState<MilitaryPersonnelRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/personnel")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPersonnelList(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = personnelList.filter((p) => {
    return (
      search === "" ||
      p.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (p.spouse && p.spouse.fullName.toLowerCase().includes(search.toLowerCase())) ||
      (p.children && p.children.some((c) => c.fullName.toLowerCase().includes(search.toLowerCase())))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              ข้อมูลครอบครัวกำลังพล (Family Information)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            ทะเบียนข้อมูลคู่สมรสจดทะเบียน บุตรในอุปการะ สิทธิทุนการศึกษา และการจับคู่ทายาททดแทน
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อกำลังพล, คู่สมรส, หรือบุตร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Family Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-xs text-muted-foreground">
            กำลังโหลดข้อมูลครอบครัว...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-xs text-muted-foreground">
            ไม่พบข้อมูลครอบครัว
          </div>
        ) : (
          filtered.map((p) => {
            const hasSuccessor = p.children?.some((c) => c.age >= 18 && c.age <= 35);
            return (
              <Card
                key={p.id}
                className="border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/50 transition-all space-y-4 p-5"
              >
                {/* Personnel Top Line */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      {p.militaryId}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {p.rankAbbr} {p.firstName} {p.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{p.normalUnit}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {p.lossType === "KIA_COMBAT_DEATH" ? "เสียชีวิตในการรบ" : "ทุพพลภาพ"}
                  </Badge>
                </div>

                {/* Spouse Section */}
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-purple-600 fill-purple-600" />
                      คู่สมรสตามกฎหมาย (Spouse)
                    </span>
                    {p.spouse ? (
                      <Badge className="bg-purple-600 text-white text-[9px]">จดทะเบียนสมรส</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px]">ไม่มีข้อมูล</Badge>
                    )}
                  </div>
                  {p.spouse ? (
                    <div className="text-xs space-y-0.5 pt-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.spouse.fullName}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        เลขบัตร: {p.spouse.nationalId}
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                        สิทธิการจัดสรรเงินบำเหน็จตกทอด: {p.spouse.allocationPercentage}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">โสด / ไม่ได้จดทะเบียน</p>
                  )}
                </div>

                {/* Children Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      บุตรในอุปการะ ({p.children?.length || 0} คน)
                    </span>
                    {hasSuccessor && (
                      <Badge className="bg-emerald-600 text-white text-[9px] gap-1">
                        <UserCheck className="h-3 w-3" />
                        มีทายาทเข้าเกณฑ์บรรจุทดแทน (18-35 ปี)
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {p.children && p.children.length > 0 ? (
                      p.children.map((child, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold">{child.fullName}</span>
                            <span className="text-[10px] text-muted-foreground block">
                              อายุ {child.age} ปี • ระดับ {child.educationLevel}
                            </span>
                          </div>
                          <div className="text-right space-y-0.5">
                            {child.isStudying ? (
                              <Badge className="bg-blue-600 text-white text-[9px]">
                                รับทุนการศึกษา {child.educationLevel === "BACHELOR" ? "฿35,000/ปี" : "฿12,000/ปี"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px]">จบการศึกษาแล้ว</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground p-2 text-center">ไม่มีบุตร</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
