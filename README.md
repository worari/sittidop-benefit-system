# sittidop-benefit-system
### ระบบประมาณการสิทธิสวัสดิการและบริหารจัดการสิทธิประโยชน์ กรมกิจการผู้สูงอายุ (DOP)
**Department of Older Persons (DOP) Welfare & Benefit Estimation Management System**

[![CI - sittidop-benefit-system](https://github.com/dop-thailand/sittidop-benefit-system/actions/workflows/ci.yml/badge.svg)](https://github.com/dop-thailand/sittidop-benefit-system/actions)
[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma)](https://www.prisma.io/)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

---

## 🏛️ บทนำ (Overview)

**sittidop-benefit-system** เป็นเว็บแอปพลิเคชันระดับองค์กร (Enterprise Web Application) ที่พัฒนาขึ้นตามสถาปัตยกรรมแบบ **Clean Architecture** เพื่อสนับสนุนภารกิจของ **กรมกิจการผู้สูงอายุ (DOP) กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (พม.)** ในการประมาณการสิทธิสวัสดิการผู้สูงอายุแห่งชาติ การตรวจสอบคุณสมบัติสิทธิประโยชน์แบบเรียลไทม์ การบริหารจัดการคำขอรับเงินสงเคราะห์ (Claims Processing) และการติดตามผลการอนุมัติงบประมาณระดับประเทศ

---

## 🏗️ สถาปัตยกรรมระบบ (Clean Architecture Structure)

ระบบถูกออกแบบโดยแยก Layer ของความรับผิดชอบอย่างชัดเจน (Separation of Concerns):

```
src/
├── core/
│   ├── domain/                  # Enterprise Business Rules & Domain Entities
│   │   ├── entities/            # Citizen, BenefitProgram, BenefitRule, Application, User, AuditLog
│   │   ├── value-objects/       # Role, BenefitCategory, PaymentFrequency, VulnerabilityLevel
│   │   └── repositories/        # Repository Interfaces (ICitizenRepository, IApplicationRepository...)
│   └── use-cases/               # Application Business Rules
│       ├── estimation/          # BenefitEstimationEngine (Rules Engine คำนวณเบี้ยขั้นบันได & สิทธิ)
│       ├── applications/        # ApplicationService (กระบวนการยื่นคำขอ, ตรวจสอบ, อนุมัติสิทธิ)
│       ├── citizens/            # CitizenService (จัดการทะเบียนประวัติและความเปราะบาง)
│       └── analytics/           # GetDashboardMetricsUseCase (วิเคราะห์ KPI & สถิติ)
├── infrastructure/              # Frameworks, Drivers & External Services
│   ├── database/
│   │   ├── prisma.ts            # Prisma Client Singleton
│   │   └── repositories/        # Prisma Repositories & In-Memory Store Manager Fallback
│   ├── auth/                    # NextAuth (Auth.js) Configuration & JWT Callbacks
│   ├── logging/                 # Structured ISO 27001 / PDPA Audit Logger
│   └── seed/                    # Comprehensive Database Seeder (7 โครงการ, 4 Demo Users, 8 ประชาชน)
├── presentation/                # Interface Adapters & UI Components
│   ├── components/
│   │   ├── ui/                  # Shadcn UI Base Primitives (Button, Dialog, Table, Card, Badge...)
│   │   ├── layout/              # AppHeader, Sidebar, UserNav, ThemeToggle, Providers
│   │   ├── calculator/          # BenefitCalculatorWizard (เครื่องมือคำนวณสิทธิ 5 ขั้นตอน + Live Breakdown)
│   │   ├── dashboard/           # MetricCards, TrendsChart, DemographicsChart, ClaimsPipeline
│   │   ├── benefits/            # BenefitCatalog (ทำเนียบโครงการ & รายละเอียดเกณฑ์กฎหมาย)
│   │   ├── applications/        # ApplicationTable (Workflow ตรวจสอบเอกสาร & อนุมัติ)
│   │   ├── citizens/            # CitizenTable (ทะเบียนผู้สูงอายุ & ดัชนีความเปราะบาง)
│   │   ├── reports/             # ReportGenerator & หนังสือรับรองสิทธิทางการ (Printable Certificate)
│   │   └── audit/               # AuditLogViewer (ประวัติการทำงานตรวจสอบย้อนกลับได้)
│   └── lib/                     # Currency, Thai Buddhist Era (พ.ศ.) & National ID Formatters
└── app/                         # Next.js 15 App Router Pages & API Route Handlers
    ├── (auth)/login/            # เข้าสู่ระบบพร้อม Role Quick-Switcher
    ├── (dashboard)/             # ระบบปฏิบัติงานภายใน (Dashboard, Calculator, Benefits, Claims, Reports, Settings)
    ├── api/                     # RESTful API Endpoints (/calculator/estimate, /applications, /benefits...)
    ├── globals.css              # Tailwind CSS Design System Tokens
    ├── layout.tsx               # Root Layout with Theme & Session Providers
    └── page.tsx                 # พอร์ทัลประชาชนหน้าแรก (Public Landing & Instant Estimator)
```

---

## 🎯 ฟีเจอร์หลักของระบบ (Core Features)

1. **เครื่องมือคำนวณประมาณการสิทธิอัจฉริยะ (Smart Benefit Estimation Engine)**:
   - ประเมินสิทธิแบบโต้ตอบ 5 ขั้นตอน (อายุ, รายได้, สวัสดิการแห่งรัฐ, ความพิการ, ที่อยู่อาศัย)
   - คำนวณเบี้ยยังชีพขั้นบันได (60-69 ปี: 600 บ., 70-79 ปี: 700 บ., 80-89 ปี: 800 บ., 90+ ปี: 1,000 บ.)
   - คำนวณเบี้ยคนพิการ 800 - 1,000 บาท/เดือน
   - คำนวณสิทธิสวัสดิการแห่งรัฐ 400 - 1,415 บาท/เดือน
   - คำนวณเงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบากฉุกเฉิน (สูงสุด 3,000 บ./ครั้ง)
   - คำนวณเงินช่วยเหลือปรับปรุงสภาพแวดล้อมบ้านผู้สูงอายุ (22,500 - 40,000 บ./หลัง)
   - คำนวณดัชนีคะแนนความเปราะบาง (Vulnerability Index: 0 - 100)
   - ปุ่ม **"ยื่นคำขอรับสิทธิออนไลน์ทันที"** เชื่อมโยงเข้าสู่ท่อการพิจารณาของเจ้าหน้าที่

2. **แดชบอร์ดสถิติและภาพรวมผู้บริหาร (Executive Analytics Dashboard)**:
   - การ์ดสรุปตัวชี้วัด KPI (งบประมาณการรวม, ผู้รับสิทธิสะสม, คำขอรอพิจารณา, Approval Rate)
   - กราฟแนวโน้มงบประมาณการเปรียบเทียบยอดเบิกจ่ายจริงรายเดือน (Recharts Area Chart)
   - แผนภูมิกระจายตัวตามช่วงอายุขั้นบันได และสัดส่วนหมวดหมู่โครงการ (Recharts Bar & Pie Chart)
   - ท่อกระบวนการพิจารณาคำขอแบบเรียลไทม์ (Claims Processing Pipeline)
   - ตารางอันดับจังหวัดที่มีการจัดสรรงบประมาณสูงสุด (Regional Demographics)

3. **ทำเนียบโครงการสวัสดิการ (Benefit Programs Directory)**:
   - แสดงข้อมูลโครงการอย่างเป็นทางการ 7 โครงการ พร้อมแถบวัดการใช้จ่ายงบประมาณ (Budget Utilization)
   - Modal แสดงข้อกฎหมาย ระเบียบกระทรวงมหาดไทย/พม. และเกณฑ์คุณสมบัติ

4. **ระบบบริหารจัดการคำขอและการอนุมัติ (Claims & Approvals Workflow)**:
   - รายการคำขอพร้อมระบบกรองสถานะ (`SUBMITTED`, `UNDER_REVIEW`, `DOCUMENT_VERIFIED`, `APPROVED`, `REJECTED`, `DISBURSED`)
   - หน้าต่างพิจารณาสิทธิสำหรับเจ้าหน้าที่ (อนุมัติ, กำหนดวงเงิน, ปฏิเสธพร้อมเหตุผล, ขอเอกสารเพิ่ม)

5. **ระบบทะเบียนประวัติผู้สูงอายุ (Beneficiary Registry)**:
   - ค้นหาเลขบัตรประชาชน 13 หลัก ชื่อ-นามสกุล ภูมิลำเนา
   - แสดงสถานะความเปราะบาง (Low, Moderate, High, Critical) พร้อมปุ่มคลิกคำนวณสิทธิให้รายบุคคลทันที

6. **ระบบรายงานและหนังสือรับรองผลการประมาณการสิทธิ (Printable Certificate)**:
   - ส่งออกข้อมูลในรูปแบบ CSV (Excel) และ JSON
   - หน้าหนังสือรับรองผลการประมาณการสิทธิสวัสดิการผู้สูงอายุทางการ พร้อมลายน้ำ QR e-Verification และบล็อกลายเซ็นนายทะเบียน

7. **ระบบบันทึกความปลอดภัยและการตรวจสอบ (ISO / PDPA Audit Trail)**:
   - บันทึกการกระทำของผู้ใช้ (Actor, Role, Action, Resource, IP Address, Timestamp) เพื่อความโปร่งใส

---

## 👥 บัญชีผู้ใช้ตัวอย่างสำหรับทดสอบ (Demo Accounts)

ระบบมาพร้อมกับ 4 บทบาทและปุ่ม **Quick Role Switcher** ในหน้า Login และเมนูผู้ใช้มุมขวาบน:

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง (Permissions) |
| :--- | :--- | :--- | :--- |
| 👨‍💼 **Admin (ผู้ดูแลระบบ)** | `admin@dop.go.th` | `admin1234` | สิทธิ์สูงสุด ทุกโมดูล ตั้งค่าระบบ และรีเซ็ตฐานข้อมูล |
| 👩‍💼 **Officer (เจ้าหน้าที่)** | `officer@dop.go.th` | `officer1234` | ตรวจสอบคำขอ พิจารณาเอกสาร และอนุมัติสิทธิ |
| 🕵️ **Auditor (ผู้ตรวจสอบ)** | `auditor@dop.go.th` | `auditor1234` | ดูรายงานเชิงลึก สถิติ และประวัติการทำงาน (Audit Trail) |
| 👴 **Citizen (ประชาชน)** | `citizen@dop.go.th` | `citizen1234` | คำนวณประมาณการสิทธิและยื่นคำขอรับสวัสดิการ |

---

## 🚀 การติดตั้งและรันระบบ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. สร้าง Prisma Client & กำหนดค่า Environment
```bash
cp .env.example .env
npx prisma generate
```

### 3. รันในโหมด Development
```bash
npm run dev
```
เปิดเบราว์เซอร์ที่: **http://localhost:3000**

---

## 🐳 การใช้งานผ่าน Docker & Docker Compose

ระบบมีคอนฟิก `Dockerfile` แบบ Multi-Stage Production Build และ `docker-compose.yml` ที่เชื่อมต่อกับ MySQL 8.0:

```bash
# สตาร์ท MySQL และ Next.js App พร้อมกัน
docker-compose up -d --build

# ดูสถานะและ Log
docker-compose logs -f
```

---

## 🧪 การตรวจสอบคุณภาพโค้ด (Quality Assurance)

```bash
# ตรวจสอบ TypeScript Types (Strict Mode)
npm run type-check

# Build Production Bundle
npm run build
```

---

## 📄 ใบอนุญาต (License)
ลิขสิทธิ์ © 2569 กรมกิจการผู้สูงอายุ (Department of Older Persons - DOP). พัฒนาเพื่อประโยชน์สาธารณะของประชาชนไทย