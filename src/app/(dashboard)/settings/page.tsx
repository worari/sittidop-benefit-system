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
  Landmark,
  Award,
} from "lucide-react";

export default function SettingsPage() {
  const [insuranceKIA, setInsuranceKIA] = useState(2000000);
  const [disasterMultiplier, setDisasterMultiplier] = useState(30);
  const [armyFundGrant, setArmyFundGrant] = useState(1500000);
  const [funeralAid, setFuneralAid] = useState(200000);
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [smsNotifyEnabled, setSmsNotifyEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveParameters = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setStatusMsg("บันทึกเกณฑ์ประมาณการสิทธิกำลังพล กองทัพบก เรียบร้อยแล้ว");
      setTimeout(() => setStatusMsg(null), 4000);
    }, 600);
  };

  const handleResetDemoData = async () => {
    if (!confirm("ต้องการรีเซ็ตข้อมูลตัวอย่างกำลังพล กองทัพบก กลับเป็นค่าเริ่มต้นหรือไม่?")) return;
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        alert("รีเซ็ตข้อมูลตัวอย่างกำลังพล ทบ. สำเร็จแล้ว!");
        window.location.reload();
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการรีเซ็ต");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-700 dark:text-amber-400" />
          ตั้งค่าระบบและเกณฑ์การคำนวณสิทธิประโยชน์ กองทัพบก (RTA Settings)
        </h1>
        <p className="text-xs text-muted-foreground">
          ปรับแต่งวงเงินสินไหมประกันภัยสงคราม ตัวคูณเงินชดเชยราชการสนาม กองทุน สก.ทบ. และการจัดการข้อมูล
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Army Benefit Rules Configuration */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-700 dark:text-amber-400" />
            <div>
              <CardTitle className="text-base font-bold">
                เกณฑ์วงเงินสิทธิประโยชน์และเงินสงเคราะห์หลัก (หมวด 1 รับเงินครั้งเดียว)
              </CardTitle>
              <CardDescription className="text-xs">
                กำหนดอัตราและตัวคูณเงินสงเคราะห์ตามระเบียบ กห. และ กองทัพบก
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="insurance">สินไหมทดแทนประกันชีวิตภัยสงคราม (KIA) บาท</Label>
              <Input
                id="insurance"
                type="number"
                value={insuranceKIA}
                onChange={(e) => setInsuranceKIA(Number(e.target.value))}
                className="font-bold text-amber-600 dark:text-amber-400 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="multiplier">ตัวคูณชดเชยตาม พ.ร.บ. สงเคราะห์ผู้ประสบภัย (เท่าของเงินเดือน)</Label>
              <Input
                id="multiplier"
                type="number"
                value={disasterMultiplier}
                onChange={(e) => setDisasterMultiplier(Number(e.target.value))}
                className="font-bold text-emerald-600 dark:text-emerald-400 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="armyFund">เงินกองทุนสวัสดิการกองทัพบก / ช่วยเหลือผู้ประสบภัย (บาท)</Label>
              <Input
                id="armyFund"
                type="number"
                value={armyFundGrant}
                onChange={(e) => setArmyFundGrant(Number(e.target.value))}
                className="font-bold text-blue-600 dark:text-blue-400 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="funeral">เงินพระราชทานเพลิงศพ / ช่วยเหลือค่าจัดการศพ ทบ. (บาท)</Label>
              <Input
                id="funeral"
                type="number"
                value={funeralAid}
                onChange={(e) => setFuneralAid(Number(e.target.value))}
                className="font-bold text-purple-600 dark:text-purple-400 font-mono"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            onClick={handleSaveParameters}
            disabled={isSaving}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs gap-1.5"
          >
            <Save className="h-4 w-4 text-amber-400" />
            {isSaving ? "กำลังบันทึก..." : "บันทึกเกณฑ์สิทธิ กองทัพบก"}
          </Button>
        </CardFooter>
      </Card>

      {/* Security & Notification Controls */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-700 dark:text-amber-400" />
            <div>
              <CardTitle className="text-base font-bold">
                การแจ้งเตือนและการคุ้มครองข้อมูลกำลังพล
              </CardTitle>
              <CardDescription className="text-xs">
                การตั้งค่าระบบแจ้งเตือนสิทธิประโยชน์แก่ทายาท และการรักษาความปลอดภัยข้อมูล
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ระบบแจ้งเตือน SMS/Email ไปยังทายาทเมื่อสิทธิได้รับการอนุมัติ
              </p>
              <p className="text-muted-foreground">แจ้งเตือนสถานะเงินสงเคราะห์และการออกหนังสือรับรองสิทธิทางการ</p>
            </div>
            <Switch
              checked={smsNotifyEnabled}
              onCheckedChange={setSmsNotifyEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                ระบบตรวจสอบคุณสมบัติทายาทและการปูนบำเหน็จอัตโนมัติ
              </p>
              <p className="text-muted-foreground">คำนวณขั้นเงินเดือนและสัดส่วนทายาทตามกฎหมายอัตโนมัติ</p>
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
                การจัดการฐานข้อมูลกำลังพล กองทัพบก (Database Seeder)
              </CardTitle>
              <CardDescription className="text-xs">
                รีเซ็ตข้อมูลตัวอย่างกลับเป็นชุดข้อมูลมาตรฐานของ กองทัพบก (กพ.ทบ. / กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            การคลิกปุ่มรีเซ็ตจะทำการโหลดข้อมูลกำลังพลตัวอย่างสังกัดกองทัพบก (พล.ร.9, พล.ร.2 รอ., พล.ร.15, กรม ทพ.45) ข้อมูลทายาท และสูตรสิทธิประโยชน์ 4 หมวดของ ทบ.
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
            รีเซ็ตข้อมูลตัวอย่างกำลังพล ทบ. (Reset RTA Data)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
