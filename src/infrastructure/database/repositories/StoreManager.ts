import { initialBenefitPrograms, initialCitizens, initialApplications, initialAuditLogs } from "@/infrastructure/seed/seed-data";
import { CitizenEntity } from "@/core/domain/entities/Citizen";
import { BenefitProgramEntity } from "@/core/domain/entities/BenefitProgram";
import { ApplicationEntity, ApprovalRecordEntity } from "@/core/domain/entities/Application";
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

    // Initialize Users
    const hashedAdmin = bcrypt.hashSync("admin1234", 10);
    const hashedOfficer = bcrypt.hashSync("officer1234", 10);
    const hashedAuditor = bcrypt.hashSync("auditor1234", 10);
    const hashedCitizen = bcrypt.hashSync("citizen1234", 10);

    this.users = [
      {
        id: "usr-admin",
        name: "ดร.วิชัย ศรีสุขสง่า",
        email: "admin@dop.go.th",
        passwordHash: hashedAdmin,
        role: Role.ADMIN,
        department: "กองส่งเสริมสวัสดิการและคุ้มครองสิทธิผู้สูงอายุ (DOP)",
        phone: "02-642-4336",
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-officer",
        name: "น.ส.กนกพร พัฒนไพบูลย์",
        email: "officer@dop.go.th",
        passwordHash: hashedOfficer,
        role: Role.OFFICER,
        department: "กลุ่มงานพิจารณาและอนุมัติสิทธิสวัสดิการ (Claims Unit)",
        phone: "02-642-4337",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-auditor",
        name: "นายภานุวัฒน์ ตรวจการดี",
        email: "auditor@dop.go.th",
        passwordHash: hashedAuditor,
        role: Role.AUDITOR,
        department: "กลุ่มงานตรวจสอบภายในและการกำกับดูแลภาครัฐ (Audit & Compliance)",
        phone: "02-642-4338",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "usr-citizen",
        name: "นายสมศักดิ์ มั่นคง",
        email: "citizen@dop.go.th",
        passwordHash: hashedCitizen,
        role: Role.CITIZEN,
        department: "ประชาชนผู้รับสวัสดิการ",
        phone: "081-456-7890",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        isActive: true,
        citizenId: "cit-001",
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
