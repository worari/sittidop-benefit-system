import { MilitaryPersonnelInput, BenefitCategoryCode } from "@/core/domain/value-objects/military-types";
import { MilitaryRuleEngine } from "@/core/use-cases/estimation/MilitaryRuleEngine";
import { militaryRuleRepository } from "./PrismaMilitaryRuleRepository";

export interface MilitaryPersonnelRecord extends MilitaryPersonnelInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedDocumentRecord {
  id: string;
  docNumber: string;
  title: string;
  personnelId: string;
  personnelName: string;
  rankWithAbbr: string;
  unit: string;
  lossType: string;
  totalLumpSum: number;
  monthlyPension: number;
  annualScholarship: number;
  commandingOfficer: string;
  officerPosition: string;
  issuedDate: string;
  qrVerifyCode: string;
  status: "DRAFT" | "APPROVED" | "OFFICIAL_ISSUED";
  createdAt: Date;
}

export const initialMilitaryPersonnel: MilitaryPersonnelRecord[] = [
  {
    id: "mil-001",
    militaryId: "MIL-49021884",
    citizenId: "3100600492811",
    rank: "LIEUTENANT_COLONEL",
    rankAbbr: "พ.ท.",
    firstName: "วีรชาติ",
    lastName: "ภักดีสยาม",
    militaryBranch: "ROYAL_THAI_ARMY",
    abbreviatedPosition: "ผบ.พัน.ร.1911",
    normalUnit: "ร.19 พัน.1 (พล.ร.9)",
    fieldPosition: "ผบ.ฉก.นราธิวาส 30",
    fieldUnit: "ฉก.นราธิวาส (กกล.ทบ.)",
    salary: 43500,
    salaryLevel: "น.3",
    salaryStep: 21.5,
    compensation: "พ.ช.ท.",
    compensationAmount: 5000,
    additionalPay: 2500,
    appointmentDate: "2010-05-01",
    multiplierDate: "2016-10-01",
    serviceYearsNormal: 16,
    serviceYearsMultiplier: 8,
    totalServiceYears: 24,
    missionType: "COUNTER_INSURGENCY",
    actionType: "DIRECT_COMBAT",
    incidentType: "COMBAT_ENGAGEMENT",
    incidentDate: "2026-03-12",
    lossType: "KIA_COMBAT_DEATH",
    promotionSteps: 7,
    promotedRank: "GENERAL",
    promotedRankAbbr: "พล.อ.",
    promotedSalary: 68500,
    spouse: {
      nationalId: "1100400289112",
      fullName: "นางพิมพา ภักดีสยาม",
      isLegallyMarried: true,
      hasPensionRights: true,
      allocationPercentage: 50,
    },
    children: [
      {
        nationalId: "1100400289113",
        fullName: "ด.ช.นราธิป ภักดีสยาม",
        age: 11,
        isStudying: true,
        educationLevel: "PRIMARY",
        allocationPercentage: 25,
      },
      {
        nationalId: "1100400289114",
        fullName: "น.ส.กานดา ภักดีสยาม",
        age: 19,
        isStudying: true,
        educationLevel: "BACHELOR",
        allocationPercentage: 25,
      },
    ],
    heirs: [
      {
        nationalId: "1100400289112",
        fullName: "นางพิมพา ภักดีสยาม",
        relationship: "SPOUSE_LEGAL",
        allocationPercentage: 50,
      },
      {
        nationalId: "1100400289113",
        fullName: "ด.ช.นราธิป ภักดีสยาม",
        relationship: "CHILD_LEGITIMATE",
        allocationPercentage: 25,
      },
      {
        nationalId: "3100600492800",
        fullName: "นายสมศักดิ์ ภักดีสยาม (บิดา)",
        relationship: "FATHER",
        allocationPercentage: 25,
      },
    ],
    createdAt: new Date("2026-03-15"),
    updatedAt: new Date(),
  },
  {
    id: "mil-002",
    militaryId: "MIL-52038190",
    citizenId: "3940100284712",
    rank: "CAPTAIN",
    rankAbbr: "ร.อ.",
    firstName: "ธนากร",
    lastName: "พิทักษ์แดน",
    militaryBranch: "ROYAL_THAI_ARMY",
    abbreviatedPosition: "ผบ.ร้อย.ร.112",
    normalUnit: "ร.11 พัน.2 (พล.ร.2 รอ.)",
    fieldPosition: "ผบ.มว.ปล. ฉก.ปัตตานี 25",
    fieldUnit: "ฉก.ปัตตานี",
    salary: 31200,
    salaryLevel: "น.2",
    salaryStep: 17.0,
    compensation: "พ.ค.ว.",
    compensationAmount: 3500,
    additionalPay: 2500,
    appointmentDate: "2015-08-01",
    multiplierDate: "2019-01-01",
    serviceYearsNormal: 11,
    serviceYearsMultiplier: 6,
    totalServiceYears: 17,
    missionType: "COUNTER_INSURGENCY",
    actionType: "IED_AMBUSH",
    incidentType: "LANDMINE_OR_IED",
    incidentDate: "2026-04-05",
    lossType: "TOTAL_PERMANENT_DISABILITY",
    promotionSteps: 5,
    promotedRank: "COLONEL",
    promotedRankAbbr: "พ.อ.",
    promotedSalary: 51200,
    spouse: {
      nationalId: "2940100284799",
      fullName: "นางสาวศิริพร พิทักษ์แดน",
      isLegallyMarried: true,
      hasPensionRights: true,
      allocationPercentage: 50,
    },
    children: [
      {
        nationalId: "1940100284701",
        fullName: "ด.ช.ธนพล พิทักษ์แดน",
        age: 7,
        isStudying: true,
        educationLevel: "PRIMARY",
        allocationPercentage: 25,
      },
    ],
    heirs: [
      {
        nationalId: "2940100284799",
        fullName: "นางสาวศิริพร พิทักษ์แดน",
        relationship: "SPOUSE_LEGAL",
        allocationPercentage: 50,
      },
      {
        nationalId: "1940100284701",
        fullName: "ด.ช.ธนพล พิทักษ์แดน",
        relationship: "CHILD_LEGITIMATE",
        allocationPercentage: 25,
      },
      {
        nationalId: "3940100284700",
        fullName: "นางจันทร์เพ็ญ พิทักษ์แดน (มารดา)",
        relationship: "MOTHER",
        allocationPercentage: 25,
      },
    ],
    createdAt: new Date("2026-04-10"),
    updatedAt: new Date(),
  },
  {
    id: "mil-003",
    militaryId: "MIL-58019941",
    citizenId: "1100500392811",
    rank: "MASTER_SERGEANT_1ST",
    rankAbbr: "จ.ส.อ.",
    firstName: "อนุสรณ์",
    lastName: "คงกระพัน",
    militaryBranch: "ROYAL_THAI_ARMY",
    abbreviatedPosition: "ผบ.หมู่ ปล.",
    normalUnit: "ร.31 พัน.3 รอ.",
    fieldPosition: "หน.ชุดลาดตระเวน กกล.สุรสีห์",
    fieldUnit: "กองกำลังสุรสีห์ (กาญจนบุรี)",
    salary: 28400,
    salaryLevel: "ป.3",
    salaryStep: 24.5,
    compensation: "พ.ส.ร.",
    compensationAmount: 2000,
    additionalPay: 2000,
    appointmentDate: "2012-02-01",
    multiplierDate: "2017-05-01",
    serviceYearsNormal: 14,
    serviceYearsMultiplier: 7,
    totalServiceYears: 21,
    missionType: "BORDER_DEFENSE",
    actionType: "PATROL_OPERATION",
    incidentType: "COMBAT_ENGAGEMENT",
    incidentDate: "2026-05-20",
    lossType: "KIA_COMBAT_DEATH",
    promotionSteps: 8,
    promotedRank: "MAJOR",
    promotedRankAbbr: "พ.ต.",
    promotedSalary: 45800,
    spouse: {
      nationalId: "1100500392812",
      fullName: "นางวรรณา คงกระพัน",
      isLegallyMarried: true,
      hasPensionRights: true,
      allocationPercentage: 50,
    },
    children: [
      {
        nationalId: "1100500392813",
        fullName: "นายอัครเดช คงกระพัน",
        age: 21,
        isStudying: true,
        educationLevel: "BACHELOR",
        allocationPercentage: 25,
      },
    ],
    heirs: [
      {
        nationalId: "1100500392812",
        fullName: "นางวรรณา คงกระพัน",
        relationship: "SPOUSE_LEGAL",
        allocationPercentage: 50,
      },
      {
        nationalId: "1100500392813",
        fullName: "นายอัครเดช คงกระพัน",
        relationship: "CHILD_LEGITIMATE",
        allocationPercentage: 25,
      },
      {
        nationalId: "1100500392800",
        fullName: "นายบุญส่ง คงกระพัน (บิดา)",
        relationship: "FATHER",
        allocationPercentage: 25,
      },
    ],
    createdAt: new Date("2026-05-22"),
    updatedAt: new Date(),
  },
  {
    id: "mil-004",
    militaryId: "MIL-62044810",
    citizenId: "1909800172641",
    rank: "SERGEANT",
    rankAbbr: "ส.อ.",
    firstName: "ปกรณ์",
    lastName: "หาญสงคราม",
    militaryBranch: "ROYAL_THAI_NAVY",
    abbreviatedPosition: "พลยิงอาวุธนำวิถี",
    normalUnit: "กองพันนาวิกโยธินที่ 1 (นย.ทร.)",
    fieldPosition: "ฉก.นย.ทร. 33",
    fieldUnit: "ฉก.นราธิวาส (ทร.)",
    salary: 21800,
    salaryLevel: "ป.2",
    salaryStep: 15.0,
    compensationAmount: 1500,
    additionalPay: 2500,
    appointmentDate: "2018-11-01",
    multiplierDate: "2021-01-01",
    serviceYearsNormal: 8,
    serviceYearsMultiplier: 4,
    totalServiceYears: 12,
    missionType: "COUNTER_INSURGENCY",
    actionType: "DIRECT_COMBAT",
    incidentType: "COMBAT_ENGAGEMENT",
    incidentDate: "2026-06-18",
    lossType: "KIA_COMBAT_DEATH",
    promotionSteps: 7,
    promotedRank: "CAPTAIN",
    promotedRankAbbr: "ร.อ.",
    promotedSalary: 38200,
    spouse: {
      nationalId: "1909800172642",
      fullName: "นางมณีรัตน์ หาญสงคราม",
      isLegallyMarried: true,
      hasPensionRights: true,
      allocationPercentage: 50,
    },
    children: [
      {
        nationalId: "1909800172643",
        fullName: "ด.ญ.กมลวรรณ หาญสงคราม",
        age: 4,
        isStudying: false,
        educationLevel: "OTHER",
        allocationPercentage: 25,
      },
    ],
    heirs: [
      {
        nationalId: "1909800172642",
        fullName: "นางมณีรัตน์ หาญสงคราม",
        relationship: "SPOUSE_LEGAL",
        allocationPercentage: 50,
      },
      {
        nationalId: "1909800172640",
        fullName: "นางสำราญ หาญสงคราม (มารดา)",
        relationship: "MOTHER",
        allocationPercentage: 50,
      },
    ],
    createdAt: new Date("2026-06-20"),
    updatedAt: new Date(),
  },
];

export const initialGeneratedDocuments: GeneratedDocumentRecord[] = [
  {
    id: "doc-001",
    docNumber: "กห-0201/2569-00142",
    title: "หนังสือรับรองและสรุปรายการประมาณการสิทธิกำลังพลผู้เสียชีวิตจากการปฏิบัติหน้าที่ราชการสนาม",
    personnelId: "mil-001",
    personnelName: "พ.ท. วีรชาติ ภักดีสยาม",
    rankWithAbbr: "พ.ท. (ปูนบำเหน็จ พล.อ.)",
    unit: "ร.19 พัน.1 / ฉก.นราธิวาส 30",
    lossType: "เสียชีวิตจากการสู้รบ (KIA)",
    totalLumpSum: 7491500,
    monthlyPension: 32880,
    annualScholarship: 47000,
    commandingOfficer: "พลโท สมโชค ชัยชนะ",
    officerPosition: "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)",
    issuedDate: "15 มีนาคม 2569",
    qrVerifyCode: "VERIFY-MIL-DOP-2569-00142-SECURE",
    status: "OFFICIAL_ISSUED",
    createdAt: new Date("2026-03-15"),
  },
  {
    id: "doc-002",
    docNumber: "กห-0201/2569-00188",
    title: "หนังสือสรุปประมาณการสิทธิกำลังพลทุพพลภาพจากการปฏิบัติราชการสงคราม",
    personnelId: "mil-002",
    personnelName: "ร.อ. ธนากร พิทักษ์แดน",
    rankWithAbbr: "ร.อ. (ปูนบำเหน็จ พ.อ.)",
    unit: "ร.11 พัน.2 / ฉก.ปัตตานี 25",
    lossType: "ทุพพลภาพถาวรจากการรบ (WIA)",
    totalLumpSum: 4890000,
    monthlyPension: 28500,
    annualScholarship: 12000,
    commandingOfficer: "พลโท สมโชค ชัยชนะ",
    officerPosition: "เจ้ากรมกำลังพลทหารบก (จก.กพ.ทบ.)",
    issuedDate: "10 เมษายน 2569",
    qrVerifyCode: "VERIFY-MIL-DOP-2569-00188-SECURE",
    status: "OFFICIAL_ISSUED",
    createdAt: new Date("2026-04-10"),
  },
];

export class MilitaryStore {
  public personnelList: MilitaryPersonnelRecord[] = [];
  public documents: GeneratedDocumentRecord[] = [];

  constructor() {
    this.personnelList = [...initialMilitaryPersonnel];
    this.documents = [...initialGeneratedDocuments];
  }

  public getAllPersonnel(): MilitaryPersonnelRecord[] {
    return [...this.personnelList];
  }

  public getPersonnelById(id: string): MilitaryPersonnelRecord | null {
    return this.personnelList.find((p) => p.id === id || p.militaryId === id) || null;
  }

  public createPersonnel(data: Omit<MilitaryPersonnelRecord, "id" | "createdAt" | "updatedAt">): MilitaryPersonnelRecord {
    const newRecord: MilitaryPersonnelRecord = {
      ...data,
      id: `mil-${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.personnelList.unshift(newRecord);
    return newRecord;
  }

  public updatePersonnel(id: string, data: Partial<MilitaryPersonnelRecord>): MilitaryPersonnelRecord {
    const idx = this.personnelList.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Personnel not found");
    this.personnelList[idx] = {
      ...this.personnelList[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.personnelList[idx];
  }

  public deletePersonnel(id: string): boolean {
    const idx = this.personnelList.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.personnelList.splice(idx, 1);
      return true;
    }
    return false;
  }

  public createDocument(doc: Omit<GeneratedDocumentRecord, "id" | "createdAt">): GeneratedDocumentRecord {
    const newDoc: GeneratedDocumentRecord = {
      ...doc,
      id: `doc-${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
    };
    this.documents.unshift(newDoc);
    return newDoc;
  }

  public getDocuments(): GeneratedDocumentRecord[] {
    return [...this.documents];
  }

  public calculateBenefitForPersonnel(personnelId: string) {
    const personnel = this.getPersonnelById(personnelId);
    if (!personnel) throw new Error("Personnel not found");
    const rules = militaryRuleRepository.getAllRules();
    return MilitaryRuleEngine.calculate(personnel, rules);
  }
}

const globalForMilitaryStore = globalThis as unknown as {
  militaryStore: MilitaryStore | undefined;
};

export const militaryStore = globalForMilitaryStore.militaryStore ?? new MilitaryStore();
if (process.env.NODE_ENV !== "production") globalForMilitaryStore.militaryStore = militaryStore;
