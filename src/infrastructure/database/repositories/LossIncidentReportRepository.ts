import { prisma } from "@/infrastructure/database/prisma";

export type LossType = "DECEASED" | "DISABLED" | "INJURED"; // เสียชีวิต | พิการทุพพลภาพ | บาดเจ็บ

export interface IncidentCasualty {
  id: string;
  personnelId?: string | null;
  militaryId: string;
  citizenId?: string | null;        // เลขประจำตัวประชาชน ๑๓ หลัก
  rankAbbr: string;
  fullName: string;
  unit?: string | null;
  normalPosition?: string | null;    // ตำแหน่งปกติ เช่น ผบ.พัน.ร.๑๙๑๑
  normalUnit?: string | null;        // สังกัดปกติ เช่น ร.๑๙ พัน.๑ (พล.ร.๙)
  fieldPosition?: string | null;     // ตำแหน่งในสนาม เช่น ผบ.ฉก.นราธิวาส ๓๐
  fieldUnit?: string | null;         // หน่วยสนาม เช่น ฉก.นราธิวาส (กกล.ทบ.)
  bloodGroup?: string | null;        // หมู่โลหิต เช่น O, A, B, AB
  salaryLevel?: string | null;       // ระดับชั้นเงินเดือน เช่น "พ.๑ ชั้น ๑๖"
  salaryAmount?: number | null;      // จำนวนเงินเดือน (บาท)
  lossType: LossType;
  lossSeverity?: string | null;      // e.g. "บาดเจ็บสาหัส", "บาดเจ็บปานกลาง", "บาดเจ็บเล็กน้อย", "พิการทุพพลภาพขนาดหนัก", "เสียชีวิตทันที"
  injuryDetails?: string | null;     // รายละเอียดบาดแผล หรืออาการ (เช่น มีอาการแน่นหน้าอกจากการได้รับแรงกระแทกจากระเบิด)
  hospital?: string | null;          // รพ.ที่ส่งรักษา
  dutyStatus?: string | null;        // สถานะการปฏิบัติหน้าที่
}

/** ข้อมูลหัวกระดาษเขียนข่าว สส.๒ สำหรับ กพ.๔ (Dispatch Telegram Meta) */
export interface LossReportDispatchMeta {
  urgency?: string;           // ความเร่งด่วน เช่น "ด่วนที่สุด"
  classification?: string;    // ชั้นความลับ เช่น "ลับมาก"
  fromUnit?: string;          // จาก เช่น "ผบ.พัน.ร.๒๐๒ (RDF)"
  toUnit?: string;            // ถึง ผู้รับปฏิบัติ เช่น "ผบ.ศปก.ทบ."
  infoUnits?: string;         // ผู้รับทราบ เช่น "ศปก.ทภ.๒, กกล.สุรนารี, พล.ร.๖, ฉก.๑"
  referenceNumber?: string;   // ที่ของผู้ให้ข่าว เช่น "กห ๐๔๘๒.๒.๓๗๒/ ๕๗๕"
  missionForce?: string;      // ชุดปฏิบัติการที่ถูกส่ง เช่น "ชุดปฏิบัติการ ๑๔ นาย"
  writerName?: string;        // ชื่อผู้เขียนข่าว
  writerUnit?: string;        // หน่วยผู้เขียนข่าว
  writerPhone?: string;       // โทรศัพท์ผู้เขียนข่าว
  approverName?: string;      // ผู้อนุมัติ (ผบ.ร้อย / ผบ.พัน)
  equipmentDamage?: string;   // ความเสียหายยุทโธปกรณ์ (สำหรับ กพ.๓ ด้วย)
  commanderKP3Name?: string;  // ผู้บังคับบัญชาลำดับชั้น กพ.๓ ชั้นที่ ๑ (ผบ.ร้อย)
  commanderKP3Rank?: string;
  commanderKP3Pos?: string;
  commander2KP3Name?: string; // ผู้บังคับบัญชาลำดับชั้น กพ.๓ ชั้นที่ ๒ (ผบ.พัน)
  commander2KP3Rank?: string;
  commander2KP3Pos?: string;
  commander3KP3Name?: string; // ผู้บังคับบัญชาลำดับชั้น กพ.๓ ชั้นที่ ๓ (ผบ.ฉก.)
  commander3KP3Rank?: string;
  commander3KP3Pos?: string;
}

export interface LossIncidentReportRecord {
  id: string;
  personnelId: string | null;
  militaryId: string | null;
  rankAbbr: string | null;
  fullName: string | null;
  incidentDate: Date;
  incidentTime: string;
  mgrsCoordinate: string;
  latitude: number | null;
  longitude: number | null;
  village: string | null;
  houseNo: string | null;
  road: string | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  eventSummary: string;
  behaviorSummary: string | null;
  engagementBehavior: string;
  enemyAction: string;
  createdByUserId: string | null;
  createdByUserName: string | null;
  updatedByUserId: string | null;
  updatedByUserName: string | null;
  createdAt: Date;
  updatedAt: Date;
  casualties: IncidentCasualty[];
}

export type LossIncidentReportCreateInput = Omit<LossIncidentReportRecord, "id" | "createdAt" | "updatedAt" | "casualties"> & {
  casualties?: IncidentCasualty[];
};

const globalForLossReportStore = globalThis as unknown as {
  lossIncidentReportsStore?: LossIncidentReportRecord[];
};

const fallbackStore = globalForLossReportStore.lossIncidentReportsStore ?? [];
if (process.env.NODE_ENV !== "production") {
  globalForLossReportStore.lossIncidentReportsStore = fallbackStore;
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function packCasualties(notes?: string | null, casualties?: IncidentCasualty[]): string {
  const payload = {
    notes: notes || "",
    casualties: casualties || [],
  };
  return JSON.stringify(payload);
}

export function unpackCasualties(rawSummary?: string | null): { notes: string; casualties: IncidentCasualty[] } {
  if (!rawSummary || !rawSummary.trim()) {
    return { notes: "", casualties: [] };
  }
  try {
    const parsed = JSON.parse(rawSummary);
    if (parsed && Array.isArray(parsed.casualties)) {
      return {
        notes: typeof parsed.notes === "string" ? parsed.notes : "",
        casualties: parsed.casualties,
      };
    }
  } catch {
    // Not JSON, plain text legacy notes
  }
  return { notes: rawSummary, casualties: [] };
}

function normalize(record: any): LossIncidentReportRecord {
  const { notes, casualties } = unpackCasualties(record.behaviorSummary);

  const fallbackCasualties: IncidentCasualty[] =
    casualties.length > 0
      ? casualties
      : (record.militaryId || record.fullName)
        ? [
            {
              id: `cas-${record.id || "default"}`,
              personnelId: record.personnelId ?? null,
              militaryId: record.militaryId ?? "-",
              rankAbbr: record.rankAbbr ?? "",
              fullName: record.fullName ?? "-",
              lossType: "DECEASED",
              lossSeverity: "",
              injuryDetails: "",
              hospital: "",
            },
          ]
        : [];

  return {
    id: String(record.id),
    personnelId: record.personnelId ?? (fallbackCasualties[0]?.personnelId || null),
    militaryId: record.militaryId ?? (fallbackCasualties[0]?.militaryId || null),
    rankAbbr: record.rankAbbr ?? (fallbackCasualties[0]?.rankAbbr || null),
    fullName: record.fullName ?? (fallbackCasualties[0]?.fullName || null),
    incidentDate: asDate(record.incidentDate),
    incidentTime: String(record.incidentTime || "00:00"),
    mgrsCoordinate: String(record.mgrsCoordinate || ""),
    latitude: record.latitude == null ? null : Number(record.latitude),
    longitude: record.longitude == null ? null : Number(record.longitude),
    village: record.village ?? null,
    houseNo: record.houseNo ?? null,
    road: record.road ?? null,
    subdistrict: record.subdistrict ?? null,
    district: record.district ?? null,
    province: record.province ?? null,
    eventSummary: String(record.eventSummary || ""),
    behaviorSummary: notes,
    engagementBehavior: String(record.engagementBehavior || "ปะทะ+ยิงต่อสู้"),
    enemyAction: String(record.enemyAction || "ENEMY"),
    createdByUserId: record.createdByUserId ?? null,
    createdByUserName: record.createdByUserName ?? null,
    updatedByUserId: record.updatedByUserId ?? null,
    updatedByUserName: record.updatedByUserName ?? null,
    createdAt: asDate(record.createdAt),
    updatedAt: asDate(record.updatedAt),
    casualties: fallbackCasualties,
  };
}

function getPrismaModel(): any {
  return (prisma as any).lossIncidentReport;
}

export class LossIncidentReportRepository {
  async findMany(params?: { personnelId?: string; search?: string }): Promise<LossIncidentReportRecord[]> {
    const model = getPrismaModel();
    let rows: any[] = [];

    if (model?.findMany) {
      try {
        const dbRows = await model.findMany({
          orderBy: { incidentDate: "desc" },
        });
        rows = dbRows.map(normalize);
      } catch {
        rows = [];
      }
    }

    const seenIds = new Set(rows.map((r) => r.id));
    for (const fb of fallbackStore) {
      if (!seenIds.has(fb.id)) {
        rows.push(normalize(fb));
      }
    }

    if (params?.personnelId) {
      const pid = params.personnelId;
      rows = rows.filter((r) => r.personnelId === pid || r.casualties?.some((c: IncidentCasualty) => c.personnelId === pid));
    }

    if (params?.search?.trim()) {
      const s = params.search.trim().toLowerCase();
      rows = rows.filter((row: LossIncidentReportRecord) => {
        const casualtyText = (row.casualties || [])
          .map((c) => [c.militaryId, c.rankAbbr, c.fullName, c.lossType, c.lossSeverity, c.injuryDetails, c.hospital].join(" "))
          .join(" ");

        return [
          row.militaryId,
          row.fullName,
          row.mgrsCoordinate,
          row.province,
          row.district,
          row.subdistrict,
          row.eventSummary,
          row.behaviorSummary,
          casualtyText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(s);
      });
    }

    rows.sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
    return rows;
  }

  async findById(id: string): Promise<LossIncidentReportRecord | null> {
    const model = getPrismaModel();
    if (model?.findUnique) {
      try {
        const row = await model.findUnique({ where: { id } });
        if (row) return normalize(row);
      } catch {
        // fallback to in-memory
      }
    }

    const found = fallbackStore.find((item) => item.id === id);
    return found ? normalize(found) : null;
  }

  async create(data: LossIncidentReportCreateInput): Promise<LossIncidentReportRecord> {
    const primary = data.casualties?.[0];
    const packedSummary = packCasualties(data.behaviorSummary, data.casualties);

    let validPersonnelId = primary?.personnelId || data.personnelId || null;
    if (validPersonnelId && (prisma as any).militaryPersonnel?.findUnique) {
      try {
        const exists = await (prisma as any).militaryPersonnel.findUnique({
          where: { id: validPersonnelId },
          select: { id: true },
        });
        if (!exists) validPersonnelId = null;
      } catch {
        validPersonnelId = null;
      }
    }

    const dbPayload = {
      personnelId: validPersonnelId,
      militaryId: primary?.militaryId || data.militaryId || null,
      rankAbbr: primary?.rankAbbr || data.rankAbbr || null,
      fullName: primary?.fullName || data.fullName || null,
      incidentDate: data.incidentDate,
      incidentTime: data.incidentTime,
      mgrsCoordinate: data.mgrsCoordinate,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      village: data.village ?? null,
      houseNo: data.houseNo ?? null,
      road: data.road ?? null,
      subdistrict: data.subdistrict ?? null,
      district: data.district ?? null,
      province: data.province ?? null,
      eventSummary: data.eventSummary,
      behaviorSummary: packedSummary,
      engagementBehavior: data.engagementBehavior,
      enemyAction: data.enemyAction,
      createdByUserId: data.createdByUserId ?? null,
      createdByUserName: data.createdByUserName ?? null,
      updatedByUserId: data.updatedByUserId ?? null,
      updatedByUserName: data.updatedByUserName ?? null,
    };

    const model = getPrismaModel();
    if (model?.create) {
      try {
        const row = await model.create({ data: dbPayload });
        return normalize(row);
      } catch {
        // fallback to in-memory
      }
    }

    const now = new Date();
    const row: LossIncidentReportRecord = normalize({
      ...dbPayload,
      id: `loss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    });
    fallbackStore.unshift(row);
    return row;
  }

  async update(id: string, data: Partial<LossIncidentReportCreateInput>): Promise<LossIncidentReportRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const mergedCasualties = data.casualties !== undefined ? data.casualties : existing.casualties;
    const primary = mergedCasualties?.[0];
    const packedSummary = packCasualties(
      data.behaviorSummary !== undefined ? data.behaviorSummary : existing.behaviorSummary,
      mergedCasualties
    );

    let validPersonnelId = primary?.personnelId ?? existing.personnelId;
    if (validPersonnelId && (prisma as any).militaryPersonnel?.findUnique) {
      try {
        const exists = await (prisma as any).militaryPersonnel.findUnique({
          where: { id: validPersonnelId },
          select: { id: true },
        });
        if (!exists) validPersonnelId = null;
      } catch {
        validPersonnelId = null;
      }
    }

    const dbPayload: any = {
      ...data,
      personnelId: validPersonnelId,
      militaryId: primary?.militaryId ?? existing.militaryId,
      rankAbbr: primary?.rankAbbr ?? existing.rankAbbr,
      fullName: primary?.fullName ?? existing.fullName,
      behaviorSummary: packedSummary,
    };
    delete dbPayload.casualties;

    const model = getPrismaModel();
    if (model?.update) {
      try {
        const row = await model.update({ where: { id }, data: dbPayload });
        if (row) {
          // Keep fallback store in sync if present
          const idx = fallbackStore.findIndex((item) => item.id === id);
          if (idx >= 0) fallbackStore[idx] = normalize(row);
          return normalize(row);
        }
      } catch {
        // fallback to in-memory
      }
    }

    const idx = fallbackStore.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const next = normalize({
      ...fallbackStore[idx],
      ...dbPayload,
      updatedAt: new Date(),
    });
    fallbackStore[idx] = next;
    return next;
  }

  async delete(id: string): Promise<LossIncidentReportRecord | null> {
    const model = getPrismaModel();
    let deleted: any = null;

    if (model?.delete) {
      try {
        deleted = await model.delete({ where: { id } });
      } catch {
        // fallback to in-memory
      }
    }

    const idx = fallbackStore.findIndex((item) => item.id === id);
    if (idx >= 0) {
      const [fbDeleted] = fallbackStore.splice(idx, 1);
      if (!deleted) deleted = fbDeleted;
    }

    return deleted ? normalize(deleted) : null;
  }
}
