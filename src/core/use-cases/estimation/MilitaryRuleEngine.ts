import {
  MilitaryPersonnelInput,
  RuleFormulaContext,
  EvaluatedBenefitItem,
  CategorySummaryResult,
  MilitaryBenefitCalculationResult,
  BenefitCategoryCode,
} from "@/core/domain/value-objects/military-types";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";

export class MilitaryRuleEngine {
  /**
   * Safely evaluates mathematical formula expression with substituted tokens
   */
  public static evaluateFormula(expression: string, context: RuleFormulaContext): number {
    if (!expression || expression.trim() === "" || expression.includes("สิทธิ") || expression.includes("อัตรา")) return context.baseAmount || 0;

    let parsed = expression
      .replace(/{salary}/g, String(context.salary))
      .replace(/{promotedSalary}/g, String(context.promotedSalary))
      .replace(/{serviceYears}/g, String(context.serviceYears))
      .replace(/{serviceYearsMultiplier}/g, String(context.serviceYearsMultiplier))
      .replace(/{totalServiceYears}/g, String(context.totalServiceYears))
      .replace(/{compensationAmount}/g, String(context.compensationAmount))
      .replace(/{additionalPay}/g, String(context.additionalPay))
      .replace(/{promotionSteps}/g, String(context.promotionSteps))
      .replace(/{childrenCount}/g, String(context.childrenCount))
      .replace(/{studyingChildrenCount}/g, String(context.studyingChildrenCount))
      .replace(/{multiplierFactor}/g, String(context.multiplierFactor))
      .replace(/{baseAmount}/g, String(context.baseAmount));

    const sanitized = parsed.replace(/[^0-9+\-*/().\s]/g, "");

    try {
      // Safe arithmetic calculation using Function constructor with no scope access
      const result = new Function(`return (${sanitized});`)();
      return isNaN(result) ? 0 : Math.round(result);
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates eligibility of a rule for given personnel
   */
  public static checkEligibility(rule: BenefitRuleDefinition, personnel: MilitaryPersonnelInput): { isEligible: boolean; notes: string[] } {
    if (!rule.isActive) {
      return { isEligible: false, notes: ["กฎเกณฑ์ปิดใช้งานอยู่"] };
    }

    const notes: string[] = [];

    // Check Loss Type
    if (rule.conditions?.allowedLossTypes && rule.conditions.allowedLossTypes.length > 0) {
      if (!rule.conditions.allowedLossTypes.includes(personnel.lossType)) {
        return { isEligible: false, notes: [`ไม่ตรงตามประเภทความสูญเสีย (${personnel.lossType})`] };
      }
    }

    // Check Children requirement
    if (rule.conditions?.requiresChildren) {
      const studyingCount = personnel.children?.filter((c) => c.isStudying).length || 0;
      if (studyingCount === 0) {
        return { isEligible: false, notes: ["ไม่มีบุตรที่อยู่ในเกณฑ์กำลังศึกษา"] };
      }
    }

    // Check Spouse requirement
    if (rule.conditions?.requiresSpouse) {
      if (!personnel.spouse || !personnel.spouse.isLegallyMarried) {
        return { isEligible: false, notes: ["ไม่มีคู่สมรสจดทะเบียนตามกฎหมาย"] };
      }
    }

    // Check Minimum service years
    if (rule.conditions?.minServiceYears) {
      if (personnel.totalServiceYears < rule.conditions.minServiceYears) {
        return { isEligible: false, notes: [`อายุราชการไม่ถึงเกณฑ์ขั้นต่ำ ${rule.conditions.minServiceYears} ปี`] };
      }
    }

    return { isEligible: true, notes: ["มีสิทธิได้รับตามระเบียบ"] };
  }

  /**
   * Executes calculation across all 4 categories
   */
  public static calculate(
    personnel: MilitaryPersonnelInput,
    rules: BenefitRuleDefinition[]
  ): MilitaryBenefitCalculationResult {
    const defaultPromotedSalary =
      personnel.promotedSalary ||
      Math.round(personnel.salary * (1 + (personnel.promotionSteps || 7) * 0.08));

    const totalYears =
      personnel.totalServiceYears ||
      personnel.serviceYearsNormal + (personnel.serviceYearsMultiplier || 0);

    const studyingCount =
      personnel.children?.filter((c) => c.isStudying).length || 0;

    const categoryDefinitions: Record<
      BenefitCategoryCode,
      { name: string; thaiName: string; desc: string }
    > = {
      [BenefitCategoryCode.LUMP_SUM_PAYMENT]: {
        name: "One-Time Lump Sum Payment",
        thaiName: "หมวด 1: รับเงินครั้งเดียว",
        desc: "เงินก้อนจ่ายครั้งเดียว เช่น บำเหน็จตกทอด, ชดเชย พ.ร.บ. สงเคราะห์ 30 เท่า, ประกันชีวิตทหาร, ปูนบำเหน็จ และเงินกองทุน",
      },
      [BenefitCategoryCode.MONTHLY_PAYMENT]: {
        name: "Monthly Payment",
        thaiName: "หมวด 2: รับเงินรายเดือน",
        desc: "เงินบำนาญพิเศษรายเดือนจ่ายตลอดชีพแก่ทายาท และเงินเลี้ยงชีพผู้ปลดพิการทุพพลภาพ",
      },
      [BenefitCategoryCode.ANNUAL_PAYMENT]: {
        name: "Annual Payment",
        thaiName: "หมวด 3: รับเงินรายปี",
        desc: "ทุนการศึกษาต่อเนื่องรายปีสำหรับบุตรกำลังพลระดับประถม มัธยม และอุดมศึกษา",
      },
      [BenefitCategoryCode.NON_MONETARY_BENEFIT]: {
        name: "Non-Monetary Rights",
        thaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
        desc: "สิทธิการบรรจุทายาททดแทน 1 อัตรา, สิทธิโควตาสถาบันการศึกษาทหาร, สิทธิการรักษาพยาบาล และพิธีพระราชทานเพลิงศพ",
      },
    };

    const categories: Record<BenefitCategoryCode, CategorySummaryResult> = {
      [BenefitCategoryCode.LUMP_SUM_PAYMENT]: {
        category: BenefitCategoryCode.LUMP_SUM_PAYMENT,
        categoryName: categoryDefinitions[BenefitCategoryCode.LUMP_SUM_PAYMENT].name,
        categoryThaiName: categoryDefinitions[BenefitCategoryCode.LUMP_SUM_PAYMENT].thaiName,
        description: categoryDefinitions[BenefitCategoryCode.LUMP_SUM_PAYMENT].desc,
        totalAmount: 0,
        itemCount: 0,
        items: [],
      },
      [BenefitCategoryCode.MONTHLY_PAYMENT]: {
        category: BenefitCategoryCode.MONTHLY_PAYMENT,
        categoryName: categoryDefinitions[BenefitCategoryCode.MONTHLY_PAYMENT].name,
        categoryThaiName: categoryDefinitions[BenefitCategoryCode.MONTHLY_PAYMENT].thaiName,
        description: categoryDefinitions[BenefitCategoryCode.MONTHLY_PAYMENT].desc,
        totalAmount: 0,
        itemCount: 0,
        items: [],
      },
      [BenefitCategoryCode.ANNUAL_PAYMENT]: {
        category: BenefitCategoryCode.ANNUAL_PAYMENT,
        categoryName: categoryDefinitions[BenefitCategoryCode.ANNUAL_PAYMENT].name,
        categoryThaiName: categoryDefinitions[BenefitCategoryCode.ANNUAL_PAYMENT].thaiName,
        description: categoryDefinitions[BenefitCategoryCode.ANNUAL_PAYMENT].desc,
        totalAmount: 0,
        itemCount: 0,
        items: [],
      },
      [BenefitCategoryCode.NON_MONETARY_BENEFIT]: {
        category: BenefitCategoryCode.NON_MONETARY_BENEFIT,
        categoryName: categoryDefinitions[BenefitCategoryCode.NON_MONETARY_BENEFIT].name,
        categoryThaiName: categoryDefinitions[BenefitCategoryCode.NON_MONETARY_BENEFIT].thaiName,
        description: categoryDefinitions[BenefitCategoryCode.NON_MONETARY_BENEFIT].desc,
        totalAmount: 0,
        itemCount: 0,
        items: [],
      },
    };

    let grandTotalLumpSum = 0;
    let grandTotalMonthlyPension = 0;
    let grandTotalAnnualScholarship = 0;
    let nonMonetaryRightsCount = 0;

    for (const rule of rules) {
      const eligibility = this.checkEligibility(rule, personnel);
      if (!eligibility.isEligible) continue;

      const context: RuleFormulaContext = {
        salary: personnel.salary,
        promotedSalary: defaultPromotedSalary,
        serviceYears: personnel.serviceYearsNormal,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        totalServiceYears: totalYears,
        compensationAmount: personnel.compensationAmount || 0,
        additionalPay: personnel.additionalPay || 0,
        promotionSteps: personnel.promotionSteps || 7,
        childrenCount: personnel.children?.length || 0,
        studyingChildrenCount: studyingCount,
        multiplierFactor: rule.multiplierFactor,
        baseAmount: rule.baseAmount,
      };

      let amount = 0;
      if (rule.formulaType !== "NON_MONETARY") {
        amount = this.evaluateFormula(rule.formulaExpression, context);
        if (rule.minAmount && amount < rule.minAmount) amount = rule.minAmount;
        if (rule.maxAmount && amount > rule.maxAmount) amount = rule.maxAmount;
      }

      const item: EvaluatedBenefitItem = {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        categoryName: rule.categoryName,
        isEligible: true,
        amount,
        paymentType: rule.paymentType,
        formulaUsed: rule.formulaExpression,
        legalBasis: rule.legalBasis,
        eligibilityNotes: eligibility.notes,
      };

      // Put into category
      if (categories[rule.category]) {
        categories[rule.category].items.push(item);
        categories[rule.category].itemCount += 1;
        categories[rule.category].totalAmount += amount;
      }

      // Aggregate totals based on Category
      if (rule.category === BenefitCategoryCode.LUMP_SUM_PAYMENT) {
        grandTotalLumpSum += amount;
      } else if (rule.category === BenefitCategoryCode.MONTHLY_PAYMENT) {
        grandTotalMonthlyPension += amount;
      } else if (rule.category === BenefitCategoryCode.ANNUAL_PAYMENT) {
        grandTotalAnnualScholarship += amount;
      } else if (rule.category === BenefitCategoryCode.NON_MONETARY_BENEFIT) {
        nonMonetaryRightsCount += 1;
      }
    }

    // Successor right check (Age 18 - 35)
    let successorEligible = false;
    let candidateName: string | undefined;

    if (personnel.children && personnel.children.length > 0) {
      const eligibleChild = personnel.children.find((c) => c.age >= 18 && c.age <= 35);
      if (eligibleChild) {
        successorEligible = true;
        candidateName = `${eligibleChild.fullName} (บุตร อายุ ${eligibleChild.age} ปี)`;
      }
    }

    if (!successorEligible && personnel.spouse?.isLegallyMarried) {
      successorEligible = true;
      candidateName = `${personnel.spouse.fullName} (คู่สมรส)`;
    }

    // Heir Distribution (Spouse 50%, Children 25%, Parents 25%)
    const heirDistribution: {
      heirName: string;
      relationship: string;
      sharePercentage: number;
      allocatedLumpSum: number;
      allocatedMonthlyPension: number;
    }[] = [];

    if (personnel.heirs && personnel.heirs.length > 0) {
      for (const h of personnel.heirs) {
        heirDistribution.push({
          heirName: h.fullName,
          relationship: h.relationship,
          sharePercentage: h.allocationPercentage,
          allocatedLumpSum: Math.round(grandTotalLumpSum * (h.allocationPercentage / 100)),
          allocatedMonthlyPension: Math.round(grandTotalMonthlyPension * (h.allocationPercentage / 100)),
        });
      }
    } else {
      if (personnel.spouse?.isLegallyMarried) {
        heirDistribution.push({
          heirName: personnel.spouse.fullName,
          relationship: "SPOUSE_LEGAL",
          sharePercentage: 50,
          allocatedLumpSum: Math.round(grandTotalLumpSum * 0.5),
          allocatedMonthlyPension: Math.round(grandTotalMonthlyPension * 0.5),
        });
      }
      if (personnel.children && personnel.children.length > 0) {
        const perChild = 25 / personnel.children.length;
        for (const c of personnel.children) {
          heirDistribution.push({
            heirName: c.fullName,
            relationship: "CHILD_LEGITIMATE",
            sharePercentage: Number(perChild.toFixed(1)),
            allocatedLumpSum: Math.round(grandTotalLumpSum * (perChild / 100)),
            allocatedMonthlyPension: Math.round(grandTotalMonthlyPension * (perChild / 100)),
          });
        }
      }
      heirDistribution.push({
        heirName: "บิดา / มารดา ผู้ให้กำเนิด",
        relationship: "PARENTS",
        sharePercentage: 25,
        allocatedLumpSum: Math.round(grandTotalLumpSum * 0.25),
        allocatedMonthlyPension: Math.round(grandTotalMonthlyPension * 0.25),
      });
    }

    return {
      personnelSummary: {
        militaryId: personnel.militaryId,
        fullName: `${personnel.rankAbbr} ${personnel.firstName} ${personnel.lastName}`,
        rankWithAbbr: `${personnel.rankAbbr} ${personnel.rank}`,
        promotedRankWithAbbr: personnel.promotedRankAbbr
          ? `${personnel.promotedRankAbbr} (ปูนบำเหน็จ ${personnel.promotionSteps} ชั้น)`
          : "พล.อ.",
        lossTypeDescription: personnel.lossType,
        normalUnit: personnel.normalUnit,
        fieldUnit: personnel.fieldUnit || personnel.normalUnit,
        baseSalary: personnel.salary,
        promotedSalary: defaultPromotedSalary,
        totalServiceYears: totalYears,
      },
      grandTotalLumpSum,
      grandTotalMonthlyPension,
      grandTotalAnnualScholarship,
      nonMonetaryRightsCount,
      categories,
      heirDistribution,
      successorJobRight: {
        isEligible: successorEligible,
        candidateName,
        conditionText: successorEligible
          ? `มีสิทธิได้รับการบรรจุทดแทน 1 อัตรา ผู้มีคุณสมบัติ: ${candidateName || "ทายาทสายตรง"}`
          : "ไม่มีทายาทที่อยู่ในเกณฑ์อายุ 18-35 ปี",
      },
      calculatedAt: new Date().toISOString(),
    };
  }
}
