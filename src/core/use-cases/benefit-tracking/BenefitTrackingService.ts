import { PrismaBenefitTrackingRepository } from "@/infrastructure/database/repositories/PrismaBenefitTrackingRepository";
import { PrismaApplicationRepository } from "@/infrastructure/database/repositories/PrismaApplicationRepository";
import { PrismaCitizenRepository } from "@/infrastructure/database/repositories/PrismaCitizenRepository";
import { PrismaBenefitProgramRepository } from "@/infrastructure/database/repositories/PrismaBenefitProgramRepository";
import { PrismaEstimateRepository } from "@/infrastructure/database/repositories/PrismaEstimateRepository";
import { ApplicationService } from "@/core/use-cases/applications/ApplicationService";
import { BenefitTrackingEntity } from "@/core/domain/entities/BenefitTracking";
import { BenefitTrackingStatus, BenefitTrackingSourceType, VulnerabilityLevel } from "@/core/domain/value-objects/enums";
import { BenefitCalculationSummary, BenefitEligibilityResult, EstimationOverviewItem } from "@/core/domain/value-objects/types";
import { BenefitEstimateRecord, IEstimateRepository } from "@/core/domain/repositories/IEstimateRepository";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export type { EstimationOverviewItem };

export class BenefitTrackingService {
    private trackingRepo = new PrismaBenefitTrackingRepository();
    private appRepo = new PrismaApplicationRepository();
    private citizenRepo = new PrismaCitizenRepository();
    private programRepo = new PrismaBenefitProgramRepository();
    private estimateRepo: IEstimateRepository = new PrismaEstimateRepository();
    private applicationService = new ApplicationService();

    public async getTrackings(params?: {
        status?: BenefitTrackingStatus;
        citizenId?: string;
        programId?: string;
        estimateId?: string;
        sourceType?: string;
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

    public async getTrackingsByEstimateId(estimateId: string): Promise<BenefitTrackingEntity[]> {
        return await this.trackingRepo.findByEstimateId(estimateId);
    }

    /**
     * บูรณาการ: เสนอขอรับสิทธิต่อจากผลประมาณการสิทธิและสวัสดิการ
     * สร้างคำขอ (Application) + รายการติดตาม (BenefitTracking สถานะ PROPOSED)
     * โดยเชื่อมโยงกลับไปยังผลประมาณการ (estimateId) แบบ end-to-end
     *
     * รองรับ 2 โหมด:
     *  - Mode A: มี estimateId อยู่แล้ว (เลือกจากรายการประมาณการที่บันทึกไว้)
     *  - Mode B: ส่ง calculation summary มาใหม่ (ระบบจะบันทึกผลประมาณการก่อน แล้วจึงเสนอขอ)
     */
    public async proposeFromEstimate(data: {
        estimateId?: string;
        summary?: BenefitCalculationSummary;
        programIds?: string[];
        notes?: string;
        citizenNationalId?: string;
        userId?: string;
        userName?: string;
    }): Promise<{ estimate: BenefitEstimateRecord; trackings: BenefitTrackingEntity[] }> {
        // 1) หา/บันทึกผลประมาณการสิทธิ
        let estimate: BenefitEstimateRecord | null = null;
        if (data.estimateId) {
            estimate = await this.estimateRepo.findById(data.estimateId);
            if (!estimate) {
                throw new Error("ไม่พบผลประมาณการสิทธิที่ระบุ (Estimate not found)");
            }
        } else if (data.summary) {
            estimate = await this.estimateRepo.create(data.summary);
        } else {
            throw new Error("ต้องระบุ estimateId หรือ summary ของผลประมาณการสิทธิ");
        }

        // 2) ระบุตัวตนผู้รับสิทธิ (Citizen) จากผลประมาณการ
        const citizen = await this.resolveCitizenFromEstimate(estimate, data.citizenNationalId);

        // 3) อ่านรายการสิทธิที่ผ่านเกณฑ์จากผลประมาณการ
        let eligiblePrograms: BenefitEligibilityResult[] = [];
        try {
            const parsed = JSON.parse(estimate.breakdownJson);
            if (Array.isArray(parsed)) eligiblePrograms = parsed;
        } catch {
            eligiblePrograms = [];
        }
        if (eligiblePrograms.length === 0) {
            throw new Error("ผลประมาณการสิทธิไม่มีรายการสิทธิที่ผ่านเกณฑ์");
        }

        const selectedPrograms = data.programIds?.length
            ? eligiblePrograms.filter((p) => data.programIds!.includes(p.programId))
            : eligiblePrograms;
        if (selectedPrograms.length === 0) {
            throw new Error("ไม่พบรายการสิทธิที่เลือกในผลประมาณการ");
        }

        // 4) สร้างคำขอ + รายการติดตามเชื่อมโยงกัน (Application + BenefitTracking)
        const trackings: BenefitTrackingEntity[] = [];
        for (const program of selectedPrograms) {
            // ตรวจสอบว่ามีการเสนอขอรายการนี้จากผลประมาณการเดียวกันไปแล้วหรือไม่ (กันการเสนอซ้ำ)
            const existing = await this.trackingRepo.findAll({
                estimateId: estimate.id,
                programId: program.programId,
                take: 1,
            });
            if (existing.trackings.length > 0) {
                trackings.push(existing.trackings[0]);
                continue;
            }

            // 4.1 สร้างคำขอรับสิทธิ (Application)
            const application = await this.applicationService.submitClaim({
                citizenId: citizen.id,
                programId: program.programId,
                requestedAmount: program.estimatedAmount,
                applicantRemarks:
                    data.notes ||
                    `เสนอขอรับสิทธิตามผลประมาณการสิทธิและสวัสดิการ${estimate.estimateNumber ? ` เลขที่ ${estimate.estimateNumber}` : ""}`,
                userId: data.userId,
                userName: data.userName,
            });

            // 4.2 สร้างรายการติดตามสถานะ (BenefitTracking) เชื่อมโยง estimate + application
            const tracking = await this.trackingRepo.create({
                applicationId: application.id,
                applicationNumber: application.applicationNumber,
                estimateId: estimate.id,
                estimateNumber: estimate.estimateNumber || null,
                sourceType: BenefitTrackingSourceType.ESTIMATE,
                citizenId: citizen.id,
                citizenName: `${citizen.title}${citizen.firstName} ${citizen.lastName}`,
                citizenNationalId: citizen.nationalId,
                citizenProvince: citizen.province,
                programId: program.programId,
                programName: program.programName,
                programCode: program.programCode,
                benefitName: program.programName,
                benefitCategory: program.category as any,
                requestedAmount: program.estimatedAmount,
                approvedAmount: null,
                disbursedAmount: null,
                status: BenefitTrackingStatus.PROPOSED,
                submissionDate: new Date(),
                expectedReceiveDate: null,
                paymentMethod: "โอนเงินผ่านบัญชีธนาคาร",
                bankName: null,
                bankAccountNumber: null,
                recipientName: null,
                notes: data.notes || null,
                officerNotes: null,
                documentsJson: JSON.stringify(program.requiredDocuments || []),
                createdByUserId: data.userId || null,
                createdByUserName: data.userName || null,
                updatedByUserId: null,
                updatedByUserName: null,
            });
            trackings.push(tracking);
        }

        await AuditLogger.log({
            userId: data.userId,
            userName: data.userName,
            action: "BENEFIT_PROPOSED_FROM_ESTIMATE",
            resource: "BenefitTracking",
            resourceId: trackings[0]?.id || estimate.id,
            details: {
                estimateId: estimate.id,
                estimateNumber: estimate.estimateNumber,
                citizenId: citizen.id,
                proposedPrograms: selectedPrograms.map((p) => ({
                    programId: p.programId,
                    programName: p.programName,
                    estimatedAmount: p.estimatedAmount,
                })),
                trackingNumbers: trackings.map((t) => t.trackingNumber),
            },
        });

        return { estimate, trackings };
    }

    /**
     * ภาพรวมบูรณาการ: ผลประมาณการสิทธิล่าสุด พร้อมสถานะการเสนอขอรับสิทธิของแต่ละรายการ
     */
    public async getEstimationOverview(limit = 20): Promise<EstimationOverviewItem[]> {
        const estimates = await this.estimateRepo.findRecent(limit);
        const overview: EstimationOverviewItem[] = [];

        for (const estimate of estimates) {
            let eligiblePrograms: BenefitEligibilityResult[] = [];
            try {
                const parsed = JSON.parse(estimate.breakdownJson);
                if (Array.isArray(parsed)) eligiblePrograms = parsed;
            } catch {
                eligiblePrograms = [];
            }

            const trackings = await this.trackingRepo.findByEstimateId(estimate.id);
            const proposedProgramIds = Array.from(new Set(trackings.map((t) => t.programId)));
            const totalRequestedAmount = trackings.reduce((sum, t) => sum + (t.requestedAmount || 0), 0);

            overview.push({
                estimate,
                eligiblePrograms,
                trackings,
                proposedProgramIds,
                totalRequestedAmount,
            });
        }

        return overview;
    }

    private async resolveCitizenFromEstimate(estimate: BenefitEstimateRecord, overrideNationalId?: string) {
        // ลำดับการค้นหา: citizenId -> เลขบัตรประชาชน -> สร้างใหม่แบบย่อ
        if (estimate.citizenId) {
            const byId = await this.citizenRepo.findById(estimate.citizenId);
            if (byId) return byId;
        }

        const nationalId = overrideNationalId || estimate.citizenNationalId || estimate.nationalId;
        if (nationalId) {
            const byNationalId = await this.citizenRepo.findByNationalId(nationalId);
            if (byNationalId) return byNationalId;
        }

        if (!nationalId) {
            throw new Error("ผลประมาณการสิทธิไม่มีเลขประจำตัวประชาชน จึงเชื่อมโยงผู้รับสิทธิไม่ได้");
        }

        // สร้างประชาชนใหม่แบบย่อจากข้อมูลผลประมาณการ (ปรับปรุงข้อมูลได้ภายหลัง)
        const age = estimate.calculatedAge || 60;
        const birthYear = new Date().getFullYear() - age;
        const created = await this.citizenRepo.create({
            nationalId,
            title: "นาย",
            firstName: "ผู้สูงอายุ",
            lastName: `ตามผลประมาณการ${estimate.estimateNumber ? ` ${estimate.estimateNumber}` : ""}`,
            dateOfBirth: new Date(birthYear, 0, 1),
            gender: "N/A",
            phone: null,
            email: null,
            address: "-",
            subdistrict: "-",
            district: "-",
            province: estimate.province || "-",
            postalCode: "-",
            monthlyIncome: estimate.inputMonthlyIncome || 0,
            hasStateWelfareCard: estimate.hasStateWelfareCard || false,
            isDisabilityRegistered: estimate.hasDisability || false,
            disabilityType: null,
            vulnerabilityScore: estimate.hardshipScore || 0,
            vulnerabilityLevel: (estimate.hardshipScore || 0) >= 60 ? VulnerabilityLevel.HIGH : VulnerabilityLevel.LOW,
            livingCondition: null,
        });
        return created;
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
            estimateId: null,
            estimateNumber: null,
            sourceType: BenefitTrackingSourceType.MANUAL,
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

    public async updateTracking(data: {
        trackingId: string;
        benefitName?: string;
        requestedAmount?: number;
        notes?: string;
        officerNotes?: string;
        expectedReceiveDate?: string;
        paymentMethod?: string;
        bankName?: string;
        bankAccountNumber?: string;
        recipientName?: string;
        updatedByUserId?: string;
        updatedByUserName?: string;
    }): Promise<BenefitTrackingEntity> {
        const updateData: any = {};
        if (data.benefitName !== undefined) updateData.benefitName = data.benefitName;
        if (data.requestedAmount !== undefined) updateData.requestedAmount = data.requestedAmount;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.officerNotes !== undefined) updateData.officerNotes = data.officerNotes;
        if (data.expectedReceiveDate !== undefined) updateData.expectedReceiveDate = data.expectedReceiveDate ? new Date(data.expectedReceiveDate) : null;
        if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
        if (data.bankName !== undefined) updateData.bankName = data.bankName;
        if (data.bankAccountNumber !== undefined) updateData.bankAccountNumber = data.bankAccountNumber;
        if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
        if (data.updatedByUserId !== undefined) updateData.updatedByUserId = data.updatedByUserId;

        const updated = await this.trackingRepo.update(data.trackingId, updateData);

        await AuditLogger.log({
            userId: data.updatedByUserId,
            userName: data.updatedByUserName,
            action: "TRACKING_UPDATED",
            resource: "BenefitTracking",
            resourceId: data.trackingId,
            details: {
                updatedFields: Object.keys(updateData),
            },
        });

        return updated;
    }

    public async deleteTracking(data: {
        trackingId: string;
        deletedByUserId?: string;
        deletedByUserName?: string;
    }): Promise<void> {
        const tracking = await this.trackingRepo.findById(data.trackingId);
        if (!tracking) {
            throw new Error("ไม่พบรายการติดตามสถานะที่ระบุ");
        }

        if (tracking.status === BenefitTrackingStatus.DISBURSED || tracking.status === BenefitTrackingStatus.RECEIVED) {
            throw new Error("ไม่สามารถลบรายการที่โอนเงินแล้วหรือได้รับสิทธิแล้วได้ กรุณายกเลิกรายการแทน");
        }

        await this.trackingRepo.delete(data.trackingId);

        await AuditLogger.log({
            userId: data.deletedByUserId,
            userName: data.deletedByUserName,
            action: "TRACKING_DELETED",
            resource: "BenefitTracking",
            resourceId: data.trackingId,
            details: {
                trackingNumber: tracking.trackingNumber,
                benefitName: tracking.benefitName,
                citizenName: tracking.citizenName,
                status: tracking.status,
                requestedAmount: tracking.requestedAmount,
            },
        });
    }
}
