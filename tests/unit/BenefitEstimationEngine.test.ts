import { describe, it, expect } from "vitest";
import { BenefitEstimationEngine } from "@/core/use-cases/estimation/BenefitEstimationEngine";
import { EstimateInput } from "@/core/domain/value-objects/types";
import { VulnerabilityLevel, BenefitCategory } from "@/core/domain/value-objects/enums";

describe("BenefitEstimationEngine", () => {
  describe("Elderly Living Allowance (เบี้ยยังชีพผู้สูงอายุ - ขั้นบันได)", () => {
    it("should be ineligible if age is under 60", () => {
      const input: EstimateInput = { age: 58 };
      const summary = BenefitEstimationEngine.calculate(input);

      const livingAllowance = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(livingAllowance).toBeUndefined();

      const ineligibleItem = summary.ineligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(ineligibleItem).toBeDefined();
    });

    it("should award 600 THB/month for age 60-69", () => {
      const input: EstimateInput = { age: 65 };
      const summary = BenefitEstimationEngine.calculate(input);

      const livingAllowance = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(livingAllowance).toBeDefined();
      expect(livingAllowance?.estimatedAmount).toBe(600);
      expect(livingAllowance?.monthlyAmountEquivalent).toBe(600);
      expect(livingAllowance?.annualAmountEquivalent).toBe(7200);
    });

    it("should award 700 THB/month for age 70-79", () => {
      const input: EstimateInput = { age: 75 };
      const summary = BenefitEstimationEngine.calculate(input);

      const livingAllowance = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(livingAllowance?.estimatedAmount).toBe(700);
      expect(livingAllowance?.annualAmountEquivalent).toBe(8400);
    });

    it("should award 800 THB/month for age 80-89", () => {
      const input: EstimateInput = { age: 82 };
      const summary = BenefitEstimationEngine.calculate(input);

      const livingAllowance = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(livingAllowance?.estimatedAmount).toBe(800);
      expect(livingAllowance?.annualAmountEquivalent).toBe(9600);
    });

    it("should award 1,000 THB/month for age 90 and above", () => {
      const input: EstimateInput = { age: 92 };
      const summary = BenefitEstimationEngine.calculate(input);

      const livingAllowance = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-ELD-001"
      );
      expect(livingAllowance?.estimatedAmount).toBe(1000);
      expect(livingAllowance?.annualAmountEquivalent).toBe(12000);
    });
  });

  describe("Disability Benefit (เบี้ยความพิการ)", () => {
    it("should award 800 THB/month for disabled person under 60", () => {
      const input: EstimateInput = {
        age: 45,
        hasDisability: true,
        isDisabilityRegistered: true,
      };
      const summary = BenefitEstimationEngine.calculate(input);

      const disabilityBenefit = summary.eligiblePrograms.find(
        (p) => p.category === BenefitCategory.DISABILITY_BENEFIT
      );
      expect(disabilityBenefit).toBeDefined();
      expect(disabilityBenefit?.estimatedAmount).toBe(800);
    });

    it("should combine elderly living allowance and disability benefit for age >= 60", () => {
      const input: EstimateInput = {
        age: 65,
        hasDisability: true,
        isDisabilityRegistered: true,
      };
      const summary = BenefitEstimationEngine.calculate(input);

      // Living allowance (600) + Disability (800) = 1,400 monthly
      expect(summary.totalMonthlyEstimate).toBeGreaterThanOrEqual(1400);
    });
  });

  describe("Vulnerability Score & Classification", () => {
    it("should classify high vulnerability for low income, alone, chronic illness", () => {
      const input: EstimateInput = {
        age: 85,
        monthlyIncome: 0,
        hasStateWelfareCard: true,
        hasDisability: true,
        livingCondition: "ALONE",
        hardshipFactors: {
          inadequateHousing: true,
          noCaregiver: true,
          chronicIllness: true,
        },
      };

      const summary = BenefitEstimationEngine.calculate(input);
      expect(summary.vulnerabilityScore).toBeGreaterThanOrEqual(75);
      expect(summary.vulnerabilityLevel).toBe(VulnerabilityLevel.CRITICAL);
    });

    it("should classify low vulnerability for healthy person with income", () => {
      const input: EstimateInput = {
        age: 60,
        monthlyIncome: 25000,
        hasStateWelfareCard: false,
        hasDisability: false,
        livingCondition: "FAMILY",
      };

      const summary = BenefitEstimationEngine.calculate(input);
      expect(summary.vulnerabilityScore).toBeLessThan(25);
      expect(summary.vulnerabilityLevel).toBe(VulnerabilityLevel.LOW);
    });
  });

  describe("State Welfare Card & Funeral Aid", () => {
    it("should provide state welfare card package for card holders", () => {
      const input: EstimateInput = {
        age: 62,
        hasStateWelfareCard: true,
      };
      const summary = BenefitEstimationEngine.calculate(input);

      const stateWelfare = summary.eligiblePrograms.find(
        (p) => p.programCode === "DOP-SWC-003" || p.category === BenefitCategory.STATE_WELFARE_TOPUP
      );
      expect(stateWelfare).toBeDefined();
    });
  });
});
