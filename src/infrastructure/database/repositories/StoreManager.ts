import { initialBenefitPrograms, initialCitizens, initialApplications, initialAuditLogs } from "@/infrastructure/seed/seed-data";
import { CitizenEntity } from "@/core/domain/entities/Citizen";
import { BenefitProgramEntity } from "@/core/domain/entities/BenefitProgram";
import { ApplicationEntity, ApprovalRecordEntity } from "@/core/domain/entities/Application";
import { BenefitTrackingEntity } from "@/core/domain/entities/BenefitTracking";
import { UserEntity } from "@/core/domain/entities/User";
import { AuditLogEntity } from "@/core/domain/entities/AuditLog";
import { BenefitEstimateRecord } from "@/core/domain/repositories/IEstimateRepository";
import { Role, ApplicationStatus, ApprovalDecision, VulnerabilityLevel } from "@/core/domain/value-objects/enums";
import bcrypt from "bcryptjs";

/**
 * Enterprise In-Memory Data Store (Single-Source-of-Truth with Live State Management)
 */
class EnterpriseStore {
  public citizens: CitizenEntity[] = [];
  public programs: BenefitProgramEntity[] = [];
  public applications: ApplicationEntity[] = [];
  public benefitTrackings: BenefitTrackingEntity[] = [];
  public users: (UserEntity & { passwordHash: string })[] = [];
  public estimates: BenefitEstimateRecord[] = [];
  public auditLogs: AuditLogEntity[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    if (this.isInitialized) return;

    // Initialize Programs
    this.programs = initialBenefitPrograms.map((p: any) => ({
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Initialize Citizens
    this.citizens = initialCitizens.map((c: any) => ({
      ...c,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Initialize Users for the 6 RBAC Roles
    const hashedSuperAdmin = bcrypt.hashSync("superadmin1234", 10);
    const hashedAdmin = bcrypt.hashSync("admin1234", 10);
    const hashedStaff = bcrypt.hashSync("staff1234", 10);
    const hashedCommander = bcrypt.hashSync("commander1234", 10);
    const hashedAuditor = bcrypt.hashSync("auditor1234", 10);
    const hashedReadOnly = bcrypt.hashSync("readonly1234", 10);

    this.users = [
      {
        id: "usr-admin-army",
        name: "พันเอก พงศกร พิทักษ์สิทธิ์",
        email: "admin@army.mod.go.th",
        passwordHash: hashedAdmin,
        role: Role.ADMIN,
        department: "กรมกำลังพลทหารบก (กพ.ทบ.)",
        phone: "02-225-7002",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-commander-army",
        name: "พันตรี นพดล สายสวัสดิการ",
        email: "commander@army.mod.go.th",
        passwordHash: hashedCommander,
        role: Role.COMMANDER,
        department: "กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล",
        phone: "02-225-7003",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-commander-army",
        name: "พลโท สมโชค ชัยชนะ",
        email: "commander@army.mod.go.th",
        passwordHash: hashedCommander,
        role: Role.COMMANDER,
        department: "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)",
        phone: "02-225-7004",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-auditor-army",
        name: "พันเอก พิษณุ ตรวจการดี",
        email: "auditor@army.mod.go.th",
        passwordHash: hashedAuditor,
        role: Role.AUDITOR,
        department: "สำนักงานตรวจสอบภายในทหารบก (สตส.ทบ.)",
        phone: "02-225-7005",
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-readonly-army",
        name: "สิบเอก สันติ ผู้รับสิทธิ",
        email: "readonly@army.mod.go.th",
        passwordHash: hashedReadOnly,
        role: Role.READONLY,
        department: "กำลังพล / ครอบครัวและทายาท ทบ.",
        phone: "02-225-7006",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Aliases & Mod accounts for backwards compatibility
      {
        id: "usr-admin-alias",
        name: "พันเอก พงศกร พิทักษ์สิทธิ์",
        email: "admin@mod.go.th",
        passwordHash: hashedAdmin,
        role: Role.ADMIN,
        department: "กรมกำลังพลทหารบก (กพ.ทบ.)",
        phone: "02-225-7002",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-admin-dop",
        name: "ผู้ดูแลระบบกลาง",
        email: "admin@dop.go.th",
        passwordHash: hashedAdmin,
        role: Role.ADMIN,
        department: "กรมกำลังพลทหารบก (กพ.ทบ.)",
        phone: "02-225-7002",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Initialize Applications
    this.applications = initialApplications.map((app: any) => {
      const citizen = this.citizens.find((c) => c.id === app.citizenId);
      const program = this.programs.find((p) => p.id === app.programId);
      return {
        ...app,
        citizenName: citizen ? `${citizen.title}${citizen.firstName} ${citizen.lastName}` : "ผู้ยื่นคำขอ",
        citizenNationalId: citizen ? citizen.nationalId : "1100400289112",
        citizenProvince: citizen ? citizen.province : "กรุงเทพมหานคร",
        programName: program ? program.thaiName : "โครงการสวัสดิการ",
        programCategory: program ? program.category : "LIVING_ALLOWANCE",
        assignedOfficerId: "usr-officer",
        assignedOfficerName: "น.ส.กนกพร พัฒนไพบูลย์",
        createdAt: app.submissionDate,
        updatedAt: new Date(),
      };
    });

    // Initialize Benefit Tracking from applications
    this.benefitTrackings = this.applications.slice(0, 6).map((app, idx) => {
      const statuses = [
        ApplicationStatus.APPROVED,
        ApplicationStatus.DISBURSED,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.REJECTED,
        ApplicationStatus.APPROVED,
      ];
      const status = statuses[idx % statuses.length];
      return {
        id: `trk-${Date.now().toString().slice(-6)}-${idx}`,
        trackingNumber: `TRK-${new Date().getFullYear() + 543}-${(idx + 1).toString().padStart(4, "0")}`,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        citizenId: app.citizenId,
        citizenName: app.citizenName,
        citizenNationalId: app.citizenNationalId,
        citizenProvince: app.citizenProvince,
        programId: app.programId,
        programName: app.programName,
        programCode: `PROG-${(idx + 1).toString().padStart(3, "0")}`,
        benefitName: app.programName || "สิทธิประโยชน์",
        benefitCategory: (app.programCategory as any) || "LIVING_ALLOWANCE",
        requestedAmount: app.requestedAmount,
        approvedAmount: status === ApplicationStatus.REJECTED ? null : app.requestedAmount * 0.9,
        disbursedAmount: status === ApplicationStatus.DISBURSED ? app.requestedAmount * 0.9 : null,
        status: status as any,
        submissionDate: app.submissionDate,
        approvalDate: [ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED].includes(status) ? new Date() : null,
        disbursementDate: status === ApplicationStatus.DISBURSED ? new Date() : null,
        receivedDate: status === ApplicationStatus.DISBURSED ? new Date() : null,
        rejectionDate: status === ApplicationStatus.REJECTED ? new Date() : null,
        expectedReceiveDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentReference: status === ApplicationStatus.DISBURSED ? `PAY-${idx + 1}` : null,
        paymentMethod: "โอนเงินผ่านบัญชีธนาคาร",
        bankName: "ธนาคารกรุงไทย",
        bankAccountNumber: "123-4-56789-0",
        recipientName: app.citizenName,
        notes: "ติดตามสถานะรายการสิทธิประโยชน์",
        officerNotes: null,
        documentsJson: null,
        createdByUserId: "usr-staff-army",
        createdByUserName: "พันตรี นพดล สายสวัสดิการ",
        updatedByUserId: null,
        updatedByUserName: null,
        createdAt: app.submissionDate,
        updatedAt: new Date(),
      };
    });

    // Initialize Audit Logs
    this.auditLogs = [...initialAuditLogs];

    this.isInitialized = true;
  }

  public resetToDefault() {
    this.isInitialized = false;
    this.initialize();
  }
}

const globalForStore = globalThis as unknown as {
  storeManager: EnterpriseStore | undefined;
};

export const storeManager = globalForStore.storeManager ?? new EnterpriseStore();
if (process.env.NODE_ENV !== "production") globalForStore.storeManager = storeManager;
