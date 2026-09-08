import {
  BenefitRuleDefinition,
  DimensionOption,
  DimensionType,
} from "@/core/domain/entities/BenefitRule";
import { BenefitCategoryCode } from "@/core/domain/value-objects/military-types";
import { BenefitRule as PrismaBenefitRule, Prisma } from "@prisma/client";
import { prisma } from "../prisma";

// ============================================================================
// Master list of extensible dimension options (5-Dimension Rules Engine)
// ============================================================================
export const defaultDimensionOptions: DimensionOption[] = [
  // 3. ประเภทภารกิจที่ได้รับสิทธิ (Mission Types)
  { id: "SOUTHERN_BORDER", label: "จชต. (จังหวัดชายแดนภาคใต้ / กอ.รมน.ภาค 4 สน.)", type: "MISSION_TYPE", isSystem: true },
  { id: "BORDER_DEFENSE", label: "แผนป้องกันประเทศ (กองกำลังชายแดน ทภ.1-4)", type: "MISSION_TYPE", isSystem: true },
  { id: "INTERNAL_SECURITY", label: "รักษาความสงบเรียบร้อยภายในราชอาณาจักร", type: "MISSION_TYPE", isSystem: true },
  { id: "DISASTER_RELIEF", label: "บรรเทาสาธารณภัย / ช่วยเหลือประชาชน", type: "MISSION_TYPE", isSystem: true },
  { id: "PEACEKEEPING_UN", label: "รักษาสันติภาพสหประชาชาติ (UN Peacekeeping)", type: "MISSION_TYPE", isSystem: true },
  { id: "COUNTER_INSURGENCY", label: "ปราบปรามความไม่สงบและการก่อการร้าย", type: "MISSION_TYPE", isSystem: true },
  { id: "ROUTINE_SERVICE", label: "ราชการประจำ / งานในที่ตั้งปกติ", type: "MISSION_TYPE", isSystem: true },

  // 4. ประเภทกำลังพลที่ได้รับสิทธิ (Personnel Categories)
  { id: "COMMISSIONED_OFFICER", label: "นายทหารสัญญาบัตร (พล.อ. - ร.ต.)", type: "PERSONNEL_CATEGORY", isSystem: true },
  { id: "NON_COMMISSIONED_OFFICER", label: "นายทหารประทวน (จ.ส.อ. - ส.ต.)", type: "PERSONNEL_CATEGORY", isSystem: true },
  { id: "VOLUNTEER_RANGER", label: "อาสาสมัครทหารพราน (อส.ทพ.)", type: "PERSONNEL_CATEGORY", isSystem: true },
  { id: "CONSCRIPT_SOLDIER", label: "ทหารกองประจำการ (พลทหาร)", type: "PERSONNEL_CATEGORY", isSystem: true },
  { id: "CIVILIAN_STAFF", label: "พนักงานราชการ / ลูกจ้าง ทบ.", type: "PERSONNEL_CATEGORY", isSystem: true },

  // 5. ประเภทความสูญเสียที่ได้รับสิทธิ (Loss / Casualty Types)
  { id: "KIA_COMBAT_DEATH", label: "เสียชีวิตจากการสู้รบ/การปะทะ (KIA)", type: "LOSS_TYPE", isSystem: true },
  { id: "DUTY_DEATH", label: "เสียชีวิตขณะปฏิบัติหน้าที่ราชการสนาม", type: "LOSS_TYPE", isSystem: true },
  { id: "TOTAL_PERMANENT_DISABILITY", label: "พิการทุพพลภาพถาวรสมบูรณ์ (TPD)", type: "LOSS_TYPE", isSystem: true },
  { id: "PARTIAL_DISABILITY", label: "พิการทุพพลภาพบางส่วน", type: "LOSS_TYPE", isSystem: true },
  { id: "SEVERE_WOUND_WIA", label: "บาดเจ็บสาหัสจากการสู้รบ (WIA)", type: "LOSS_TYPE", isSystem: true },
  { id: "MODERATE_INJURY", label: "บาดเจ็บปานกลาง / เล็กน้อย", type: "LOSS_TYPE", isSystem: true },
];

export const defaultMilitaryRules: BenefitRuleDefinition[] = [
  // ============================================================================
  // หมวด 1: รับเงินครั้งเดียว (One-Time Lump Sum)
  // ============================================================================
  {
    id: "rule-cat1-01",
    ruleCode: "RULE-LUMP-INSURANCE",
    ruleName: "เงินสินไหมทดแทนประกันชีวิตทหารภัยสงคราม (กห./ทบ.)",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินสินไหมทดแทนประกันชีวิตกำลังพลที่เสียชีวิต ทุพพลภาพ หรือบาดเจ็บจากการปฏิบัติหน้าที่ในสนามรบและพื้นที่ จชต.",
    legalBasis: "สัญญากรมธรรม์ประกันชีวิตกำลังพล กรมการเงินกลาโหมและกองทัพบก",
    paymentType: "ONE_TIME_LUMP_SUM",

    // 1. ประเภทสิทธิ (Benefit Scope)
    benefitScope: "IN_ARMY",

    // 2. ถูกกระทำ (Action Cause)
    causeType: "BOTH",

    formulaType: "FIXED_AMOUNT",
    formulaExpression: "{baseAmount}",
    multiplierFactor: 1,
    baseAmount: 2000000,
    minAmount: 150000,
    maxAmount: 2000000,

    // 3, 4, 5 Dimensions
    conditions: {
      allowedMissions: ["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY", "COUNTER_INSURGENCY", "DISASTER_RELIEF", "ALL"],
      allowedPersonnelCategories: ["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER", "CIVILIAN_STAFF", "ALL"],
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "SEVERE_WOUND_WIA", "DUTY_DEATH", "PARTIAL_DISABILITY", "INJURY_SEVERE"],
    },

    // Matrix Tiers
    insuranceMatrix: [
      { scope: "IN_ARMY", cause: "ENEMY_ACTION", lossType: "KIA_COMBAT_DEATH", amount: 2000000 },
      { scope: "IN_ARMY", cause: "ENEMY_ACTION", lossType: "TOTAL_PERMANENT_DISABILITY", amount: 2000000 },
      { scope: "IN_ARMY", cause: "ENEMY_ACTION", lossType: "SEVERE_WOUND_WIA", amount: 500000 },
      { scope: "IN_ARMY", cause: "NON_ENEMY_ACTION", lossType: "DUTY_DEATH", amount: 1000000 },
      { scope: "IN_ARMY", cause: "NON_ENEMY_ACTION", lossType: "TOTAL_PERMANENT_DISABILITY", amount: 1200000 },
      { scope: "OUTSIDE_ARMY", cause: "ENEMY_ACTION", lossType: "KIA_COMBAT_DEATH", amount: 1000000 },
    ],

    isActive: true,
    priorityOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-02",
    ruleCode: "RULE-LUMP-GRATUITY",
    ruleName: "บำเหน็จตกทอดแก่ทายาท (Gratuity Inheritance)",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินบำเหน็จตกทอดจ่ายเป็นเงินก้อนให้แก่ทายาทตามกฎหมาย คำนวณจากฐานเงินเดือนปูนบำเหน็จคูณเวลาราชการรวม",
    legalBasis: "พ.ร.บ. บำเหน็จบำนาญข้าราชการ พ.ศ. 2494 มาตรา 48",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "EXPRESSION",
    formulaExpression: "{promotedSalary} * {totalServiceYears} * 1.5",
    multiplierFactor: 1.5,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-03",
    ruleCode: "RULE-LUMP-COMBAT-COMPENSATION",
    ruleName: "เงินชดเชยตาม พ.ร.บ. สงเคราะห์ผู้ประสบภัย (30 เท่าเงินเดือน)",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินช่วยเหลือผู้ประสบภัยเนื่องจากการช่วยเหลือราชการ การปฏิบัติหน้าที่ราชการสนาม 30 เท่าของเงินเดือน",
    legalBasis: "พ.ร.บ. สงเคราะห์ผู้ประสบภัยเนื่องจากการช่วยเหลือราชการ การปฏิบัติหน้าที่ราชการสนาม พ.ศ. 2543",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "EXPRESSION",
    formulaExpression: "{salary} * {multiplierFactor}",
    multiplierFactor: 30,
    baseAmount: 0,
    minAmount: 500000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-07",
    ruleCode: "RULE-LUMP-TASKFORCE-AID",
    ruleName: "เงินช่วยเหลือบำรุงขวัญจากหน่วยเฉพาะกิจและกองกำลังสนาม",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินมอบเป็นขวัญกำลังใจแก่ทายาทจากหน่วยบัญชาการสนามในพื้นที่ปฏิบัติการ",
    legalBasis: "ระเบียบกองกำลังป้องกันชายแดนและกองอำนวยการรักษาความมั่นคงภายใน",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "FIXED_AMOUNT",
    formulaExpression: "{baseAmount}",
    multiplierFactor: 1,
    baseAmount: 150000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ============================================================================
  // หมวด 2: รับเงินรายเดือน (Monthly Recurring)
  // ============================================================================
  {
    id: "rule-cat2-01",
    ruleCode: "RULE-MONTHLY-SPECIAL-PENSION",
    ruleName: "บำนาญพิเศษรายเดือน (Special Monthly Pension)",
    category: BenefitCategoryCode.MONTHLY_PAYMENT,
    categoryName: "Monthly Payment",
    categoryThaiName: "หมวด 2: รับเงินรายเดือน",
    description: "เงินบำนาญพิเศษรายเดือนจ่ายให้แก่ทายาทตลอดชีพตาม พ.ร.บ. บำเหน็จบำนาญข้าราชการ",
    legalBasis: "พ.ร.บ. บำเหน็จบำนาญข้าราชการ พ.ศ. 2494 และระเบียบกระทรวงกลาโหม",
    paymentType: "MONTHLY_PENSION",
    formulaType: "EXPRESSION",
    formulaExpression: "({promotedSalary} * {totalServiceYears}) / 50",
    multiplierFactor: 1,
    baseAmount: 0,
    minAmount: 12000,
    maxAmount: 85000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat2-02",
    ruleCode: "RULE-MONTHLY-DISABILITY-ALLOWANCE",
    ruleName: "เงินเลี้ยงชีพผู้ปลดพิการทุพพลภาพรายเดือน",
    category: BenefitCategoryCode.MONTHLY_PAYMENT,
    categoryName: "Monthly Payment",
    categoryThaiName: "หมวด 2: รับเงินรายเดือน",
    description: "เงินเลี้ยงชีพรายเดือนสำหรับกำลังพลที่พิการทุพพลภาพจากการรบจนต้องปลดประจำการ",
    legalBasis: "ระเบียบกระทรวงกลาโหมว่าด้วยการสงเคราะห์ทหารพิการ พ.ศ. 2558",
    paymentType: "MONTHLY_PENSION",
    formulaType: "FIXED_AMOUNT",
    formulaExpression: "{baseAmount}",
    multiplierFactor: 1,
    baseAmount: 15000,
    conditions: {
      allowedLossTypes: ["TOTAL_PERMANENT_DISABILITY", "PARTIAL_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 9,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ============================================================================
  // หมวด 3: รับเงินรายปี (Annual Grants)
  // ============================================================================
  {
    id: "rule-cat3-01",
    ruleCode: "RULE-ANNUAL-SCHOLARSHIP-PRIMARY",
    ruleName: "ทุนการศึกษาบุตรระดับประถมศึกษา (รายปี)",
    category: BenefitCategoryCode.ANNUAL_PAYMENT,
    categoryName: "Annual Payment",
    categoryThaiName: "หมวด 3: รับเงินรายปี",
    description: "ทุนการศึกษาต่อเนื่องรายปีสำหรับบุตรกำลังพลที่กำลังศึกษาในระดับประถมศึกษา",
    legalBasis: "ระเบียบมูลนิธิสายใจไทยและกองทุนการศึกษาบุตรกองทัพไทย",
    paymentType: "ANNUAL_GRANT",
    formulaType: "EXPRESSION",
    formulaExpression: "{baseAmount} * {studyingChildrenCount}",
    multiplierFactor: 1,
    baseAmount: 12000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "DUTY_DEATH"],
      requiresChildren: true,
    },
    isActive: true,
    priorityOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat3-02",
    ruleCode: "RULE-ANNUAL-SCHOLARSHIP-SECONDARY",
    ruleName: "ทุนการศึกษาบุตรระดับมัธยมศึกษา (รายปี)",
    category: BenefitCategoryCode.ANNUAL_PAYMENT,
    categoryName: "Annual Payment",
    categoryThaiName: "หมวด 3: รับเงินรายปี",
    description: "ทุนการศึกษารายปีระดับมัธยมศึกษาตอนต้นและตอนปลาย",
    legalBasis: "ระเบียบกองทุนสงเคราะห์และพัฒนาการศึกษาบุตรทหาร",
    paymentType: "ANNUAL_GRANT",
    formulaType: "EXPRESSION",
    formulaExpression: "{baseAmount} * {studyingChildrenCount}",
    multiplierFactor: 1,
    baseAmount: 18000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "DUTY_DEATH"],
      requiresChildren: true,
    },
    isActive: true,
    priorityOrder: 11,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat3-03",
    ruleCode: "RULE-ANNUAL-SCHOLARSHIP-BACHELOR",
    ruleName: "ทุนการศึกษาบุตรระดับอุดมศึกษา / ปริญญาตรี (รายปี)",
    category: BenefitCategoryCode.ANNUAL_PAYMENT,
    categoryName: "Annual Payment",
    categoryThaiName: "หมวด 3: รับเงินรายปี",
    description: "ทุนการศึกษารายปีระดับปริญญาตรีจนสำเร็จการศึกษา",
    legalBasis: "ระเบียบทุนการศึกษาสมเด็จพระนางเจ้าฯ พระบรมราชินีนาถ เพื่อบุตรทหารผ่านศึก",
    paymentType: "ANNUAL_GRANT",
    formulaType: "EXPRESSION",
    formulaExpression: "{baseAmount} * {studyingChildrenCount}",
    multiplierFactor: 1,
    baseAmount: 35000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "DUTY_DEATH"],
      requiresChildren: true,
    },
    isActive: true,
    priorityOrder: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // ============================================================================
  // หมวด 4: สิทธิมิใช่ตัวเงิน (Non-Monetary Rights)
  // ============================================================================
  {
    id: "rule-cat4-01",
    ruleCode: "RULE-NONMONEY-HEIR-SUCCESSION",
    ruleName: "สิทธิการบรรจุทายาทเข้ารับราชการทหารทดแทน 1 อัตรา",
    category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
    categoryName: "Non-Monetary Rights",
    categoryThaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    description: "สิทธิพิเศษของบุตรหรือคู่สมรสในการได้รับการบรรจุเข้ารับราชการทหารในตำแหน่งทดแทน (อายุ 18-35 ปี)",
    legalBasis: "ระเบียบกระทรวงกลาโหมว่าด้วยการบรรจุทายาทของผู้เสียชีวิตจากการปฏิบัติหน้าที่ พ.ศ. 2552",
    paymentType: "NON_MONETARY",
    formulaType: "NON_MONETARY",
    formulaExpression: "1 อัตราทดแทน",
    multiplierFactor: 0,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 13,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat4-02",
    ruleCode: "RULE-NONMONEY-ACADEMY-QUOTA",
    ruleName: "สิทธิโควตาพิเศษเข้าศึกษาโรงเรียนเตรียมทหารและวิทยาลัยพยาบาลเหล่าทัพ",
    category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
    categoryName: "Non-Monetary Rights",
    categoryThaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    description: "โควตาสิทธิพิเศษในการสอบคัดเลือกเข้าเป็นนักเรียนเตรียมทหารและนักเรียนพยาบาลกองทัพ",
    legalBasis: "ระเบียบการรับสมัครนักเรียนทหาร กระทรวงกลาโหม",
    paymentType: "NON_MONETARY",
    formulaType: "NON_MONETARY",
    formulaExpression: "โควตาสิทธิพิเศษบุตรทหาร",
    multiplierFactor: 0,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat4-03",
    ruleCode: "RULE-NONMONEY-MEDICAL-CARE",
    ruleName: "สิทธิการรักษาพยาบาลต่อเนื่องในโรงพยาบาลทหารและสถานพยาบาลของรัฐ",
    category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
    categoryName: "Non-Monetary Rights",
    categoryThaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    description: "สิทธิการรักษาพยาบาลเทียบเท่าข้าราชการสำหรับคู่สมรส บุตร และบิดามารดา",
    legalBasis: "พระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล พ.ศ. 2553",
    paymentType: "NON_MONETARY",
    formulaType: "NON_MONETARY",
    formulaExpression: "สิทธิรักษาพยาบาลครอบครัว",
    multiplierFactor: 0,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat4-05",
    ruleCode: "RULE-NONMONEY-BANGRAJAN-MEDAL",
    ruleName: "สิทธิเสนอขอเหรียญบางระจัน",
    category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
    categoryName: "Non-Monetary Rights",
    categoryThaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    description: "สิทธิเสนอขอพระราชทานเหรียญบางระจัน แก่กำลังพลที่กระทำการอันเป็นการกล้าหาญเด็ดเดี่ยวในการปฏิบัติภารกิจในพื้นที่ปฏิบัติการรบ ทั้งกรณีเสียชีวิต ทุพพลภาพ และบาดเจ็บจากการสู้รบ",
    legalBasis: "พ.ร.บ. เครื่องอิสริยาภรณ์ตรีภาษณาภิรมย์ และระเบียบการเสนอขอเหรียญกล้าหาญ (เหรียญบางระจัน) กองทัพบก",
    paymentType: "NON_MONETARY",
    formulaType: "NON_MONETARY",
    formulaExpression: "สิทธิเสนอขอเหรียญบางระจัน",
    multiplierFactor: 0,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY", "SEVERE_WOUND_WIA", "MODERATE_INJURY", "MINOR_INJURY", "INJURY_SEVERE", "DUTY_DEATH"],
      allowedMissions: ["SOUTHERN_BORDER", "BORDER_DEFENSE", "COUNTER_INSURGENCY", "ALL"],
    },
    isActive: true,
    priorityOrder: 17,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat4-04",
    ruleCode: "RULE-NONMONEY-ROYAL-CREMATION",
    ruleName: "สิทธิการขอพระราชทานเพลิงศพเป็นกรณีพิเศษ พร้อมกองทหารเกียรติยศ",
    category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
    categoryName: "Non-Monetary Rights",
    categoryThaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
    description: "พิธีพระราชทานเพลิงศพ กองทหารเกียรติยศ และพิธีเชิญธงชาติคลุมหีบศพตามระเบียบพิธีการทหาร",
    legalBasis: "ระเบียบกระทรวงกลาโหมว่าด้วยพิธีการศพทหารและผู้ปฏิบัติหน้าที่เพื่อชาติ",
    paymentType: "NON_MONETARY",
    formulaType: "NON_MONETARY",
    formulaExpression: "พิธีพระราชทานเพลิงศพเกียรติยศ",
    multiplierFactor: 0,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 16,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class MilitaryRuleRepository {
  private rules: BenefitRuleDefinition[] = [];
  private dimensionOptions: DimensionOption[] = [];

  constructor() {
    this.rules = [...defaultMilitaryRules];
    this.dimensionOptions = [...defaultDimensionOptions];
  }

  public getAllRules(): BenefitRuleDefinition[] {
    return [...this.rules].sort((a, b) => a.priorityOrder - b.priorityOrder);
  }

  public getRulesByCategory(category: BenefitCategoryCode): BenefitRuleDefinition[] {
    return this.rules.filter((r) => r.category === category);
  }

  public getRuleById(id: string): BenefitRuleDefinition | null {
    return this.rules.find((r) => r.id === id) || null;
  }

  public createRule(data: Omit<BenefitRuleDefinition, "id" | "createdAt" | "updatedAt">): BenefitRuleDefinition {
    const newRule: BenefitRuleDefinition = {
      ...data,
      id: `rule-${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.push(newRule);
    return newRule;
  }

  public updateRule(id: string, data: Partial<BenefitRuleDefinition>): BenefitRuleDefinition {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Rule with id ${id} not found`);

    this.rules[idx] = {
      ...this.rules[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.rules[idx];
  }

  public deleteRule(id: string): boolean {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.rules.splice(idx, 1);
      return true;
    }
    return false;
  }

  public resetToDefault() {
    this.rules = [...defaultMilitaryRules];
    this.dimensionOptions = [...defaultDimensionOptions];
  }

  // --------------------------------------------------------------------------
  // Dimension Options Master List
  // (ประเภทภารกิจ / ประเภทกำลังพล / ประเภทความสูญเสีย)
  // --------------------------------------------------------------------------

  public getDimensionOptions(type?: DimensionType): DimensionOption[] {
    const list = type ? this.dimensionOptions.filter((o) => o.type === type) : this.dimensionOptions;
    return [...list];
  }

  public createDimensionOption(data: { id?: string; label: string; type: DimensionType }): DimensionOption {
    const label = (data.label || "").trim();
    if (!label) throw new Error("กรุณาระบุชื่อตัวเลือก (label is required)");
    if (!["MISSION_TYPE", "PERSONNEL_CATEGORY", "LOSS_TYPE"].includes(data.type)) {
      throw new Error("ประเภทมิติไม่ถูกต้อง (invalid dimension type)");
    }

    // Auto-generate a stable, readable id from the Thai/English label
    const slug =
      data.id?.trim() ||
      `${data.type}_${label
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase()
        .slice(0, 48)}`;
    const safeId = this.dimensionOptions.some((o) => o.id === slug)
      ? `${slug}_${Date.now().toString().slice(-5)}`
      : slug;

    const newOption: DimensionOption = { id: safeId, label, type: data.type, isSystem: false };
    this.dimensionOptions.push(newOption);
    return newOption;
  }

  public updateDimensionOption(id: string, data: { label?: string }): DimensionOption {
    const idx = this.dimensionOptions.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error(`ไม่พบตัวเลือกมิติที่ระบุ (${id})`);
    if (data.label !== undefined) {
      const label = data.label.trim();
      if (!label) throw new Error("ชื่อตัวเลือกไม่สามารถเป็นค่าว่างได้");
      this.dimensionOptions[idx] = { ...this.dimensionOptions[idx], label };
    }
    return this.dimensionOptions[idx];
  }

  /**
   * Delete a dimension option from the master list.
   * With cascade=true it also removes the option id from every rule's
   * conditions arrays so the rules engine never evaluates an orphaned option.
   */
  public deleteDimensionOption(id: string, cascade: boolean): { deleted: boolean; affectedRules: number } {
    const option = this.dimensionOptions.find((o) => o.id === id);
    if (!option) throw new Error(`ไม่พบตัวเลือกมิติที่ระบุ (${id})`);

    let affectedRules = 0;
    if (cascade) {
      const key =
        option.type === "MISSION_TYPE"
          ? "allowedMissions"
          : option.type === "PERSONNEL_CATEGORY"
            ? "allowedPersonnelCategories"
            : "allowedLossTypes";
      for (const rule of this.rules) {
        const cond = rule.conditions as Record<string, unknown> | undefined;
        if (!cond) continue;
        const arr = cond[key];
        if (Array.isArray(arr) && arr.includes(id)) {
          cond[key] = arr.filter((x) => x !== id);
          affectedRules += 1;
          rule.updatedAt = new Date();
        }
      }
    }

    const idx = this.dimensionOptions.findIndex((o) => o.id === id);
    this.dimensionOptions.splice(idx, 1);
    return { deleted: true, affectedRules };
  }
}

class PrismaMilitaryRuleRepository {
  private toDomainRule(rule: PrismaBenefitRule): BenefitRuleDefinition {
    const toStringArray = (value: Prisma.JsonValue | undefined | null): string[] => {
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
      }
      return [];
    };

    return {
      id: rule.id,
      ruleCode: rule.ruleCode,
      ruleName: rule.ruleName,
      category: rule.category as BenefitCategoryCode,
      categoryName: rule.categoryName || "",
      categoryThaiName: rule.categoryThaiName || "",
      description: rule.description || "",
      legalBasis: rule.legalBasis || "",
      paymentType: rule.paymentType as BenefitRuleDefinition["paymentType"],
      benefitScope: rule.benefitScope ? (rule.benefitScope as BenefitRuleDefinition["benefitScope"]) : undefined,
      causeType: rule.causeType ? (rule.causeType as BenefitRuleDefinition["causeType"]) : undefined,
      formulaType: rule.formulaType as BenefitRuleDefinition["formulaType"],
      formulaExpression: rule.formulaExpression,
      multiplierFactor: rule.multiplierFactor,
      baseAmount: rule.baseAmount,
      minAmount: rule.minAmount ?? undefined,
      maxAmount: rule.maxAmount ?? undefined,
      conditions: {
        allowedMissions: toStringArray(rule.allowedMissions),
        allowedPersonnelCategories: toStringArray(rule.allowedPersonnelCategories),
        allowedLossTypes: toStringArray(rule.allowedLossTypes),
        allowedRanks: toStringArray(rule.allowedRanks),
        minServiceYears: rule.minServiceYears ?? undefined,
        requiresSpouse: rule.requiresSpouse ?? undefined,
        requiresChildren: rule.requiresChildren ?? undefined,
      },
      insuranceMatrix:
        rule.insuranceMatrix && typeof rule.insuranceMatrix === "object"
          ? (rule.insuranceMatrix as unknown as BenefitRuleDefinition["insuranceMatrix"])
          : undefined,
      formulaTiers:
        rule.formulaTiers && typeof rule.formulaTiers === "object"
          ? (rule.formulaTiers as unknown as BenefitRuleDefinition["formulaTiers"])
          : undefined,
      isActive: rule.isActive,
      priorityOrder: rule.priorityOrder,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  public async getAllRules(): Promise<BenefitRuleDefinition[]> {
    const rules = await prisma.benefitRule.findMany({ orderBy: { priorityOrder: "asc" } });
    return rules.map((rule) => this.toDomainRule(rule));
  }

  public async getRulesByCategory(category: BenefitCategoryCode): Promise<BenefitRuleDefinition[]> {
    const rules = await prisma.benefitRule.findMany({ where: { category }, orderBy: { priorityOrder: "asc" } });
    return rules.map((rule) => this.toDomainRule(rule));
  }

  public async getRuleById(id: string): Promise<BenefitRuleDefinition | null> {
    const rule = await prisma.benefitRule.findUnique({ where: { id } });
    return rule ? this.toDomainRule(rule) : null;
  }

  public async createRule(data: Omit<BenefitRuleDefinition, "id" | "createdAt" | "updatedAt">): Promise<BenefitRuleDefinition> {
    const created = await prisma.benefitRule.create({
      data: {
        id: `rule-${Date.now().toString().slice(-6)}`,
        ruleCode: data.ruleCode,
        ruleName: data.ruleName,
        category: data.category,
        categoryName: data.categoryName,
        categoryThaiName: data.categoryThaiName,
        description: data.description,
        legalBasis: data.legalBasis,
        paymentType: data.paymentType,
        benefitScope: data.benefitScope ?? null,
        causeType: data.causeType ?? null,
        formulaType: data.formulaType,
        formulaExpression: data.formulaExpression,
        multiplierFactor: data.multiplierFactor,
        baseAmount: data.baseAmount,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        allowedMissions: (data.conditions.allowedMissions || []) as Prisma.InputJsonValue,
        allowedPersonnelCategories: (data.conditions.allowedPersonnelCategories || []) as Prisma.InputJsonValue,
        allowedLossTypes: (data.conditions.allowedLossTypes || []) as Prisma.InputJsonValue,
        allowedRanks: (data.conditions.allowedRanks || []) as Prisma.InputJsonValue,
        minServiceYears: data.conditions.minServiceYears ?? null,
        requiresSpouse: data.conditions.requiresSpouse ?? null,
        requiresChildren: data.conditions.requiresChildren ?? null,
        insuranceMatrix: data.insuranceMatrix ? (data.insuranceMatrix as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        formulaTiers: data.formulaTiers ? (data.formulaTiers as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        priorityOrder: data.priorityOrder,
        isActive: data.isActive,
      },
    });

    return this.toDomainRule(created);
  }

  public async updateRule(id: string, data: Partial<BenefitRuleDefinition>): Promise<BenefitRuleDefinition> {
    const updated = await prisma.benefitRule.update({
      where: { id },
      data: {
        ruleCode: data.ruleCode,
        ruleName: data.ruleName,
        category: data.category,
        categoryName: data.categoryName,
        categoryThaiName: data.categoryThaiName,
        description: data.description,
        legalBasis: data.legalBasis,
        paymentType: data.paymentType,
        benefitScope: data.benefitScope ?? undefined,
        causeType: data.causeType ?? undefined,
        formulaType: data.formulaType,
        formulaExpression: data.formulaExpression,
        multiplierFactor: data.multiplierFactor,
        baseAmount: data.baseAmount,
        minAmount: data.minAmount ?? null,
        maxAmount: data.maxAmount ?? null,
        allowedMissions: data.conditions?.allowedMissions as Prisma.InputJsonValue | undefined,
        allowedPersonnelCategories: data.conditions?.allowedPersonnelCategories as Prisma.InputJsonValue | undefined,
        allowedLossTypes: data.conditions?.allowedLossTypes as Prisma.InputJsonValue | undefined,
        allowedRanks: data.conditions?.allowedRanks as Prisma.InputJsonValue | undefined,
        minServiceYears: data.conditions?.minServiceYears ?? undefined,
        requiresSpouse: data.conditions?.requiresSpouse ?? undefined,
        requiresChildren: data.conditions?.requiresChildren ?? undefined,
        insuranceMatrix: data.insuranceMatrix ? (data.insuranceMatrix as unknown as Prisma.InputJsonValue) : undefined,
        formulaTiers: data.formulaTiers ? (data.formulaTiers as unknown as Prisma.InputJsonValue) : undefined,
        priorityOrder: data.priorityOrder,
        isActive: data.isActive,
      },
    });

    return this.toDomainRule(updated);
  }

  public async deleteRule(id: string): Promise<boolean> {
    try {
      await prisma.benefitRule.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async resetToDefault(): Promise<void> {
    await prisma.benefitRule.deleteMany();
    await prisma.benefitDimensionOption.deleteMany();
  }

  public async getDimensionOptions(type?: DimensionType): Promise<DimensionOption[]> {
    const options = await prisma.benefitDimensionOption.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    return options.map((option) => ({
      id: option.id,
      label: option.label,
      type: option.type as DimensionType,
      isSystem: option.isSystem,
    }));
  }

  public async createDimensionOption(data: { id?: string; label: string; type: DimensionType }): Promise<DimensionOption> {
    const label = (data.label || "").trim();
    if (!label) throw new Error("กรุณาระบุชื่อตัวเลือก (label is required)");

    const existingIds = await prisma.benefitDimensionOption.findMany({ select: { id: true } });
    const slug =
      data.id?.trim() ||
      `${data.type}_${label
        .replace(/[^\p{L}\p{N}]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase()
        .slice(0, 48)}`;
    const safeId = existingIds.some((option) => option.id === slug)
      ? `${slug}_${Date.now().toString().slice(-5)}`
      : slug;

    const created = await prisma.benefitDimensionOption.create({
      data: { id: safeId, label, type: data.type, isSystem: false },
    });

    return {
      id: created.id,
      label: created.label,
      type: created.type as DimensionType,
      isSystem: created.isSystem,
    };
  }

  public async updateDimensionOption(id: string, data: { label?: string }): Promise<DimensionOption> {
    const updated = await prisma.benefitDimensionOption.update({
      where: { id },
      data: data.label !== undefined ? { label: data.label.trim() } : {},
    });

    return {
      id: updated.id,
      label: updated.label,
      type: updated.type as DimensionType,
      isSystem: updated.isSystem,
    };
  }

  public async deleteDimensionOption(id: string, cascade: boolean): Promise<{ deleted: boolean; affectedRules: number }> {
    const option = await prisma.benefitDimensionOption.findUnique({ where: { id } });
    if (!option) throw new Error(`ไม่พบตัวเลือกมิติที่ระบุ (${id})`);

    let affectedRules = 0;
    if (cascade) {
      const fieldName =
        option.type === "MISSION_TYPE"
          ? "allowedMissions"
          : option.type === "PERSONNEL_CATEGORY"
            ? "allowedPersonnelCategories"
            : "allowedLossTypes";

      const rules = await prisma.benefitRule.findMany();
      for (const rule of rules) {
        const rawValue = (rule as unknown as Record<string, Prisma.JsonValue>)[fieldName];
        if (!Array.isArray(rawValue) || !rawValue.includes(id)) continue;

        const nextValues = rawValue.filter((value) => value !== id);
        await prisma.benefitRule.update({
          where: { id: rule.id },
          data: { [fieldName]: nextValues } as Prisma.BenefitRuleUpdateInput,
        });
        affectedRules += 1;
      }
    }

    await prisma.benefitDimensionOption.delete({ where: { id } });
    return { deleted: true, affectedRules };
  }
}

const globalForMilitaryRules = globalThis as unknown as {
  militaryRuleRepo: PrismaMilitaryRuleRepository | undefined;
};

export const militaryRuleRepository = globalForMilitaryRules.militaryRuleRepo ?? new PrismaMilitaryRuleRepository();
if (process.env.NODE_ENV !== "production") globalForMilitaryRules.militaryRuleRepo = militaryRuleRepository;

