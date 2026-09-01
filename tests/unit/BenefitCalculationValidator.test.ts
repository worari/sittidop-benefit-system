import { describe, it, expect } from "vitest";
import { BenefitCalculationValidator } from "@/core/validation/BenefitCalculationValidator";
import { EstimateInput } from "@/core/domain/value-objects/types";
import { MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";

describe("BenefitCalculationValidator", () => {
  describe("validateCivilianInput", () => {
    it("should accept valid civilian input", () => {
      const valid: EstimateInput = {
        age: 65,
        monthlyIncome: 4500,
        hasDisability: false,
        hasStateWelfareCard: true,
        livingCondition: "FAMILY",
      };

      const result = BenefitCalculationValidator.validateCivilianInput(valid);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject negative age or age > 120", () => {
      const invalidAge: EstimateInput = { age: -5 };
      const res1 = BenefitCalculationValidator.validateCivilianInput(invalidAge);
      expect(res1.isValid).toBe(false);
      expect(res1.errors).toContain("อายุต้องอยู่ระหว่าง 0-120 ปี");

      const tooOld: EstimateInput = { age: 150 };
      const res2 = BenefitCalculationValidator.validateCivilianInput(tooOld);
      expect(res2.isValid).toBe(false);
    });

    it("should reject negative monthly income", () => {
      const invalidIncome: EstimateInput = { age: 70, monthlyIncome: -1000 };
      const res = BenefitCalculationValidator.validateCivilianInput(invalidIncome);
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain("รายได้ต้องไม่ติดลบ");
    });

    it("should reject invalid living conditions", () => {
      const invalidLiving: EstimateInput = {
        age: 60,
        livingCondition: "HOTEL" as any,
      };
      const res = BenefitCalculationValidator.validateCivilianInput(invalidLiving);
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain("สภาพการอยู่อาศัยไม่ถูกต้อง");
    });
  });

  describe("validateMilitaryInput", () => {
    const validMilitary: MilitaryPersonnelInput = {
      militaryId: "1234567890",
      citizenId: "1100400289112",
      rank: "MAJOR",
      rankAbbr: "พ.ต.",
      firstName: "สมชาย",
      lastName: "ชาติทหาร",
      militaryBranch: "ROYAL_THAI_ARMY",
      abbreviatedPosition: "ผบ.ร้อย",
      normalUnit: "ร.19 พัน.1",
      salary: 35000,
      salaryLevel: "น.2",
      salaryStep: 15.5,
      compensationAmount: 0,
      additionalPay: 2500,
      appointmentDate: "2015-05-01",
      serviceYearsNormal: 10,
      serviceYearsMultiplier: 2,
      totalServiceYears: 14,
      missionType: "COUNTER_INSURGENCY",
      actionType: "DIRECT_COMBAT",
      incidentType: "COMBAT_ENGAGEMENT",
      lossType: "KIA_COMBAT_DEATH",
      promotionSteps: 7,
    };

    it("should pass for complete valid military input", () => {
      const result = BenefitCalculationValidator.validateMilitaryInput(validMilitary);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail when mandatory fields are missing", () => {
      const missing = { ...validMilitary, militaryId: "", firstName: "" };
      const result = BenefitCalculationValidator.validateMilitaryInput(missing);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ต้องระบุ ID ทหาร");
      expect(result.errors).toContain("ต้องระบุชื่อ");
    });

    it("should validate child age and allocation bounds", () => {
      const withInvalidChild: MilitaryPersonnelInput = {
        ...validMilitary,
        children: [
          {
            nationalId: "1100400289113",
            fullName: "เด็กชาย A",
            age: 30,
            isStudying: true,
            educationLevel: "SECONDARY",
            allocationPercentage: 150,
          },
        ],
      };
      const result = BenefitCalculationValidator.validateMilitaryInput(withInvalidChild);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("อายุไม่ถูกต้อง"))).toBe(true);
      expect(result.errors.some((e) => e.includes("เปอร์เซ็นต์การจัดสรรไม่ถูกต้อง"))).toBe(true);
    });
  });

  describe("sanitizeInput", () => {
    it("should strip malicious script tags and symbols from strings and objects", () => {
      const dirty = {
        name: "<script>alert('xss')</script>John Doe",
        remarks: "test & ' \" $ ; `",
        list: ["<b>safe</b>"],
      };

      const clean = BenefitCalculationValidator.sanitizeInput(dirty);
      expect(clean.name).toBe("scriptalert(xss)/scriptJohn Doe");
      expect(clean.remarks).toBe("test      ");
      expect(clean.list[0]).toBe("bsafe/b");
    });
  });

  describe("validateCalculationResults", () => {
    it("should validate complete results object", () => {
      const validResults = {
        eligibleProgramsCount: 2,
        totalMonthlyEstimate: 1600,
        totalAnnualEstimate: 19200,
        totalOneTimeEstimate: 20000,
        vulnerabilityScore: 45,
        eligiblePrograms: [
          {
            programId: "dop-eld-001",
            programName: "เบี้ยยังชีพ",
            estimatedAmount: 600,
          },
        ],
      };

      const result = BenefitCalculationValidator.validateCalculationResults(validResults);
      expect(result.isValid).toBe(true);
    });

    it("should reject negative summary estimates", () => {
      const invalidResults = {
        eligibleProgramsCount: 1,
        totalMonthlyEstimate: -500,
        totalAnnualEstimate: 1000,
        totalOneTimeEstimate: 0,
        vulnerabilityScore: 50,
        eligiblePrograms: [],
      };

      const result = BenefitCalculationValidator.validateCalculationResults(invalidResults);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("ยอดรวมรายเดือนต้องไม่ติดลบ");
    });
  });
});
