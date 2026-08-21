import { ApplicationStatus, ApprovalDecision } from "../value-objects/enums";

export interface ApprovalRecordEntity {
  id: string;
  applicationId: string;
  approverId: string;
  approverName?: string;
  previousStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  decision: ApprovalDecision;
  comments?: string | null;
  approvedAmount?: number | null;
  createdAt: Date;
}

export interface ApplicationEntity {
  id: string;
  applicationNumber: string;
  citizenId: string;
  citizenName?: string;
  citizenNationalId?: string;
  citizenProvince?: string;
  programId: string;
  programName?: string;
  programCategory?: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  status: ApplicationStatus;
  submissionDate: Date;
  decisionDate?: Date | null;
  disbursementDate?: Date | null;
  documentsJson?: string | null;
  officerNotes?: string | null;
  applicantRemarks?: string | null;
  createdByUserId?: string | null;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
  approvalRecords?: ApprovalRecordEntity[];
  createdAt: Date;
  updatedAt: Date;
}
