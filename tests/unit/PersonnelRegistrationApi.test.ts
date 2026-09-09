import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/infrastructure/database/prisma";
import { POST } from "@/app/api/personnel/route";
import { NextRequest } from "next/server";

describe("Personnel Registration (Add Personnel) API Tests", () => {
  const testMilId1 = "TEST990001";
  const testCitId1 = "3100600492811";
  const testMilId2 = "TEST990002";
  const testCitId2 = "3100600492812";

  beforeAll(async () => {
    // Cleanup any existing test records
    await prisma.militaryPersonnel.deleteMany({
      where: {
        militaryId: { in: [testMilId1, testMilId2] },
      },
    });
  });

  afterAll(async () => {
    await prisma.militaryPersonnel.deleteMany({
      where: {
        militaryId: { in: [testMilId1, testMilId2] },
      },
    });
  });

  it("should successfully register an NCO personnel (MASTER_SERGEANT_1ST) with full service breakdown", async () => {
    const payload = {
      militaryId: testMilId1,
      citizenId: testCitId1,
      rank: "MASTER_SERGEANT_1ST",
      rankAbbr: "จ.ส.อ.",
      firstName: "วีรชัย",
      lastName: "ภักดีสยาม",
      phone: "0812345678",
      normalUnit: "ร.19 พัน.1 (พล.ร.9)",
      abbreviatedPosition: "ผบ.มว.ปล.",
      fieldUnit: "ฉก.นราธิวาส",
      fieldPosition: "ผบ.มว.ปล. สน.",
      fieldDutyOrderNo: "142/2567",
      missionCategory: "COUNTER_INSURGENCY",
      salary: 26500,
      salaryLevel: "ป.3",
      salaryStep: 15,
      compensationAmount: 28500,
      additionalPay: 2500,
      appointmentDate: "2016-05-01",
      serviceYearsNormal: 8,
      serviceMonthsNormal: 4,
      serviceDaysNormal: 15,
      serviceYearsMultiplier: 4,
      serviceMonthsMultiplier: 6,
      serviceDaysMultiplier: 0,
      totalServiceYears: 12,
      totalServiceMonths: 10,
      totalServiceDays: 15,
      lossType: "KIA_COMBAT_DEATH",
    };

    const req = new NextRequest("http://localhost:3000/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.militaryId).toBe(testMilId1);
    expect(json.data.rank).toBe("MASTER_SERGEANT_1ST");
    expect(json.data.serviceYearsNormal).toBe(8);
    expect(json.data.serviceMonthsNormal).toBe(4);
    expect(json.data.serviceDaysNormal).toBe(15);
    expect(json.data.totalServiceYears).toBe(12);
    expect(json.data.totalServiceMonths).toBe(10);
    expect(json.data.totalServiceDays).toBe(15);
  });

  it("should return a clear Thai error when attempting to register duplicate militaryId", async () => {
    const payload = {
      militaryId: testMilId1, // Duplicate ID
      citizenId: "3999999999999",
      rank: "CAPTAIN",
      rankAbbr: "ร.อ.",
      firstName: "สมคิด",
      lastName: "รักชาติ",
    };

    const req = new NextRequest("http://localhost:3000/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("เลขประจำตัวทหารนี้ถูกลงทะเบียนไว้ในระบบแล้ว");
  });

  it("should return a clear Thai error when attempting to register duplicate citizenId", async () => {
    const payload = {
      militaryId: testMilId2,
      citizenId: testCitId1, // Duplicate Citizen ID
      rank: "MAJOR",
      rankAbbr: "พ.ต.",
      firstName: "สมหวัง",
      lastName: "มั่นคง",
    };

    const req = new NextRequest("http://localhost:3000/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("เลขบัตรประจำตัวประชาชนนี้ถูกลงทะเบียนไว้ในระบบแล้ว");
  });

  it("should successfully register an Enlisted Private with conscriptionBatch", async () => {
    const payload = {
      militaryId: testMilId2,
      citizenId: testCitId2,
      rank: "PRIVATE",
      rankAbbr: "พลทหาร",
      firstName: "ประหยัด",
      lastName: "อดทน",
      conscriptionBatch: 2,
      normalUnit: "ร.19 พัน.2",
      lossType: "TOTAL_PERMANENT_DISABILITY",
    };

    const req = new NextRequest("http://localhost:3000/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.militaryId).toBe(testMilId2);
    expect(json.data.conscriptionBatch).toBe(2);
    expect(json.data.lossType).toBe("TOTAL_PERMANENT_DISABILITY");
  });

  it("should return a clear Thai error when attempting to register duplicate firstName and lastName", async () => {
    const payload = {
      militaryId: "TEST990003",
      citizenId: "3100600492813",
      rank: "MAJOR",
      rankAbbr: "พ.ต.",
      firstName: "วีรชัย", // Same as testMilId1
      lastName: "ภักดีสยาม", // Same as testMilId1
    };

    const req = new NextRequest("http://localhost:3000/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("พบข้อมูลกำลังพลชื่อ-นามสกุล 'วีรชัย ภักดีสยาม'");
    expect(json.error).toContain("ป้องกันชื่อซ้ำซ้อน");
  });
});
