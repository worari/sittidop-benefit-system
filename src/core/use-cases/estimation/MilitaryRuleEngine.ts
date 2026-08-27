import {
  MilitaryPersonnelInput,
  RuleFormulaContext,
  EvaluatedBenefitItem,
  CategorySummaryResult,
  MilitaryBenefitCalculationResult,
  BenefitCategoryCode,
} from "@/core/domain/value-objects/military-types";
import { BenefitRuleDefinition, FormulaTierConfig } from "@/core/domain/entities/BenefitRule";

export class MilitaryRuleEngine {
  /**
   * Derives personnel category from rank if not explicitly provided
   */
  public static derivePersonnelCategory(rank: string, rankAbbr: string): string {
    const r = (rank || "").toUpperCase();
    const abbr = (rankAbbr || "").toLowerCase();

    if (
      r.includes("GENERAL") ||
      r.includes("COLONEL") ||
      r.includes("MAJOR") ||
      r.includes("CAPTAIN") ||
      r.includes("LIEUTENANT") ||
      abbr.includes("พล.") ||
      abbr.includes("พ.อ.") ||
      abbr.includes("พ.ท.") ||
      abbr.includes("พ.ต.") ||
      abbr.includes("ร.อ.") ||
      abbr.includes("ร.ท.") ||
      abbr.includes("ร.ต.")
    ) {
      return "COMMISSIONED_OFFICER";
    }

    if (
      r.includes("SERGEANT") ||
      r.includes("CORPORAL") ||
      abbr.includes("จ.ส.อ.") ||
      abbr.includes("จ.ส.ท.") ||
      abbr.includes("จ.ส.ต.") ||
      abbr.includes("ส.อ.") ||
      abbr.includes("ส.ท.") ||
      abbr.includes("ส.ต.")
    ) {
      return "NON_COMMISSIONED_OFFICER";
    }

    if (r.includes("RANGER") || abbr.includes("อส.ทพ") || abbr.includes("ทพ.")) {
      return "VOLUNTEER_RANGER";
    }

    if (r.includes("PRIVATE") || r.includes("CONSCRIPT") || abbr.includes("พลฯ") || abbr.includes("พลทหาร")) {
      return "CONSCRIPT_SOLDIER";
    }

    return "COMMISSIONED_OFFICER";
  }

  /**
   * Safely evaluates mathematical formula expression with substituted tokens
   * Uses a secure expression evaluator that prevents code injection
   * Implements multiple layers of security validation
   */
  public static evaluateFormula(
    expression: string,
    context: RuleFormulaContext,
    rule?: BenefitRuleDefinition
  ): number {
    // Configurable Benefit Tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทนที่กำหนดผ่านหน้าจัดการกฎเกณฑ์)
    // เช่น เงินบำรุงขวัญ: เสียชีวิต/ทุพพลภาพ 40,000 | บาดเจ็บพักรักษา <=20 วัน 10,000 | >20 วัน +10,000
    // Takes precedence over hardcoded logic and the expression whenever tiers are defined on the rule.
    if (rule?.formulaTiers && rule.formulaTiers.length > 0) {
      return this.evaluateFormulaTiers(rule.formulaTiers, context.lossType || "", context.hospitalStayDays || 0);
    }

    if (!expression || expression.trim() === "" || expression.includes("สิทธิ") || expression.includes("อัตรา")) {
      return context.baseAmount || 0;
    }

    // Special logic for Insurance rule (RULE-LUMP-INSURANCE)
    if (rule?.ruleCode === "RULE-LUMP-INSURANCE") {
      let insuranceBase = rule.baseAmount || 2000000;

      // Check Insurance Matrix if defined
      if (rule.insuranceMatrix && rule.insuranceMatrix.length > 0) {
        const matched = rule.insuranceMatrix.find((tier) => {
          const matchScope = tier.scope === "BOTH" || !context.benefitScope || tier.scope === context.benefitScope;
          const matchCause = tier.cause === "BOTH" || !context.actionCause || tier.cause === context.actionCause;
          const matchLoss = !tier.lossType || tier.lossType === context.lossType;
          return matchScope && matchCause && matchLoss;
        });
        if (matched) return matched.amount;
      }

      // Dynamic calculation based on 5 Dimensions:
      const isEnemyAction = context.actionCause === "ENEMY_ACTION" || context.lossType?.includes("KIA") || context.lossType?.includes("COMBAT");
      const isSouthernBorder = context.missionType === "SOUTHERN_BORDER" || context.missionType === "COUNTER_INSURGENCY";
      const isInjury = context.lossType === "SEVERE_WOUND_WIA" || context.lossType === "MODERATE_INJURY" || context.lossType === "INJURY";
      const isDisability = context.lossType === "TOTAL_PERMANENT_DISABILITY" || context.lossType === "PARTIAL_DISABILITY";

      if (isEnemyAction) {
        if (isInjury) {
          insuranceBase = context.lossType === "SEVERE_WOUND_WIA" ? 500000 : 250000;
        } else if (isDisability) {
          insuranceBase = isSouthernBorder ? 2000000 : 1800000;
        } else {
          // Death by Enemy Action in Field/Border
          insuranceBase = isSouthernBorder ? 2000000 : 1800000;
        }
      } else {
        // Non-Enemy Action (e.g. duty accident / illness)
        if (isInjury) {
          insuranceBase = 150000;
        } else if (isDisability) {
          insuranceBase = 1200000;
        } else {
          insuranceBase = 1000000;
        }
      }

      // Benefit scope multiplier adjustment if outside army co-insurance applies
      if (context.benefitScope === "OUTSIDE_ARMY") {
        insuranceBase = Math.round(insuranceBase * 0.5);
      }

      return insuranceBase;
    }

    // Special logic for Hospital Stay / Morale Grant rule (RULE-LUMP-HOSPITAL-STAY)
    if (rule?.ruleCode === "RULE-LUMP-HOSPITAL-STAY") {
      const isDeath =
        context.lossType === "KIA_COMBAT_DEATH" ||
        context.lossType === "DUTY_DEATH" ||
        (context.lossType || "").includes("DEATH");

      // Death case: เงินบำรุงขวัญกรณีเสียชีวิต 40,000 บาท
      if (isDeath) return 40000;

      const isInjury =
        context.lossType === "SEVERE_WOUND_WIA" ||
        context.lossType === "MODERATE_INJURY" ||
        context.lossType === "MINOR_INJURY" ||
        context.lossType === "TOTAL_PERMANENT_DISABILITY" ||
        context.lossType === "PARTIAL_DISABILITY" ||
        (context.lossType || "").includes("INJURY") ||
        (context.lossType || "").includes("DISABILITY") ||
        (context.lossType || "").includes("WOUND");

      const days = context.hospitalStayDays || 0;

      // Injury + hospitalized case
      if (isInjury && days > 0) {
        if (days <= 20) return 10000; // บาดเจ็บพักรักษาไม่เกิน 20 วัน รับ 10,000 บาท
        return 20000; // บาดเจ็บพักรักษาเกิน 20 วัน รับเพิ่ม 10,000 บาท รวม 20,000 บาท
      }

      return 0;
    }

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
      .replace(/{hospitalStayDays}/g, String(context.hospitalStayDays || 0))
      .replace(/{multiplierFactor}/g, String(context.multiplierFactor))
      .replace(/{baseAmount}/g, String(context.baseAmount));

    // Handle ternary / conditional operators safely
    if (parsed.includes("?") && parsed.includes(":")) {
      try {
        // Safe ternary evaluation using Function constructor with strict validation
        const sanitizedTernary = parsed.replace(/[^0-9+\-*/().? :\s]/g, "");
        const condResult = new Function(`return (${sanitizedTernary});`)();
        return isNaN(condResult) ? 0 : Math.round(condResult);
      } catch {
        return context.baseAmount || 0;
      }
    }

    const sanitized = parsed.replace(/[^0-9+\-*/().\s]/g, "");

    try {
      // Safe arithmetic calculation with additional validation
      const sanitizedExpr = sanitized.trim();
      if (!sanitizedExpr || sanitizedExpr.length === 0) {
        return context.baseAmount || 0;
      }

      // Additional security check: prevent potentially dangerous operations
      if (sanitizedExpr.includes("eval") || sanitizedExpr.includes("Function") ||
        sanitizedExpr.includes("require") || sanitizedExpr.includes("import")) {
        return context.baseAmount || 0;
      }

      // Enhanced security: validate expression contains only safe mathematical operations
      const safePattern = /^[0-9+\-*/().\s]+$/;
      if (!safePattern.test(sanitizedExpr)) {
        return context.baseAmount || 0;
      }

      // Additional validation: check for potentially dangerous patterns
      const dangerousPatterns = [
        /eval\(/,
        /Function\(/,
        /require\(/,
        /import\(/,
        /process\./,
        /global\./,
        /console\./,
        /Math\./,
        /Date\(/,
        /RegExp\(/,
        /new\s+\w+/,
        /\w+\s*=\s*\w+/,
        /\w+\s*\(/,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sanitizedExpr)) {
          return context.baseAmount || 0;
        }
      }

      // Final security check: ensure expression is a simple arithmetic expression
      // Only allow basic arithmetic operations: +, -, *, /, parentheses, and numbers
      const arithmeticPattern = /^[0-9+\-*/().\s]+$/;
      if (!arithmeticPattern.test(sanitizedExpr)) {
        return context.baseAmount || 0;
      }

      // Additional check: prevent division by zero in complex expressions
      if (sanitizedExpr.includes("/")) {
        // Simple check for division by zero pattern
        const divisionPattern = /\/\s*0\b/;
        if (divisionPattern.test(sanitizedExpr)) {
          return context.baseAmount || 0;
        }
      }

      // Final validation: ensure expression doesn't contain any suspicious characters
      const suspiciousChars = /[<>"'&;`$]/;
      if (suspiciousChars.test(sanitizedExpr)) {
        return context.baseAmount || 0;
      }

      const result = new Function(`return (${sanitizedExpr});`)();
      return isNaN(result) ? 0 : Math.round(result);
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates configurable benefit tiers (สูตร & กฎเกณฑ์ระดับเงินตอบแทน)
   *
   * Semantics:
   *  - A tier matches when its loss-type group AND hospital-stay day range cover the case.
   *  - Base tiers (isAdditional = false/undefined): the HIGHEST matching amount applies.
   *  - Additional tiers (isAdditional = true): ALL matching amounts are summed on top of the base,
   *    e.g. บาดเจ็บพักรักษาตัวเกิน 20 วัน รับเงินเพิ่มเติมอีก 10,000 บาท.
   *
   * Loss group keywords: "DEATH", "DISABILITY", "INJURY", "ALL" or exact loss-type codes.
   */
  public static evaluateFormulaTiers(
    tiers: FormulaTierConfig[],
    lossType: string,
    hospitalStayDays: number
  ): number {
    const lt = (lossType || "").toUpperCase();
    const days = hospitalStayDays || 0;

    const isDeath = lt.includes("DEATH") || lt.includes("KIA");
    const isDisability = lt.includes("DISABILITY");

    const matchesLossGroup = (groups?: string[]): boolean => {
      if (!groups || groups.length === 0) return true;
      if (groups.includes("ALL")) return true;
      return groups.some((g) => {
        const gu = String(g).toUpperCase();
        if (gu === "DEATH") return isDeath;
        if (gu === "DISABILITY") return isDisability;
        if (gu === "INJURY") return !isDeath && !isDisability;
        return lt === gu || lt.includes(gu);
      });
    };

    let baseAmount = 0;
    let hasBaseMatch = false;
    let additionalAmount = 0;

    for (const tier of tiers) {
      if (!matchesLossGroup(tier.lossTypes)) continue;

      const minOk = tier.minDays === undefined || days >= tier.minDays;
      const maxOk = tier.maxDays === undefined || days <= tier.maxDays;
      if (!minOk || !maxOk) continue;

      if (tier.isAdditional) {
        additionalAmount += tier.amount || 0;
      } else if (!hasBaseMatch || (tier.amount || 0) > baseAmount) {
        baseAmount = tier.amount || 0;
        hasBaseMatch = true;
      }
    }

    if (!hasBaseMatch && additionalAmount === 0) return 0;
    return Math.round(baseAmount + additionalAmount);
  }

  /**
   * Evaluates eligibility of a rule for given personnel across the 5 dimensions
   */
  public static checkEligibility(
    rule: BenefitRuleDefinition,
    personnel: MilitaryPersonnelInput
  ): { isEligible: boolean; notes: string[] } {
    if (!rule.isActive) {
      return { isEligible: false, notes: ["กฎเกณฑ์ปิดใช้งานอยู่"] };
    }

    const notes: string[] = [];

    // 1. Check Benefit Scope (ใน ทบ. / นอก ทบ.)
    if (rule.benefitScope && rule.benefitScope !== "BOTH" && personnel.benefitScope) {
      if (personnel.benefitScope !== "BOTH" && rule.benefitScope !== personnel.benefitScope) {
        const scopeLabel = rule.benefitScope === "IN_ARMY" ? "ใน ทบ." : "นอก ทบ.";
        return { isEligible: false, notes: [`ใช้สำหรับสิทธิเฉพาะ ${scopeLabel}`] };
      }
    }

    // 2. Check Action Cause (ข้าศึก / มิใช่ข้าศึก)
    if (rule.causeType && rule.causeType !== "BOTH" && personnel.actionCause) {
      if (personnel.actionCause !== "BOTH" && rule.causeType !== personnel.actionCause) {
        const causeLabel = rule.causeType === "ENEMY_ACTION" ? "การกระทำของข้าศึก" : "มิใช่การกระทำของข้าศึก";
        return { isEligible: false, notes: [`ใช้สำหรับกรณี ${causeLabel}`] };
      }
    }

    // 3. Check Mission Type
    if (rule.conditions?.allowedMissions && rule.conditions.allowedMissions.length > 0) {
      if (personnel.missionType && !rule.conditions.allowedMissions.includes("ALL")) {
        if (!rule.conditions.allowedMissions.includes(personnel.missionType)) {
          return { isEligible: false, notes: [`ไม่ตรงตามประเภทภารกิจที่กำหนด (${personnel.missionType})`] };
        }
      }
    }

    // 4. Check Personnel Category
    const derivedCategory = personnel.personnelCategory || this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr);
    if (rule.conditions?.allowedPersonnelCategories && rule.conditions.allowedPersonnelCategories.length > 0) {
      if (!rule.conditions.allowedPersonnelCategories.includes("ALL")) {
        if (!rule.conditions.allowedPersonnelCategories.includes(derivedCategory)) {
          return { isEligible: false, notes: [`ไม่ตรงตามกลุ่มประเภทกำลังพล (${derivedCategory})`] };
        }
      }
    }

    // 5. Check Loss Type - ENHANCED for Live Estimator filtering
    if (rule.conditions?.allowedLossTypes && rule.conditions.allowedLossTypes.length > 0) {
      if (!rule.conditions.allowedLossTypes.includes("ALL")) {
        const normLoss = personnel.lossType;
        const isMatched = rule.conditions.allowedLossTypes.some(
          (t) => t === normLoss || (normLoss.includes("KIA") && t.includes("DEATH")) || (normLoss.includes("DISABILITY") && t.includes("DISABILITY"))
        );
        if (!isMatched) {
          return { isEligible: false, notes: [`ไม่ตรงตามประเภทความสูญเสีย (${personnel.lossType})`] };
        }
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

    // Check Hospital Stay / Morale Grant Rule - ENHANCED for Live Estimator
    if (rule.ruleCode === "RULE-LUMP-HOSPITAL-STAY") {
      const isDeath =
        personnel.lossType === "KIA_COMBAT_DEATH" ||
        personnel.lossType === "DUTY_DEATH" ||
        personnel.lossType?.includes("DEATH");

      // Amount derived from configurable Benefit Tiers when defined (fallback: legacy fixed rates)
      const tierAmount = (stayDays: number): number =>
        rule.formulaTiers && rule.formulaTiers.length > 0
          ? this.evaluateFormulaTiers(rule.formulaTiers, personnel.lossType, stayDays)
          : stayDays <= 20
            ? 10000
            : 20000;
      const fmtThb = (n: number) => n.toLocaleString("en-US");

      // Death case: เงินบำรุงขวัญกรณีเสียชีวิต (ค่าเริ่มต้น 40,000 บาท ตามระดับเงินที่กำหนดในกฎเกณฑ์)
      if (isDeath) {
        return { isEligible: true, notes: [`กรณีเสียชีวิต ได้รับเงินบำรุงขวัญ ${fmtThb(tierAmount(0))} บาท`] };
      }

      const isInjury =
        personnel.lossType === "SEVERE_WOUND_WIA" ||
        personnel.lossType === "MODERATE_INJURY" ||
        personnel.lossType === "MINOR_INJURY" ||
        personnel.lossType === "TOTAL_PERMANENT_DISABILITY" ||
        personnel.lossType === "PARTIAL_DISABILITY" ||
        personnel.lossType?.includes("INJURY") ||
        personnel.lossType?.includes("DISABILITY") ||
        personnel.lossType?.includes("WOUND");

      let days = personnel.hospitalStayDays || 0;
      if (!days && personnel.hospitalAdmissionDate && personnel.hospitalDischargeDate) {
        try {
          const d1 = new Date(personnel.hospitalAdmissionDate);
          const d2 = new Date(personnel.hospitalDischargeDate);
          const diff = Math.abs(d2.getTime() - d1.getTime());
          days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        } catch {
          days = 0;
        }
      }

      if (!isInjury) {
        return { isEligible: false, notes: ["กฎเกณฑ์นี้ใช้สำหรับกรณีเสียชีวิตหรือบาดเจ็บจากการปฏิบัติหน้าที่"] };
      }

      if (days <= 0) {
        return { isEligible: false, notes: ["กรณีบาดเจ็บต้องมีประวัติหรือระยะเวลาพักรักษาตัวในโรงพยาบาล"] };
      }

      if (days <= 20) {
        return { isEligible: true, notes: [`บาดเจ็บพักรักษาพยาบาล ${days} วัน (ไม่เกิน 20 วัน ได้รับ ${fmtThb(tierAmount(days))} บาท)`] };
      } else {
        return { isEligible: true, notes: [`บาดเจ็บพักรักษาพยาบาล ${days} วัน (เกิน 20 วัน รับเงินเพิ่มเติม รวม ${fmtThb(tierAmount(days))} บาท)`] };
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
   * Filters rules by specific loss types for Live Estimator
   * Provides enhanced filtering for death, disability, and injury cases
   */
  public static filterRulesByLossType(
    rules: BenefitRuleDefinition[],
    lossType: string
  ): {
    deathCases: BenefitRuleDefinition[];
    disabilityCases: BenefitRuleDefinition[];
    injuryCases: BenefitRuleDefinition[];
    otherCases: BenefitRuleDefinition[];
    totalEligible: number;
  } {
    const deathCases: BenefitRuleDefinition[] = [];
    const disabilityCases: BenefitRuleDefinition[] = [];
    const injuryCases: BenefitRuleDefinition[] = [];
    const otherCases: BenefitRuleDefinition[] = [];

    for (const rule of rules) {
      if (!rule.isActive) continue;

      const isDeath = lossType.includes("DEATH") || lossType.includes("KIA");
      const isDisability = lossType.includes("DISABILITY") || lossType.includes("PERMANENT") || lossType.includes("PARTIAL");
      const isInjury = lossType.includes("INJURY") || lossType.includes("WOUND") || lossType.includes("SEVERE") || lossType.includes("MODERATE") || lossType.includes("MINOR") ||
        lossType.includes("SEVERE_WOUND_WIA") || lossType.includes("MODERATE_INJURY") || lossType.includes("MINOR_INJURY") ||
        lossType.includes("TOTAL_PERMANENT_DISABILITY") || lossType.includes("PARTIAL_DISABILITY") ||
        lossType.includes("INJURY_SEVERE") || lossType.includes("INJURY_MODERATE") || lossType.includes("INJURY_MINOR");

      // Check if rule is eligible for this loss type
      const tempPersonnel: MilitaryPersonnelInput = {
        militaryId: "",
        citizenId: "",
        rank: "",
        rankAbbr: "",
        firstName: "",
        lastName: "",
        militaryBranch: "",
        lossType: lossType,
        salary: 0,
        serviceYearsNormal: 0,
        totalServiceYears: 0,
        missionType: "",
        benefitScope: "IN_ARMY",
        actionCause: isDeath ? "ENEMY_ACTION" : "NON_ENEMY_ACTION",
        personnelCategory: "COMMISSIONED_OFFICER",
        normalUnit: "",
        fieldUnit: "",
        salaryLevel: "",
        salaryStep: 0,
        compensation: "",
        compensationLevel: "",
        compensationAmount: 0,
        additionalPay: 0,
        appointmentDate: "",
        incidentDate: "",
        multiplierDate: "",
        specialPensionType: undefined,
        specialPensionTier: undefined,
        rankAppointmentTo: "",
        salaryLevelAdjustment: "",
        promotionSteps: 7,
        promotedRank: "",
        promotedRankAbbr: "",
        promotedSalary: 0,
        hospitalAdmissionDate: "",
        hospitalDischargeDate: "",
        hospitalStayDays: 0,
        spouse: null,
        children: [],
        heirs: [],
        serviceMonthsNormal: 0,
        serviceDaysNormal: 0,
        serviceYearsMultiplier: 0,
        serviceMonthsMultiplier: 0,
        serviceDaysMultiplier: 0,
        totalServiceMonths: 0,
        totalServiceDays: 0,
        actionType: "",
        incidentType: "",
        abbreviatedPosition: "",
      };

      const eligibility = this.checkEligibility(rule, tempPersonnel);

      if (eligibility.isEligible) {
        if (isDeath) {
          deathCases.push(rule);
        } else if (isDisability) {
          disabilityCases.push(rule);
        } else if (isInjury) {
          injuryCases.push(rule);
        } else {
          otherCases.push(rule);
        }
      }
    }

    return {
      deathCases,
      disabilityCases,
      injuryCases,
      otherCases,
      totalEligible: deathCases.length + disabilityCases.length + injuryCases.length + otherCases.length,
    };
  }

  /**
   * Gets enhanced calculation results for specific loss types
   * Provides detailed breakdown for Live Estimator UI
   */
  public static calculateForLossType(
    personnel: MilitaryPersonnelInput,
    rules: BenefitRuleDefinition[],
    lossType: string
  ): {
    personnelSummary: any;
    deathBenefits: any;
    disabilityBenefits: any;
    injuryBenefits: any;
    otherBenefits: any;
    totalBenefits: number;
    lossTypeBreakdown: {
      death: number;
      disability: number;
      injury: number;
      other: number;
    };
  } {
    const filteredRules = this.filterRulesByLossType(rules, lossType);
    const baseCalculation = this.calculate(personnel, rules);

    // Calculate benefits for each category
    const deathBenefits = filteredRules.deathCases.map(rule => {
      const eligibility = this.checkEligibility(rule, personnel);
      const amount = eligibility.isEligible ? this.evaluateFormula(rule.formulaExpression, {
        salary: personnel.salary,
        promotedSalary: personnel.promotedSalary || personnel.salary * 1.08,
        serviceYears: personnel.serviceYearsNormal,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        totalServiceYears: personnel.totalServiceYears || personnel.serviceYearsNormal,
        compensationAmount: personnel.compensationAmount || 0,
        additionalPay: personnel.additionalPay || 0,
        promotionSteps: personnel.specialPensionTier || personnel.promotionSteps || 7,
        childrenCount: personnel.children?.length || 0,
        studyingChildrenCount: personnel.children?.filter(c => c.isStudying).length || 0,
        multiplierFactor: rule.multiplierFactor,
        baseAmount: rule.baseAmount,
        benefitScope: personnel.benefitScope || "IN_ARMY",
        actionCause: personnel.actionCause || (personnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
        missionType: personnel.missionType,
        personnelCategory: personnel.personnelCategory || this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr),
        lossType: personnel.lossType,
        hospitalStayDays: personnel.hospitalStayDays || 0,
      }, rule) : 0;

      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        amount: amount,
        eligibilityNotes: eligibility.notes,
      };
    });

    const disabilityBenefits = filteredRules.disabilityCases.map(rule => {
      const eligibility = this.checkEligibility(rule, personnel);
      const amount = eligibility.isEligible ? this.evaluateFormula(rule.formulaExpression, {
        salary: personnel.salary,
        promotedSalary: personnel.promotedSalary || personnel.salary * 1.08,
        serviceYears: personnel.serviceYearsNormal,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        totalServiceYears: personnel.totalServiceYears || personnel.serviceYearsNormal,
        compensationAmount: personnel.compensationAmount || 0,
        additionalPay: personnel.additionalPay || 0,
        promotionSteps: personnel.specialPensionTier || personnel.promotionSteps || 7,
        childrenCount: personnel.children?.length || 0,
        studyingChildrenCount: personnel.children?.filter(c => c.isStudying).length || 0,
        multiplierFactor: rule.multiplierFactor,
        baseAmount: rule.baseAmount,
        benefitScope: personnel.benefitScope || "IN_ARMY",
        actionCause: personnel.actionCause || (personnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
        missionType: personnel.missionType,
        personnelCategory: personnel.personnelCategory || this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr),
        lossType: personnel.lossType,
        hospitalStayDays: personnel.hospitalStayDays || 0,
      }, rule) : 0;

      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        amount: amount,
        eligibilityNotes: eligibility.notes,
      };
    });

    const injuryBenefits = filteredRules.injuryCases.map(rule => {
      const eligibility = this.checkEligibility(rule, personnel);
      const amount = eligibility.isEligible ? this.evaluateFormula(rule.formulaExpression, {
        salary: personnel.salary,
        promotedSalary: personnel.promotedSalary || personnel.salary * 1.08,
        serviceYears: personnel.serviceYearsNormal,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        totalServiceYears: personnel.totalServiceYears || personnel.serviceYearsNormal,
        compensationAmount: personnel.compensationAmount || 0,
        additionalPay: personnel.additionalPay || 0,
        promotionSteps: personnel.specialPensionTier || personnel.promotionSteps || 7,
        childrenCount: personnel.children?.length || 0,
        studyingChildrenCount: personnel.children?.filter(c => c.isStudying).length || 0,
        multiplierFactor: rule.multiplierFactor,
        baseAmount: rule.baseAmount,
        benefitScope: personnel.benefitScope || "IN_ARMY",
        actionCause: personnel.actionCause || (personnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
        missionType: personnel.missionType,
        personnelCategory: personnel.personnelCategory || this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr),
        lossType: personnel.lossType,
        hospitalStayDays: personnel.hospitalStayDays || 0,
      }, rule) : 0;

      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        amount: amount,
        eligibilityNotes: eligibility.notes,
      };
    });

    const otherBenefits = filteredRules.otherCases.map(rule => {
      const eligibility = this.checkEligibility(rule, personnel);
      const amount = eligibility.isEligible ? this.evaluateFormula(rule.formulaExpression, {
        salary: personnel.salary,
        promotedSalary: personnel.promotedSalary || personnel.salary * 1.08,
        serviceYears: personnel.serviceYearsNormal,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        totalServiceYears: personnel.totalServiceYears || personnel.serviceYearsNormal,
        compensationAmount: personnel.compensationAmount || 0,
        additionalPay: personnel.additionalPay || 0,
        promotionSteps: personnel.specialPensionTier || personnel.promotionSteps || 7,
        childrenCount: personnel.children?.length || 0,
        studyingChildrenCount: personnel.children?.filter(c => c.isStudying).length || 0,
        multiplierFactor: rule.multiplierFactor,
        baseAmount: rule.baseAmount,
        benefitScope: personnel.benefitScope || "IN_ARMY",
        actionCause: personnel.actionCause || (personnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
        missionType: personnel.missionType,
        personnelCategory: personnel.personnelCategory || this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr),
        lossType: personnel.lossType,
        hospitalStayDays: personnel.hospitalStayDays || 0,
      }, rule) : 0;

      return {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        amount: amount,
        eligibilityNotes: eligibility.notes,
      };
    });

    const deathTotal = deathBenefits.reduce((sum, benefit) => sum + benefit.amount, 0);
    const disabilityTotal = disabilityBenefits.reduce((sum, benefit) => sum + benefit.amount, 0);
    const injuryTotal = injuryBenefits.reduce((sum, benefit) => sum + benefit.amount, 0);
    const otherTotal = otherBenefits.reduce((sum, benefit) => sum + benefit.amount, 0);

    return {
      personnelSummary: baseCalculation.personnelSummary,
      deathBenefits,
      disabilityBenefits,
      injuryBenefits,
      otherBenefits,
      totalBenefits: deathTotal + disabilityTotal + injuryTotal + otherTotal,
      lossTypeBreakdown: {
        death: deathTotal,
        disability: disabilityTotal,
        injury: injuryTotal,
        other: otherTotal,
      },
    };
  }

  /**
   * Build empty category result map
   */
  private static buildEmptyCategories(): Record<BenefitCategoryCode, CategorySummaryResult> {
    const categoryDefinitions: Record<
      BenefitCategoryCode,
      { name: string; thaiName: string; desc: string }
    > = {
      [BenefitCategoryCode.LUMP_SUM_PAYMENT]: {
        name: "One-Time Lump Sum Payment",
        thaiName: "หมวด 1: รับเงินครั้งเดียว",
        desc: "เงินก้อนจ่ายครั้งเดียว เช่น บำเหน็จตกทอด, ชดเชย พ.ร.บ. สงเคราะห์ 30 เท่า, ประกันชีวิตทหาร, ปูนบำเหน็จ และเงินกองทุน ทบ.",
      },
      [BenefitCategoryCode.MONTHLY_PAYMENT]: {
        name: "Monthly Payment",
        thaiName: "หมวด 2: รับเงินรายเดือน",
        desc: "เงินบำนาญพิเศษรายเดือนจ่ายตลอดชีพแก่ทายาท และเงินเลี้ยงชีพผู้ปลดพิการทุพพลภาพ ทบ.",
      },
      [BenefitCategoryCode.ANNUAL_PAYMENT]: {
        name: "Annual Payment",
        thaiName: "หมวด 3: รับเงินรายปี",
        desc: "ทุนการศึกษาต่อเนื่องรายปีสำหรับบุตรกำลังพลระดับประถม มัธยม และอุดมศึกษา",
      },
      [BenefitCategoryCode.NON_MONETARY_BENEFIT]: {
        name: "Non-Monetary Rights",
        thaiName: "หมวด 4: สิทธิมิใช่ตัวเงิน",
        desc: "สิทธิการบรรจุทายาททดแทน 1 อัตรา, สิทธิการรักษาพยาบาล รพ.ค่าย, และสิทธิขอพระราชทานเหรียญเกียรติยศ",
      },
    };

    return {
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
  }

  /**
   * Calculate hospital stay days from admission/discharge dates.
   */
  private static computeHospitalStayDays(personnel: MilitaryPersonnelInput): number {
    if (personnel.hospitalStayDays) return personnel.hospitalStayDays;
    if (!personnel.hospitalAdmissionDate || !personnel.hospitalDischargeDate) return 0;
    try {
      const d1 = new Date(personnel.hospitalAdmissionDate);
      const d2 = new Date(personnel.hospitalDischargeDate);
      const diff = Math.abs(d2.getTime() - d1.getTime());
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  }

  /**
   * Execute calculation for a single benefit scope.
   */
  public static calculateForScope(
    personnel: MilitaryPersonnelInput,
    rules: BenefitRuleDefinition[],
    scope: "IN_ARMY" | "OUTSIDE_ARMY"
  ): {
    categories: Record<BenefitCategoryCode, CategorySummaryResult>;
    grandTotalLumpSum: number;
    grandTotalMonthlyPension: number;
    grandTotalAnnualScholarship: number;
    nonMonetaryRightsCount: number;
  } {
    const scopedPersonnel = { ...personnel, benefitScope: scope };
    const defaultPromotedSalary =
      scopedPersonnel.promotedSalary ||
      Math.round(scopedPersonnel.salary * (1 + (scopedPersonnel.specialPensionTier || scopedPersonnel.promotionSteps || 7) * 0.08));

    const totalYears =
      scopedPersonnel.totalServiceYears ||
      scopedPersonnel.serviceYearsNormal + (scopedPersonnel.serviceYearsMultiplier || 0);

    const studyingCount =
      scopedPersonnel.children?.filter((c) => c.isStudying).length || 0;

    const derivedCategory =
      scopedPersonnel.personnelCategory ||
      this.derivePersonnelCategory(scopedPersonnel.rank, scopedPersonnel.rankAbbr);

    const categories = this.buildEmptyCategories();
    const computedStayDays = this.computeHospitalStayDays(scopedPersonnel);

    const context: RuleFormulaContext = {
      salary: scopedPersonnel.salary,
      promotedSalary: defaultPromotedSalary,
      serviceYears: scopedPersonnel.serviceYearsNormal,
      serviceYearsMultiplier: scopedPersonnel.serviceYearsMultiplier || 0,
      totalServiceYears: totalYears,
      compensationAmount: scopedPersonnel.compensationAmount || 0,
      additionalPay: scopedPersonnel.additionalPay || 0,
      promotionSteps: scopedPersonnel.specialPensionTier || scopedPersonnel.promotionSteps || 7,
      childrenCount: scopedPersonnel.children?.length || 0,
      studyingChildrenCount: studyingCount,
      multiplierFactor: 1,
      baseAmount: 0,
      benefitScope: scope,
      actionCause: scopedPersonnel.actionCause || (scopedPersonnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
      missionType: scopedPersonnel.missionType,
      personnelCategory: derivedCategory,
      lossType: scopedPersonnel.lossType,
      hospitalStayDays: computedStayDays,
    };

    const sortedRules = [...rules].sort((a, b) => (a.priorityOrder || 0) - (b.priorityOrder || 0));

    for (const rule of sortedRules) {
      const eligibility = this.checkEligibility(rule, scopedPersonnel);
      let calculatedAmount = 0;

      if (eligibility.isEligible) {
        context.multiplierFactor = rule.multiplierFactor;
        context.baseAmount = rule.baseAmount;
        calculatedAmount = this.evaluateFormula(rule.formulaExpression, context, rule);

        if (rule.minAmount !== undefined && calculatedAmount < rule.minAmount) {
          calculatedAmount = rule.minAmount;
        }
        if (rule.maxAmount !== undefined && calculatedAmount > rule.maxAmount) {
          calculatedAmount = rule.maxAmount;
        }
      }

      const item: EvaluatedBenefitItem = {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        categoryName: rule.categoryThaiName || rule.categoryName,
        isEligible: eligibility.isEligible,
        amount: calculatedAmount,
        paymentType: rule.paymentType,
        formulaUsed: rule.formulaExpression,
        legalBasis: rule.legalBasis,
        eligibilityNotes: eligibility.notes,
        benefitScope: rule.benefitScope || "BOTH",
      };

      if (categories[rule.category]) {
        categories[rule.category].items.push(item);
        if (eligibility.isEligible) {
          categories[rule.category].totalAmount += calculatedAmount;
          categories[rule.category].itemCount += 1;
        }
      }
    }

    return {
      categories,
      grandTotalLumpSum: categories[BenefitCategoryCode.LUMP_SUM_PAYMENT].totalAmount,
      grandTotalMonthlyPension: categories[BenefitCategoryCode.MONTHLY_PAYMENT].totalAmount,
      grandTotalAnnualScholarship: categories[BenefitCategoryCode.ANNUAL_PAYMENT].totalAmount,
      nonMonetaryRightsCount: categories[BenefitCategoryCode.NON_MONETARY_BENEFIT].itemCount,
    };
  }

  /**
   * Executes calculation across all 4 categories.
   * When benefitScope is BOTH, returns a side-by-side IN_ARMY vs OUTSIDE_ARMY comparison.
   */
  public static calculate(
    personnel: MilitaryPersonnelInput,
    rules: BenefitRuleDefinition[]
  ): MilitaryBenefitCalculationResult {
    const defaultPromotedSalary =
      personnel.promotedSalary ||
      Math.round(personnel.salary * (1 + (personnel.specialPensionTier || personnel.promotionSteps || 7) * 0.08));

    const totalYears =
      personnel.totalServiceYears ||
      personnel.serviceYearsNormal + (personnel.serviceYearsMultiplier || 0);

    const studyingCount =
      personnel.children?.filter((c) => c.isStudying).length || 0;

    const derivedCategory =
      personnel.personnelCategory ||
      this.derivePersonnelCategory(personnel.rank, personnel.rankAbbr);

    const categories = this.buildEmptyCategories();
    const computedStayDays = this.computeHospitalStayDays(personnel);

    const context: RuleFormulaContext = {
      salary: personnel.salary,
      promotedSalary: defaultPromotedSalary,
      serviceYears: personnel.serviceYearsNormal,
      serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
      totalServiceYears: totalYears,
      compensationAmount: personnel.compensationAmount || 0,
      additionalPay: personnel.additionalPay || 0,
      promotionSteps: personnel.specialPensionTier || personnel.promotionSteps || 7,
      childrenCount: personnel.children?.length || 0,
      studyingChildrenCount: studyingCount,
      multiplierFactor: 1,
      baseAmount: 0,
      benefitScope: personnel.benefitScope || "IN_ARMY",
      actionCause: personnel.actionCause || (personnel.lossType?.includes("KIA") ? "ENEMY_ACTION" : "NON_ENEMY_ACTION"),
      missionType: personnel.missionType,
      personnelCategory: derivedCategory,
      lossType: personnel.lossType,
      hospitalStayDays: computedStayDays,
    };

    const sortedRules = [...rules].sort((a, b) => (a.priorityOrder || 0) - (b.priorityOrder || 0));

    for (const rule of sortedRules) {
      const eligibility = this.checkEligibility(rule, personnel);
      let calculatedAmount = 0;

      if (eligibility.isEligible) {
        context.multiplierFactor = rule.multiplierFactor;
        context.baseAmount = rule.baseAmount;
        calculatedAmount = this.evaluateFormula(rule.formulaExpression, context, rule);

        if (rule.minAmount !== undefined && calculatedAmount < rule.minAmount) {
          calculatedAmount = rule.minAmount;
        }
        if (rule.maxAmount !== undefined && calculatedAmount > rule.maxAmount) {
          calculatedAmount = rule.maxAmount;
        }
      }

      const item: EvaluatedBenefitItem = {
        ruleId: rule.id,
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        category: rule.category,
        categoryName: rule.categoryThaiName || rule.categoryName,
        isEligible: eligibility.isEligible,
        amount: calculatedAmount,
        paymentType: rule.paymentType,
        formulaUsed: rule.formulaExpression,
        legalBasis: rule.legalBasis,
        eligibilityNotes: eligibility.notes,
        benefitScope: rule.benefitScope || "BOTH",
      };

      if (categories[rule.category]) {
        categories[rule.category].items.push(item);
        if (eligibility.isEligible) {
          categories[rule.category].totalAmount += calculatedAmount;
          categories[rule.category].itemCount += 1;
        }
      }
    }

    const grandTotalLumpSum = categories[BenefitCategoryCode.LUMP_SUM_PAYMENT].totalAmount;
    const grandTotalMonthlyPension = categories[BenefitCategoryCode.MONTHLY_PAYMENT].totalAmount;
    const grandTotalAnnualScholarship = categories[BenefitCategoryCode.ANNUAL_PAYMENT].totalAmount;
    const nonMonetaryRightsCount = categories[BenefitCategoryCode.NON_MONETARY_BENEFIT].itemCount;

    // Heir Distribution calculation
    const heirDistribution = (personnel.heirs || []).map((heir) => {
      const pct = (heir.allocationPercentage || 0) / 100;
      return {
        heirName: heir.fullName,
        relationship: heir.relationship,
        sharePercentage: heir.allocationPercentage || 0,
        allocatedLumpSum: Math.round(grandTotalLumpSum * pct),
        allocatedMonthlyPension: Math.round(grandTotalMonthlyPension * pct),
      };
    });

    const isSuccessorEligible =
      personnel.lossType === "KIA_COMBAT_DEATH" ||
      personnel.lossType === "TOTAL_PERMANENT_DISABILITY" ||
      personnel.lossType === "DUTY_DEATH";

    // Build scope comparison when scope is BOTH
    let scopeComparison: MilitaryBenefitCalculationResult["scopeComparison"] = undefined;
    if (personnel.benefitScope === "BOTH") {
      const inArmyResult = this.calculateForScope(personnel, rules, "IN_ARMY");
      const outsideResult = this.calculateForScope(personnel, rules, "OUTSIDE_ARMY");

      scopeComparison = {
        inArmy: {
          scope: "IN_ARMY",
          scopeThaiName: "ใน ทบ.",
          lumpSumTotal: inArmyResult.grandTotalLumpSum,
          monthlyPensionTotal: inArmyResult.grandTotalMonthlyPension,
          annualScholarshipTotal: inArmyResult.grandTotalAnnualScholarship,
          nonMonetaryCount: inArmyResult.nonMonetaryRightsCount,
          categoryTotals: {
            [BenefitCategoryCode.LUMP_SUM_PAYMENT]: inArmyResult.categories[BenefitCategoryCode.LUMP_SUM_PAYMENT].totalAmount,
            [BenefitCategoryCode.MONTHLY_PAYMENT]: inArmyResult.categories[BenefitCategoryCode.MONTHLY_PAYMENT].totalAmount,
            [BenefitCategoryCode.ANNUAL_PAYMENT]: inArmyResult.categories[BenefitCategoryCode.ANNUAL_PAYMENT].totalAmount,
            [BenefitCategoryCode.NON_MONETARY_BENEFIT]: inArmyResult.categories[BenefitCategoryCode.NON_MONETARY_BENEFIT].totalAmount,
          },
          items: Object.values(inArmyResult.categories).flatMap((c) => c.items),
        },
        outsideArmy: {
          scope: "OUTSIDE_ARMY",
          scopeThaiName: "นอก ทบ.",
          lumpSumTotal: outsideResult.grandTotalLumpSum,
          monthlyPensionTotal: outsideResult.grandTotalMonthlyPension,
          annualScholarshipTotal: outsideResult.grandTotalAnnualScholarship,
          nonMonetaryCount: outsideResult.nonMonetaryRightsCount,
          categoryTotals: {
            [BenefitCategoryCode.LUMP_SUM_PAYMENT]: outsideResult.categories[BenefitCategoryCode.LUMP_SUM_PAYMENT].totalAmount,
            [BenefitCategoryCode.MONTHLY_PAYMENT]: outsideResult.categories[BenefitCategoryCode.MONTHLY_PAYMENT].totalAmount,
            [BenefitCategoryCode.ANNUAL_PAYMENT]: outsideResult.categories[BenefitCategoryCode.ANNUAL_PAYMENT].totalAmount,
            [BenefitCategoryCode.NON_MONETARY_BENEFIT]: outsideResult.categories[BenefitCategoryCode.NON_MONETARY_BENEFIT].totalAmount,
          },
          items: Object.values(outsideResult.categories).flatMap((c) => c.items),
        },
        recommendedScope:
          inArmyResult.grandTotalLumpSum >= outsideResult.grandTotalLumpSum ? "IN_ARMY" : "OUTSIDE_ARMY",
        differenceLumpSum: Math.abs(inArmyResult.grandTotalLumpSum - outsideResult.grandTotalLumpSum),
      };
    }

    return {
      personnelSummary: {
        militaryId: personnel.militaryId,
        fullName: `${personnel.rankAbbr} ${personnel.firstName} ${personnel.lastName}`,
        rankWithAbbr: `${personnel.rankAbbr} (${personnel.rank})`,
        promotedRankWithAbbr: personnel.promotedRankAbbr
          ? `${personnel.promotedRankAbbr} (ปูนบำเหน็จพิเศษ ${personnel.specialPensionTier || personnel.promotionSteps || 7} ชั้น)`
          : `ปูนบำเหน็จ ${personnel.specialPensionTier || personnel.promotionSteps || 7} ชั้น`,
        lossTypeDescription: personnel.lossType,
        normalUnit: personnel.normalUnit,
        fieldUnit: personnel.fieldUnit || personnel.normalUnit,
        baseSalary: personnel.salary,
        promotedSalary: defaultPromotedSalary,
        totalServiceYears: totalYears,
        totalServiceMonths: personnel.totalServiceMonths || 0,
        totalServiceDays: personnel.totalServiceDays || 0,
        serviceYearsNormal: personnel.serviceYearsNormal,
        serviceMonthsNormal: personnel.serviceMonthsNormal || 0,
        serviceDaysNormal: personnel.serviceDaysNormal || 0,
        serviceYearsMultiplier: personnel.serviceYearsMultiplier || 0,
        serviceMonthsMultiplier: personnel.serviceMonthsMultiplier || 0,
        serviceDaysMultiplier: personnel.serviceDaysMultiplier || 0,
        appointmentDate: personnel.appointmentDate,
        incidentDate: personnel.incidentDate,
        multiplierDate: personnel.multiplierDate,
        specialPensionType: personnel.specialPensionType,
        specialPensionTier: personnel.specialPensionTier,
        rankAppointmentTo: personnel.rankAppointmentTo,
        salaryLevelAdjustment: personnel.salaryLevelAdjustment,
        compensationLevel: personnel.compensationLevel,
      },
      grandTotalLumpSum,
      grandTotalMonthlyPension,
      grandTotalAnnualScholarship,
      nonMonetaryRightsCount,
      categories,
      heirDistribution,
      successorJobRight: {
        isEligible: isSuccessorEligible,
        candidateName: personnel.children?.[0]?.fullName || personnel.spouse?.fullName || "ทายาทลำดับที่ 1",
        conditionText: isSuccessorEligible
          ? "มีสิทธิได้รับการบรรจุทดแทน 1 อัตรา ตามเกณฑ์เสียชีวิต/ทุพพลภาพจากการรบและปฏิบัติราชการสนาม (กองทัพบก)"
          : "ไม่ตรงตามเงื่อนไขการปูนบำเหน็จบรรจุทายาททดแทน",
      },
      scopeComparison,
      calculatedAt: new Date().toISOString(),
    };
  }
}
