import { PrismaBenefitTrackingRepository } from "@/infrastructure/database/repositories/PrismaBenefitTrackingRepository";
import { PrismaApplicationRepository } from "@/infrastructure/database/repositories/PrismaApplicationRepository";
import { PrismaCitizenRepository } from "@/infrastructure/database/repositories/PrismaCitizenRepository";
import { PrismaBenefitProgramRepository } from "@/infrastructure/database/repositories/PrismaBenefitProgramRepository";
import { BenefitTrackingEntity } from "@/core/domain/entities/BenefitTracking";
import { BenefitTrackingStatus } from "@/core/domain/value-objects/enums";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export class BenefitTrackingService {
    private trackingRepo = new PrismaBenefitTrackingRepository();
    private appRepo = new PrismaApplicationRepository();
    private citizenRepo = new PrismaCitizenRepository();
    private programRepo = new PrismaBenefitProgramRepository();

    public async getTrackings(params?: {
        status?: BenefitTrackingStatus;
        citizenId?: string;
        programId?: string;
        search?: string;
        skip?: number;
        take?: number;
    }) {
        return await this.trackingRepo.findAll(params);
    }

    public async getTrackingById(id: string): Promise<BenefitTrackingEntity | null> {
        return await this.trackingRepo.findById(id);
    }

    public async getTrackingsByCitizenId(citizenId: string): Promise<BenefitTrackingEntity[]> {
        return await this.trackingRepo.findByCitizenId(citizenId);
    }

    public async createTracking(data: {
        applicationId?: string;
        citizenId?: string;
        citizenNationalId?: string;
        programId: string;
        benefitName: string;
        requestedAmount: number;
        paymentMethod?: string;
        bankName?: string;
        bankAccountNumber?: string;
        recipientName?: string;
        notes?: string;
        expectedReceiveDate?: string;
        userId?: string;
        userName?: string;
    }): Promise<BenefitTrackingEntity> {
        let citizenId = data.citizenId;

        if (!citizenId && data.citizenNationalId) {
            const existing = await this.citizenRepo.findByNationalId(data.citizenNationalId);
            if (existing) citizenId = existing.id;
        }

        if (!citizenId && data.applicationId) {
            const app = await this.appRepo.findById(data.applicationId);
            if (app) citizenId = app.citizenId;
        }

        if (!citizenId) {
            throw new Error("Citizen not found");
        }

        const program = await this.programRepo.findById(data.programId);
        if (!program) {
            throw new Error("Benefit program not found");
        }

        const newTracking = await this.trackingRepo.create({
            applicationId: data.applicationId || null,
            citizenId,
            programId: data.programId,
            benefitName: data.benefitName || program.thaiName,
            benefitCategory: program.category as any,
            requestedAmount: data.requestedAmount,
            approvedAmount: null,
            disbursedAmount: null,
            status: BenefitTrackingStatus.PENDING,
            submissionDate: new Date(),
            expectedReceiveDate: data.expectedReceiveDate ? new Date(data.expectedReceiveDate) : null,
            paymentMethod: data.paymentMethod || "โอนเงินผ่านบัญชีธนาคาร",
            bankName: data.bankName || null,
            bankAccountNumber: data.bankAccountNumber || null,
            recipientName: data.recipientName || null,
            notes: data.notes || null,
            officerNotes: null,
            documentsJson: null,
            createdByUserId: data.userId || null,
            createdByUserName: data.userName || null,
            updatedByUserId: null,
            updatedByUserName: null,
        });

        await AuditLogger.log({
            userId: data.userId,
            userName: data.userName,
            action: "TRACKING_CREATED",
            resource: "BenefitTracking",
            resourceId: newTracking.id,
            details: {
                trackingNumber: newTracking.trackingNumber,
                citizenId: newTracking.citizenId,
                programId: newTracking.programId,
                requestedAmount: newTracking.requestedAmount,
            },
        });

        return newTracking;
    }

    public async updateTrackingStatus(data: {
        trackingId: string;
        status: BenefitTrackingStatus;
        approvedAmount?: number;
        disbursedAmount?: number;
        paymentReference?: string;
        paymentMethod?: string;
        bankName?: string;
        bankAccountNumber?: string;
        recipientName?: string;
        notes?: string;
        officerNotes?: string;
        expectedReceiveDate?: string;
        updatedByUserId?: string;
        updatedByUserName?: string;
        updatedByRole?: string;
    }): Promise<BenefitTrackingEntity> {
        const updates: any = {};
        if (data.approvedAmount !== undefined) updates.approvedAmount = data.approvedAmount;
        if (data.disbursedAmount !== undefined) updates.disbursedAmount = data.disbursedAmount;
        if (data.paymentReference !== undefined) updates.paymentReference = data.paymentReference;
        if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
        if (data.bankName !== undefined) updates.bankName = data.bankName;
        if (data.bankAccountNumber !== undefined) updates.bankAccountNumber = data.bankAccountNumber;
        if (data.recipientName !== undefined) updates.recipientName = data.recipientName;
        if (data.notes !== undefined) updates.notes = data.notes;
        if (data.officerNotes !== undefined) updates.officerNotes = data.officerNotes;
        if (data.expectedReceiveDate !== undefined) updates.expectedReceiveDate = new Date(data.expectedReceiveDate);

        const updated = await this.trackingRepo.updateStatus(data.trackingId, data.status, updates);

        await AuditLogger.log({
            userId: data.updatedByUserId,
            userName: data.updatedByUserName,
            role: data.updatedByRole,
            action: `TRACKING_${data.status}`,
            resource: "BenefitTracking",
            resourceId: data.trackingId,
            details: {
                newStatus: data.status,
                approvedAmount: data.approvedAmount,
                disbursedAmount: data.disbursedAmount,
                paymentReference: data.paymentReference,
                notes: data.notes,
                officerNotes: data.officerNotes,
            },
        });

        return updated;
    }

    public async getStatusCounts(): Promise<Record<BenefitTrackingStatus, number>> {
        return await this.trackingRepo.countByStatus();
    }
}
