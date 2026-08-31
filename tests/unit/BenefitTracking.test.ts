import { describe, it, expect } from "vitest";
import { BenefitTrackingStatus, BenefitCategory } from "@/core/domain/value-objects/enums";
import { BenefitTrackingEntity } from "@/core/domain/entities/BenefitTracking";

describe("BenefitTracking", () => {
  const mockTracking: BenefitTrackingEntity = {
    id: "track-001",
    trackingNumber: "TRK-2026-0001",
    applicationId: "app-001",
    applicationNumber: "APP-2026-0001",
    estimateId: "est-001",
    estimateNumber: "EST-2026-0001",
    sourceType: "ESTIMATE",
    citizenId: "cit-001",
    citizenName: "นายสมศักดิ์ มั่นคง",
    citizenNationalId: "1100400289112",
    programId: "dop-eld-001",
    programCode: "DOP-ELD-001",
    benefitName: "เบี้ยยังชีพผู้สูงอายุ",
    benefitCategory: BenefitCategory.LIVING_ALLOWANCE,
    requestedAmount: 600,
    status: BenefitTrackingStatus.PROPOSED,
    submissionDate: new Date("2026-08-01"),
    createdAt: new Date("2026-08-01"),
    updatedAt: new Date("2026-08-01"),
  };

  it("should initialize with PROPOSED status and valid entity properties", () => {
    expect(mockTracking.id).toBe("track-001");
    expect(mockTracking.status).toBe(BenefitTrackingStatus.PROPOSED);
    expect(mockTracking.sourceType).toBe("ESTIMATE");
    expect(mockTracking.requestedAmount).toBe(600);
  });

  it("should track status transitions through full approval and disbursement lifecycle", () => {
    const tracking: BenefitTrackingEntity = { ...mockTracking };

    // Step 1: Officer Reviews -> PENDING
    tracking.status = BenefitTrackingStatus.PENDING;
    expect(tracking.status).toBe(BenefitTrackingStatus.PENDING);

    // Step 2: Officer Approves -> APPROVED
    tracking.status = BenefitTrackingStatus.APPROVED;
    tracking.approvedAmount = 600;
    tracking.approvalDate = new Date("2026-08-05");
    expect(tracking.status).toBe(BenefitTrackingStatus.APPROVED);
    expect(tracking.approvedAmount).toBe(600);

    // Step 3: Finance Disburses -> DISBURSED
    tracking.status = BenefitTrackingStatus.DISBURSED;
    tracking.disbursedAmount = 600;
    tracking.disbursementDate = new Date("2026-08-10");
    tracking.paymentReference = "PAY-20260810-001";
    expect(tracking.status).toBe(BenefitTrackingStatus.DISBURSED);
    expect(tracking.paymentReference).toBe("PAY-20260810-001");

    // Step 4: Citizen Receives -> RECEIVED
    tracking.status = BenefitTrackingStatus.RECEIVED;
    tracking.receivedDate = new Date("2026-08-11");
    expect(tracking.status).toBe(BenefitTrackingStatus.RECEIVED);
  });

  it("should handle terminal rejection and cancellation states", () => {
    const rejected: BenefitTrackingEntity = {
      ...mockTracking,
      status: BenefitTrackingStatus.REJECTED,
      rejectionDate: new Date("2026-08-03"),
      officerNotes: "เอกสารไม่ครบถ้วน ขาดสำเนาทะเบียนบ้าน",
    };

    expect(rejected.status).toBe(BenefitTrackingStatus.REJECTED);
    expect(rejected.officerNotes).toBeDefined();

    const cancelled: BenefitTrackingEntity = {
      ...mockTracking,
      status: BenefitTrackingStatus.CANCELLED,
      notes: "ขอยกเลิกคำขอเนื่องจากย้ายภูมิลำเนา",
    };

    expect(cancelled.status).toBe(BenefitTrackingStatus.CANCELLED);
  });
});
