import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/infrastructure/database/prisma";
import { POST } from "@/app/api/personnel/route";
import { PUT as putFamily, GET as getFamily } from "@/app/api/personnel/[id]/family/route";
import { PUT as putHeirs, GET as getHeirs } from "@/app/api/personnel/[id]/heirs/route";
import { DELETE as deletePersonnel } from "@/app/api/personnel/[id]/route";
import { NextRequest } from "next/server";

describe("Workflow Simulation: Tabs 2 - 4 (Personnel -> Family -> Heirs)", () => {
  const testMilitaryId = "MIL-SIM-2026";
  const testCitizenId = "3100600492899";
  let createdPersonnelId = "";

  beforeAll(async () => {
    // Ensure clean state
    await prisma.militaryPersonnel.deleteMany({
      where: { militaryId: testMilitaryId },
    });
  });

  afterAll(async () => {
    if (createdPersonnelId) {
      await prisma.militaryPersonnel.deleteMany({
        where: { id: createdPersonnelId },
      });
    }
  });

  it("Tab 2: Should successfully register a new military personnel record", async () => {
    const personnelPayload = {
      militaryId: testMilitaryId,
      citizenId: testCitizenId,
      rank: "MASTER_SERGEANT_1ST",
      rankAbbr: "จ.ส.อ.",
      firstName: "สมศักดิ์",
      lastName: "กล้าหาญ",
      dateOfBirth: "1992-05-15",
      age: 34,
      maritalStatus: "สมรส",
      phone: "0891234567",
      normalUnit: "ร.19 พัน.1 (พล.ร.9)",
      abbreviatedPosition: "ผบ.มว.ปล.",
      fieldUnit: "ฉก.นราธิวาส (กกล.ทบ.)",
      fieldPosition: "ผบ.มว.ปล. สน.",
      fieldDutyOrderNo: "คำสั่ง ทภ.4 ที่ 142/2567",
      fieldDutyOrderDate: "2024-10-01",
      fieldDutyOrderIssuer: "กองทัพภาคที่ 4",
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
      body: JSON.stringify(personnelPayload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.militaryId).toBe(testMilitaryId);
    expect(json.data.rank).toBe("MASTER_SERGEANT_1ST");
    expect(json.data.firstName).toBe("สมศักดิ์");
    expect(json.data.lastName).toBe("กล้าหาญ");

    createdPersonnelId = json.data.id;
    expect(createdPersonnelId).toBeTruthy();
  });

  it("Tab 3: Should save spouse and children data with 100% allocation", async () => {
    const familyPayload = {
      spouse: {
        hasSpouse: true,
        nationalId: "3100600492815",
        title: "นาง",
        firstName: "วรรณา",
        lastName: "กล้าหาญ",
        dateOfBirth: "1994-08-20",
        age: 32,
        isAlive: true,
        isLegallyMarried: true,
        marriageCertNumber: "คร.2/2560",
        phone: "0819876543",
        address: "123 หมู่ 4 ต.ลาดหญ้า อ.เมือง จ.กาญจนบุรี",
        bankName: "กรุงไทย",
        bankAccountNumber: "1234567890",
        hasPensionRights: true,
        allocationPercentage: 50,
      },
      children: [
        {
          nationalId: "3100600492822",
          title: "ด.ช.",
          firstName: "ภูวดล",
          lastName: "กล้าหาญ",
          dateOfBirth: "2016-03-10",
          age: 10,
          isAlive: true,
          isStudying: true,
          educationLevel: "PRIMARY",
          phone: "0819876543",
          scholarshipEligible: true,
          annualScholarship: 15000,
          hasSuccessorRight: false,
          allocationPercentage: 25,
        },
        {
          nationalId: "3100600492833",
          title: "ด.ญ.",
          firstName: "กานดา",
          lastName: "กล้าหาญ",
          dateOfBirth: "2019-11-25",
          age: 7,
          isAlive: true,
          isStudying: true,
          educationLevel: "PRIMARY",
          phone: "0819876543",
          scholarshipEligible: true,
          annualScholarship: 15000,
          hasSuccessorRight: false,
          allocationPercentage: 25,
        },
      ],
    };

    const putReq = new NextRequest(`http://localhost:3000/api/personnel/${createdPersonnelId}/family`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(familyPayload),
    });

    const putRes = await putFamily(putReq, { params: Promise.resolve({ id: createdPersonnelId }) });
    const putJson = await putRes.json();

    expect(putRes.status).toBe(200);
    expect(putJson.success).toBe(true);
    expect(putJson.data.spouse.firstName).toBe("วรรณา");
    expect(putJson.data.spouse.allocationPercentage).toBe(50);
    expect(putJson.data.children.length).toBe(2);
    expect(putJson.data.children[0].firstName).toBe("ภูวดล");
    expect(putJson.data.children[1].firstName).toBe("กานดา");

    // Verify GET endpoint returns the family snapshot
    const getReq = new NextRequest(`http://localhost:3000/api/personnel/${createdPersonnelId}/family`);
    const getRes = await getFamily(getReq, { params: Promise.resolve({ id: createdPersonnelId }) });
    const getJson = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getJson.success).toBe(true);
    expect(getJson.data.spouse.nationalId).toBe("3100600492815");
    expect(getJson.data.children.length).toBe(2);
  });

  it("Tab 4: Should save heirs list with allocation breakdown totaling 100%", async () => {
    const heirsPayload = {
      heirs: [
        {
          nationalId: "3100600492815",
          title: "นาง",
          firstName: "วรรณา",
          lastName: "กล้าหาญ",
          relationship: "SPOUSE_LEGAL",
          phone: "0819876543",
          address: "กาญจนบุรี",
          isAlive: true,
          bankName: "กรุงไทย",
          bankAccountNumber: "1234567890",
          allocationPercentage: 50,
          isDesignatedSuccessor: true,
          documentsVerified: true,
        },
        {
          nationalId: "3100600492822",
          title: "ด.ช.",
          firstName: "ภูวดล",
          lastName: "กล้าหาญ",
          relationship: "CHILD_LEGITIMATE",
          phone: "0819876543",
          address: "กาญจนบุรี",
          isAlive: true,
          bankName: "กรุงไทย",
          bankAccountNumber: "1234567891",
          allocationPercentage: 25,
          isDesignatedSuccessor: false,
          documentsVerified: true,
        },
        {
          nationalId: "3100600492855",
          title: "นาย",
          firstName: "สมควร",
          lastName: "กล้าหาญ",
          relationship: "FATHER",
          phone: "0811112222",
          address: "กาญจนบุรี",
          isAlive: true,
          bankName: "ออมสิน",
          bankAccountNumber: "9876543210",
          allocationPercentage: 12.5,
          isDesignatedSuccessor: false,
          documentsVerified: true,
        },
        {
          nationalId: "3100600492866",
          title: "นาง",
          firstName: "สมศรี",
          lastName: "กล้าหาญ",
          relationship: "MOTHER",
          phone: "0811112223",
          address: "กาญจนบุรี",
          isAlive: true,
          bankName: "ออมสิน",
          bankAccountNumber: "9876543211",
          allocationPercentage: 12.5,
          isDesignatedSuccessor: false,
          documentsVerified: true,
        },
      ],
    };

    const putReq = new NextRequest(`http://localhost:3000/api/personnel/${createdPersonnelId}/heirs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(heirsPayload),
    });

    const putRes = await putHeirs(putReq, { params: Promise.resolve({ id: createdPersonnelId }) });
    const putJson = await putRes.json();

    expect(putRes.status).toBe(200);
    expect(putJson.success).toBe(true);
    expect(putJson.data.heirs.length).toBe(4);

    // Verify GET endpoint returns all heirs and family snapshot
    const getReq = new NextRequest(`http://localhost:3000/api/personnel/${createdPersonnelId}/heirs`);
    const getRes = await getHeirs(getReq, { params: Promise.resolve({ id: createdPersonnelId }) });
    const getJson = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getJson.success).toBe(true);
    expect(getJson.data.heirs.length).toBe(4);

    // Check total allocation percentage
    const totalAlloc = getJson.data.heirs.reduce((sum: number, h: any) => sum + h.allocationPercentage, 0);
    expect(totalAlloc).toBe(100);
  });

  it("Should cascade delete personnel, spouse, children, and heirs cleanly", async () => {
    const delReq = new NextRequest(`http://localhost:3000/api/personnel/${createdPersonnelId}`, {
      method: "DELETE",
    });
    const delRes = await deletePersonnel(delReq, { params: Promise.resolve({ id: createdPersonnelId }) });
    const delJson = await delRes.json();

    expect(delRes.status).toBe(200);
    expect(delJson.success).toBe(true);

    // Verify record is gone
    const checkPersonnel = await prisma.militaryPersonnel.findUnique({
      where: { id: createdPersonnelId },
    });
    expect(checkPersonnel).toBeNull();
    createdPersonnelId = "";
  });
});
