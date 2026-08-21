import { ApplicationEntity, ApprovalRecordEntity } from "../entities/Application";
import { ApplicationStatus } from "../value-objects/enums";

export interface IApplicationRepository {
  findById(id: string): Promise<ApplicationEntity | null>;
  findByApplicationNumber(applicationNumber: string): Promise<ApplicationEntity | null>;
  findByCitizenId(citizenId: string): Promise<ApplicationEntity[]>;
  findAll(params?: {
    status?: ApplicationStatus;
    programId?: string;
    province?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ applications: ApplicationEntity[]; total: number }>;
  create(data: Omit<ApplicationEntity, "id" | "createdAt" | "updatedAt">): Promise<ApplicationEntity>;
  updateStatus(id: string, status: ApplicationStatus, notes?: string, approvedAmount?: number): Promise<ApplicationEntity>;
  addApprovalRecord(data: Omit<ApprovalRecordEntity, "id" | "createdAt">): Promise<ApprovalRecordEntity>;
  countByStatus(): Promise<Record<ApplicationStatus, number>>;
}
