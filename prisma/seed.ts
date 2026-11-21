import {
  PrismaClient,
  Role,
  MilitaryRank,
  MilitaryBranch,
  MissionType,
  ActionType,
  IncidentType,
  LossType,
  SpecialPensionType,
  RelationshipType,
  BenefitCategory,
  PaymentFrequency,
  BenefitTrackingStatus,
  ApplicationStatus,
  VulnerabilityLevel,
  Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultDimensionOptions, defaultMilitaryRules } from "../src/infrastructure/database/repositories/PrismaMilitaryRuleRepository";
import { BenefitRuleDefinition } from "../src/core/domain/entities/BenefitRule";

const prisma = new PrismaClient();

function toPrismaRuleData(rule: BenefitRuleDefinition) {
  const conditions = rule.conditions || {};
  return {
    ruleCode: rule.ruleCode,
    ruleName: rule.ruleName,
    category: rule.category,
    categoryName: rule.categoryName || rule.category || "",
    categoryThaiName: rule.categoryThaiName || "",
    description: rule.description || "",
    legalBasis: rule.legalBasis || "",
    paymentType: rule.paymentType || "ONE_TIME_LUMP_SUM",
    benefitScope: rule.benefitScope || null,
    causeType: rule.causeType || null,
    formulaType: rule.formulaType || "EXPRESSION",
    formulaExpression: rule.formulaExpression || "",
    multiplierFactor: rule.multiplierFactor ?? 1,
    baseAmount: rule.baseAmount ?? 0,
    minAmount: rule.minAmount ?? null,
    maxAmount: rule.maxAmount ?? null,
    allowedMissions: conditions.allowedMissions || [],
    allowedPersonnelCategories: conditions.allowedPersonnelCategories || [],
    allowedLossTypes: conditions.allowedLossTypes || [],
    allowedRanks: conditions.allowedRanks || [],
    minServiceYears: conditions.minServiceYears ?? null,
    requiresSpouse: conditions.requiresSpouse ?? null,
    requiresChildren: conditions.requiresChildren ?? null,
    insuranceMatrix: rule.insuranceMatrix && rule.insuranceMatrix.length > 0 ? (rule.insuranceMatrix as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    formulaTiers: rule.formulaTiers && rule.formulaTiers.length > 0 ? (rule.formulaTiers as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    priorityOrder: rule.priorityOrder ?? 10,
    isActive: rule.isActive ?? true,
    createdAt: rule.createdAt || new Date(),
    updatedAt: rule.updatedAt || new Date(),
  };
}

async function main() {
  console.log("🎖️ Starting WeR-RTA PostgreSQL Database Seed (Royal Thai Army)...");

  // 1. Clean existing records in correct foreign-key order
  await prisma.lossIncidentCasualty.deleteMany();
  await prisma.lossIncidentReport.deleteMany();
  await prisma.benefitTracking.deleteMany();
  await prisma.approvalRecord.deleteMany();
  await prisma.benefitClaimApplication.deleteMany();
  await prisma.application.deleteMany();
  await prisma.benefitReport.deleteMany();
  await prisma.militaryBenefitEstimate.deleteMany();
  await prisma.benefitEstimate.deleteMany();
  await prisma.heir.deleteMany();
  await prisma.child.deleteMany();
  await prisma.spouse.deleteMany();
  await prisma.user.deleteMany();
  await prisma.militaryPersonnel.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.benefitRule.deleteMany();
  await prisma.benefitDimensionOption.deleteMany();
  await prisma.benefitProgram.deleteMany();
  await prisma.auditLog.deleteMany();

  // 2. Create Users for WeR-RTA
  const defaultPassword = await bcrypt.hash("rta12345", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "พ.อ. ธนกร มนตรีภักดี",
      email: "admin@wer-rta.mi.th",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      rank: MilitaryRank.COLONEL,
      department: "กรมกำลังพลทหารบก (กพ.ทบ.)",
      unit: "สำนักงานผู้อำนวยการ กพ.ทบ.",
      phone: "02-297-7111",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const casualtyOfficer = await prisma.user.create({
    data: {
      name: "พ.ท. กฤษณะ ยอดสิงห์",
      email: "officer@wer-rta.mi.th",
      passwordHash: defaultPassword,
      role: Role.OFFICER,
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      rank: MilitaryRank.LIEUTENANT_COLONEL,
      department: "ศูนย์ปฏิบัติการกองทัพบก (ศปก.ทบ.)",
      unit: "ส่วนปฏิบัติการ ศปก.ทบ.",
      phone: "02-297-7222",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const benefitReviewer = await prisma.user.create({
    data: {
      name: "ร.อ.หญิง ปิยะดา วงศ์สุวรรณ",
      email: "claims@wer-rta.mi.th",
      passwordHash: defaultPassword,
      role: Role.BENEFIT_REVIEWER,
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      rank: MilitaryRank.CAPTAIN,
      department: "กองการสงเคราะห์ กรมกำลังพลทหารบก",
      unit: "แผนกเงินสงเคราะห์และสิทธิกำลังพล กพ.ทบ.",
      phone: "02-297-7333",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const auditorUser = await prisma.user.create({
    data: {
      name: "พ.อ. สุรศักดิ์ สุขประเสริฐ",
      email: "auditor@wer-rta.mi.th",
      passwordHash: defaultPassword,
      role: Role.AUDITOR,
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      rank: MilitaryRank.COLONEL,
      department: "สำนักงานตรวจเงินทหารบก (สตง.ทบ.)",
      unit: "กองตรวจสอบสวัสดิการและสิทธิกำลังพล",
      phone: "02-297-7444",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Users created: Admin, Casualty Officer (ศปก.ทบ.), Benefit Reviewer (กพ.ทบ.), Auditor (สตง.ทบ.)");

  // 3. Create Citizens (Corresponding to military personnel & spouses/children for tracking & national ID validation)
  const c1 = await prisma.citizen.create({
    data: {
      nationalId: "3100600492811",
      title: "พ.ท.",
      firstName: "วีรชาติ",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("1984-08-15"),
      gender: "MALE",
      phone: "081-456-7890",
      email: "veerachat.p@rta.mi.th",
      address: "124/5 ค่ายสุรสีห์ กองพลทหารราบที่ 9 ต.ลาดหญ้า",
      subdistrict: "ลาดหญ้า",
      district: "เมืองกาญจนบุรี",
      province: "กาญจนบุรี",
      postalCode: "71190",
      monthlyIncome: 43500,
      vulnerabilityLevel: VulnerabilityLevel.CRITICAL,
    },
  });

  const c1Spouse = await prisma.citizen.create({
    data: {
      nationalId: "1100400289112",
      title: "นาง",
      firstName: "พิมพา",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("1986-11-20"),
      gender: "FEMALE",
      phone: "089-765-4321",
      email: "pimpa.p@gmail.com",
      address: "124/5 ค่ายสุรสีห์ ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
      subdistrict: "ลาดหญ้า",
      district: "เมืองกาญจนบุรี",
      province: "กาญจนบุรี",
      postalCode: "71190",
      monthlyIncome: 18000,
      vulnerabilityLevel: VulnerabilityLevel.HIGH,
    },
  });

  const c2 = await prisma.citizen.create({
    data: {
      nationalId: "1100500392812",
      title: "ร.อ.",
      firstName: "ภาคิน",
      lastName: "ดำรงไทย",
      dateOfBirth: new Date("1990-04-12"),
      gender: "MALE",
      phone: "084-332-1100",
      email: "phakin.d@rta.mi.th",
      address: "88/1 กองร้อย ร.1512 ค่ายเสนาณรงค์ ต.คอหงส์",
      subdistrict: "คอหงส์",
      district: "หาดใหญ่",
      province: "สงขลา",
      postalCode: "90110",
      monthlyIncome: 32000,
      isDisabilityRegistered: true,
      disabilityType: "พิการทางการเคลื่อนไหวจากการปฏิบัติหน้าที่ราชการสนาม",
      vulnerabilityLevel: VulnerabilityLevel.HIGH,
    },
  });

  const c3 = await prisma.citizen.create({
    data: {
      nationalId: "1909800213890",
      title: "ส.อ.",
      firstName: "อนุชา",
      lastName: "ชัยมงคล",
      dateOfBirth: new Date("1996-12-05"),
      gender: "MALE",
      phone: "087-991-2345",
      address: "55 หมู่ 4 ต.เขานิเวศน์",
      subdistrict: "เขานิเวศน์",
      district: "เมืองระนอง",
      province: "ระนอง",
      postalCode: "85000",
      monthlyIncome: 21500,
      vulnerabilityLevel: VulnerabilityLevel.MODERATE,
    },
  });

  const c4 = await prisma.citizen.create({
    data: {
      nationalId: "1450200384719",
      title: "พลทหาร",
      firstName: "ณัฐพล",
      lastName: "ศรีสุวรรณ",
      dateOfBirth: new Date("2003-05-20"),
      gender: "MALE",
      phone: "092-445-6789",
      address: "12 หมู่ 2 ต.หนองกี่",
      subdistrict: "หนองกี่",
      district: "หนองกี่",
      province: "บุรีรัมย์",
      postalCode: "31210",
      monthlyIncome: 12500,
      vulnerabilityLevel: VulnerabilityLevel.MODERATE,
    },
  });

  console.log("✅ Citizens created with National IDs & Birthdates");

  // 4. Create Military Benefit Programs (WeR-RTA)
  const progInsurance = await prisma.benefitProgram.create({
    data: {
      code: "MIL-RTA-001",
      name: "War Risk Life Insurance",
      thaiName: "เงินสินไหมทดแทนประกันชีวิตภัยสงคราม (KIA/ทุพพลภาพ)",
      description: "เงินสินไหมทดแทนจากกรมธรรม์ประกันชีวิตกำลังพลปฏิบัติหน้าที่ราชการสนาม กองทัพบก",
      category: BenefitCategory.MILITARY_INSURANCE,
      targetGroup: "กำลังพลที่เสียชีวิตหรือทุพพลภาพจากการปฏิบัติราชการสนาม",
      budgetTotal: 500000000,
      budgetDisbursed: 20000000,
      maxAmount: 2000000,
      paymentFrequency: PaymentFrequency.ONE_TIME,
      legalBasis: "สัญญาประกันชีวิตหมู่กำลังพลกองทัพบก และคำสั่ง ทบ. ด้านสวัสดิการกำลังพลสนาม",
      isActive: true,
    },
  });

  const progCompensation = await prisma.benefitProgram.create({
    data: {
      code: "MIL-RTA-002",
      name: "Field Service Compensation Grant",
      thaiName: "เงินชดเชยการปฏิบัติหน้าที่ราชการสนามและเงินทำขวัญ (พ.ช.ท.)",
      description: "เงินชดเชยตามระเบียบกระทรวงกลาโหมว่าด้วยเงินชดเชยผู้ประสบอันตรายจากการปฏิบัติราชการสนาม",
      category: BenefitCategory.LUMP_SUM_COMPENSATION,
      targetGroup: "กำลังพลที่สูญเสียชีวิต พิการ หรือบาดเจ็บในการปฏิบัติราชการสนาม จชต./ชายแดน",
      budgetTotal: 300000000,
      budgetDisbursed: 15000000,
      maxAmount: 1500000,
      paymentFrequency: PaymentFrequency.ONE_TIME,
      legalBasis: "ระเบียบกระทรวงกลาโหมว่าด้วยการปูนบำเหน็จพิเศษและการสงเคราะห์ผู้ประสบภัย พ.ศ. 2564",
      isActive: true,
    },
  });

  const progSpecialPension = await prisma.benefitProgram.create({
    data: {
      code: "MIL-RTA-003",
      name: "Special Monthly Pension",
      thaiName: "เงินบำนาญพิเศษรายเดือนกำลังพลและเงินเลี้ยงชีพ",
      description: "เงินบำนาญพิเศษรายเดือนสำหรับทายาทกำลังพลที่เสียชีวิต หรือกำลังพลที่พิการทุพพลภาพ",
      category: BenefitCategory.SPECIAL_PENSION,
      targetGroup: "ทายาทกำลังพลเสียชีวิต หรือกำลังพลพิการทุพพลภาพ",
      budgetTotal: 250000000,
      budgetDisbursed: 12000000,
      maxAmount: 45000,
      paymentFrequency: PaymentFrequency.MONTHLY,
      legalBasis: "พ.ร.บ. กองทุนบำเหน็จบำนาญข้าราชการ และ พ.ร.บ. บำเหน็จบำนาญข้าราชการทหาร",
      isActive: true,
    },
  });

  const progFuneralAid = await prisma.benefitProgram.create({
    data: {
      code: "MIL-RTA-004",
      name: "Funeral and Royal Cremation Aid",
      thaiName: "เงินช่วยเหลือการจัดการศพและพระราชทานเพลิงศพ",
      description: "เงินช่วยเหลือการจัดการศพเร่งด่วนและค่าฌาปนกิจสงเคราะห์ กรมกำลังพลทหารบก",
      category: BenefitCategory.FUNERAL_AID,
      targetGroup: "ครอบครัวกำลังพลที่เสียชีวิตในการปฏิบัติราชการสนาม",
      budgetTotal: 50000000,
      budgetDisbursed: 5000000,
      maxAmount: 300000,
      paymentFrequency: PaymentFrequency.ONE_TIME,
      legalBasis: "ระเบียบกรมสวัสดิการทหารบกว่าด้วยการสงเคราะห์การศพ พ.ศ. 2562",
      isActive: true,
    },
  });

  const progScholarship = await prisma.benefitProgram.create({
    data: {
      code: "MIL-RTA-005",
      name: "Children Annual Education Scholarship",
      thaiName: "ทุนการศึกษาบุตรกำลังพล ทบ. ผู้สูญเสียประจำปี",
      description: "ทุนการศึกษาต่อเนื่องจนจบปริญญาตรีสำหรับบุตรของกำลังพลที่เสียชีวิตหรือพิการทุพพลภาพ",
      category: BenefitCategory.CHILD_EDUCATION_GRANT,
      targetGroup: "บุตรกำลังพลที่เสียชีวิตหรือพิการทุพพลภาพ",
      budgetTotal: 80000000,
      budgetDisbursed: 4000000,
      maxAmount: 60000,
      paymentFrequency: PaymentFrequency.ANNUAL,
      legalBasis: "ระเบียบกองทัพบกว่าด้วยทุนการศึกษาบุตรกำลังพลผู้เสียสละ พ.ศ. 2560",
      isActive: true,
    },
  });

  console.log("✅ Benefit Programs created");

  // 5. Create Military Rules Engine Data
  await prisma.benefitDimensionOption.createMany({
    data: defaultDimensionOptions.map((opt, i) => ({
      id: opt.id,
      label: opt.label,
      type: opt.type,
      isSystem: opt.isSystem ?? false,
      sortOrder: i + 1,
    })),
  });

  for (const r of defaultMilitaryRules) {
    await prisma.benefitRule.create({ data: toPrismaRuleData(r) });
  }
  console.log("✅ Rules engine dimensions & 15 default rules seeded");

  // 6. Create Military Personnel (4 Key Records)
  // Personnel 1: พ.ท. วีรชาติ ภักดีสยาม (KIA Combat Death)
  const p1 = await prisma.militaryPersonnel.create({
    data: {
      militaryId: "MIL-49021884",
      citizenId: "3100600492811",
      rank: MilitaryRank.LIEUTENANT_COLONEL,
      rankAbbr: "พ.ท.",
      firstName: "วีรชาติ",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("1984-08-15"),
      age: 42,
      maritalStatus: "สมรส",
      religion: "พุทธ",
      educationLevel: "ปริญญาตรี (รร.จปร.)",
      phone: "081-456-7890",
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      abbreviatedPosition: "ผบ.พัน.ร.1911",
      fullPosition: "ผู้บังคับกองพันทหารราบที่ 1 กรมทหารราบที่ 19",
      normalUnit: "ร.19 พัน.1 (พล.ร.9)",
      fieldPosition: "ผบ.ฉก.นราธิวาส 30",
      fieldUnit: "ฉก.นราธิวาส (กกล.ทบ.)",
      fieldDutyOrderNo: "คำสั่ง ศปก.ทบ. ที่ 421/2568",
      fieldDutyOrderDate: new Date("2025-09-25"),
      fieldDutyOrderIssuer: "พล.อ. พนา แคล้วปลอดทุกข์ (ผบ.ทบ./ผบ.ศปก.ทบ.)",
      missionCategory: "พื้นที่ จชต. ปฏิบัติการรักษาความสงบเรียบร้อย",
      salary: 43500,
      salaryLevel: "น.3",
      salaryStep: 21.5,
      compensation: "พ.ช.ท.",
      compensationLevel: "ระดับ 1",
      compensationAmount: 5000,
      additionalPay: 2500,
      appointmentDate: new Date("2010-05-01"),
      incidentDate: new Date("2026-03-12"),
      multiplierDate: new Date("2016-10-01"),
      serviceYearsNormal: 16,
      serviceMonthsNormal: 0,
      serviceDaysNormal: 0,
      serviceYearsMultiplier: 8,
      serviceMonthsMultiplier: 0,
      serviceDaysMultiplier: 0,
      totalServiceYears: 24,
      totalServiceMonths: 0,
      totalServiceDays: 0,
      specialPensionType: SpecialPensionType.NORMAL_TIME,
      specialPensionTier: 7,
      rankAppointmentTo: "พลเอก (พล.อ.)",
      salaryLevelAdjustment: "น.3 ขั้น 27.5",
      promotedRank: MilitaryRank.GENERAL,
      promotedRankAbbr: "พล.อ.",
      promotionSteps: 7,
      promotedSalary: 68500,
      missionType: MissionType.COUNTER_INSURGENCY,
      actionType: ActionType.DIRECT_COMBAT,
      incidentType: IncidentType.COMBAT_ENGAGEMENT,
      incidentLocation: "เส้นทางสาย 4107 ต.จวบ อ.เจาะไอร้อง จ.นราธิวาส",
      lossType: LossType.KIA_COMBAT_DEATH,
      incidentDescription: "ขณะปฏิบัติภารกิจนำชุดลาดตระเวนเคลื่อนที่เร็ว ถูกผู้ก่อเหตุรุนแรงลอบจุดชนวนระเบิดแสวงเครื่อง (IED) ฝังใต้ผิวถนนและระดมยิงซ้ำ",
    },
  });

  // P1 Spouse & Children & Heirs
  await prisma.spouse.create({
    data: {
      personnelId: p1.id,
      nationalId: "1100400289112",
      title: "นาง",
      firstName: "พิมพา",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("1986-11-20"),
      age: 40,
      maritalStatus: "สมรสชอบด้วยกฎหมาย",
      isAlive: true,
      isLegallyMarried: true,
      marriageCertNumber: "45/2553 สนง.เขตบางซื่อ",
      phone: "089-765-4321",
      address: "124/5 ค่ายสุรสีห์ กองพลทหารราบที่ 9 ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      hasPensionRights: true,
      allocationPercentage: 50,
    },
  });

  await prisma.child.create({
    data: {
      personnelId: p1.id,
      nationalId: "1100400289113",
      title: "ด.ช.",
      firstName: "นราธิป",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("2015-03-10"),
      age: 11,
      isAlive: true,
      isStudying: true,
      educationLevel: "ประถมศึกษาปีที่ 5",
      scholarshipEligible: true,
      annualScholarship: 15000,
      allocationPercentage: 25,
    },
  });

  await prisma.child.create({
    data: {
      personnelId: p1.id,
      nationalId: "1100400289114",
      title: "น.ส.",
      firstName: "กานดา",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("2008-07-22"),
      age: 18,
      isAlive: true,
      isStudying: true,
      educationLevel: "มัธยมศึกษาปีที่ 6",
      scholarshipEligible: true,
      annualScholarship: 20000,
      allocationPercentage: 25,
    },
  });

  await prisma.heir.create({
    data: {
      personnelId: p1.id,
      nationalId: "1100400289112",
      title: "นาง",
      firstName: "พิมพา",
      lastName: "ภักดีสยาม",
      dateOfBirth: new Date("1986-11-20"),
      age: 40,
      relationship: RelationshipType.SPOUSE_LEGAL,
      phone: "089-765-4321",
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      allocationPercentage: 50,
      calculatedAmount: 1850000,
      isDesignatedSuccessor: true,
      documentsVerified: true,
    },
  });

  // Personnel 2: ร.อ. ภาคิน ดำรงไทย (Total Permanent Disability)
  const p2 = await prisma.militaryPersonnel.create({
    data: {
      militaryId: "MIL-54019231",
      citizenId: "1100500392812",
      rank: MilitaryRank.CAPTAIN,
      rankAbbr: "ร.อ.",
      firstName: "ภาคิน",
      lastName: "ดำรงไทย",
      dateOfBirth: new Date("1990-04-12"),
      age: 36,
      maritalStatus: "สมรส",
      phone: "084-332-1100",
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      abbreviatedPosition: "ผบ.ร้อย.ร.1512",
      fullPosition: "ผู้บังคับกองร้อยทหารราบที่ 2 กรมทหารราบที่ 15",
      normalUnit: "ร.15 พัน.1",
      fieldPosition: "ผบ.ร้อย.ฉก.ทพ.45",
      fieldUnit: "ฉก.ทพ.45 (กกล.ทบ.)",
      fieldDutyOrderNo: "คำสั่ง ศปก.ทบ. ที่ 88/2569",
      fieldDutyOrderDate: new Date("2026-01-15"),
      missionCategory: "พื้นที่ จชต. กองกำลังทหารพรานจังหวัดชายแดนใต้",
      salary: 32000,
      salaryLevel: "น.2",
      salaryStep: 17.5,
      appointmentDate: new Date("2014-06-01"),
      incidentDate: new Date("2026-03-12"),
      serviceYearsNormal: 12,
      serviceYearsMultiplier: 5,
      totalServiceYears: 17,
      specialPensionType: SpecialPensionType.NORMAL_TIME,
      specialPensionTier: 5,
      promotedRank: MilitaryRank.MAJOR,
      promotedRankAbbr: "พ.ต.",
      promotionSteps: 5,
      promotedSalary: 45000,
      missionType: MissionType.COUNTER_INSURGENCY,
      actionType: ActionType.IED_AMBUSH,
      incidentType: IncidentType.LANDMINE_OR_IED,
      incidentLocation: "อ.เจาะไอร้อง จ.นราธิวาส",
      lossType: LossType.TOTAL_PERMANENT_DISABILITY,
      incidentDescription: "ได้รับบาดเจ็บทุพพลภาพสูญเสียขาทั้งสองข้างจากแรงระเบิดแสวงเครื่องขณะควบคุมการปฏิบัติการในพื้นที่เสี่ยงภัย",
    },
  });

  // Personnel 3: ส.อ. อนุชา ชัยมงคล (Severe Injury WIA)
  const p3 = await prisma.militaryPersonnel.create({
    data: {
      militaryId: "MIL-60038172",
      citizenId: "1909800213890",
      rank: MilitaryRank.SERGEANT,
      rankAbbr: "ส.อ.",
      firstName: "อนุชา",
      lastName: "ชัยมงคล",
      dateOfBirth: new Date("1996-12-05"),
      age: 30,
      maritalStatus: "โสด",
      phone: "087-991-2345",
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      abbreviatedPosition: "พลขับสายตรวจ ฉก.ร.25",
      normalUnit: "ร.25 พัน.2",
      fieldPosition: "พลขับสายตรวจ กกล.เทพสตรี",
      fieldUnit: "กกล.เทพสตรี ชายแดนไทย-เมียนมา",
      fieldDutyOrderNo: "คำสั่ง ศปก.ทบ. ที่ 105/2569",
      fieldDutyOrderDate: new Date("2026-02-01"),
      missionCategory: "กองกำลังป้องกันชายแดน กกล.เทพสตรี",
      salary: 21500,
      salaryLevel: "ป.2",
      salaryStep: 14.0,
      appointmentDate: new Date("2018-05-01"),
      incidentDate: new Date("2026-03-12"),
      serviceYearsNormal: 8,
      serviceYearsMultiplier: 3,
      totalServiceYears: 11,
      promotionSteps: 3,
      promotedRank: MilitaryRank.MASTER_SERGEANT_3RD,
      promotedRankAbbr: "จ.ส.ต.",
      promotedSalary: 27500,
      missionType: MissionType.BORDER_DEFENSE,
      actionType: ActionType.PATROL_OPERATION,
      incidentType: IncidentType.GUNSHOT_WOUND,
      incidentLocation: "เส้นทางสาย 4107 ต.จวบ อ.เจาะไอร้อง จ.นราธิวาส",
      lossType: LossType.SEVERE_WOUND_WIA,
      incidentDescription: "ได้รับบาดเจ็บสาหัสถูกสะเก็ดระเบิดเข้าที่บริเวณช่องท้องและท่อนแขนขวา นำส่งรักษา รพ.นราธิวาสราชนครินทร์",
    },
  });

  // Personnel 4: พลทหาร ณัฐพล ศรีสุวรรณ (Moderate Injury)
  const p4 = await prisma.militaryPersonnel.create({
    data: {
      militaryId: "MIL-66029104",
      citizenId: "1450200384719",
      rank: MilitaryRank.PRIVATE,
      rankAbbr: "พลฯ",
      firstName: "ณัฐพล",
      lastName: "ศรีสุวรรณ",
      dateOfBirth: new Date("2003-05-20"),
      age: 23,
      maritalStatus: "โสด",
      phone: "092-445-6789",
      militaryBranch: MilitaryBranch.ROYAL_THAI_ARMY,
      abbreviatedPosition: "พลปืนเล็ก ฉก.ทพ.47",
      normalUnit: "มทบ.26 (ผลัด 1/66)",
      fieldPosition: "พลปืนเล็ก ฉก.ทพ.47",
      fieldUnit: "ฉก.ทพ.47 กกล.ทบ.",
      fieldDutyOrderNo: "คำสั่ง ศปก.ทบ. ที่ 210/2569",
      fieldDutyOrderDate: new Date("2026-01-20"),
      missionCategory: "พื้นที่ จชต. อ.ยะหา จ.ยะลา",
      salary: 12500,
      salaryLevel: "พลอาสาสมัคร",
      salaryStep: 1.0,
      appointmentDate: new Date("2023-05-01"),
      incidentDate: new Date("2026-03-12"),
      serviceYearsNormal: 2.5,
      totalServiceYears: 2.5,
      promotedRank: MilitaryRank.LANCE_CORPORAL,
      promotedRankAbbr: "ส.ต.",
      promotionSteps: 1,
      promotedSalary: 15500,
      missionType: MissionType.COUNTER_INSURGENCY,
      actionType: ActionType.IED_AMBUSH,
      incidentType: IncidentType.FIRE_OR_EXPLOSION,
      incidentLocation: "เส้นทางสาย 4107 ต.จวบ อ.เจาะไอร้อง จ.นราธิวาส",
      lossType: LossType.MODERATE_INJURY,
      incidentDescription: "ได้รับบาดเจ็บปานกลาง แน่นหน้าอก หูอื้อ และมีบาดแผลฉีกขาดจากเศษกระจกและสะเก็ดหิน",
    },
  });

  console.log("✅ 4 Military Personnel records created with field orders & family");

  // 7. Create Incident Report (กพ.4 & กพ.3) with multiple casualties
  const lossReport1 = await prisma.lossIncidentReport.create({
    data: {
      reportType: "KP4",
      personnelId: p1.id,
      militaryId: p1.militaryId,
      rankAbbr: p1.rankAbbr,
      fullName: `${p1.firstName} ${p1.lastName}`,
      incidentDate: new Date("2026-03-12"),
      incidentTime: "08:45",
      mgrsCoordinate: "47N RG 84521 12345",
      latitude: 6.2415,
      longitude: 101.8124,
      village: "3",
      houseNo: "-",
      road: "ทล.4107",
      subdistrict: "จวบ",
      district: "เจาะไอร้อง",
      province: "นราธิวาส",
      eventSummary: "ขบวนยานยนต์ลาดตระเวน ฉก.นราธิวาส 30 จำนวน 3 คัน ขณะปฏิบัติภารกิจรักษาความปลอดภัยเส้นทาง ถูกกลุ่มผู้ก่อเหตุรุนแรงลอบจุดชนวนระเบิดแสวงเครื่อง (IED) น้ำหนักประมาณ 25 กก. ฝังใต้ผิวถนน จากนั้นระดมยิงด้วยอาวุธสงคราม ฝ่ายเราทำการยิงตอบโต้และขอกำลังทางอากาศสนับสนุน",
      behaviorSummary: "กำลังพลทุกนายทำการยิงต่อสู้อย่างกล้าหาญ ป้องกันไม่ให้ฝ่ายตรงข้ามเข้าประชิดยานพาหนะและควบคุมพื้นที่ได้ในเวลาต่อมา",
      engagementBehavior: "ปะทะและยิงต่อสู้",
      enemyAction: "ENEMY",
      createdByUserId: casualtyOfficer.id,
      createdByUserName: casualtyOfficer.name,
      dispatchMetaJson: JSON.stringify({
        urgency: "ด่วนที่สุด",
        classification: "ลับมาก",
        fromUnit: "ผบ.ฉก.นราธิวาส",
        toUnit: "ผบ.ศปก.ทบ.",
        infoUnits: "ศปก.ทภ.4, กกล.ทบ., กพ.ทบ.",
        referenceNumber: "กห 0482.2/ 142",
        missionForce: "ชุด ลว.ยานยนต์ 14 นาย",
        writerName: "พ.ท. กฤษณะ ยอดสิงห์",
      }),
      casualties: {
        create: [
          {
            personnelId: p1.id,
            militaryId: p1.militaryId,
            citizenId: p1.citizenId,
            rankAbbr: p1.rankAbbr,
            fullName: `${p1.firstName} ${p1.lastName}`,
            unit: p1.normalUnit,
            normalPosition: p1.abbreviatedPosition,
            normalUnit: p1.normalUnit,
            fieldPosition: p1.fieldPosition,
            fieldUnit: p1.fieldUnit,
            bloodGroup: "O",
            salaryLevel: p1.salaryLevel,
            salaryAmount: p1.salary,
            lossType: "DECEASED",
            lossSeverity: "เสียชีวิตทันทีในที่เกิดเหตุ",
            injuryDetails: "ได้รับบาดเจ็บรุนแรงจากแรงอัดระเบิดและสะเก็ดระเบิดเข้าบริเวณศีรษะและลำตัว",
            hospital: "รพ.เจาะไอร้อง / ส่งต่อ รพ.สงขลานครินทร์",
            dutyStatus: "เสียชีวิตขณะปฏิบัติหน้าที่รบ",
          },
          {
            personnelId: p3.id,
            militaryId: p3.militaryId,
            citizenId: p3.citizenId,
            rankAbbr: p3.rankAbbr,
            fullName: `${p3.firstName} ${p3.lastName}`,
            unit: p3.normalUnit,
            normalPosition: p3.abbreviatedPosition,
            normalUnit: p3.normalUnit,
            fieldPosition: p3.fieldPosition,
            fieldUnit: p3.fieldUnit,
            bloodGroup: "B",
            salaryLevel: p3.salaryLevel,
            salaryAmount: p3.salary,
            lossType: "INJURED",
            lossSeverity: "บาดเจ็บสาหัส (WIA)",
            injuryDetails: "ถูกสะเก็ดระเบิดบริเวณช่องท้องและท่อนแขนขวา เสียเลือดมาก",
            hospital: "รพ.นราธิวาสราชนครินทร์ (ห้อง ICU)",
            dutyStatus: "ส่งรักษาตัวใน รพ.",
          },
          {
            personnelId: p4.id,
            militaryId: p4.militaryId,
            citizenId: p4.citizenId,
            rankAbbr: p4.rankAbbr,
            fullName: `${p4.firstName} ${p4.lastName}`,
            unit: p4.normalUnit,
            normalPosition: p4.abbreviatedPosition,
            normalUnit: p4.normalUnit,
            fieldPosition: p4.fieldPosition,
            fieldUnit: p4.fieldUnit,
            bloodGroup: "A",
            salaryLevel: p4.salaryLevel,
            salaryAmount: p4.salary,
            lossType: "INJURED",
            lossSeverity: "บาดเจ็บปานกลาง",
            injuryDetails: "มีอาการแน่นหน้าอก หูอื้อ และบาดแผลฉีกขาดจากเศษกระจก",
            hospital: "รพ.เจาะไอร้อง",
            dutyStatus: "ส่งรักษาตัวใน รพ.",
          },
        ],
      },
    },
  });

  console.log(`✅ Loss Incident Report กพ.4 created with ${lossReport1.id} (3 casualties connected)`);

  // 8. Create Benefit Tracking Records (Linked directly to MilitaryPersonnel, Citizen, and Program)
  // Tracking for P1 (พ.ท. วีรชาติ ภักดีสยาม / ทายาท นางพิมพา)
  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00101",
      personnelId: p1.id,
      citizenId: c1.id,
      programId: progInsurance.id,
      benefitName: "เงินสินไหมทดแทนประกันชีวิตภัยสงคราม (พ.ท. วีรชาติ ภักดีสยาม)",
      benefitCategory: BenefitCategory.MILITARY_INSURANCE,
      requestedAmount: 2000000,
      approvedAmount: 2000000,
      disbursedAmount: 2000000,
      status: BenefitTrackingStatus.RECEIVED,
      submissionDate: new Date("2026-03-14"),
      approvalDate: new Date("2026-03-18"),
      disbursementDate: new Date("2026-03-22"),
      receivedDate: new Date("2026-03-23"),
      paymentMethod: "โอนผ่านระบบอิเล็กทรอนิกส์เข้าบัญชีเงินฝากทายาท",
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      recipientName: "นางพิมพา ภักดีสยาม (ภริยา/ทายาทผู้มีสิทธิ)",
      paymentReference: "KTB-CORP-20260322-88741",
      notes: "การจ่ายเงินสินไหมทดแทนประกันชีวิตภัยสงครามกองทัพบก ปิดจบขั้นตอนสมบูรณ์",
      officerNotes: "ตรวจสอบคำสั่งปฏิบัติหน้าที่สนาม กพ.4 และหนังสือรับรองทายาทถูกต้องครบถ้วน",
      createdByUserId: benefitReviewer.id,
    },
  });

  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00102",
      personnelId: p1.id,
      citizenId: c1.id,
      programId: progCompensation.id,
      benefitName: "เงินชดเชยการปฏิบัติหน้าที่ราชการสนามและเงินทำขวัญ (พ.ช.ท.)",
      benefitCategory: BenefitCategory.LUMP_SUM_COMPENSATION,
      requestedAmount: 1500000,
      approvedAmount: 1500000,
      disbursedAmount: 1500000,
      status: BenefitTrackingStatus.DISBURSED,
      submissionDate: new Date("2026-03-15"),
      approvalDate: new Date("2026-03-20"),
      disbursementDate: new Date("2026-03-25"),
      paymentMethod: "โอนเงินผ่านระบบ KTB Corporate Online กรมการเงินทหารบก",
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      recipientName: "นางพิมพา ภักดีสยาม (ภริยา)",
      paymentReference: "FIN-RTA-2569-03-4912",
      notes: "อนุมัติจ่ายเต็มอัตราเงินชดเชยราชการสนาม พ.ช.ท. ระดับ 1 ทวีคูณ",
      createdByUserId: benefitReviewer.id,
    },
  });

  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00103",
      personnelId: p1.id,
      citizenId: c1.id,
      programId: progSpecialPension.id,
      benefitName: "เงินบำนาญพิเศษรายเดือนกำลังพล (7 ชั้นยศ พลเอก)",
      benefitCategory: BenefitCategory.SPECIAL_PENSION,
      requestedAmount: 47950,
      approvedAmount: 47950,
      status: BenefitTrackingStatus.APPROVED,
      submissionDate: new Date("2026-03-16"),
      approvalDate: new Date("2026-03-22"),
      paymentMethod: "โอนรายเดือนเข้าบัญชีเงินฝากผ่านกรมบัญชีกลาง",
      bankName: "ธนาคารทหารไทยธนชาต (ttb)",
      bankAccountNumber: "099-2-45812-4",
      recipientName: "นางพิมพา ภักดีสยาม และบุตร",
      notes: "คณะกรรมการพิจารณาสิทธิกำลังพล กพ.ทบ. มีมติอนุมัติบำนาญพิเศษอัตรายศ พล.อ. รอการเชื่อมรอบเบิกจ่ายกรมบัญชีกลาง",
      createdByUserId: benefitReviewer.id,
    },
  });

  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00104",
      personnelId: p1.id,
      citizenId: c1.id,
      programId: progScholarship.id,
      benefitName: "ทุนการศึกษาบุตรกำลังพล ทบ. (ด.ช.นราธิป และ น.ส.กานดา)",
      benefitCategory: BenefitCategory.CHILD_EDUCATION_GRANT,
      requestedAmount: 35000,
      status: BenefitTrackingStatus.UNDER_REVIEW,
      submissionDate: new Date("2026-03-18"),
      paymentMethod: "โอนเงินตรงเข้าบัญชีเพื่อการศึกษา",
      recipientName: "นางพิมพา ภักดีสยาม (ผู้ปกครอง)",
      notes: "อยู่ระหว่างรวบรวมใบรับรองการศึกษาจากสถานศึกษา เพื่อเสนอขออนุมัติทุนประจำปี 2569",
      createdByUserId: benefitReviewer.id,
    },
  });

  // Tracking for P2 (ร.อ. ภาคิน ดำรงไทย / พิการทุพพลภาพ)
  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00201",
      personnelId: p2.id,
      citizenId: c2.id,
      programId: progInsurance.id,
      benefitName: "เงินสินไหมทดแทนประกันภัยสงคราม (ทุพพลภาพถาวร)",
      benefitCategory: BenefitCategory.MILITARY_INSURANCE,
      requestedAmount: 1500000,
      approvedAmount: 1500000,
      status: BenefitTrackingStatus.APPROVED,
      submissionDate: new Date("2026-03-15"),
      approvalDate: new Date("2026-03-24"),
      paymentMethod: "โอนเข้าบัญชีเงินฝากกำลังพล",
      bankName: "ธนาคารกรุงไทย (KTB)",
      bankAccountNumber: "901-0-12847-1",
      recipientName: "ร.อ. ภาคิน ดำรงไทย",
      notes: "ผลการตรวจรับรองความพิการจากคณะกรรมการแพทย์ รพ.พระมงกุฎเกล้า ได้รับอนุมัติเต็มวงเงิน",
      createdByUserId: benefitReviewer.id,
    },
  });

  // Tracking for P3 (ส.อ. อนุชา ชัยมงคล / บาดเจ็บสาหัส)
  await prisma.benefitTracking.create({
    data: {
      trackingNumber: "TRK-2569-00301",
      personnelId: p3.id,
      citizenId: c3.id,
      programId: progCompensation.id,
      benefitName: "เงินทำขวัญและเงินชดเชยการบาดเจ็บสาหัสในการรบ (WIA)",
      benefitCategory: BenefitCategory.LUMP_SUM_COMPENSATION,
      requestedAmount: 250000,
      status: BenefitTrackingStatus.PROPOSED,
      submissionDate: new Date("2026-03-15"),
      paymentMethod: "โอนเข้าบัญชีเงินฝากกำลังพล",
      recipientName: "ส.อ. อนุชา ชัยมงคล",
      notes: "หน่วยต้นสังกัด ร.25 พัน.2 ยื่นเสนอขอรับเงินทำขวัญและสิทธิรักษาพยาบาล",
      createdByUserId: benefitReviewer.id,
    },
  });

  console.log("✅ 6 Relational Benefit Tracking items seeded across all 5 timeline stages");

  // 9. Create System Settings for Telegram & LINE Messaging API
  await prisma.systemSetting.upsert({
    where: { key: "LINE_NOTIFY_ENABLED" },
    update: { value: "true" },
    create: { key: "LINE_NOTIFY_ENABLED", value: "true", description: "เปิดใช้งานการแจ้งเตือนผ่าน LINE Messaging API" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "TELEGRAM_NOTIFY_ENABLED" },
    update: { value: "true" },
    create: { key: "TELEGRAM_NOTIFY_ENABLED", value: "true", description: "เปิดใช้งานการแจ้งเตือนผ่าน Telegram Bot" },
  });

  console.log("🎉 PostgreSQL WeR-RTA database seed completed with 100% relational integrity!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
