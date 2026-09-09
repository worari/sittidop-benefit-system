import { describe, it, expect } from "vitest";
import {
  SALARY_LEVEL_OPTIONS,
  getSalaryAmount,
  getCompensationAmount,
  getAvailableSalarySteps,
  getAvailableCompensationSteps,
  normalizeSalaryLevel,
  formatSalaryStep,
} from "@/presentation/lib/salary-scale";

describe("Salary Scale & Compensation (คำสั่ง กห ที่ 160/2560)", () => {
  it("should contain all 14 official salary levels (พ.1 to น.9)", () => {
    expect(SALARY_LEVEL_OPTIONS).toEqual([
      "พ.1", "พ.2",
      "ป.1", "ป.2", "ป.3",
      "น.1", "น.2", "น.3", "น.4", "น.5", "น.6", "น.7", "น.8", "น.9"
    ]);
  });

  it("should correctly lookup salary amounts for various levels and steps", () => {
    // พ.1 step 1 and step 8.5
    expect(getSalaryAmount("พ.1", 1)).toBe(4870);
    expect(getSalaryAmount("พ.1", 8.5)).toBe(6970);

    // พ.2 step 1 and step 33
    expect(getSalaryAmount("พ.2", 1)).toBe(4870);
    expect(getSalaryAmount("พ.2", 33)).toBe(16790);

    // ป.1 step 1, 19, 40
    expect(getSalaryAmount("ป.1", 1)).toBe(4870);
    expect(getSalaryAmount("ป.1", 19)).toBe(10760);
    expect(getSalaryAmount("ป.1", 40)).toBe(21480);

    // ป.3 step 1, 37
    expect(getSalaryAmount("ป.3", 1)).toBe(10350);
    expect(getSalaryAmount("ป.3", 37)).toBe(38750);

    // น.1 step 1, 19, 46
    expect(getSalaryAmount("น.1", 1)).toBe(6470);
    expect(getSalaryAmount("น.1", 19)).toBe(15610);
    expect(getSalaryAmount("น.1", 46)).toBe(38750);

    // น.3 step 19, 33
    expect(getSalaryAmount("น.3", 19)).toBe(34110);
    expect(getSalaryAmount("น.3", 33)).toBe(54820);

    // น.9 step 1, 12.5
    expect(getSalaryAmount("น.9", 1)).toBe(51960);
    expect(getSalaryAmount("น.9", 12.5)).toBe(78030);
  });

  it("should correctly lookup compensation amounts (เยียวยา)", () => {
    // น.1 compensation step 0.5 and step 10.5
    expect(getCompensationAmount("น.1", 0.5)).toBe(39190);
    expect(getCompensationAmount("น.1", 10.5)).toBe(54820);

    // น.3 compensation step 0.5 and step 2
    expect(getCompensationAmount("น.3", 0.5)).toBe(55720);
    expect(getCompensationAmount("น.3", 2)).toBe(58390);

    // Non-existent or 0 step returns 0
    expect(getCompensationAmount("น.3", 0)).toBe(0);
  });

  it("should provide available steps per salary level", () => {
    const stepsP1 = getAvailableSalarySteps("พ.1");
    expect(stepsP1[0]).toBe(1);
    expect(stepsP1[stepsP1.length - 1]).toBe(8.5);

    const stepsN1 = getAvailableSalarySteps("น.1");
    expect(stepsN1[0]).toBe(1);
    expect(stepsN1[stepsN1.length - 1]).toBe(46);
  });

  it("should format salary step correctly", () => {
    expect(formatSalaryStep(1)).toBe("1");
    expect(formatSalaryStep(1.5)).toBe("1.5");
    expect(formatSalaryStep(19)).toBe("19");
    expect(formatSalaryStep(27.5)).toBe("27.5");
  });
});
