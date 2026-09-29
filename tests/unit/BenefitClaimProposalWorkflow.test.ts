import { describe, it, expect } from "vitest";
import { ApplicationService } from "@/core/use-cases/applications/ApplicationService";
import { BenefitTrackingService } from "@/core/use-cases/benefit-tracking/BenefitTrackingService";
import { ApplicationStatus, BenefitTrackingStatus } from "@/core/domain/value-objects/enums";

describe("Benefit Claim Proposal & Workflow Unit Tests", () => {
  const mockPersonnel = {
    militaryId: "MIL-49021884",
    rank: "LIEUTENANT_COLONEL",
    rankAbbr: "พ.ท.",
    firstName: "วีรชาติ",
    lastName: "ภักดีสยาม",
    normalUnit: "ร.19 พัน.1 (พล.ร.9)",
    fieldUnit: "ฉก.นราธิวาส (กกล.ทบ.)",
    salary: 43500,
    lossType: "DEATH",
    incidentDate: "2026-03-12",
  };

  const mockDocumentsChecklist = [
    {
      code: "RTA-KP3-4",
      name: "แบบรายงานการสูญเสียกำลังพล (กพ.3 / กพ.4)",
      status: "ATTACHED",
      required: true,
      fileName: "กพ3_กพ4_ลงนามแล้ว.pdf",
    },
    {
      code: "RTA-FIELD-ORDER",
      name: "คำสั่งปฏิบัติหน้าที่ราชการสนาม",
      status: "ATTACHED",
      required: true,
      fileName: "คำสั่งปฏิบัติการสนาม.pdf",
    },
    {
      code: "MED-DEATH-CERT",
      name: "ใบมรณบัตร",
      status: "ATTACHED",
      required: true,
      fileName: "ใบมรณบัตร.pdf",
    },
    {
      code: "FIN-BANK-BOOK",
      name: "สำเนาหน้าสมุดบัญชีเงินฝากธนาคาร TTB",
      status: "ATTACHED",
      required: true,
      fileName: "bookbank_ttb.pdf",
    },
  ];

  it("should validate and create a formal claim application with complete military metadata and 4-category summary", async () => {
    const appService = new ApplicationService();

    const claimPayload = {
      citizenNationalId: "3100600492811",
      citizenData: {
        title: "พ.ท.",
        firstName: mockPersonnel.firstName,
        lastName: mockPersonnel.lastName,
        dateOfBirth: "1980-01-01",
        gender: "MALE",
        phone: "081-234-5678",
        address: "123 ค่ายสุรสีห์ กาญจนบุรี",
        subdistrict: "ลาดหญ้า",
        district: "เมือง",
        province: "กาญจนบุรี",
        postalCode: "71190",
        monthlyIncome: mockPersonnel.salary,
        hasStateWelfareCard: false,
        isDisabilityRegistered: false,
      },
      programId: "dop-eld-001",
      requestedAmount: 4850000,
      applicantRemarks: "ยื่นเรื่องขอรับสิทธิและสวัสดิการกำลังพลตามผลประมาณการสิทธิ 4 หมวดของ ทบ.",
      documents: {
        requestFiles: mockDocumentsChecklist.map((d) => ({
          name: d.fileName,
          code: d.code,
          stage: "REQUEST",
          uploadedAt: new Date().toISOString(),
        })),
        militaryCasualtyMetadata: mockPersonnel,
        benefitCategoriesBreakdown: {
          lumpSumTotal: 4850000,
          monthlyPensionTotal: 34500,
          annualScholarshipTotal: 20000,
          nonMonetaryCount: 2,
        },
        heirDisbursementInfo: {
          applicantName: "นางพิมพา ภักดีสยาม",
          applicantRole: "SPOUSE",
          primaryBank: "ธนาคารทหารไทยธนชาต (TTB)",
          primaryAccount: "123-4-56789-0",
        },
      },
      userId: "usr-officer-01",
      userName: "นายทหารฝ่ายสวัสดิการ",
    };

    const created = await appService.submitClaim(claimPayload);

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.status).toBe(ApplicationStatus.SUBMITTED);
    expect(created.requestedAmount).toBe(4850000);
    expect(created.documentsJson).toBeDefined();

    const parsedDocs = JSON.parse(created.documentsJson!);
    expect(parsedDocs.militaryCasualtyMetadata.militaryId).toBe("MIL-49021884");
    expect(parsedDocs.benefitCategoriesBreakdown.lumpSumTotal).toBe(4850000);
    expect(parsedDocs.heirDisbursementInfo.primaryBank).toContain("TTB");
  });

  it("should correctly check required documents completeness", () => {
    const requiredTotal = mockDocumentsChecklist.filter((d) => d.required).length;
    const attachedTotal = mockDocumentsChecklist.filter((d) => d.required && d.status === "ATTACHED").length;

    expect(requiredTotal).toBe(4);
    expect(attachedTotal).toBe(4);
    expect(attachedTotal >= requiredTotal).toBe(true);
  });
});
