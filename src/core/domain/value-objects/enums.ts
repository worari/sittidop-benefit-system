export enum Role {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  COMMANDER = "COMMANDER",
  AUDITOR = "AUDITOR",
  READONLY = "READONLY",
}

export enum BenefitCategory {
  LIVING_ALLOWANCE = "LIVING_ALLOWANCE",         // เบี้ยยังชีพผู้สูงอายุ
  DISABILITY_BENEFIT = "DISABILITY_BENEFIT",     // สิทธิความพิการ
  EMERGENCY_GRANT = "EMERGENCY_GRANT",           // เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก
  HOUSING_RENOVATION = "HOUSING_RENOVATION",     // ปรับปรุงสภาพแวดล้อมที่อยู่อาศัย
  FUNERAL_AID = "FUNERAL_AID",                   // เงินสงเคราะห์ค่าทำศพตามประเพณี
  OCCUPATIONAL_LOAN = "OCCUPATIONAL_LOAN",       // กองทุนผู้สูงอายุเพื่อการประกอบอาชีพ
  STATE_WELFARE_TOPUP = "STATE_WELFARE_TOPUP",   // สวัสดิการแห่งรัฐเสริม
}

export enum PaymentFrequency {
  MONTHLY = "MONTHLY",
  ONE_TIME = "ONE_TIME",
  ANNUAL = "ANNUAL",
  PER_OCCURRENCE = "PER_OCCURRENCE",
}

export enum ApplicationStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
}

export enum ApprovalDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  REQUEST_DOCUMENTS = "REQUEST_DOCUMENTS",
  FORWARD = "FORWARD",
}

export enum VulnerabilityLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
