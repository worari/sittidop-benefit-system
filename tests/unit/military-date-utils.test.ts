import { describe, it, expect } from "vitest";
import {
  toThaiDateParts,
  fromThaiDateParts,
  formatThaiBE,
  toBEDisplayLabel,
  calculateServiceTime,
  calculateTotalServiceTime,
  formatServiceTime,
} from "@/presentation/lib/military-date-utils";

describe("military-date-utils", () => {
  describe("toThaiDateParts & fromThaiDateParts", () => {
    it("should convert C.E. ISO date string to B.E. parts correctly", () => {
      const parts = toThaiDateParts("2026-08-15");
      expect(parts).toEqual({
        day: 15,
        month: 8,
        yearBE: 2569,
      });
    });

    it("should return null for invalid or empty dates", () => {
      expect(toThaiDateParts("")).toBeNull();
      expect(toThaiDateParts(undefined)).toBeNull();
      expect(toThaiDateParts("invalid-date")).toBeNull();
    });

    it("should convert B.E. parts back to C.E. ISO date string", () => {
      const iso = fromThaiDateParts({ day: 1, month: 1, yearBE: 2569 });
      expect(iso).toBe("2026-01-01");
    });
  });

  describe("formatThaiBE", () => {
    it("should format dates in Thai Buddhist Era format", () => {
      expect(formatThaiBE("2026-05-01")).toBe("1 พ.ค. 2569");
      expect(formatThaiBE("2024-12-31")).toBe("31 ธ.ค. 2567");
    });

    it("should return '-' for null/undefined dates", () => {
      expect(formatThaiBE(null)).toBe("-");
      expect(formatThaiBE(undefined)).toBe("-");
      expect(toBEDisplayLabel(null)).toBe("-");
    });
  });

  describe("calculateServiceTime", () => {
    it("should calculate exact years, months, and days between dates", () => {
      const result = calculateServiceTime("2020-01-01", "2025-01-01");
      expect(result.years).toBe(5);
      expect(result.months).toBe(0);
      expect(result.days).toBe(0);
    });

    it("should handle calendar month and day borrowing correctly", () => {
      const result = calculateServiceTime("2020-05-15", "2023-03-10");
      expect(result.years).toBe(2);
      expect(result.months).toBe(9);
      expect(result.days).toBeGreaterThan(20);
    });

    it("should return zeros if start date is after end date or missing", () => {
      expect(calculateServiceTime("2025-01-01", "2020-01-01")).toEqual({
        years: 0,
        months: 0,
        days: 0,
      });
      expect(calculateServiceTime("", "2025-01-01")).toEqual({
        years: 0,
        months: 0,
        days: 0,
      });
    });
  });

  describe("calculateTotalServiceTime", () => {
    it("should calculate total service time with 2x multiplier for field service", () => {
      const normal = { years: 5, months: 0, days: 0 };
      const multiplier = { years: 2, months: 0, days: 0 };

      // Normal 5 years + (2 years * 2) = 9 years
      const total = calculateTotalServiceTime(normal, multiplier, { multiplierFactor: 2 });
      expect(total.years).toBe(9);
    });

    it("should format service time breakdown into Thai readable string", () => {
      expect(formatServiceTime({ years: 10, months: 6, days: 15 })).toBe("10 ปี 6 เดือน 15 วัน");
      expect(formatServiceTime({ years: 0, months: 0, days: 5 })).toBe("5 วัน");
    });
  });
});
