import { Role } from "../value-objects/enums";

export enum Permission {
  // User Management
  MANAGE_USERS = "MANAGE_USERS",
  VIEW_USERS = "VIEW_USERS",

  // Personnel Management
  MANAGE_PERSONNEL = "MANAGE_PERSONNEL",
  VIEW_PERSONNEL = "VIEW_PERSONNEL",

  // Family & Heirs
  MANAGE_FAMILY = "MANAGE_FAMILY",
  VIEW_FAMILY = "VIEW_FAMILY",

  // Rules & Calculation Formulas
  MANAGE_RULES = "MANAGE_RULES",
  VIEW_RULES = "VIEW_RULES",
  EXECUTE_CALCULATION = "EXECUTE_CALCULATION",

  // Documents
  SIGN_DOCUMENTS = "SIGN_DOCUMENTS",
  EXPORT_DOCUMENTS = "EXPORT_DOCUMENTS",
  VIEW_DOCUMENTS = "VIEW_DOCUMENTS",

  // Excel Import
  IMPORT_EXCEL = "IMPORT_EXCEL",

  // Reports & Analytics
  VIEW_REPORTS = "VIEW_REPORTS",
  EXPORT_REPORTS = "EXPORT_REPORTS",

  // Audit Logs & Security
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  MANAGE_SYSTEM = "MANAGE_SYSTEM",
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPERADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.MANAGE_PERSONNEL,
    Permission.VIEW_PERSONNEL,
    Permission.MANAGE_FAMILY,
    Permission.VIEW_FAMILY,
    Permission.MANAGE_RULES,
    Permission.VIEW_RULES,
    Permission.EXECUTE_CALCULATION,
    Permission.SIGN_DOCUMENTS,
    Permission.EXPORT_DOCUMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.IMPORT_EXCEL,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SYSTEM,
  ],

  [Role.ADMIN]: [
    Permission.VIEW_USERS,
    Permission.MANAGE_PERSONNEL,
    Permission.VIEW_PERSONNEL,
    Permission.MANAGE_FAMILY,
    Permission.VIEW_FAMILY,
    Permission.MANAGE_RULES,
    Permission.VIEW_RULES,
    Permission.EXECUTE_CALCULATION,
    Permission.SIGN_DOCUMENTS,
    Permission.EXPORT_DOCUMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.IMPORT_EXCEL,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [Role.STAFF]: [
    Permission.MANAGE_PERSONNEL,
    Permission.VIEW_PERSONNEL,
    Permission.MANAGE_FAMILY,
    Permission.VIEW_FAMILY,
    Permission.VIEW_RULES,
    Permission.EXECUTE_CALCULATION,
    Permission.EXPORT_DOCUMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.IMPORT_EXCEL,
    Permission.VIEW_REPORTS,
  ],

  [Role.COMMANDER]: [
    Permission.VIEW_PERSONNEL,
    Permission.VIEW_FAMILY,
    Permission.VIEW_RULES,
    Permission.EXECUTE_CALCULATION,
    Permission.SIGN_DOCUMENTS,
    Permission.EXPORT_DOCUMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
  ],

  [Role.AUDITOR]: [
    Permission.VIEW_PERSONNEL,
    Permission.VIEW_FAMILY,
    Permission.VIEW_RULES,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [Role.READONLY]: [
    Permission.VIEW_PERSONNEL,
    Permission.VIEW_FAMILY,
    Permission.VIEW_RULES,
    Permission.EXECUTE_CALCULATION,
    Permission.VIEW_DOCUMENTS,
  ],
};

export const RouteAccessRules: { path: string; roles: Role[] }[] = [
  { path: "/dashboard", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/personnel", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/family", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/heirs", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/calculator", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/rules", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.AUDITOR] },
  { path: "/documents", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY] },
  { path: "/import", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF] },
  { path: "/reports", roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR] },
  { path: "/users", roles: [Role.SUPERADMIN, Role.ADMIN] },
  { path: "/audit-logs", roles: [Role.SUPERADMIN, Role.AUDITOR] },
];

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
}

export function canAccessPath(role: Role, path: string): boolean {
  const rule = RouteAccessRules.find((r) => r.path === path || (r.path !== "/dashboard" && path.startsWith(r.path)));
  if (!rule) return true;
  return rule.roles.includes(role);
}

export const RoleDescriptions: Record<
  Role,
  { thaiTitle: string; englishTitle: string; badgeColor: string; description: string }
> = {
  [Role.SUPERADMIN]: {
    thaiTitle: "ผู้ดูแลระบบสูงสุด",
    englishTitle: "Super Administrator",
    badgeColor: "bg-red-600 text-white",
    description: "มีสิทธิ์เข้าถึง จัดการผู้ใช้งาน ระบบความปลอดภัย และฐานข้อมูลทั้งหมดอย่างสมบูรณ์",
  },
  [Role.ADMIN]: {
    thaiTitle: "ผู้ดูแลระบบกำลังพล",
    englishTitle: "Administrator",
    badgeColor: "bg-purple-600 text-white",
    description: "บริหารจัดการกำลังพล ครอบครัว กฎเกณฑ์สูตรคำนวณ ออกเอกสาร และนำเข้าข้อมูล",
  },
  [Role.STAFF]: {
    thaiTitle: "เจ้าหน้าที่ฝ่ายกำลังพล / ธุรการ",
    englishTitle: "Staff Officer",
    badgeColor: "bg-emerald-600 text-white",
    description: "บันทึกทะเบียนกำลังพล ครอบครัว คำนวณสิทธิ นำเข้า Excel และเตรียมร่างหนังสือรับรอง",
  },
  [Role.COMMANDER]: {
    thaiTitle: "ผู้บังคับบัญชา / ผู้อนุมัติ",
    englishTitle: "Commander / Approver",
    badgeColor: "bg-amber-600 text-white",
    description: "พิจารณาอนุมัติสิทธิ ลงนามหนังสือรับรองทางการ (e-Signature) และดูรายงานสถิติภาพรวม",
  },
  [Role.AUDITOR]: {
    thaiTitle: "ผู้ตรวจสอบภายใน / สตง.",
    englishTitle: "Internal Auditor",
    badgeColor: "bg-blue-600 text-white",
    description: "ตรวจสอบความโปร่งใส ดูบันทึกประวัติการทำงาน (Audit Trail) และรายงานงบประมาณ",
  },
  [Role.READONLY]: {
    thaiTitle: "กำลังพล / ทายาท (อ่านอย่างเดียว)",
    englishTitle: "Read Only Viewer",
    badgeColor: "bg-slate-500 text-white",
    description: "ดูข้อมูลสิทธิประโยชน์ส่วนบุคคล ผลการคำนวณ และหนังสือรับรองที่ออกแล้ว",
  },
};
