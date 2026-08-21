import { IApplicationRepository } from "../../../core/domain/repositories/IApplicationRepository";
import { ApplicationEntity, ApprovalRecordEntity } from "../../../core/domain/entities/Application";
import { ApplicationStatus, ApprovalDecision } from "../../../core/domain/value-objects/enums";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaApplicationRepository implements IApplicationRepository {
  async findById(id: string): Promise<ApplicationEntity | null> {
    try {
      const dbItem = await prisma.application.findUnique({
        where: { id },
        include: { citizen: true, program: true, approvalRecords: true },
      });
      if (dbItem) {
        return {
          id: dbItem.id,
          applicationNumber: dbItem.applicationNumber,
          citizenId: dbItem.citizenId,
          citizenName: `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}`,
          citizenNationalId: dbItem.citizen.nationalId,
          citizenProvince: dbItem.citizen.province,
          programId: dbItem.programId,
          programName: dbItem.program.thaiName,
          programCategory: dbItem.program.category,
          requestedAmount: dbItem.requestedAmount,
          approvedAmount: dbItem.approvedAmount,
          status: dbItem.status as unknown as ApplicationStatus,
          submissionDate: dbItem.submissionDate,
          decisionDate: dbItem.decisionDate,
          disbursementDate: dbItem.disbursementDate,
          documentsJson: dbItem.documentsJson,
          officerNotes: dbItem.officerNotes,
          applicantRemarks: dbItem.applicantRemarks,
          createdByUserId: dbItem.createdByUserId,
          assignedOfficerId: dbItem.assignedOfficerId,
          createdAt: dbItem.createdAt,
          updatedAt: dbItem.updatedAt,
        };
      }
    } catch {
      // fallback
    }

    const item = storeManager.applications.find((a) => a.id === id);
    return item || null;
  }

  async findByApplicationNumber(applicationNumber: string): Promise<ApplicationEntity | null> {
    try {
      const dbItem = await prisma.application.findUnique({
        where: { applicationNumber },
        include: { citizen: true, program: true },
      });
      if (dbItem) {
        return {
          ...dbItem,
          status: dbItem.status as unknown as ApplicationStatus,
          citizenName: `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}`,
        };
      }
    } catch {
      // fallback
    }
    const item = storeManager.applications.find((a) => a.applicationNumber === applicationNumber);
    return item || null;
  }

  async findByCitizenId(citizenId: string): Promise<ApplicationEntity[]> {
    try {
      const items = await prisma.application.findMany({
        where: { citizenId },
        include: { program: true },
        orderBy: { submissionDate: "desc" },
      });
      if (items.length > 0) return items as unknown as ApplicationEntity[];
    } catch {
      // fallback
    }

    return storeManager.applications.filter((a) => a.citizenId === citizenId);
  }

  async findAll(params?: {
    status?: ApplicationStatus;
    programId?: string;
    province?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ applications: ApplicationEntity[]; total: number }> {
    try {
      const where: any = {};
      if (params?.status) where.status = params.status;
      if (params?.programId) where.programId = params.programId;
      if (params?.search) {
        where.OR = [
          { applicationNumber: { contains: params.search } },
          { citizen: { firstName: { contains: params.search } } },
          { citizen: { lastName: { contains: params.search } } },
          { citizen: { nationalId: { contains: params.search } } },
        ];
      }
      const [items, total] = await Promise.all([
        prisma.application.findMany({
          where,
          include: { citizen: true, program: true },
          skip: params?.skip ?? 0,
          take: params?.take ?? 50,
          orderBy: { submissionDate: "desc" },
        }),
        prisma.application.count({ where }),
      ]);
      if (items.length > 0) {
        const apps: ApplicationEntity[] = items.map((dbItem) => ({
          id: dbItem.id,
          applicationNumber: dbItem.applicationNumber,
          citizenId: dbItem.citizenId,
          citizenName: `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}`,
          citizenNationalId: dbItem.citizen.nationalId,
          citizenProvince: dbItem.citizen.province,
          programId: dbItem.programId,
          programName: dbItem.program.thaiName,
          programCategory: dbItem.program.category,
          requestedAmount: dbItem.requestedAmount,
          approvedAmount: dbItem.approvedAmount,
          status: dbItem.status as unknown as ApplicationStatus,
          submissionDate: dbItem.submissionDate,
          decisionDate: dbItem.decisionDate,
          disbursementDate: dbItem.disbursementDate,
          documentsJson: dbItem.documentsJson,
          officerNotes: dbItem.officerNotes,
          applicantRemarks: dbItem.applicantRemarks,
          createdByUserId: dbItem.createdByUserId,
          assignedOfficerId: dbItem.assignedOfficerId,
          createdAt: dbItem.createdAt,
          updatedAt: dbItem.updatedAt,
        }));
        return { applications: apps, total };
      }
    } catch {
      // fallback
    }

    let filtered = [...storeManager.applications];
    if (params?.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params?.programId) {
      filtered = filtered.filter((a) => a.programId === params.programId);
    }
    if (params?.province) {
      filtered = filtered.filter((a) => a.citizenProvince === params.province);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.applicationNumber.toLowerCase().includes(s) ||
          (a.citizenName && a.citizenName.toLowerCase().includes(s)) ||
          (a.citizenNationalId && a.citizenNationalId.includes(s))
      );
    }

    const total = filtered.length;
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 50;
    const applications = filtered.slice(skip, skip + take);

    return { applications, total };
  }

  async create(data: Omit<ApplicationEntity, "id" | "createdAt" | "updatedAt">): Promise<ApplicationEntity> {
    const yearBE = new Date().getFullYear() + 543;
    const seq = (storeManager.applications.length + 1).toString().padStart(4, "0");
    const appNumber = data.applicationNumber || `APP-${yearBE}-${seq}`;

    const citizen = storeManager.citizens.find((c) => c.id === data.citizenId);
    const program = storeManager.programs.find((p) => p.id === data.programId);

    const newItem: ApplicationEntity = {
      ...data,
      id: `app-${Date.now().toString().slice(-6)}`,
      applicationNumber: appNumber,
      citizenName: citizen ? `${citizen.title}${citizen.firstName} ${citizen.lastName}` : "ผู้ยื่นคำขอ",
      citizenNationalId: citizen ? citizen.nationalId : "1100400289112",
      citizenProvince: citizen ? citizen.province : "กรุงเทพมหานคร",
      programName: program ? program.thaiName : "โครงการสวัสดิการ",
      programCategory: program ? program.category : "LIVING_ALLOWANCE",
      status: data.status || ApplicationStatus.SUBMITTED,
      submissionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const dbItem = await prisma.application.create({
        data: {
          applicationNumber: newItem.applicationNumber,
          citizenId: newItem.citizenId,
          programId: newItem.programId,
          requestedAmount: newItem.requestedAmount,
          approvedAmount: newItem.approvedAmount,
          status: newItem.status as any,
          documentsJson: newItem.documentsJson,
          officerNotes: newItem.officerNotes,
          applicantRemarks: newItem.applicantRemarks,
        },
      });
      if (dbItem) return newItem;
    } catch {
      // fallback
    }

    storeManager.applications.unshift(newItem);
    return newItem;
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    notes?: string,
    approvedAmount?: number
  ): Promise<ApplicationEntity> {
    try {
      await prisma.application.update({
        where: { id },
        data: {
          status: status as any,
          officerNotes: notes,
          approvedAmount: approvedAmount !== undefined ? approvedAmount : undefined,
          decisionDate: status === ApplicationStatus.APPROVED || status === ApplicationStatus.REJECTED ? new Date() : undefined,
          disbursementDate: status === ApplicationStatus.DISBURSED ? new Date() : undefined,
        },
      });
    } catch {
      // fallback
    }

    const idx = storeManager.applications.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Application not found");

    const app = storeManager.applications[idx];
    app.status = status;
    if (notes) app.officerNotes = notes;
    if (approvedAmount !== undefined) app.approvedAmount = approvedAmount;
    if (status === ApplicationStatus.APPROVED || status === ApplicationStatus.REJECTED) {
      app.decisionDate = new Date();
    }
    if (status === ApplicationStatus.DISBURSED) {
      app.disbursementDate = new Date();
    }
    app.updatedAt = new Date();

    return app;
  }

  async addApprovalRecord(data: Omit<ApprovalRecordEntity, "id" | "createdAt">): Promise<ApprovalRecordEntity> {
    const record: ApprovalRecordEntity = {
      ...data,
      id: `rec-${Date.now()}`,
      createdAt: new Date(),
    };
    return record;
  }

  async countByStatus(): Promise<Record<ApplicationStatus, number>> {
    const counts: Record<ApplicationStatus, number> = {
      [ApplicationStatus.DRAFT]: 0,
      [ApplicationStatus.SUBMITTED]: 0,
      [ApplicationStatus.UNDER_REVIEW]: 0,
      [ApplicationStatus.DOCUMENT_VERIFIED]: 0,
      [ApplicationStatus.APPROVED]: 0,
      [ApplicationStatus.REJECTED]: 0,
      [ApplicationStatus.DISBURSED]: 0,
    };

    storeManager.applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });

    return counts;
  }
}
