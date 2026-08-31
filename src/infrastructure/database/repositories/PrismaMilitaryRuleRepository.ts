import {
  BenefitRuleDefinition,
  DimensionOption,
  DimensionType,
} from "@/core/domain/entities/BenefitRule";
import { BenefitCategoryCode } from "@/core/domain/value-objects/military-types";

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
    id: "rule-cat1-04",
    ruleCode: "RULE-LUMP-PROMOTION-DIFF",
    ruleName: "เงินเพิ่มพิเศษผลต่างการปูนบำเหน็จเลื่อนชั้นยศ (7-9 ชั้นยศ)",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินตกเบิกและผลต่างเงินเดือนจากการได้รับการปูนบำเหน็จเลื่อนชั้นยศเป็นกรณีพิเศษ",
    legalBasis: "ระเบียบกระทรวงกลาโหมว่าด้วยการปูนบำเหน็จพิเศษ พ.ศ. 2560",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "EXPRESSION",
    formulaExpression: "({promotedSalary} - {salary}) * 12 * 3",
    multiplierFactor: 3,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-09",
    ruleCode: "RULE-LUMP-HOSPITAL-STAY",
    ruleName: "เงินบำรุงขวัญกำลังพล (Morale / Consolation Grant)",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินบำรุงขวัญกำลังพล: กรณีเสียชีวิตรับ 40,000 บาท; กรณีบาดเจ็บและพักรักษาตัวในโรงพยาบาลไม่เกิน 20 วันรับ 10,000 บาท; กรณีบาดเจ็บพักรักษาตัวเกิน 20 วันรับเพิ่มอีก 10,000 บาท รวม 20,000 บาท",
    legalBasis: "ระเบียบกองทัพบกว่าด้วยการสงเคราะห์กำลังพลที่ได้รับบาดเจ็บจากการปฏิบัติราชการสนาม พ.ศ. 2562",
    paymentType: "ONE_TIME_LUMP_SUM",
    benefitScope: "IN_ARMY",
    causeType: "BOTH",
    formulaType: "EXPRESSION",
    formulaExpression: "{hospitalStayDays} <= 20 ? 10000 : 20000",
    multiplierFactor: 1,
    baseAmount: 10000,
    minAmount: 10000,
    maxAmount: 40000,

    // สูตร & กฎเกณฑ์ระดับเงินบำรุงขวัญ (Configurable Benefit Tiers)
    // ตามระเบียบกองทัพบกว่าด้วยการสงเคราะห์กำลังพลที่ได้รับบาดเจ็บจากการปฏิบัติราชการสนาม พ.ศ. 2562
    // กำหนดระดับเงินบำรุงขวัญดังนี้:
    // 1. กรณีเสียชีวิตหรือพิการทุพพลภาพ -> 40,000 บาท
    // 2. กรณีบาดเจ็บและพักรักษาตัวในโรงพยาบาลไม่เกิน 20 วัน -> 10,000 บาท
    // 3. กรณีบาดเจ็บพักรักษาตัวเกิน 20 วัน -> รับเพิ่มเติมอีก 10,000 บาท (รวม 20,000 บาท)
    formulaTiers: [
      {
        id: "tier-morale-death-disability",
        label: "กรณีเสียชีวิตหรือพิการทุพพลภาพ",
        lossTypes: ["DEATH", "DISABILITY"],
        amount: 40000,
      },
      {
        id: "tier-morale-injury-base",
        label: "กรณีบาดเจ็บและพักรักษาตัวในโรงพยาบาล (ฐาน)",
        lossTypes: ["INJURY"],
        amount: 10000,
      },
      {
        id: "tier-morale-injury-over20",
        label: "กรณีบาดเจ็บพักรักษาตัวเกิน 20 วัน (รับเพิ่มเติม)",
        lossTypes: ["INJURY"],
        minDays: 21,
        amount: 10000,
        isAdditional: true,
      },
    ],

    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH", "SEVERE_WOUND_WIA", "MODERATE_INJURY", "MINOR_INJURY", "TOTAL_PERMANENT_DISABILITY", "PARTIAL_DISABILITY", "ALL"],
      allowedMissions: ["SOUTHERN_BORDER", "BORDER_DEFENSE", "INTERNAL_SECURITY", "COUNTER_INSURGENCY", "DISASTER_RELIEF", "ALL"],
      allowedPersonnelCategories: ["COMMISSIONED_OFFICER", "NON_COMMISSIONED_OFFICER", "VOLUNTEER_RANGER", "CONSCRIPT_SOLDIER", "CIVILIAN_STAFF", "ALL"],
    },
    isActive: true,
    priorityOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-05",
    ruleCode: "RULE-LUMP-ARMY-FUND",
    ruleName: "เงินกองทุนสวัสดิการกองทัพบก / บก.ทท.",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินช่วยเหลือจากกองทุนสวัสดิการกองทัพ คิดจากฐานเงินกองทุนบวกอายุราชการ",
    legalBasis: "ระเบียบกองทุนสวัสดิการกองทัพบก พ.ศ. 2555",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "EXPRESSION",
    formulaExpression: "{baseAmount} + ({totalServiceYears} * 10000)",
    multiplierFactor: 1,
    baseAmount: 300000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
    isActive: true,
    priorityOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "rule-cat1-06",
    ruleCode: "RULE-LUMP-FUNERAL-AID",
    ruleName: "เงินช่วยพิเศษค่าจัดการศพ 3 เท่าเงินเดือน",
    category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
    categoryName: "One-Time Lump Sum",
    categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
    description: "เงินช่วยเหลือการจัดการศพตามระเบียบกระทรวงการคลัง 3 เท่าของเงินเดือนสุดท้าย",
    legalBasis: "ระเบียบกระทรวงการคลังว่าด้วยเงินช่วยพิเศษกรณีข้าราชการถึงแก่ความตาย",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "EXPRESSION",
    formulaExpression: "{salary} * 3",
    multiplierFactor: 3,
    baseAmount: 0,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH"],
    },
    isActive: true,
    priorityOrder: 6,
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

const globalForMilitaryRules = globalThis as unknown as {
  militaryRuleRepo: MilitaryRuleRepository | undefined;
};

export const militaryRuleRepository = globalForMilitaryRules.militaryRuleRepo ?? new MilitaryRuleRepository();
if (process.env.NODE_ENV !== "production") globalForMilitaryRules.militaryRuleRepo = militaryRuleRepository;
