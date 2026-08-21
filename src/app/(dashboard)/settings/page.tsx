"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { Badge } from "../../../presentation/components/ui/badge";
import { Switch } from "../../../presentation/components/ui/switch";
import {
  Settings,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [tier60, setTier60] = useState(600);
  const [tier70, setTier70] = useState(700);
  const [tier80, setTier80] = useState(800);
  const [tier90, setTier90] = useState(1000);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveParameters = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setStatusMsg("บันทึกการตั้งค่าเกณฑ์ประมาณการสิทธิสวัสดิการเรียบร้อยแล้ว");
      setTimeout(() => setStatusMsg(null), 4000);
    }, 600);
  };

  const handleResetDemoData = async () => {
    if (!confirm("ต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?")) return;
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        alert("รีเซ็ตข้อมูลตัวอย่างมาตรฐานสำเร็จแล้ว!");
        window.location.reload();
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการรีเซ็ต");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          ตั้งค่าระบบและเกณฑ์การประมาณการสิทธิ (System Settings)
        </h1>
        <p className="text-xs text-muted-foreground">
          ปรับแต่งอัตราเบี้ยยังชีพขั้นบันได กฎเกณฑ์การประเมินความเปราะบาง และการจัดการฐานข้อมูล
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Benefit Rules Configuration */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-base font-bold">
                อัตราเบี้ยยังชีพผู้สูงอายุแห่งชาติ (แบบขั้นบันได พ.ร.บ. ผู้สูงอายุ)
              </CardTitle>
              <CardDescription className="text-xs">
                กำหนดอัตราเงินสวัสดิการรายเดือนตามกลุ่มอายุ (บาท/คน/เดือน)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tier60">ช่วงอายุ 60 - 69 ปี (บาท/เดือน)</Label>
              <Input
                id="tier60"
                type="number"
                value={tier60}
                onChange={(e) => setTier60(Number(e.target.value))}
                className="font-bold text-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier70">ช่วงอายุ 70 - 79 ปี (บาท/เดือน)</Label>
              <Input
                id="tier70"
                type="number"
                value={tier70}
                onChange={(e) => setTier70(Number(e.target.value))}
                className="font-bold text-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier80">ช่วงอายุ 80 - 89 ปี (บาท/เดือน)</Label>
              <Input
                id="tier80"
                type="number"
                value={tier80}
                onChange={(e) => setTier80(Number(e.target.value))}
                className="font-bold text-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tier90">ช่วงอายุ 90 ปีขึ้นไป (บาท/เดือน)</Label>
              <Input
                id="tier90"
                type="number"
                value={tier90}
                onChange={(e) => setTier90(Number(e.target.value))}
                className="font-bold text-emerald-600"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            onClick={handleSaveParameters}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "กำลังบันทึก..." : "บันทึกอัตราเกณฑ์สิทธิ"}
          </Button>
        </CardFooter>
      </Card>

      {/* System Automation & Security */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-base font-bold">
                การควบคุมความปลอดภัยและระบบอัตโนมัติ
              </CardTitle>
              <CardDescription className="text-xs">
                การตั้งค่าระบบแจ้งเตือน และการตรวจสอบสิทธิอัตโนมัติ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ระบบแจ้งเตือนทาง SMS/Email เมื่อคำขอผ่านการอนุมัติ
              </p>
              <p className="text-muted-foreground">ส่งข้อความอัตโนมัติไปยังหมายเลขโทรศัพท์ผู้สูงอายุ/ทายาท</p>
            </div>
            <Switch
              checked={emailNotifyEnabled}
              onCheckedChange={setEmailNotifyEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ระบบตรวจคุณสมบัติล่วงหน้าแบบอัตโนมัติ (AI Pre-screening)
              </p>
              <p className="text-muted-foreground">ตรวจสอบความครบถ้วนของเอกสารด้วย OCR อัตโนมัติก่อนส่งเจ้าหน้าที่</p>
            </div>
            <Switch
              checked={autoApproveEnabled}
              onCheckedChange={setAutoApproveEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Maintenance & Reset */}
      <Card className="border-rose-200 dark:border-rose-950/50 shadow-xs bg-rose-50/20 dark:bg-rose-950/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-rose-600" />
            <div>
              <CardTitle className="text-base font-bold text-rose-900 dark:text-rose-300">
                การจัดการฐานข้อมูลและการทดสอบ (Database Seeder)
              </CardTitle>
              <CardDescription className="text-xs">
                รีเซ็ตข้อมูลตัวอย่างกลับเป็นชุดข้อมูลมาตรฐานของกรมกิจการผู้สูงอายุ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            การคลิกปุ่มรีเซ็ตจะทำการโหลดข้อมูลโครงการสวัสดิการ 7 โครงการ บัญชีผู้ใช้ตัวอย่าง 4 บทบาท (Admin, Officer, Auditor, Citizen) ทะเบียนผู้สูงอายุ 8 ราย และคำขอ 7 รายการ
          </p>
        </CardContent>
        <CardFooter className="border-t border-rose-200/50 dark:border-rose-900/30 pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleResetDemoData}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            รีเซ็ตข้อมูลตัวอย่าง (Reset & Re-seed Demo Data)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
