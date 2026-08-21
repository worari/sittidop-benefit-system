"use client";

import Link from "next/link";
import { BenefitCalculatorWizard } from "../presentation/components/calculator/BenefitCalculatorWizard";
import { ThemeToggle } from "../presentation/components/layout/ThemeToggle";
import { Button } from "../presentation/components/ui/button";
import { Badge } from "../presentation/components/ui/badge";
import {
  Calculator,
  ShieldCheck,
  Building2,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  Lock,
  Globe,
  LogIn,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-background to-slate-100/60 dark:from-slate-950 dark:via-background dark:to-slate-950">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  sittidop
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Gov Portal
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                ระบบประมาณการสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                เข้าสู่ระบบเจ้าหน้าที่ / ประชาชน
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold gap-1.5 shadow-sm shadow-emerald-600/20">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">เข้าสู่ระบบปฏิบัติงาน</span>
                <span className="sm:hidden">ระบบงาน</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/50 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300 text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            แพลตฟอร์มดิจิทัลเพื่อการคุ้มครองสิทธิและส่งเสริมสวัสดิการผู้สูงอายุแห่งชาติ
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            ระบบประมาณการสิทธิสวัสดิการ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              กรมกิจการผู้สูงอายุ (DOP)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            บริการตรวจสอบและประมาณการสิทธิเบี้ยยังชีพ สิทธิคนพิการ เงินสงเคราะห์ฉุกเฉิน และทุนปรับปรุงที่อยู่อาศัย ครบจบในที่เดียว พร้อมระบบยื่นคำขอและติดตามผลทางอิเล็กทรอนิกส์
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a href="#calculator-section">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base gap-2 shadow-lg shadow-emerald-600/25 px-6">
                <Calculator className="h-5 w-5" />
                เริ่มต้นคำนวณสิทธิของท่านทันที
              </Button>
            </a>
            <Link href="/benefits">
              <Button size="lg" variant="outline" className="font-semibold text-sm sm:text-base gap-2">
                <Layers className="h-5 w-5 text-slate-500" />
                ดูทำเนียบ 7 โครงการสวัสดิการ
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ระเบียบกระทรวงมหาดไทย พ.ศ. 2566
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              คุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-emerald-600" />
              ความปลอดภัยระดับมาตรฐานภาครัฐ
            </span>
          </div>
        </section>

        {/* Embedded Interactive Calculator */}
        <section id="calculator-section" className="py-8 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-card/90 backdrop-blur-md p-6 sm:p-10 shadow-xl">
            <BenefitCalculatorWizard />
          </div>
        </section>

        {/* 7 Benefit Programs Showcase */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-xs">
              ทำเนียบสวัสดิการภาครัฐ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              7 โครงการสวัสดิการและเงินช่วยเหลือที่ครอบคลุม
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              ออกแบบตามกรอบกฎหมาย พ.ร.บ. ผู้สูงอายุ และระเบียบกรมกิจการผู้สูงอายุเพื่อคนไทยทุกคน
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                code: "DOP-ELD-001",
                title: "เบี้ยยังชีพผู้สูงอายุแห่งชาติ",
                rate: "600 - 1,000 บาท/เดือน",
                desc: "จ่ายแบบขั้นบันไดตามช่วงอายุ 60, 70, 80, 90 ปีขึ้นไป ทั่วประเทศ",
              },
              {
                code: "DOP-DIS-002",
                title: "เบี้ยความพิการสำหรับผู้สูงอายุ",
                rate: "800 - 1,000 บาท/เดือน",
                desc: "รับควบคู่กับเบี้ยยังชีพ พร้อมเงินเพิ่มพิเศษสำหรับผู้ถือบัตรสวัสดิการแห่งรัฐ",
              },
              {
                code: "DOP-SWC-003",
                title: "สิทธิสวัสดิการแห่งรัฐเสริม",
                rate: "400 - 1,415 บาท/เดือน",
                desc: "วงเงินซื้อสินค้าอุปโภคบริโภค ส่วนลดค่าสาธารณูปโภค และเงินเพิ่มพิเศษ",
              },
              {
                code: "DOP-EMG-004",
                title: "เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก",
                rate: "สูงสุด 3,000 บาท/ครั้ง",
                desc: "เงินช่วยเหลือฉุกเฉินสำหรับผู้สูงอายุที่ประสบความเดือดร้อน ไร้ที่พึ่ง (สูงสุด 3 ครั้ง/ปี)",
              },
              {
                code: "DOP-HSG-005",
                title: "เงินช่วยเหลือปรับปรุงบ้านผู้สูงอายุ",
                rate: "22,500 - 40,000 บาท/หลัง",
                desc: "ปรับปรุงห้องน้ำ ทางลาด หลังคา และสภาพแวดล้อมให้ปลอดภัยและถูกสุขลักษณะ",
              },
              {
                code: "DOP-FNL-006",
                title: "เงินสงเคราะห์ค่าทำศพตามประเพณี",
                rate: "3,000 บาท/ราย",
                desc: "เงินช่วยเหลือครอบครัวและผู้จัดการศพผู้สูงอายุที่มีฐานะยากจนตามเกณฑ์ พม.",
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-card hover:border-emerald-500/50 hover:shadow-md transition-all space-y-2"
              >
                <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {p.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.title}</h3>
                <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">{p.rate}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              DOP
            </div>
            <div>
              <p className="font-bold text-slate-100">กรมกิจการผู้สูงอายุ (Department of Older Persons)</p>
              <p className="text-slate-400 text-[11px]">กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)</p>
            </div>
          </div>
          <div className="text-center sm:text-right text-slate-400 text-[11px] space-y-1">
            <p>สายด่วน พม. โทร 1300 ตลอด 24 ชั่วโมง</p>
            <p>© 2569 sittidop-benefit-system. All Rights Reserved. Clean Architecture & Production Ready.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
