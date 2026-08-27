import { BenefitTrackingEntity } from "../entities/BenefitTracking";
import { BenefitTrackingStatus } from "../value-objects/enums";

export interface IBenefitTrackingRepository {
    findById(id: string): Promise<BenefitTrackingEntity | null>;
    findByTrackingNumber(trackingNumber: string): Promise<BenefitTrackingEntity | null>;
    findByCitizenId(citizenId: string): Promise<BenefitTrackingEntity[]>;
    findByApplicationId(applicationId: string): Promise<BenefitTrackingEntity[]>;
    findAll(params?: {
        status?: BenefitTrackingStatus;
        citizenId?: string;
        programId?: string;
        search?: string;
        skip?: number;
        take?: number;
    }): Promise<{ trackings: BenefitTrackingEntity[]; total: number }>;
    create(data: Omit<BenefitTrackingEntity, "id" | "trackingNumber" | "createdAt" | "updatedAt">): Promise<BenefitTrackingEntity>;
    updateStatus(
        id: string,
        status: BenefitTrackingStatus,
        updates?: {
            approvedAmount?: number;
            disbursedAmount?: number;
            paymentReference?: string;
            paymentMethod?: string;
            bankName?: string;
            bankAccountNumber?: string;
            recipientName?: string;
            notes?: string;
            officerNotes?: string;
            expectedReceiveDate?: Date;
        }
    ): Promise<BenefitTrackingEntity>;
    countByStatus(): Promise<Record<BenefitTrackingStatus, number>>;
}
