import { describe, it, expect } from "vitest";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";

describe("MilitaryStoreManager CRUD", () => {
  it("should create, update and delete personnel records", () => {
    const created = militaryStore.createPersonnel({
      militaryId: "MIL-TEST-001",
      citizenId: "1100000000001",
      rank: "CAPTAIN",
      rankAbbr: "ร.อ.",
      firstName: "ทดสอบ",
      lastName: "ระบบ",
      militaryBranch: "ROYAL_THAI_ARMY",
      abbreviatedPosition: "ผบ.ร้อย",
      normalUnit: "ร.11 พัน.2",
      fieldPosition: "ผบ.ฉก.เชียงใหม่",
      fieldUnit: "ฉก.เชียงใหม่",
      salary: 30000,
      salaryLevel: "น.2",
      salaryStep: 15,
      compensationAmount: 2500,
      additionalPay: 1500,
      appointmentDate: "2018-01-01",
      serviceYearsNormal: 8,
      serviceYearsMultiplier: 4,
      totalServiceYears: 12,
      missionType: "COUNTER_INSURGENCY",
      actionType: "DIRECT_COMBAT",
      incidentType: "COMBAT_ENGAGEMENT",
      lossType: "KIA_COMBAT_DEATH",
      promotionSteps: 5,
      promotedRank: "COLONEL",
      promotedRankAbbr: "พ.อ.",
      promotedSalary: 42000,
      spouse: undefined,
      children: [],
      heirs: [],
    });

    expect(created.id).toBeTruthy();

    const updated = militaryStore.updatePersonnel(created.id, {
      firstName: "ทดสอบแก้ไข",
      salary: 35000,
      lossType: "TOTAL_PERMANENT_DISABILITY",
    });

    expect(updated.firstName).toBe("ทดสอบแก้ไข");
    expect(updated.salary).toBe(35000);
    expect(updated.lossType).toBe("TOTAL_PERMANENT_DISABILITY");

    const deleted = militaryStore.deletePersonnel(created.id);
    expect(deleted).toBe(true);
    expect(militaryStore.getPersonnelById(created.id)).toBeNull();
  });
});
