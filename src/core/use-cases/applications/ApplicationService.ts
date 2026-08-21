import { PrismaApplicationRepository } from "@/infrastructure/database/repositories/PrismaApplicationRepository";
import { PrismaCitizenRepository } from "@/infrastructure/database/repositories/PrismaCitizenRepository";
import { PrismaBenefitProgramRepository } from "@/infrastructure/database/repositories/PrismaBenefitProgramRepository";
import { ApplicationEntity } from "@/core/domain/entities/Application";
import { ApplicationStatus, ApprovalDecision } from "@/core/domain/value-objects/enums";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export class ApplicationService {
  private appRepo = new PrismaApplicationRepository();
  private citizenRepo = new PrismaCitizenRepository();
  private programRepo = new PrismaBenefitProgramRepository();

  public async getApplications(params?: {
    status?: ApplicationStatus;
    programId?: string;
    province?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return await this.appRepo.findAll(params);
  }

  public async getApplicationById(id: string): Promise<ApplicationEntity | null> {
    return await this.appRepo.findById(id);
  }

  public async submitClaim(data: {
    citizenId?: string;
    citizenNationalId?: string;
    citizenData?: {
      title: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: string;
      phone: string;
      address: string;
      subdistrict: string;
      district: string;
      province: string;
      postalCode: string;
      monthlyIncome: number;
      hasStateWelfareCard: boolean;
      isDisabilityRegistered: boolean;
      disabilityType?: string;
      livingCondition?: string;
    };
    programId: string;
    requestedAmount: number;
    applicantRemarks?: string;
    documents?: { name: string; verified: boolean }[];
    userId?: string;
    userName?: string;
  }): Promise<ApplicationEntity> {
    let citizenId = data.citizenId;

    if (!citizenId && data.citizenNationalId) {
      let existing = await this.citizenRepo.findByNationalId(data.citizenNationalId);
      if (!existing && data.citizenData) {
        existing = await this.citizenRepo.create({
          nationalId: data.citizenNationalId,
          title: data.citizenData.title,
          firstName: data.citizenData.firstName,
          lastName: data.citizenData.lastName,
          dateOfBirth: new Date(data.citizenData.dateOfBirth),
          gender: data.citizenData.gender,
          phone: data.citizenData.phone,
          email: null,
          address: data.citizenData.address,
          subdistrict: data.citizenData.subdistrict,
          district: data.citizenData.district,
          province: data.citizenData.province,
          postalCode: data.citizenData.postalCode,
          monthlyIncome: data.citizenData.monthlyIncome,
          hasStateWelfareCard: data.citizenData.hasStateWelfareCard,
          isDisabilityRegistered: data.citizenData.isDisabilityRegistered,
          disabilityType: data.citizenData.disabilityType || null,
          vulnerabilityScore: 40,
          vulnerabilityLevel: (data.citizenData.isDisabilityRegistered || data.citizenData.hasStateWelfareCard) ? "HIGH" as any : "LOW" as any,
          livingCondition: data.citizenData.livingCondition || "FAMILY",
        });
      }
      if (existing) {
        citizenId = existing.id;
      }
    }

    if (!citizenId) {
      citizenId = "cit-001";
    }

    const newApp = await this.appRepo.create({
      applicationNumber: "",
      citizenId,
      programId: data.programId,
      requestedAmount: data.requestedAmount,
      approvedAmount: null,
      status: ApplicationStatus.SUBMITTED,
      submissionDate: new Date(),
      documentsJson: data.documents ? JSON.stringify(data.documents) : null,
      applicantRemarks: data.applicantRemarks || "ยื่นคำขอผ่านระบบประมาณการสิทธิออนไลน์",
      createdByUserId: data.userId || null,
    });

    await AuditLogger.log({
      userId: data.userId,
      userName: data.userName,
      action: "CLAIM_SUBMITTED",
      resource: "Application",
      resourceId: newApp.id,
      details: {
        applicationNumber: newApp.applicationNumber,
        programId: data.programId,
        requestedAmount: data.requestedAmount,
      },
    });

    return newApp;
  }

  public async reviewClaim(data: {
    applicationId: string;
    decision: ApprovalDecision;
    notes?: string;
    approvedAmount?: number;
    reviewerId: string;
    reviewerName: string;
    reviewerRole: string;
  }): Promise<ApplicationEntity> {
    let nextStatus: ApplicationStatus;
    switch (data.decision) {
      case ApprovalDecision.APPROVE:
        nextStatus = ApplicationStatus.APPROVED;
        break;
      case ApprovalDecision.REJECT:
        nextStatus = ApplicationStatus.REJECTED;
        break;
      case ApprovalDecision.REQUEST_DOCUMENTS:
        nextStatus = ApplicationStatus.UNDER_REVIEW;
        break;
      case ApprovalDecision.FORWARD:
        nextStatus = ApplicationStatus.DOCUMENT_VERIFIED;
        break;
      default:
        nextStatus = ApplicationStatus.UNDER_REVIEW;
    }

    const updatedApp = await this.appRepo.updateStatus(
      data.applicationId,
      nextStatus,
      data.notes,
      data.approvedAmount
    );

    await this.appRepo.addApprovalRecord({
      applicationId: data.applicationId,
      approverId: data.reviewerId,
      approverName: data.reviewerName,
      previousStatus: updatedApp.status,
      newStatus: nextStatus,
      decision: data.decision,
      comments: data.notes || null,
      approvedAmount: data.approvedAmount || null,
    });

    await AuditLogger.log({
      userId: data.reviewerId,
      userName: data.reviewerName,
      role: data.reviewerRole,
      action: `CLAIM_${data.decision}`,
      resource: "Application",
      resourceId: data.applicationId,
      details: {
        newStatus: nextStatus,
        decision: data.decision,
        approvedAmount: data.approvedAmount,
        notes: data.notes,
      },
    });

    return updatedApp;
  }
}
