import { PrismaClient, Role, BenefitCategory, PaymentFrequency, VulnerabilityLevel, ApplicationStatus, ApprovalDecision } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed for sittidop-benefit-system...");

  // 1. Clean existing records
  await prisma.approvalRecord.deleteMany();
  await prisma.application.deleteMany();
  await prisma.benefitEstimate.deleteMany();
  await prisma.benefitRule.deleteMany();
  await prisma.benefitProgram.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.citizen.deleteMany();

  // 2. Create Users
  const hashedAdmin = await bcrypt.hash("admin1234", 10);
  const hashedOfficer = await bcrypt.hash("officer1234", 10);
  const hashedAuditor = await bcrypt.hash("auditor1234", 10);
  const hashedCitizen = await bcrypt.hash("citizen1234", 10);

  const admin = await prisma.user.create({
    data: {
      name: "ดร.วิชัย ศรีสุขสง่า",
      email: "admin@dop.go.th",
      passwordHash: hashedAdmin,
      role: Role.ADMIN,
      department: "กองส่งเสริมสวัสดิการและคุ้มครองสิทธิผู้สูงอายุ (DOP)",
      phone: "02-642-4336",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const officer = await prisma.user.create({
    data: {
      name: "น.ส.กนกพร พัฒนไพบูลย์",
      email: "officer@dop.go.th",
      passwordHash: hashedOfficer,
      role: Role.OFFICER,
      department: "กลุ่มงานพิจารณาและอนุมัติสิทธิสวัสดิการ (Claims Unit)",
      phone: "02-642-4337",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const auditor = await prisma.user.create({
    data: {
      name: "นายภานุวัฒน์ ตรวจการดี",
      email: "auditor@dop.go.th",
      passwordHash: hashedAuditor,
      role: Role.AUDITOR,
      department: "กลุ่มงานตรวจสอบภายในและการกำกับดูแลภาครัฐ (Audit & Compliance)",
      phone: "02-642-4338",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const citizenUser = await prisma.user.create({
    data: {
      name: "นายสมศักดิ์ มั่นคง",
      email: "citizen@dop.go.th",
      passwordHash: hashedCitizen,
      role: Role.CITIZEN,
      department: "ประชาชนผู้รับสิทธิสวัสดิการ",
      phone: "081-456-7890",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Citizens
  const c1 = await prisma.citizen.create({
    data: {
      nationalId: "1100400289112",
      title: "นาย",
      firstName: "สมศักดิ์",
      lastName: "มั่นคง",
      dateOfBirth: new Date("1954-04-12"),
      gender: "MALE",
      phone: "081-456-7890",
      email: "somsak.m@gmail.com",
      address: "124/5 หมู่ 3 ซอยสุขเกษม ถนนประชาชื่น",
      subdistrict: "วงศ์สว่าง",
      district: "บางซื่อ",
      province: "กรุงเทพมหานคร",
      postalCode: "10800",
      monthlyIncome: 2500,
      hasStateWelfareCard: true,
      isDisabilityRegistered: false,
      vulnerabilityScore: 55,
      vulnerabilityLevel: VulnerabilityLevel.HIGH,
      livingCondition: "ALONE",
    },
  });

  const c2 = await prisma.citizen.create({
    data: {
      nationalId: "3500100456123",
      title: "นาง",
      firstName: "สมใจ",
      lastName: "เจริญสุข",
      dateOfBirth: new Date("1942-08-25"),
      gender: "FEMALE",
      phone: "089-123-4567",
      address: "88/1 หมู่ 5 ตำบลสุเทพ",
      subdistrict: "สุเทพ",
      district: "เมืองเชียงใหม่",
      province: "เชียงใหม่",
      postalCode: "50200",
      monthlyIncome: 0,
      hasStateWelfareCard: true,
      isDisabilityRegistered: true,
      disabilityType: "ทางการเคลื่อนไหว (ข้อเข่าเสื่อมรุนแรง)",
      vulnerabilityScore: 85,
      vulnerabilityLevel: VulnerabilityLevel.CRITICAL,
      livingCondition: "BEDRIDDEN",
    },
  });

  const c3 = await prisma.citizen.create({
    data: {
      nationalId: "3400200112345",
      title: "นาย",
      firstName: "บุญมี",
      lastName: "มีลาภ",
      dateOfBirth: new Date("1961-11-03"),
      gender: "MALE",
      phone: "086-778-9901",
      address: "45 หมู่ 2 บ้านหนองหญ้าปล้อง",
      subdistrict: "ในเมือง",
      district: "เมืองขอนแก่น",
      province: "ขอนแก่น",
      postalCode: "40000",
      monthlyIncome: 4500,
      hasStateWelfareCard: true,
      isDisabilityRegistered: false,
      vulnerabilityScore: 35,
      vulnerabilityLevel: VulnerabilityLevel.MODERATE,
      livingCondition: "FAMILY",
    },
  });

  // Link citizenUser with c1
  await prisma.user.update({
    where: { id: citizenUser.id },
    data: { citizenId: c1.id },
  });

  // 4. Create Benefit Programs
  const p1 = await prisma.benefitProgram.create({
    data: {
      code: "DOP-ELD-001",
      name: "Elderly Living Allowance",
      thaiName: "เบี้ยยังชีพผู้สูงอายุ (แบบขั้นบันได)",
      description: "เงินช่วยเหลือรายเดือนสำหรับผู้สูงอายุสัญชาติไทยที่มีอายุ 60 ปีขึ้นไป เพื่อการยังชีพตามเกณฑ์ขั้นบันได",
      category: BenefitCategory.LIVING_ALLOWANCE,
      targetGroup: "ผู้สูงอายุสัญชาติไทย อายุ 60 ปีขึ้นไป",
      budgetTotal: 88500000000,
      budgetDisbursed: 64200000000,
      maxAmount: 1000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      legalBasis: "พ.ร.บ. ผู้สูงอายุ พ.ศ. 2546 และระเบียบกระทรวงมหาดไทย พ.ศ. 2566",
    },
  });

  const p2 = await prisma.benefitProgram.create({
    data: {
      code: "DOP-DIS-002",
      name: "Disability Benefit for Elderly",
      thaiName: "เบี้ยความพิการสำหรับผู้สูงอายุ",
      description: "เงินสวัสดิการรายเดือนสำหรับคนพิการที่มีบัตรประจำตัวคนพิการถูกต้องตามกฎหมาย และเงินเพิ่มพิเศษกรณีมีบัตรสวัสดิการแห่งรัฐ",
      category: BenefitCategory.DISABILITY_BENEFIT,
      targetGroup: "คนพิการที่มีสมุด/บัตรประจำตัวคนพิการ อายุ 18 ปีขึ้นไป",
      budgetTotal: 24000000000,
      budgetDisbursed: 18500000000,
      maxAmount: 1000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      legalBasis: "พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550",
    },
  });

  const p3 = await prisma.benefitProgram.create({
    data: {
      code: "DOP-HSG-005",
      name: "Home Modification Grant",
      thaiName: "เงินช่วยเหลือปรับปรุงสภาพแวดล้อมที่อยู่อาศัยผู้สูงอายุ",
      description: "เงินสนับสนุนปรับปรุงห้องน้ำ ทางลาด ประตู หลังคา และโครงสร้างบ้านให้ปลอดภัยและเอื้อต่อสุขอนามัยของผู้สูงอายุ",
      category: BenefitCategory.HOUSING_RENOVATION,
      targetGroup: "ผู้สูงอายุที่มีบ้านพักอาศัยชำรุดทรุดโทรม ไม่ปลอดภัย และมีฐานะยากจน",
      budgetTotal: 3200000000,
      budgetDisbursed: 2100000000,
      maxAmount: 40000,
      paymentFrequency: PaymentFrequency.ONE_TIME,
      legalBasis: "ระเบียบกรมกิจการผู้สูงอายุว่าด้วยการปรับปรุงสภาพแวดล้อมที่อยู่อาศัย",
    },
  });

  // 5. Create Applications
  await prisma.application.create({
    data: {
      applicationNumber: "APP-2569-0001",
      citizenId: c2.id,
      programId: p3.id,
      requestedAmount: 40000,
      approvedAmount: 40000,
      status: ApplicationStatus.APPROVED,
      submissionDate: new Date("2026-08-05T09:30:00Z"),
      decisionDate: new Date("2026-08-10T14:15:00Z"),
      disbursementDate: new Date("2026-08-18T10:00:00Z"),
      officerNotes: "ผ่านการตรวจสอบข้อเท็จจริงในพื้นที่โดย อพม. แล้ว สภาพบ้านทรุดโทรมและผู้สูงอายุติดเตียง จำเป็นต้องทำทางลาดและห้องน้ำคนพิการเร่งด่วน อนุมัติเต็มวงเงิน 40,000 บาท",
      applicantRemarks: "ขอความอนุเคราะห์ปรับปรุงห้องน้ำและทางลาดเพื่อความปลอดภัยในการเคลื่อนย้าย",
      assignedOfficerId: officer.id,
    },
  });

  // 6. Create Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      role: "ADMIN",
      action: "DATABASE_SEEDED",
      resource: "Database",
      detailsJson: JSON.stringify({ message: "Seed data initialized successfully" }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
