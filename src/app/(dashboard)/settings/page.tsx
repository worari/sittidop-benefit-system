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
  Send,
  MessageCircle,
  Check,
  Loader2,
  HelpCircle,
  ExternalLink,
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

  // Telegram Settings State
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [hasSavedToken, setHasSavedToken] = useState(false);
  const [maskedToken, setMaskedToken] = useState("");
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramResult, setTelegramResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load Telegram Settings
  React.useEffect(() => {
    async function loadTelegramSettings() {
      setIsLoadingTelegram(true);
      try {
        const res = await fetch("/api/settings/telegram");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setTelegramChatId(json.data.chatId || "");
            setTelegramEnabled(json.data.enabled !== false);
            setHasSavedToken(Boolean(json.data.hasBotToken));
            setMaskedToken(json.data.botTokenMasked || "");
          }
        }
      } catch (err) {
        console.warn("Failed to load Telegram settings:", err);
      } finally {
        setIsLoadingTelegram(false);
      }
    }
    loadTelegramSettings();
  }, []);

  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    setTelegramResult(null);
    try {
      const res = await fetch("/api/settings/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramBotToken || undefined,
          chatId: telegramChatId,
          enabled: telegramEnabled,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTelegramResult({ success: true, message: "บันทึกการตั้งค่า Telegram เรียบร้อยแล้ว" });
        setHasSavedToken(Boolean(json.data.hasBotToken));
        setMaskedToken(json.data.botTokenMasked || "");
        setTelegramBotToken("");
      } else {
        setTelegramResult({ success: false, message: json.error || "บันทึกการตั้งค่าไม่สำเร็จ" });
      }
    } catch {
      setTelegramResult({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ" });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramResult(null);
    try {
      const res = await fetch("/api/settings/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramBotToken || undefined,
          chatId: telegramChatId || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTelegramResult({
          success: true,
          message: "✅ ส่งข้อความทดสอบไปยังแอป Telegram สำเร็จ! ตรวจสอบข้อความใน Telegram ของท่าน",
        });
      } else {
        setTelegramResult({
          success: false,
          message: `❌ ส่งข้อความไม่สำเร็จ: ${json.error || "กรุณาตรวจสอบ Token และ Chat ID"}`,
        });
      }
    } catch (err: any) {
      setTelegramResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย",
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

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

      {/* Telegram Notification Bot Integration */}
      <Card className="border-sky-200/70 dark:border-sky-950/60 shadow-xs bg-sky-50/20 dark:bg-sky-950/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>การแจ้งเตือนแอป Telegram (Telegram Bot Integration)</span>
                  <Badge variant="outline" className="text-[10px] border-sky-400 text-sky-700 dark:text-sky-300">
                    รายงานการสูญเสีย
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  ส่งข้อความด่วนแจ้งเตือนเข้ากลุ่มหรือบัญชี Telegram ทันทีที่มีการบันทึกรายงานการสูญเสียกำลังพล (กพ.๓ - กพ.๔)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="telegram-toggle" className="text-xs font-semibold cursor-pointer">
                {telegramEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </Label>
              <Switch
                id="telegram-toggle"
                checked={telegramEnabled}
                onCheckedChange={setTelegramEnabled}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {telegramResult && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                telegramResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
              }`}
            >
              {telegramResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{telegramResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="botToken" className="text-xs font-semibold">
                  Telegram Bot Token
                </Label>
                {hasSavedToken && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    ✓ กำหนดค่าแล้ว ({maskedToken})
                  </span>
                )}
              </div>
              <Input
                id="botToken"
                type="password"
                placeholder={hasSavedToken ? "กรอกเพื่อเปลี่ยน Token ใหม่ (เช่น 7123456789:AAFx...)" : "เช่น 7123456789:AAFx..."}
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                รับ Token จากบอท <b>@BotFather</b> ใน Telegram โดยส่งคำสั่ง <code>/newbot</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="chatId" className="text-xs font-semibold">
                Telegram Chat ID / Group ID
              </Label>
              <Input
                id="chatId"
                type="text"
                placeholder="เช่น -1001234567890 หรือ 987654321"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                ID ของกลุ่มหรือห้องแชทที่จะรับแจ้งเตือน (เชิญบอทเข้ากลุ่ม แล้วทัก <b>@userinfobot</b> เพื่อดู Chat ID)
              </p>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-sky-600" />
              <span>วิธีตั้งค่าการแจ้งเตือน Telegram สำหรับศูนย์ปฏิบัติการ ทบ.</span>
            </p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>เปิดแอป Telegram ค้นหาบอท <b>@BotFather</b> แล้วส่งคำสั่ง <code>/newbot</code> เพื่อสร้างบอทใหม่และรับ HTTP API Token</li>
              <li>นำบอทที่สร้างเข้าสู่กลุ่มไลน์/กลุ่มงานสารบรรณ ทบ. และตั้งค่าเป็น Admin ของกลุ่ม</li>
              <li>หา Chat ID ของกลุ่มโดยค้นหา <b>@userinfobot</b> หรือส่งข้อความในกลุ่ม แล้วกรอกลงในช่อง Chat ID ข้างต้น</li>
              <li>กด <b>"ทดสอบส่งการแจ้งเตือน"</b> เพื่อยืนยันว่าบอทสามารถส่งข้อความเข้ากลุ่มได้สำเร็จ</li>
            </ol>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-100 dark:border-sky-950/80 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestTelegram}
            disabled={isTestingTelegram || (!hasSavedToken && !telegramBotToken) || (!telegramChatId && !telegramChatId)}
            className="text-xs gap-1.5 border-sky-300 text-sky-800 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
          >
            {isTestingTelegram ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>{isTestingTelegram ? "กำลังทดสอบส่ง..." : "ทดสอบส่งการแจ้งเตือน Telegram"}</span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveTelegram}
            disabled={isSavingTelegram}
            className="bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs gap-1.5"
          >
            {isSavingTelegram ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isSavingTelegram ? "กำลังบันทึก..." : "บันทึกการตั้งค่า Telegram"}</span>
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
