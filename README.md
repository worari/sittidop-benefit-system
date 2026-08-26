# ระบบประมาณการสิทธิประโยชน์และเงินสงเคราะห์กำลังพล กองทัพบก (RTA Benefit System)
### Royal Thai Army (RTA) Military Benefit, Pension & Welfare Estimation Management System
**กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล**

[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Security](https://img.shields.io/badge/Security-RTA_Classified-emerald)](https://rta.mi.th)

---

## 🏛️ บทนำ (Overview)

**ระบบประมาณการสิทธิประโยชน์และเงินสงเคราะห์กำลังพล กองทัพบก (RTA Benefit System)** เป็นเว็บแอปพลิเคชันระดับองค์กร (Enterprise Web Application) ที่พัฒนาขึ้นตามสถาปัตยกรรมแบบ **Clean Architecture** เพื่อสนับสนุนภารกิจของ **กองทัพบก (Royal Thai Army)** โดย **กรมกำลังพลทหารบก (กพ.ทบ.)** และ **กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล** ในการประมาณการสิทธิประโยชน์ เงินสงเคราะห์ บำนาญพิเศษ บำเหน็จตกทอด ทุนการศึกษาบุตร และสิทธิการบรรจุทายาททดแทน สำหรับกำลังพลที่เสียชีวิต ทุพพลภาพ หรือได้รับบาดเจ็บจากการปฏิบัติหน้าที่ราชการสนามและการรบ

---

## 🎯 โครงสร้างสิทธิประโยชน์ 4 หมวดของกองทัพบก (4-Category RTA Benefit Structure)

1. **หมวดที่ 1: รับเงินครั้งเดียว (One-Time Lump Sum Grants & Aids)**:
   - **เงินสินไหมทดแทนประกันชีวิตทหารภัยสงคราม (กห./ทบ.)**: คุ้มครองกำลังพลเสียชีวิตและทุพพลภาพถาวร (1,000,000 - 2,000,000 บาท)
   - **เงินบำเหน็จตกทอดแก่ทายาทตามกฎหมาย**: คำนวณจากฐานเงินเดือนปูนบำเหน็จพิเศษคูณเวลาราชการรวม (`{promotedSalary} * {totalServiceYears} * 1.5`)
   - **เงินช่วยเหลือตาม พ.ร.บ. สงเคราะห์ผู้ประสบภัยเนื่องจากการปฏิบัติราชการสนาม พ.ศ. 2543**: จ่าย 30 เท่าของเงินเดือน
   - **เงินเพิ่มพิเศษผลต่างการปูนบำเหน็จเลื่อนชั้นยศ (7 - 9 ชั้นยศ)**
   - **เงินกองทุนสวัสดิการกองทัพบก (สก.ทบ.) / กองทุนช่วยเหลือผู้ประสบภัย ทบ.**
   - **เงินฌาปนกิจสงเคราะห์กองทัพบก (ฌส.ทบ.)** และเงินพระราชทานเพลิงศพ
   - **เงินช่วยเหลือจากมูลนิธิสายใจไทยในพระบรมราชูปถัมภ์ / องค์การสงเคราะห์ทหารผ่านศึก (ผศ.)**

2. **หมวดที่ 2: รับเงินรายเดือน (Monthly Recurring Pension & Allowances)**:
   - **บำนาญพิเศษทายาท (Special Pension for Heirs)**: จ่ายให้แก่ทายาทตามสัดส่วนกฎหมาย อิงฐานเงินเดือนปูนบำเหน็จพิเศษ
   - **เงินเพิ่มพิเศษสำหรับการสู้รบ (พ.ช.ท.)**: เงินเพิ่มรายเดือนสำหรับกำลังพลปฏิบัติหน้าที่ในพื้นที่การรบและเสี่ยงภัย
   - **เงินบำนาญกำลังพลทุพพลภาพ ทบ.**: จ่ายรายเดือนตลอดชีพ
   - **เงินช่วยเหลือรายเดือนจากกองทุนสวัสดิการกองทัพบก (สก.ทบ.)**

3. **หมวดที่ 3: รับเงินรายปี (Annual Grants & Scholarships)**:
   - **ทุนการศึกษาบุตรกำลังพล ทบ. (สก.ทบ.)**: ให้ทุนการศึกษาแก่บุตรกำลังพลจนสำเร็จการศึกษาระดับปริญญาตรี (ประถม, มัธยม, ปวช./ปวส., ปริญญาตรี)
   - **ทุนมูลนิธิ พล.อ.เปรม ติณสูลานนท์**
   - **ทุนมูลนิธิสายใจไทยในพระบรมราชูปถัมภ์** สำหรับบุตรกำลังพลผู้สูญเสีย

4. **หมวดที่ 4: สิทธิประโยชน์มิใช่ตัวเงินและสิทธิด้านอื่นๆ (Non-Monetary & Honour Rights)**:
   - **สิทธิการบรรจุทายาททดแทนเข้ารับราชการในกองทัพบก (1 อัตรา)**: ตามคุณวุฒิการศึกษาและเกณฑ์กระทรวงกลาโหม
   - **สิทธิการรักษาพยาบาล รพ.พระมงกุฎเกล้า / รพ.ค่าย สังกัด กรมแพทย์ทหารบก (พบ.) ตลอดชีพ**
   - **สิทธิเสนอขอพระราชทานเหรียญพิทักษ์เสรีชน / เหรียญกล้าหาญ / เหรียญราชการชายแดน**
   - **สิทธิเงินกู้สวัสดิการเคหะ ทบ. อัตราดอกเบี้ยพิเศษ** เพื่อที่อยู่อาศัยของทายาท

---

## 🏗️ สถาปัตยกรรมระบบ (Clean Architecture Structure)

```
src/
├── core/
│   ├── domain/                  # Enterprise Military Rules & Domain Entities
│   │   ├── entities/            # MilitaryPersonnel, BenefitRule, Heir, Application, User, AuditLog
│   │   ├── value-objects/       # military-types, Role, MilitaryBranch, MilitaryRank, LossType
│   │   └── repositories/        # Repository Interfaces (IMilitaryPersonnelRepository, IMilitaryRuleRepository...)
│   └── use-cases/               # Application Business Rules
│       ├── estimation/          # MilitaryRuleEngine (เครื่องมือคำนวณสิทธิ 4 หมวดของ ทบ.)
│       ├── documents/           # OfficialDocumentService (สร้างหนังสือรับรองสิทธิ กพ.ทบ. + QR Code)
│       └── import/              # ExcelImportService (นำเข้าข้อมูลกำลังพลและทายาท)
├── infrastructure/              # Frameworks, Drivers & External Services
│   ├── database/
│   │   ├── prisma.ts            # Prisma Client Singleton
│   │   └── repositories/        # MilitaryStoreManager, PrismaMilitaryRuleRepository, PrismaUserRepository
│   ├── auth/                    # NextAuth RBAC Guard & Army User Roles
│   └── logging/                 # Structured ISO 27001 / MOD Security Audit Logger
├── presentation/                # Interface Adapters & UI Components
│   ├── components/
│   │   ├── layout/              # AppHeader (RTA Crest), Sidebar, UserNav, ThemeToggle
│   │   ├── calculator/          # MilitaryBenefitCalculator (คำนวณสิทธิ 4 หมวดของ ทบ. แบบละเอียด)
│   │   ├── dashboard/           # ภาพรวมสถิติงบประมาณและกำลังพล ทบ.
│   │   ├── personnel/           # PersonnelTable (ทะเบียนประวัติกำลังพล สังกัด ทภ.1-4, ฉก.สนาม)
│   │   ├── family/ & heirs/     # ข้อมูลครอบครัวและสัดส่วนทายาทตามกฎหมาย
│   │   ├── rules/               # RuleManager (จัดการสูตรและเกณฑ์สิทธิประโยชน์)
│   │   ├── documents/           # DocumentStudio (สร้างและพิมพ์หนังสือรับรองสิทธิ กพ.ทบ.)
│   │   ├── import/              # ExcelImportWizard (นำเข้าไฟล์ Excel ทบ.)
│   │   └── reports/             # ReportGenerator (รายงานสถิติและหนังสือรับรอง)
│   └── lib/                     # Currency, Thai Buddhist Era (พ.ศ.) & Military Formatters
└── app/                         # Next.js 15 App Router Pages & API Route Handlers
    ├── (auth)/login/            # เข้าสู่ระบบพร้อมบัญชีทดสอบระดับ ทบ.
    ├── (dashboard)/             # ระบบปฏิบัติงานภายใน ทบ. (Dashboard, Calculator, Personnel, Rules, Docs...)
    ├── api/                     # RESTful API Endpoints (/personnel, /rules, /documents, /calculator...)
    ├── globals.css              # Army Green & Gold Military Design Tokens
    ├── layout.tsx               # Root Layout with RTA Title & Providers
    └── page.tsx                 # หน้าพอร์ทัลบริการกำลังพล ทบ. พร้อม Live Fast Estimator
```

---

## 🔐 บัญชีผู้ใช้งานทดสอบระบบ (Demo Accounts for Royal Thai Army)

| บทบาทหน้าที่ | ชื่อ-สกุล | อีเมล | รหัสผ่าน | สิทธิ์การใช้งาน |
|---|---|---|---|---|
| **ผู้ดูแลระบบ (Admin)** | พันเอก พงศกร พิทักษ์สิทธิ์ | `admin@army.mod.go.th` | `admin1234` | สิทธิ์สูงสุด จัดการเกณฑ์สิทธิและผู้ใช้ กพ.ทบ. |
| **เจ้าหน้าที่สวัสดิการ (Staff)** | พันตรี นพดล สายสวัสดิการ | `staff@army.mod.go.th` | `staff1234` | คำนวณและออกหนังสือรับรองสิทธิ กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล |
| **ผู้บังคับบัญชา (Commander)** | พลโท สมโชค ชัยชนะ | `commander@army.mod.go.th` | `commander1234` | ลงนามอนุมัติสิทธิและหนังสือรับรอง จก.กพ.ทบ. |
| **ผู้ตรวจสอบ (Auditor)** | พันเอก พิษณุ ตรวจการดี | `auditor@army.mod.go.th` | `auditor1234` | ตรวจสอบรายงานและ Audit Logs สตส.ทบ. |
| **กำลังพล / ทายาท (Personnel)** | สิบเอก สันติ ผู้รับสิทธิ | `readonly@army.mod.go.th` | `readonly1234` | ตรวจสอบสิทธิและสถานะเงินสงเคราะห์ |

---

## 🚀 การติดตั้งและรันระบบ (Getting Started)

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

2. รันในโหมดพัฒนา (Development Mode):
   ```bash
   npm run dev
   ```
   เข้าใช้งานผ่านเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

3. ตรวจสอบการ Build สำหรับ Production:
   ```bash
   npm run build
   ```

---

## 🛡️ มาตรฐานความปลอดภัย
ระบบถูกออกแบบตามระเบียบว่าด้วยการรักษาความลับของทางราชการ และมาตรฐานความปลอดภัยสารสนเทศของกระทรวงกลาโหม ข้อมูลเลขบัตรประจำตัวและประวัติการสูญเสียได้รับการเข้ารหัสและควบคุมสิทธิ์การเข้าถึงอย่างเคร่งครัด

ลิขสิทธิ์ © 2569 กองทัพบก (Royal Thai Army) • กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล