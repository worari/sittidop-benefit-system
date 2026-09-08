import { IApplicationRepository } from "../../../core/domain/repositories/IApplicationRepository";
import { ApplicationEntity, ApprovalRecordEntity } from "../../../core/domain/entities/Application";
import { ApplicationStatus, ApprovalDecision } from "../../../core/domain/value-objects/enums";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaApplicationRepository implements IApplicationRepository {
  private mapDbItem(dbItem: any): ApplicationEntity {
    const latestApproval = (dbItem.approvalRecords || [])[0] || null;

    return {
      id: dbItem.id,
      applicationNumber: dbItem.applicationNumber,
      citizenId: dbItem.citizenId,
      citizenName: dbItem.citizen ? `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}` : undefined,
      citizenNationalId: dbItem.citizen?.nationalId,
      citizenProvince: dbItem.citizen?.province,
      programId: dbItem.programId,
      programName: dbItem.program?.thaiName,
      programDescription: dbItem.program?.description || null,
      programCategory: dbItem.program?.category,
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
      assignedOfficerName: dbItem.assignedOfficer?.name || null,
      reviewerName: latestApproval?.approverName || dbItem.assignedOfficer?.name || null,
      createdAt: dbItem.createdAt,
      updatedAt: dbItem.updatedAt,
      approvalRecords: (dbItem.approvalRecords || []).map((r: any) => ({
        id: r.id,
        applicationId: r.applicationId,
        approverId: r.approverId,
        approverName: r.approverName,
        previousStatus: r.previousStatus as unknown as ApplicationStatus,
        newStatus: r.newStatus as unknown as ApplicationStatus,
        decision: r.decision as unknown as ApprovalDecision,
        comments: r.comments,
        approvedAmount: r.approvedAmount,
        createdAt: r.actionTimestamp,
      })),
    };
  }

  async findById(id: string): Promise<ApplicationEntity | null> {
    try {
      const dbItem = await prisma.application.findUnique({
        where: { id },
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: {
            orderBy: { actionTimestamp: "desc" },
            take: 20,
          },
        },
      });
      if (dbItem) {
        return this.mapDbItem(dbItem);
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
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: { orderBy: { actionTimestamp: "desc" }, take: 1 },
        },
      });
      if (dbItem) {
        return this.mapDbItem(dbItem);
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
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: { orderBy: { actionTimestamp: "desc" }, take: 1 },
        },
        orderBy: { submissionDate: "desc" },
      });
      if (items.length > 0) return items.map((item) => this.mapDbItem(item));
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
      if (params?.province) where.citizen = { province: params.province };
      if (params?.search) {
        where.OR = [
          { applicationNumber: { contains: params.search, mode: "insensitive" } },
          { citizen: { firstName: { contains: params.search, mode: "insensitive" } } },
          { citizen: { lastName: { contains: params.search, mode: "insensitive" } } },
          { citizen: { nationalId: { contains: params.search, mode: "insensitive" } } },
          { program: { thaiName: { contains: params.search, mode: "insensitive" } } },
        ];
      }
      const [items, total] = await Promise.all([
        prisma.application.findMany({
          where,
          include: {
            citizen: true,
            program: true,
            assignedOfficer: true,
            approvalRecords: {
              orderBy: { actionTimestamp: "desc" },
              take: 1,
            },
          },
          skip: params?.skip ?? 0,
          take: params?.take ?? 50,
          orderBy: { submissionDate: "desc" },
        }),
        prisma.application.count({ where }),
      ]);
      if (items.length > 0) {
        const apps: ApplicationEntity[] = items.map((dbItem) => this.mapDbItem(dbItem));
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
          assignedOfficerId: newItem.assignedOfficerId,
          createdByUserId: newItem.createdByUserId,
        },
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: { orderBy: { actionTimestamp: "desc" }, take: 1 },
        },
      });
      if (dbItem) return this.mapDbItem(dbItem);
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
      const dbItem = await prisma.application.update({
        where: { id },
        data: {
          status: status as any,
          officerNotes: notes,
          approvedAmount: approvedAmount !== undefined ? approvedAmount : undefined,
          reviewDate: status === ApplicationStatus.UNDER_REVIEW || status === ApplicationStatus.DOCUMENT_VERIFIED ? new Date() : undefined,
          decisionDate: status === ApplicationStatus.APPROVED || status === ApplicationStatus.REJECTED || status === ApplicationStatus.DOCUMENT_VERIFIED ? new Date() : undefined,
          disbursementDate: status === ApplicationStatus.DISBURSED ? new Date() : undefined,
        },
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: { orderBy: { actionTimestamp: "desc" }, take: 20 },
        },
      });
      if (dbItem) {
        return this.mapDbItem(dbItem);
      }
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
    try {
      const dbItem = await prisma.approvalRecord.create({
        data: {
          applicationId: data.applicationId,
          approverId: data.approverId,
          approverName: data.approverName || "เจ้าหน้าที่ผู้พิจารณา",
          previousStatus: data.previousStatus as any,
          newStatus: data.newStatus as any,
          decision: data.decision as any,
          comments: data.comments,
          approvedAmount: data.approvedAmount,
        },
      });
      return {
        id: dbItem.id,
        applicationId: dbItem.applicationId,
        approverId: dbItem.approverId,
        approverName: dbItem.approverName,
        previousStatus: dbItem.previousStatus as unknown as ApplicationStatus,
        newStatus: dbItem.newStatus as unknown as ApplicationStatus,
        decision: dbItem.decision as unknown as ApprovalDecision,
        comments: dbItem.comments,
        approvedAmount: dbItem.approvedAmount,
        createdAt: dbItem.actionTimestamp,
      };
    } catch {
      // fallback
    }

    const record: ApprovalRecordEntity = {
      ...data,
      id: `rec-${Date.now()}`,
      createdAt: new Date(),
    };
    return record;
  }

  async countByStatus(): Promise<Record<ApplicationStatus, number>> {
    try {
      const grouped = await prisma.application.groupBy({
        by: ["status"],
        _count: { status: true },
      });
      const counts: Record<ApplicationStatus, number> = {
        [ApplicationStatus.DRAFT]: 0,
        [ApplicationStatus.SUBMITTED]: 0,
        [ApplicationStatus.UNDER_REVIEW]: 0,
        [ApplicationStatus.DOCUMENT_VERIFIED]: 0,
        [ApplicationStatus.APPROVED]: 0,
        [ApplicationStatus.REJECTED]: 0,
        [ApplicationStatus.DISBURSED]: 0,
      };

      grouped.forEach((row) => {
        const key = row.status as unknown as ApplicationStatus;
        counts[key] = row._count.status;
      });

      return counts;
    } catch {
      // fallback
    }

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

  async update(id: string, data: Partial<ApplicationEntity>): Promise<ApplicationEntity> {
    try {
      const dbItem = await prisma.application.update({
        where: { id },
        data: {
          programId: data.programId,
          requestedAmount: data.requestedAmount,
          applicantRemarks: data.applicantRemarks,
          documentsJson: data.documentsJson,
          officerNotes: data.officerNotes,
          status: data.status as any,
        },
        include: {
          citizen: true,
          program: true,
          assignedOfficer: true,
          approvalRecords: { orderBy: { actionTimestamp: "desc" }, take: 20 },
        },
      });
      return this.mapDbItem(dbItem);
    } catch {
      // fallback
    }

    const idx = storeManager.applications.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Application not found");
    storeManager.applications[idx] = {
      ...storeManager.applications[idx],
      ...data,
      updatedAt: new Date(),
    };
    return storeManager.applications[idx];
  }

  async remove(id: string): Promise<void> {
    try {
      await prisma.application.delete({ where: { id } });
      return;
    } catch {
      // fallback
    }

    const idx = storeManager.applications.findIndex((a) => a.id === id);
    if (idx !== -1) {
      storeManager.applications.splice(idx, 1);
      return;
    }

    throw new Error("Application not found");
  }
}
