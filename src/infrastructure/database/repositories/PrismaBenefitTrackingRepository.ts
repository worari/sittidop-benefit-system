import { IBenefitTrackingRepository } from "../../../core/domain/repositories/IBenefitTrackingRepository";
import { BenefitTrackingEntity } from "../../../core/domain/entities/BenefitTracking";
import { BenefitTrackingStatus } from "../../../core/domain/value-objects/enums";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaBenefitTrackingRepository implements IBenefitTrackingRepository {
    private toEntity(dbItem: any): BenefitTrackingEntity {
        return {
            id: dbItem.id,
            trackingNumber: dbItem.trackingNumber,
            applicationId: dbItem.applicationId,
            applicationNumber: dbItem.application?.applicationNumber || null,
            citizenId: dbItem.citizenId,
            citizenName: dbItem.citizen ? `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}` : null,
            citizenNationalId: dbItem.citizen?.nationalId || null,
            citizenProvince: dbItem.citizen?.province || null,
            programId: dbItem.programId,
            programName: dbItem.program?.thaiName || null,
            programCode: dbItem.program?.code || null,
            benefitName: dbItem.benefitName,
            benefitCategory: dbItem.benefitCategory as any,
            requestedAmount: dbItem.requestedAmount,
            approvedAmount: dbItem.approvedAmount,
            disbursedAmount: dbItem.disbursedAmount,
            status: dbItem.status as unknown as BenefitTrackingStatus,
            submissionDate: dbItem.submissionDate,
            approvalDate: dbItem.approvalDate,
            disbursementDate: dbItem.disbursementDate,
            receivedDate: dbItem.receivedDate,
            rejectionDate: dbItem.rejectionDate,
            expectedReceiveDate: dbItem.expectedReceiveDate,
            paymentReference: dbItem.paymentReference,
            paymentMethod: dbItem.paymentMethod,
            bankName: dbItem.bankName,
            bankAccountNumber: dbItem.bankAccountNumber,
            recipientName: dbItem.recipientName,
            notes: dbItem.notes,
            officerNotes: dbItem.officerNotes,
            documentsJson: dbItem.documentsJson,
            createdByUserId: dbItem.createdByUserId,
            createdByUserName: dbItem.createdByUser?.name || null,
            updatedByUserId: dbItem.updatedByUserId,
            updatedByUserName: dbItem.updatedByUser?.name || null,
            createdAt: dbItem.createdAt,
            updatedAt: dbItem.updatedAt,
        };
    }

    async findById(id: string): Promise<BenefitTrackingEntity | null> {
        try {
            const dbItem = await prisma.benefitTracking.findUnique({
                where: { id },
                include: { citizen: true, program: true, application: true, createdByUser: true, updatedByUser: true },
            });
            if (dbItem) return this.toEntity(dbItem);
        } catch {
            // fallback
        }
        const item = storeManager.benefitTrackings.find((t) => t.id === id);
        return item || null;
    }

    async findByTrackingNumber(trackingNumber: string): Promise<BenefitTrackingEntity | null> {
        try {
            const dbItem = await prisma.benefitTracking.findUnique({
                where: { trackingNumber },
                include: { citizen: true, program: true, application: true },
            });
            if (dbItem) return this.toEntity(dbItem);
        } catch {
            // fallback
        }
        const item = storeManager.benefitTrackings.find((t) => t.trackingNumber === trackingNumber);
        return item || null;
    }

    async findByCitizenId(citizenId: string): Promise<BenefitTrackingEntity[]> {
        try {
            const items = await prisma.benefitTracking.findMany({
                where: { citizenId },
                include: { citizen: true, program: true, application: true },
                orderBy: { submissionDate: "desc" },
            });
            if (items.length > 0) return items.map((i: any) => this.toEntity(i));
        } catch {
            // fallback
        }
        return storeManager.benefitTrackings.filter((t) => t.citizenId === citizenId);
    }

    async findByApplicationId(applicationId: string): Promise<BenefitTrackingEntity[]> {
        try {
            const items = await prisma.benefitTracking.findMany({
                where: { applicationId },
                include: { citizen: true, program: true, application: true },
                orderBy: { submissionDate: "desc" },
            });
            if (items.length > 0) return items.map((i: any) => this.toEntity(i));
        } catch {
            // fallback
        }
        return storeManager.benefitTrackings.filter((t) => t.applicationId === applicationId);
    }

    async findAll(params?: {
        status?: BenefitTrackingStatus;
        citizenId?: string;
        programId?: string;
        search?: string;
        skip?: number;
        take?: number;
    }): Promise<{ trackings: BenefitTrackingEntity[]; total: number }> {
        try {
            const where: any = {};
            if (params?.status) where.status = params.status;
            if (params?.citizenId) where.citizenId = params.citizenId;
            if (params?.programId) where.programId = params.programId;
            if (params?.search) {
                where.OR = [
                    { trackingNumber: { contains: params.search } },
                    { benefitName: { contains: params.search } },
                    { citizen: { firstName: { contains: params.search } } },
                    { citizen: { lastName: { contains: params.search } } },
                    { citizen: { nationalId: { contains: params.search } } },
                ];
            }
            const [items, total] = await Promise.all([
                prisma.benefitTracking.findMany({
                    where,
                    include: { citizen: true, program: true, application: true, createdByUser: true, updatedByUser: true },
                    skip: params?.skip ?? 0,
                    take: params?.take ?? 50,
                    orderBy: { submissionDate: "desc" },
                }),
                prisma.benefitTracking.count({ where }),
            ]);
            if (items.length > 0) {
                return { trackings: items.map((i: any) => this.toEntity(i)), total };
            }
        } catch {
            // fallback
        }

        let filtered = [...storeManager.benefitTrackings];
        if (params?.status) filtered = filtered.filter((t) => t.status === params.status);
        if (params?.citizenId) filtered = filtered.filter((t) => t.citizenId === params.citizenId);
        if (params?.programId) filtered = filtered.filter((t) => t.programId === params.programId);
        if (params?.search) {
            const s = params.search.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.trackingNumber.toLowerCase().includes(s) ||
                    t.benefitName.toLowerCase().includes(s) ||
                    (t.citizenName && t.citizenName.toLowerCase().includes(s)) ||
                    (t.citizenNationalId && t.citizenNationalId.includes(s))
            );
        }
        const total = filtered.length;
        const skip = params?.skip ?? 0;
        const take = params?.take ?? 50;
        const trackings = filtered.slice(skip, skip + take);
        return { trackings, total };
    }

    async create(data: Omit<BenefitTrackingEntity, "id" | "trackingNumber" | "createdAt" | "updatedAt">): Promise<BenefitTrackingEntity> {
        const yearBE = new Date().getFullYear() + 543;
        const seq = (storeManager.benefitTrackings.length + 1).toString().padStart(4, "0");
        const trackingNumber = `TRK-${yearBE}-${seq}`;

        const citizen = storeManager.citizens.find((c) => c.id === data.citizenId);
        const program = storeManager.programs.find((p) => p.id === data.programId);
        const application = data.applicationId ? storeManager.applications.find((a) => a.id === data.applicationId) : null;

        const newItem: BenefitTrackingEntity = {
            ...data,
            id: `trk-${Date.now().toString().slice(-6)}`,
            trackingNumber,
            applicationNumber: application?.applicationNumber || null,
            citizenName: citizen ? `${citizen.title}${citizen.firstName} ${citizen.lastName}` : "ผู้รับสิทธิ",
            citizenNationalId: citizen?.nationalId || null,
            citizenProvince: citizen?.province || null,
            programName: program?.thaiName || "โครงการสวัสดิการ",
            programCode: program?.code || null,
            status: data.status || BenefitTrackingStatus.PENDING,
            submissionDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            const dbItem = await prisma.benefitTracking.create({
                data: {
                    trackingNumber: newItem.trackingNumber,
                    applicationId: newItem.applicationId,
                    citizenId: newItem.citizenId,
                    programId: newItem.programId,
                    benefitName: newItem.benefitName,
                    benefitCategory: newItem.benefitCategory as any,
                    requestedAmount: newItem.requestedAmount,
                    approvedAmount: newItem.approvedAmount,
                    disbursedAmount: newItem.disbursedAmount,
                    status: newItem.status as any,
                    submissionDate: newItem.submissionDate,
                    expectedReceiveDate: newItem.expectedReceiveDate,
                    paymentMethod: newItem.paymentMethod,
                    bankName: newItem.bankName,
                    bankAccountNumber: newItem.bankAccountNumber,
                    recipientName: newItem.recipientName,
                    notes: newItem.notes,
                    officerNotes: newItem.officerNotes,
                    documentsJson: newItem.documentsJson,
                    createdByUserId: newItem.createdByUserId,
                },
            });
            if (dbItem) return newItem;
        } catch {
            // fallback
        }

        storeManager.benefitTrackings.unshift(newItem);
        return newItem;
    }

    async updateStatus(
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
    ): Promise<BenefitTrackingEntity> {
        const now = new Date();
        const dataToUpdate: any = { status: status as any };

        if (updates?.approvedAmount !== undefined) dataToUpdate.approvedAmount = updates.approvedAmount;
        if (updates?.disbursedAmount !== undefined) dataToUpdate.disbursedAmount = updates.disbursedAmount;
        if (updates?.paymentReference !== undefined) dataToUpdate.paymentReference = updates.paymentReference;
        if (updates?.paymentMethod !== undefined) dataToUpdate.paymentMethod = updates.paymentMethod;
        if (updates?.bankName !== undefined) dataToUpdate.bankName = updates.bankName;
        if (updates?.bankAccountNumber !== undefined) dataToUpdate.bankAccountNumber = updates.bankAccountNumber;
        if (updates?.recipientName !== undefined) dataToUpdate.recipientName = updates.recipientName;
        if (updates?.notes !== undefined) dataToUpdate.notes = updates.notes;
        if (updates?.officerNotes !== undefined) dataToUpdate.officerNotes = updates.officerNotes;
        if (updates?.expectedReceiveDate !== undefined) dataToUpdate.expectedReceiveDate = updates.expectedReceiveDate;

        if (status === BenefitTrackingStatus.APPROVED) dataToUpdate.approvalDate = now;
        if (status === BenefitTrackingStatus.DISBURSED) dataToUpdate.disbursementDate = now;
        if (status === BenefitTrackingStatus.RECEIVED) dataToUpdate.receivedDate = now;
        if (status === BenefitTrackingStatus.REJECTED) dataToUpdate.rejectionDate = now;

        try {
            await prisma.benefitTracking.update({ where: { id }, data: dataToUpdate });
        } catch {
            // fallback
        }

        const idx = storeManager.benefitTrackings.findIndex((t) => t.id === id);
        if (idx === -1) throw new Error("BenefitTracking not found");

        const tracking = storeManager.benefitTrackings[idx];
        tracking.status = status;
        if (updates?.approvedAmount !== undefined) tracking.approvedAmount = updates.approvedAmount;
        if (updates?.disbursedAmount !== undefined) tracking.disbursedAmount = updates.disbursedAmount;
        if (updates?.paymentReference !== undefined) tracking.paymentReference = updates.paymentReference;
        if (updates?.paymentMethod !== undefined) tracking.paymentMethod = updates.paymentMethod;
        if (updates?.bankName !== undefined) tracking.bankName = updates.bankName;
        if (updates?.bankAccountNumber !== undefined) tracking.bankAccountNumber = updates.bankAccountNumber;
        if (updates?.recipientName !== undefined) tracking.recipientName = updates.recipientName;
        if (updates?.notes !== undefined) tracking.notes = updates.notes;
        if (updates?.officerNotes !== undefined) tracking.officerNotes = updates.officerNotes;
        if (updates?.expectedReceiveDate !== undefined) tracking.expectedReceiveDate = updates.expectedReceiveDate;
        if (status === BenefitTrackingStatus.APPROVED) tracking.approvalDate = now;
        if (status === BenefitTrackingStatus.DISBURSED) tracking.disbursementDate = now;
        if (status === BenefitTrackingStatus.RECEIVED) tracking.receivedDate = now;
        if (status === BenefitTrackingStatus.REJECTED) tracking.rejectionDate = now;
        tracking.updatedAt = now;

        return tracking;
    }

    async countByStatus(): Promise<Record<BenefitTrackingStatus, number>> {
        const counts: Record<BenefitTrackingStatus, number> = {
            [BenefitTrackingStatus.PENDING]: 0,
            [BenefitTrackingStatus.UNDER_REVIEW]: 0,
            [BenefitTrackingStatus.APPROVED]: 0,
            [BenefitTrackingStatus.DISBURSED]: 0,
            [BenefitTrackingStatus.RECEIVED]: 0,
            [BenefitTrackingStatus.REJECTED]: 0,
            [BenefitTrackingStatus.CANCELLED]: 0,
        };

        try {
            const dbCounts = await prisma.benefitTracking.groupBy({ by: ["status"], _count: { status: true } });
            dbCounts.forEach((c: any) => {
                if (counts[c.status as BenefitTrackingStatus] !== undefined) {
                    counts[c.status as BenefitTrackingStatus] = c._count.status;
                }
            });
            return counts;
        } catch {
            // fallback
        }

        storeManager.benefitTrackings.forEach((t) => {
            if (counts[t.status] !== undefined) counts[t.status]++;
        });
        return counts;
    }
}
