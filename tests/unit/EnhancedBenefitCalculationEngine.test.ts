import { describe, it, expect } from "vitest";
import { EnhancedBenefitCalculationEngine } from "@/core/use-cases/estimation/EnhancedBenefitCalculationEngine";
import { EstimateInput } from "@/core/domain/value-objects/types";
import { MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";

describe("EnhancedBenefitCalculationEngine", () => {
  describe("validateInput", () => {
    it("should validate input properly with civilian and optional military data", () => {
      const civilianInput: EstimateInput = {
        age: 65,
        monthlyIncome: 3000,
      };

      const res = EnhancedBenefitCalculationEngine.validateInput(civilianInput);
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("should report errors when age is out of bounds", () => {
      const civilianInput: EstimateInput = {
        age: -10,
      };

      const res = EnhancedBenefitCalculationEngine.validateInput(civilianInput);
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });
  });

  describe("calculateComprehensive", () => {
    it("should calculate comprehensive benefits for civilian-only input", () => {
      const civilianInput: EstimateInput = {
        age: 70,
        monthlyIncome: 2000,
        hasStateWelfareCard: true,
      };

      const summary = EnhancedBenefitCalculationEngine.calculateComprehensive(civilianInput);

      expect(summary).toBeDefined();
      expect(summary.totalMonthlyEstimate).toBeGreaterThan(0);
      expect(summary.eligiblePrograms.length).toBeGreaterThan(0);
    });

    it("should calculate and merge benefits when military data is provided", () => {
      const civilianInput: EstimateInput = {
        age: 62,
        monthlyIncome: 0,
      };

      const militaryInput: MilitaryPersonnelInput = {
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
        serviceYearsNormal: 16,
        serviceYearsMultiplier: 6,
        totalServiceYears: 28,
        missionType: "COUNTER_INSURGENCY",
        actionType: "DIRECT_COMBAT",
        incidentType: "COMBAT_ENGAGEMENT",
        lossType: "KIA_COMBAT_DEATH",
      };

      const summary = EnhancedBenefitCalculationEngine.calculateComprehensive(
        civilianInput,
        militaryInput,
        []
      );

      expect(summary).toBeDefined();
      expect(summary.eligiblePrograms.length).toBeGreaterThan(0);
    });
  });

  describe("getCalculationStats", () => {
    it("should return comprehensive statistics for analytics", () => {
      const civilianInput: EstimateInput = {
        age: 70,
        monthlyIncome: 0,
      };

      const summary = EnhancedBenefitCalculationEngine.calculateComprehensive(civilianInput);
      const stats = EnhancedBenefitCalculationEngine.getCalculationStats(summary);

      expect(stats).toBeDefined();
      expect(stats.totalPrograms).toBe(summary.eligiblePrograms.length);
      expect(stats.civilianPrograms).toBe(summary.eligiblePrograms.length);
      expect(stats.totalAmount).toBeGreaterThan(0);
      expect(stats.averageAmount).toBeGreaterThan(0);
    });
  });
});
