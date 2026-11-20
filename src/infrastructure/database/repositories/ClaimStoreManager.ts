import { MilitaryPersonnelRecord, initialMilitaryPersonnel } from "./MilitaryStoreManager";

export type ClaimStage = "UNIT_SUBMISSION" | "DOP_VERIFICATION" | "PAYMENT_APPROVAL" | "DISBURSEMENT_SETTLED";

export type ClaimStatus =
  | "DRAFT"
  | "SUBMITTED_TO_DOP"
  | "RETURNED_FOR_EDIT"
  | "DOP_VERIFIED"
  | "PENDING_COMMANDER_APP"
  | "APPROVED_FOR_PAYMENT"
  | "PROCESSING_DISBURSEMENT"
  | "DISBURSED_COMPLETED"
  | "REJECTED";

export interface ClaimDocumentItem {
  id: string;
  code: string;
  title: string;
  category: "OFFICIAL" | "IDENTITY" | "FAMILY" | "MEDICAL" | "FINANCIAL" | "DELAY_REPORT" | "DOP_ADDITIONAL";
  isRequired: boolean;
  status: "ATTACHED" | "PENDING" | "REJECTED_BY_DOP" | "NOT_APPLICABLE";
  fileName?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  fileDataUrl?: string;
  uploadedByStage: ClaimStage;
  dopNotes?: string;
}

export interface ClaimHeirDisbursementItem {
  id: string;
  heirName: string;
  heirNationalId: string;
  relationship: string;
  allocatedPercent: number;
  allocatedAmount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bankBookScanUrl?: string;
  // Disbursed info
  disbursementChannel: "WELFARE_DEPT" | "INSURANCE_COMPANY" | "BOTH";
  isTransferred: boolean;
  transferredAmount?: number;
  transferredDateTime?: string;
  transactionRefNumber?: string;
  transferSlipUrl?: string;
  payerName?: string;
}

export interface BenefitClaimRecord {
  id: string;
  claimNumber: string;
  personnelId: string;
  personnelName: string;
  personnelRank: string;
  personnelMilitaryId: string;
  personnelCitizenId: string;
  submittingUnitName: string;
  submittingOfficerName: string;
  submittingOfficerPosition: string;
  submissionDate: string;
  
  // Timing & 30-day delay rule
  incidentDate: string;
  daysFromIncident: number;
  isDelayedOver30Days: boolean;
  delayReasonExplanation?: string;
  
  // Workflow Stage & Status
  currentStage: ClaimStage;
  status: ClaimStatus;
  
  // 4-Category Benefit Totals
  requestedLumpSum: number;
  requestedMonthly: number;
  requestedScholarship: number;
  requestedNonMonetary: string;
  
  // Step 2: DOP Verification
  dopReviewerName?: string;
  dopReviewedDate?: string;
  dopReturnComment?: string;
  dopRejectedDocCodes?: string[];
  
  // Step 3: Payment Approval
  approvalOrderNumber?: string;
  approverName?: string;
  approverPosition?: string;
  approvedDate?: string;
  approvedTotalAmount?: number;
  approvalNotes?: string;
  
  // Step 4: Disbursement & Insurance
  welfareDisbursed: boolean;
  welfareDisbursedDate?: string;
  welfareDisbursedAmount?: number;
  welfareSlipUrl?: string;
  welfareRefNo?: string;

  insuranceDisbursed: boolean;
  insuranceDisbursedDate?: string;
  insuranceDisbursedAmount?: number;
  insuranceSlipUrl?: string;
  insuranceRefNo?: string;
  insuranceCompanyName?: string;

  // Documents & Heirs
  documents: ClaimDocumentItem[];
  heirDisbursements: ClaimHeirDisbursementItem[];
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial 8 Standard Documents
export const INITIAL_REQUIRED_DOCUMENTS: Omit<ClaimDocumentItem, "id" | "status" | "uploadedByStage">[] = [
  {
    code: "DOC-1-DEATH-CERT",
    title: "ใบมรณบัตร (กรณีเสียชีวิต) หรือ ใบสำคัญความพิการ/ใบรับรองแพทย์",
    category: "MEDICAL",
    isRequired: true,
  },
  {
    code: "DOC-2-HOUSE-REG-DECEASED",
    title: "สำเนาทะเบียนบ้าน (ผู้ตาย) ที่ประทับตราจำหน่ายตาย",
    category: "IDENTITY",
    isRequired: true,
  },
  {
    code: "DOC-3-INTENT-LETTER",
    title: "หนังสือแสดงเจตนาระบุผู้รับเงินช่วยพิเศษ/บำเหน็จตกทอด (แบบ ทบ.)",
    category: "OFFICIAL",
    isRequired: true,
  },
  {
    code: "DOC-4-ID-RECIPIENT",
    title: "สำเนาบัตรประจำตัวประชาชน (ผู้รับเงิน/ทายาททุกคน)",
    category: "IDENTITY",
    isRequired: true,
  },
  {
    code: "DOC-5-HOUSE-REG-RECIPIENT",
    title: "สำเนาทะเบียนบ้าน (ผู้รับเงิน/ทายาททุกคน)",
    category: "IDENTITY",
    isRequired: true,
  },
  {
    code: "DOC-6-POLICE-REPORT",
    title: "สำเนาบันทึกประจำวันของตำรวจ / รายงานการสอบสวนคดี",
    category: "OFFICIAL",
    isRequired: true,
  },
  {
    code: "DOC-7-BANK-BOOK",
    title: "สำเนาสมุดบัญชีเงินฝากธนาคารของทายาทผู้มีสิทธิรับเงิน",
    category: "FINANCIAL",
    isRequired: true,
  },
  {
    code: "DOC-8-DELAY-REASON",
    title: "รายงานชี้แจงสาเหตุความล่าช้าจากหน่วยต้นสังกัด (กรณีเกิน 30 วัน)",
    category: "DELAY_REPORT",
    isRequired: false, // Conditioned if days > 30
  },
];

export const INITIAL_CLAIMS: BenefitClaimRecord[] = [
  {
    id: "claim-001",
    claimNumber: "RTA-CLAIM-2569-00101",
    personnelId: "mil-001",
    personnelName: "พ.ท. วีรชาติ ภักดีสยาม",
    personnelRank: "พ.ท.",
    personnelMilitaryId: "MIL-49021884",
    personnelCitizenId: "3100600492811",
    submittingUnitName: "ร.19 พัน.1 (พล.ร.9) / ฉก.นราธิวาส 30",
    submittingOfficerName: "ร.อ. ภาคภูมิ กล้าหาญ",
    submittingOfficerPosition: "นายทหารฝ่ายกำลังพล ฝอ.1",
    submissionDate: "2026-03-28T09:30:00.000Z",
    incidentDate: "2026-03-12",
    daysFromIncident: 16,
    isDelayedOver30Days: false,
    currentStage: "PAYMENT_APPROVAL",
    status: "PENDING_COMMANDER_APP",
    requestedLumpSum: 4250000,
    requestedMonthly: 38500,
    requestedScholarship: 60000,
    requestedNonMonetary: "บรรจุทายาททดแทน 1 อัตรา (น.ส.กานดา ภักดีสยาม)",
    dopReviewerName: "พ.อ. สมเกียรติ ยุติธรรม (กพ.ทบ.)",
    dopReviewedDate: "2026-03-29T11:00:00.000Z",
    welfareDisbursed: false,
    insuranceDisbursed: false,
    documents: [
      {
        id: "cdoc-1",
        code: "DOC-1-DEATH-CERT",
        title: "ใบมรณบัตร (กรณีเสียชีวิต) หรือ ใบสำคัญความพิการ/ใบรับรองแพทย์",
        category: "MEDICAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ใบมรณบัตร_พ.ท.วีรชาติ.pdf",
        fileSizeBytes: 420000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-2",
        code: "DOC-2-HOUSE-REG-DECEASED",
        title: "สำเนาทะเบียนบ้าน (ผู้ตาย) ที่ประทับตราจำหน่ายตาย",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ทะเบียนบ้าน_ผู้ตาย_จำหน่ายตาย.pdf",
        fileSizeBytes: 310000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-3",
        code: "DOC-3-INTENT-LETTER",
        title: "หนังสือแสดงเจตนาระบุผู้รับเงินช่วยพิเศษ/บำเหน็จตกทอด (แบบ ทบ.)",
        category: "OFFICIAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "หนังสือแสดงเจตนาผู้รับเงิน_ทบ.pdf",
        fileSizeBytes: 280000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-4",
        code: "DOC-4-ID-RECIPIENT",
        title: "สำเนาบัตรประจำตัวประชาชน (ผู้รับเงิน/ทายาททุกคน)",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "บัตรปชช_ทายาท3ท่าน.pdf",
        fileSizeBytes: 520000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-5",
        code: "DOC-5-HOUSE-REG-RECIPIENT",
        title: "สำเนาทะเบียนบ้าน (ผู้รับเงิน/ทายาททุกคน)",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ทะเบียนบ้าน_ทายาท.pdf",
        fileSizeBytes: 340000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-6",
        code: "DOC-6-POLICE-REPORT",
        title: "สำเนาบันทึกประจำวันของตำรวจ / รายงานการสอบสวนคดี",
        category: "OFFICIAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "สำเนาประจำวันคดี_สภ.เจาะไอร้อง.pdf",
        fileSizeBytes: 650000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-7",
        code: "DOC-7-BANK-BOOK",
        title: "สำเนาสมุดบัญชีเงินฝากธนาคารของทายาทผู้มีสิทธิรับเงิน",
        category: "FINANCIAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "หน้าสมุดบัญชี_TTB_นางพิมพา.pdf",
        fileSizeBytes: 290000,
        uploadedAt: "2026-03-28T09:00:00.000Z",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-8",
        code: "DOC-8-DELAY-REASON",
        title: "รายงานชี้แจงสาเหตุความล่าช้าจากหน่วยต้นสังกัด (กรณีเกิน 30 วัน)",
        category: "DELAY_REPORT",
        isRequired: false,
        status: "NOT_APPLICABLE",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-dop-1",
        code: "DOP-ADDITIONAL-ORDER",
        title: "คำสั่งปฏิบัติหน้าที่สนามเฉพาะกิจ (กพ.ทบ. แนบเพิ่มเติม)",
        category: "DOP_ADDITIONAL",
        isRequired: false,
        status: "ATTACHED",
        fileName: "คำสั่ง_ทภ.4_ปฏิบัติหน้าที่สนาม_รับรองสิทธิ.pdf",
        fileSizeBytes: 480000,
        uploadedAt: "2026-03-29T10:45:00.000Z",
        uploadedByStage: "DOP_VERIFICATION",
      },
    ],
    heirDisbursements: [
      {
        id: "heir-dis-1",
        heirName: "นางพิมพา ภักดีสยาม",
        heirNationalId: "1100400289112",
        relationship: "คู่สมรส",
        allocatedPercent: 50,
        allocatedAmount: 2125000,
        bankName: "ธนาคารทหารไทยธนชาต (TTB)",
        bankAccountNumber: "123-4-56789-0",
        bankAccountHolderName: "นางพิมพา ภักดีสยาม",
        disbursementChannel: "BOTH",
        isTransferred: false,
      },
      {
        id: "heir-dis-2",
        heirName: "ด.ช.นราธิป ภักดีสยาม",
        heirNationalId: "1100400289113",
        relationship: "บุตร",
        allocatedPercent: 25,
        allocatedAmount: 1062500,
        bankName: "ธนาคารกรุงไทย (KTB)",
        bankAccountNumber: "987-6-54321-0",
        bankAccountHolderName: "ด.ช.นราธิป ภักดีสยาม (โดยมารดา)",
        disbursementChannel: "BOTH",
        isTransferred: false,
      },
      {
        id: "heir-dis-3",
        heirName: "น.ส.กานดา ภักดีสยาม",
        heirNationalId: "1100400289114",
        relationship: "บุตร",
        allocatedPercent: 25,
        allocatedAmount: 1062500,
        bankName: "ธนาคารไทยพาณิชย์ (SCB)",
        bankAccountNumber: "555-2-33344-5",
        bankAccountHolderName: "น.ส.กานดา ภักดีสยาม",
        disbursementChannel: "BOTH",
        isTransferred: false,
      },
    ],
    createdAt: "2026-03-28T09:30:00.000Z",
    updatedAt: "2026-03-29T11:00:00.000Z",
  },
  {
    id: "claim-002",
    claimNumber: "RTA-CLAIM-2569-00102",
    personnelId: "mil-002",
    personnelName: "จ.ส.อ. ธนกฤต มั่นคง",
    personnelRank: "จ.ส.อ.",
    personnelMilitaryId: "MIL-52019941",
    personnelCitizenId: "3100600778899",
    submittingUnitName: "กรม ทพ.41",
    submittingOfficerName: "ร.ท. ธีรเดช สุขสวัสดิ์",
    submittingOfficerPosition: "นายทหารกำลังพล",
    submissionDate: "2026-03-20T14:00:00.000Z",
    incidentDate: "2026-01-15",
    daysFromIncident: 64, // > 30 days
    isDelayedOver30Days: true,
    delayReasonExplanation: "เนื่องจากอยู่ในพื้นที่ปฏิบัติการห่างไกล ทายาทติดภารกิจติดตามเรื่องมรณบัตรและเอกสารชันสูตรพลิกศพจากโรงพยาบาลศูนย์ยะลา จึงส่งเรื่องเกินกำหนด 30 วัน",
    currentStage: "DOP_VERIFICATION",
    status: "RETURNED_FOR_EDIT",
    requestedLumpSum: 2850000,
    requestedMonthly: 24500,
    requestedScholarship: 30000,
    requestedNonMonetary: "สิทธิบรรจุทายาททดแทน 1 อัตรา",
    dopReviewerName: "พ.อ. สมเกียรติ ยุติธรรม (กพ.ทบ.)",
    dopReviewedDate: "2026-03-22T10:30:00.000Z",
    dopReturnComment: "สำเนาสมุดบัญชีเงินฝากของทายาท (DOC-7) ภาพถ่ายไม่ชัดเจน ไม่เห็นเลขที่บัญชี 10 หลัก และหนังสือแสดงเจตนาระบุผู้รับเงิน (DOC-3) ยังขาดลายมือชื่อพยาน 2 ท่าน กรุณาแก้ไขและยื่นใหม่",
    dopRejectedDocCodes: ["DOC-3-INTENT-LETTER", "DOC-7-BANK-BOOK"],
    welfareDisbursed: false,
    insuranceDisbursed: false,
    documents: [
      {
        id: "cdoc-201",
        code: "DOC-1-DEATH-CERT",
        title: "ใบมรณบัตร",
        category: "MEDICAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ใบมรณบัตร_จสอ_ธนกฤต.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-202",
        code: "DOC-2-HOUSE-REG-DECEASED",
        title: "สำเนาทะเบียนบ้าน (ผู้ตาย)",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ทะเบียนบ้าน_จสอ_ธนกฤต.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-203",
        code: "DOC-3-INTENT-LETTER",
        title: "หนังสือแสดงเจตนาระบุผู้รับเงิน",
        category: "OFFICIAL",
        isRequired: true,
        status: "REJECTED_BY_DOP",
        fileName: "หนังสือแสดงเจตนา_ขาดพยาน.pdf",
        dopNotes: "ขาดลายมือชื่อพยาน 2 ท่าน",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-204",
        code: "DOC-4-ID-RECIPIENT",
        title: "สำเนาบัตร ปชช. ผู้รับเงิน",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "บัตรปชช_ทายาท.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-205",
        code: "DOC-5-HOUSE-REG-RECIPIENT",
        title: "สำเนาทะเบียนบ้าน ผู้รับเงิน",
        category: "IDENTITY",
        isRequired: true,
        status: "ATTACHED",
        fileName: "ทะเบียนบ้าน_ทายาท.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-206",
        code: "DOC-6-POLICE-REPORT",
        title: "สำเนาสอบสวนตำรวจ",
        category: "OFFICIAL",
        isRequired: true,
        status: "ATTACHED",
        fileName: "บันทึกประจำวันคดี_สภ_บันนังสตา.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-207",
        code: "DOC-7-BANK-BOOK",
        title: "สำเนาสมุดบัญชีเงินฝาก",
        category: "FINANCIAL",
        isRequired: true,
        status: "REJECTED_BY_DOP",
        fileName: "สมุดบัญชี_รูปเบลอ.pdf",
        dopNotes: "ภาพไม่ชัดเจน ไม่เห็นเลขที่บัญชี 10 หลัก",
        uploadedByStage: "UNIT_SUBMISSION",
      },
      {
        id: "cdoc-208",
        code: "DOC-8-DELAY-REASON",
        title: "รายงานชี้แจงสาเหตุความล่าช้า (กรณีเกิน 30 วัน)",
        category: "DELAY_REPORT",
        isRequired: true,
        status: "ATTACHED",
        fileName: "รายงานชี้แจงสาเหตุความล่าช้า_ผบ_กรมทพ41.pdf",
        uploadedByStage: "UNIT_SUBMISSION",
      },
    ],
    heirDisbursements: [
      {
        id: "heir-dis-201",
        heirName: "นางสมศรี มั่นคง",
        heirNationalId: "3100600112233",
        relationship: "คู่สมรส",
        allocatedPercent: 100,
        allocatedAmount: 2850000,
        bankName: "ธนาคารกรุงไทย (KTB)",
        bankAccountNumber: "987-0-12345-6",
        bankAccountHolderName: "นางสมศรี มั่นคง",
        disbursementChannel: "BOTH",
        isTransferred: false,
      },
    ],
    createdAt: "2026-03-20T14:00:00.000Z",
    updatedAt: "2026-03-22T10:30:00.000Z",
  },
  {
    id: "claim-003",
    claimNumber: "RTA-CLAIM-2569-00089",
    personnelId: "mil-003",
    personnelName: "ส.อ. ณัฐวุฒิ สมบูรณ์",
    personnelRank: "ส.อ.",
    personnelMilitaryId: "MIL-58012399",
    personnelCitizenId: "1409900223344",
    submittingUnitName: "ม.พัน.14 (พล.ม.1)",
    submittingOfficerName: "พ.ต. กฤษดา ศรีสุข",
    submittingOfficerPosition: "นายทหารสวัสดิการ",
    submissionDate: "2026-02-10T10:00:00.000Z",
    incidentDate: "2026-01-20",
    daysFromIncident: 21,
    isDelayedOver30Days: false,
    currentStage: "DISBURSEMENT_SETTLED",
    status: "DISBURSED_COMPLETED",
    requestedLumpSum: 2200000,
    requestedMonthly: 18500,
    requestedScholarship: 0,
    requestedNonMonetary: "บรรจุทายาททดแทน (บิดา-มารดาไม่มีบุตร ขอส่งชื่อน้องชาย)",
    dopReviewerName: "พ.อ. สมเกียรติ ยุติธรรม (กพ.ทบ.)",
    dopReviewedDate: "2026-02-15T09:00:00.000Z",
    approvalOrderNumber: "กห 0401/1825 ลว. 20 ก.พ. 69",
    approverName: "พล.ท. วิชัย สิทธิศาสตร์",
    approverPosition: "เจ้ากรมกำลังพลทหารบก",
    approvedDate: "2026-02-20T14:30:00.000Z",
    approvedTotalAmount: 2200000,
    welfareDisbursed: true,
    welfareDisbursedDate: "2026-02-25T10:30:00.000Z",
    welfareDisbursedAmount: 1200000,
    welfareRefNo: "KTB-WELFARE-25690225-8812",
    insuranceDisbursed: true,
    insuranceDisbursedDate: "2026-02-26T15:20:00.000Z",
    insuranceDisbursedAmount: 1000000,
    insuranceRefNo: "MTL-INS-69-029141",
    insuranceCompanyName: "บมจ.เมืองไทยประกันชีวิต (ประกันภัยกำลังพล ทบ.)",
    documents: [],
    heirDisbursements: [
      {
        id: "heir-dis-301",
        heirName: "นายประเสริฐ สมบูรณ์",
        heirNationalId: "3100600998877",
        relationship: "บิดา",
        allocatedPercent: 50,
        allocatedAmount: 1100000,
        bankName: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
        bankAccountNumber: "020-1-23456-7",
        bankAccountHolderName: "นายประเสริฐ สมบูรณ์",
        disbursementChannel: "BOTH",
        isTransferred: true,
        transferredAmount: 1100000,
        transferredDateTime: "2026-02-26T15:20:00.000Z",
        transactionRefNumber: "TX-690226-0011",
      },
      {
        id: "heir-dis-302",
        heirName: "นางมาลี สมบูรณ์",
        heirNationalId: "3100600998878",
        relationship: "มารดา",
        allocatedPercent: 50,
        allocatedAmount: 1100000,
        bankName: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
        bankAccountNumber: "020-1-23456-8",
        bankAccountHolderName: "นางมาลี สมบูรณ์",
        disbursementChannel: "BOTH",
        isTransferred: true,
        transferredAmount: 1100000,
        transferredDateTime: "2026-02-26T15:20:00.000Z",
        transactionRefNumber: "TX-690226-0012",
      },
    ],
    createdAt: "2026-02-10T10:00:00.000Z",
    updatedAt: "2026-02-26T16:00:00.000Z",
  },
];

class ClaimStoreManagerClass {
  private claims: BenefitClaimRecord[] = [...INITIAL_CLAIMS];

  public getAll(): BenefitClaimRecord[] {
    return this.claims;
  }

  public getById(id: string): BenefitClaimRecord | undefined {
    return this.claims.find((c) => c.id === id || c.claimNumber === id);
  }

  public create(payload: Partial<BenefitClaimRecord>): BenefitClaimRecord {
    const claimNumber = `RTA-CLAIM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    
    // Check 30-day delay rule
    let daysFromIncident = 0;
    let isDelayed = false;
    if (payload.incidentDate) {
      const incDate = new Date(payload.incidentDate).getTime();
      const currDate = new Date().getTime();
      daysFromIncident = Math.max(0, Math.floor((currDate - incDate) / (1000 * 60 * 60 * 24)));
      isDelayed = daysFromIncident > 30;
    }

    const newClaim: BenefitClaimRecord = {
      id: `claim-${Date.now()}`,
      claimNumber,
      personnelId: payload.personnelId || "mil-001",
      personnelName: payload.personnelName || "กำลังพลผู้สูญเสีย",
      personnelRank: payload.personnelRank || "พ.ท.",
      personnelMilitaryId: payload.personnelMilitaryId || "MIL-99999",
      personnelCitizenId: payload.personnelCitizenId || "1234567890123",
      submittingUnitName: payload.submittingUnitName || "หน่วยต้นสังกัด ทบ.",
      submittingOfficerName: payload.submittingOfficerName || "นายทหารกำลังพล",
      submittingOfficerPosition: payload.submittingOfficerPosition || "ฝอ.1",
      submissionDate: now,
      incidentDate: payload.incidentDate || now.split("T")[0],
      daysFromIncident,
      isDelayedOver30Days: isDelayed,
      delayReasonExplanation: payload.delayReasonExplanation || "",
      currentStage: "DOP_VERIFICATION",
      status: "SUBMITTED_TO_DOP",
      requestedLumpSum: payload.requestedLumpSum || 0,
      requestedMonthly: payload.requestedMonthly || 0,
      requestedScholarship: payload.requestedScholarship || 0,
      requestedNonMonetary: payload.requestedNonMonetary || "บรรจุทายาททดแทน 1 อัตรา",
      welfareDisbursed: false,
      insuranceDisbursed: false,
      documents: payload.documents || [],
      heirDisbursements: payload.heirDisbursements || [],
      notes: payload.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    this.claims.unshift(newClaim);
    return newClaim;
  }

  // Step 2: DOP Verification (กพ.ทบ. ตรวจสอบเอกสาร)
  public verifyByDOP(
    claimId: string,
    action: "ACCEPT" | "RETURN_FOR_EDIT",
    reviewerName: string,
    options?: {
      returnComment?: string;
      rejectedDocCodes?: string[];
      additionalDoc?: ClaimDocumentItem;
    }
  ): BenefitClaimRecord | null {
    const claim = this.getById(claimId);
    if (!claim) return null;

    const now = new Date().toISOString();
    claim.dopReviewerName = reviewerName;
    claim.dopReviewedDate = now;
    claim.updatedAt = now;

    if (options?.additionalDoc) {
      claim.documents.push(options.additionalDoc);
    }

    if (action === "ACCEPT") {
      claim.currentStage = "PAYMENT_APPROVAL";
      claim.status = "PENDING_COMMANDER_APP";
      claim.dopReturnComment = undefined;
      claim.dopRejectedDocCodes = undefined;
      // Mark verified
      claim.documents = claim.documents.map((d) => ({ ...d, status: d.status === "REJECTED_BY_DOP" ? "ATTACHED" : d.status }));
    } else {
      claim.currentStage = "DOP_VERIFICATION";
      claim.status = "RETURNED_FOR_EDIT";
      claim.dopReturnComment = options?.returnComment || "เอกสารไม่ครบถ้วน กรุณาตรวจสอบและแนบเพิ่ม";
      claim.dopRejectedDocCodes = options?.rejectedDocCodes || [];
      if (options?.rejectedDocCodes) {
        claim.documents = claim.documents.map((d) =>
          options.rejectedDocCodes?.includes(d.code) ? { ...d, status: "REJECTED_BY_DOP" } : d
        );
      }
    }

    return claim;
  }

  // Step 3: Payment Approval (ขออนุมัติจ่ายเงิน)
  public approvePayment(
    claimId: string,
    orderNumber: string,
    approverName: string,
    approverPosition: string,
    approvedAmount: number,
    notes?: string
  ): BenefitClaimRecord | null {
    const claim = this.getById(claimId);
    if (!claim) return null;

    const now = new Date().toISOString();
    claim.currentStage = "DISBURSEMENT_SETTLED";
    claim.status = "APPROVED_FOR_PAYMENT";
    claim.approvalOrderNumber = orderNumber;
    claim.approverName = approverName;
    claim.approverPosition = approverPosition;
    claim.approvedDate = now;
    claim.approvedTotalAmount = approvedAmount;
    claim.approvalNotes = notes;
    claim.updatedAt = now;

    return claim;
  }

  // Step 4: Disbursement & Insurance (สก.ทบ. และ บ.ประกัน โอนเงิน)
  public recordDisbursement(
    claimId: string,
    type: "WELFARE" | "INSURANCE" | "BOTH",
    payload: {
      amount: number;
      refNumber: string;
      slipUrl?: string;
      insuranceCompany?: string;
      heirAccountIds?: string[];
    }
  ): BenefitClaimRecord | null {
    const claim = this.getById(claimId);
    if (!claim) return null;

    const now = new Date().toISOString();
    if (type === "WELFARE" || type === "BOTH") {
      claim.welfareDisbursed = true;
      claim.welfareDisbursedDate = now;
      claim.welfareDisbursedAmount = payload.amount;
      claim.welfareRefNo = payload.refNumber;
      claim.welfareSlipUrl = payload.slipUrl;
    }

    if (type === "INSURANCE" || type === "BOTH") {
      claim.insuranceDisbursed = true;
      claim.insuranceDisbursedDate = now;
      claim.insuranceDisbursedAmount = payload.amount;
      claim.insuranceRefNo = payload.refNumber;
      claim.insuranceSlipUrl = payload.slipUrl;
      claim.insuranceCompanyName = payload.insuranceCompany || "บมจ.เมืองไทยประกันชีวิต (ประกันภัย ทบ.)";
    }

    // Update heir status
    if (payload.heirAccountIds && payload.heirAccountIds.length > 0) {
      claim.heirDisbursements = claim.heirDisbursements.map((h) =>
        payload.heirAccountIds?.includes(h.id)
          ? {
              ...h,
              isTransferred: true,
              transferredAmount: h.allocatedAmount,
              transferredDateTime: now,
              transactionRefNumber: payload.refNumber,
            }
          : h
      );
    } else {
      claim.heirDisbursements = claim.heirDisbursements.map((h) => ({
        ...h,
        isTransferred: true,
        transferredAmount: h.allocatedAmount,
        transferredDateTime: now,
        transactionRefNumber: payload.refNumber,
      }));
    }

    // Check if fully disbursed
    if (claim.welfareDisbursed && claim.insuranceDisbursed) {
      claim.status = "DISBURSED_COMPLETED";
    } else {
      claim.status = "PROCESSING_DISBURSEMENT";
    }

    claim.updatedAt = now;
    return claim;
  }
}

export const claimStoreManager = new ClaimStoreManagerClass();
