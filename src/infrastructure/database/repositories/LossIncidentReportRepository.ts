import { prisma } from "@/infrastructure/database/prisma";

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
}

export type LossIncidentReportCreateInput = Omit<LossIncidentReportRecord, "id" | "createdAt" | "updatedAt">;

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

function normalize(record: any): LossIncidentReportRecord {
  return {
    id: String(record.id),
    personnelId: record.personnelId ?? null,
    militaryId: record.militaryId ?? null,
    rankAbbr: record.rankAbbr ?? null,
    fullName: record.fullName ?? null,
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
    behaviorSummary: record.behaviorSummary ?? null,
    engagementBehavior: String(record.engagementBehavior || "ปะทะ+ยิงต่อสู้"),
    enemyAction: String(record.enemyAction || "ENEMY"),
    createdByUserId: record.createdByUserId ?? null,
    createdByUserName: record.createdByUserName ?? null,
    updatedByUserId: record.updatedByUserId ?? null,
    updatedByUserName: record.updatedByUserName ?? null,
    createdAt: asDate(record.createdAt),
    updatedAt: asDate(record.updatedAt),
  };
}

function getPrismaModel(): any {
  return (prisma as any).lossIncidentReport;
}

export class LossIncidentReportRepository {
  async findMany(params?: { personnelId?: string; search?: string }): Promise<LossIncidentReportRecord[]> {
    const model = getPrismaModel();
    if (model?.findMany) {
      try {
        let rows = await model.findMany({
          orderBy: { incidentDate: "desc" },
          where: params?.personnelId ? { personnelId: params.personnelId } : undefined,
        });

        if (params?.search?.trim()) {
          const s = params.search.trim().toLowerCase();
          rows = rows.filter((row: any) =>
            [
              row.militaryId,
              row.fullName,
              row.mgrsCoordinate,
              row.province,
              row.district,
              row.subdistrict,
              row.eventSummary,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(s)
          );
        }

        return rows.map(normalize);
      } catch {
        // fallback to in-memory
      }
    }

    let rows = [...fallbackStore];
    if (params?.personnelId) rows = rows.filter((item) => item.personnelId === params.personnelId);
    if (params?.search?.trim()) {
      const s = params.search.trim().toLowerCase();
      rows = rows.filter((row) =>
        [row.militaryId, row.fullName, row.mgrsCoordinate, row.province, row.district, row.subdistrict, row.eventSummary]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(s)
      );
    }

    rows.sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
    return rows;
  }

  async findById(id: string): Promise<LossIncidentReportRecord | null> {
    const model = getPrismaModel();
    if (model?.findUnique) {
      try {
        const row = await model.findUnique({ where: { id } });
        return row ? normalize(row) : null;
      } catch {
        // fallback to in-memory
      }
    }

    return fallbackStore.find((item) => item.id === id) || null;
  }

  async create(data: LossIncidentReportCreateInput): Promise<LossIncidentReportRecord> {
    const model = getPrismaModel();
    if (model?.create) {
      try {
        const row = await model.create({ data });
        return normalize(row);
      } catch {
        // fallback to in-memory
      }
    }

    const now = new Date();
    const row: LossIncidentReportRecord = {
      ...data,
      id: `loss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    fallbackStore.unshift(row);
    return row;
  }

  async update(id: string, data: Partial<LossIncidentReportCreateInput>): Promise<LossIncidentReportRecord | null> {
    const model = getPrismaModel();
    if (model?.update) {
      try {
        const row = await model.update({ where: { id }, data });
        return normalize(row);
      } catch {
        // fallback to in-memory
      }
    }

    const idx = fallbackStore.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const next = {
      ...fallbackStore[idx],
      ...data,
      updatedAt: new Date(),
    };
    fallbackStore[idx] = normalize(next);
    return fallbackStore[idx];
  }

  async delete(id: string): Promise<LossIncidentReportRecord | null> {
    const model = getPrismaModel();
    if (model?.delete) {
      try {
        const row = await model.delete({ where: { id } });
        return normalize(row);
      } catch {
        // fallback to in-memory
      }
    }

    const idx = fallbackStore.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const [deleted] = fallbackStore.splice(idx, 1);
    return deleted;
  }
}
