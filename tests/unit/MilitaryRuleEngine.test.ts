import { describe, it, expect } from "vitest";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { MilitaryPersonnelInput, RuleFormulaContext } from "@/core/domain/value-objects/military-types";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";
import { defaultMilitaryRules } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";

function buildContext(partial: Partial<RuleFormulaContext> = {}): RuleFormulaContext {
  return {
    salary: 30000,
    promotedSalary: 45000,
    serviceYears: 10,
    serviceYearsMultiplier: 0,
    totalServiceYears: 10,
    compensationAmount: 0,
    additionalPay: 0,
    promotionSteps: 7,
    childrenCount: 0,
    studyingChildrenCount: 0,
    multiplierFactor: 1,
    baseAmount: 0,
    ...partial,
  };
}

describe("MilitaryRuleEngine", () => {
  describe("derivePersonnelCategory", () => {
    it("should derive COMMISSIONED_OFFICER for officer ranks", () => {
      expect(MilitaryRuleEngine.derivePersonnelCategory("COLONEL", "พ.อ.")).toBe("COMMISSIONED_OFFICER");
      expect(MilitaryRuleEngine.derivePersonnelCategory("MAJOR", "พ.ต.")).toBe("COMMISSIONED_OFFICER");
      expect(MilitaryRuleEngine.derivePersonnelCategory("CAPTAIN", "ร.อ.")).toBe("COMMISSIONED_OFFICER");
    });

    it("should derive NON_COMMISSIONED_OFFICER for NCO ranks", () => {
      expect(MilitaryRuleEngine.derivePersonnelCategory("MASTER_SERGEANT_1ST", "จ.ส.อ.")).toBe("NON_COMMISSIONED_OFFICER");
      expect(MilitaryRuleEngine.derivePersonnelCategory("SERGEANT", "ส.อ.")).toBe("NON_COMMISSIONED_OFFICER");
    });

    it("should derive VOLUNTEER_RANGER for volunteer rangers", () => {
      expect(MilitaryRuleEngine.derivePersonnelCategory("VOLUNTEER_RANGER", "อส.ทพ.")).toBe("VOLUNTEER_RANGER");
    });

    it("should derive CONSCRIPT_SOLDIER for private / conscript ranks", () => {
      expect(MilitaryRuleEngine.derivePersonnelCategory("PRIVATE", "พลฯ")).toBe("CONSCRIPT_SOLDIER");
    });
  });

  describe("evaluateFormula", () => {
    it("should calculate mathematical expression substituting context variables", () => {
      const context = buildContext({
        salary: 30000,
        serviceYears: 10,
        promotionSteps: 7,
        promotedSalary: 45000,
      });

      const expr = "{PROMOTED_SALARY} * {PROMOTION_STEPS} * 0.5";
      const result = MilitaryRuleEngine.evaluateFormula(expr, context);
      // 45000 * 7 * 0.5 = 157,500
      expect(result).toBe(157500);
    });

    it("should handle formula tiers matching hospitalization days", () => {
      const rule: BenefitRuleDefinition = {
        id: "r1",
        ruleCode: "RULE-MORALE",
        ruleName: "เงินบำรุงขวัญ",
        category: "LUMP_SUM_PAYMENT" as BenefitRuleDefinition["category"],
        categoryName: "One-Time Lump Sum",
        categoryThaiName: "หมวด 1: รับเงินครั้งเดียว",
        description: "",
        legalBasis: "",
        paymentType: "ONE_TIME_LUMP_SUM",
        formulaType: "EXPRESSION",
        formulaExpression: "",
        multiplierFactor: 1,
        baseAmount: 10000,
        conditions: {
          allowedLossTypes: ["KIA_COMBAT_DEATH", "DUTY_DEATH", "SEVERE_WOUND_WIA", "MODERATE_INJURY", "TOTAL_PERMANENT_DISABILITY", "PARTIAL_DISABILITY", "ALL"],
        },
        formulaTiers: [
          { id: "t-test-death", label: "เสียชีวิต", lossTypes: ["KIA_COMBAT_DEATH", "DEATH"], amount: 40000 },
          { id: "t-test-inj-long", label: "บาดเจ็บ > 20 วัน", lossTypes: ["INJURY", "SEVERE_WOUND_WIA"], minDays: 21, amount: 20000 },
          { id: "t-test-inj-short", label: "บาดเจ็บ <= 20 วัน", lossTypes: ["INJURY", "SEVERE_WOUND_WIA"], maxDays: 20, amount: 10000 },
        ],
        isActive: true,
        priorityOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test Death tier
      const deathResult = MilitaryRuleEngine.evaluateFormula(
        "",
        buildContext({ lossType: "KIA_COMBAT_DEATH" }),
        rule
      );
      expect(deathResult).toBe(40000);

      // Test injury > 20 days
      const longHospitalStay = MilitaryRuleEngine.evaluateFormula(
        "",
        buildContext({ lossType: "SEVERE_WOUND_WIA", hospitalStayDays: 25 }),
        rule
      );
      expect(longHospitalStay).toBe(20000);

      // Test injury <= 20 days
      const shortStay = MilitaryRuleEngine.evaluateFormula(
        "",
        buildContext({ lossType: "SEVERE_WOUND_WIA", hospitalStayDays: 10 }),
        rule
      );
      expect(shortStay).toBe(10000);
    });
  });

  describe("Full Military Calculation (calculate)", () => {
    const mockPersonnel: MilitaryPersonnelInput = {
      militaryId: "1234567890",
      citizenId: "1100400289112",
      rank: "MAJOR",
      rankAbbr: "พ.ต.",
      firstName: "วีระพล",
      lastName: "กล้าหาญ",
      militaryBranch: "ROYAL_THAI_ARMY",
      abbreviatedPosition: "ผบ.ร้อย",
      normalUnit: "ร.19 พัน.1",
      salary: 32000,
      salaryLevel: "น.2",
      salaryStep: 15.5,
      compensationAmount: 0,
      additionalPay: 2500,
      appointmentDate: "2010-05-01",
      incidentDate: "2026-08-01",
      multiplierDate: "2020-01-01",
      serviceYearsNormal: 16,
      serviceYearsMultiplier: 6,
      totalServiceYears: 28,
      missionType: "COUNTER_INSURGENCY",
      actionType: "DIRECT_COMBAT",
      incidentType: "COMBAT_ENGAGEMENT",
      lossType: "KIA_COMBAT_DEATH",
      specialPensionType: "NORMAL_TIME",
      specialPensionTier: 7,
      promotionSteps: 7,
      promotedRank: "COLONEL",
      promotedRankAbbr: "พ.อ.",
      promotedSalary: 52000,
      heirs: [
        {
          nationalId: "1100400289112",
          fullName: "นาง สมร กล้าหาญ",
          relationship: "SPOUSE_LEGAL",
          allocationPercentage: 50,
        },
        {
          nationalId: "1100400289113",
          fullName: "ด.ช. ภูมิ กล้าหาญ",
          relationship: "CHILD_LEGITIMATE",
          allocationPercentage: 50,
        },
      ],
    };

    it("should compute categories: Lump sum, Monthly, Annual, and Non-Monetary", () => {
      const result = MilitaryRuleEngine.calculate(mockPersonnel, defaultMilitaryRules);

      expect(result).toBeDefined();
      expect(result.grandTotalLumpSum).toBeGreaterThan(0);
      expect(result.grandTotalMonthlyPension).toBeGreaterThan(0);
      expect(result.categories.LUMP_SUM_PAYMENT.items.length).toBeGreaterThan(0);
      expect(result.categories.MONTHLY_PAYMENT.items.length).toBeGreaterThan(0);
      expect(result.categories.NON_MONETARY_BENEFIT.items.length).toBeGreaterThan(0);
    });

    it("should correctly allocate shares among heirs", () => {
      const result = MilitaryRuleEngine.calculate(mockPersonnel, defaultMilitaryRules);

      expect(result.heirDistribution).toBeDefined();
      expect(result.heirDistribution.length).toBe(2);

      const totalPercentage = result.heirDistribution.reduce((sum, h) => sum + h.sharePercentage, 0);
      expect(totalPercentage).toBe(100);

      const spouse = result.heirDistribution.find((h) => h.relationship === "SPOUSE_LEGAL");
      expect(spouse?.sharePercentage).toBe(50);
      expect(spouse?.allocatedLumpSum).toBe(result.grandTotalLumpSum * 0.5);
    });
  });
});
