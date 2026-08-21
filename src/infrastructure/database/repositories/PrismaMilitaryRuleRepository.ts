import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";
import { BenefitCategoryCode } from "@/core/domain/value-objects/military-types";

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
    description: "เงินสินไหมทดแทนประกันชีวิตกำลังพลที่เสียชีวิตจากการปฏิบัติหน้าที่ในสนามรบและพื้นที่ จชต.",
    legalBasis: "สัญญากรมธรรม์ประกันชีวิตกำลังพล กรมการเงินกลาโหมและกองทัพบก",
    paymentType: "ONE_TIME_LUMP_SUM",
    formulaType: "FIXED_AMOUNT",
    formulaExpression: "{baseAmount}",
    multiplierFactor: 1,
    baseAmount: 2000000,
    conditions: {
      allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"],
    },
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

  constructor() {
    this.rules = [...defaultMilitaryRules];
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
  }
}

const globalForMilitaryRules = globalThis as unknown as {
  militaryRuleRepo: MilitaryRuleRepository | undefined;
};

export const militaryRuleRepository = globalForMilitaryRules.militaryRuleRepo ?? new MilitaryRuleRepository();
if (process.env.NODE_ENV !== "production") globalForMilitaryRules.militaryRuleRepo = militaryRuleRepository;
