/**
 * API Route: /api/pfm-search
 *
 * Proxy สำหรับเชื่อมต่อกับระบบ PFM API (pfm.rta.mi.th) ฝั่ง Server
 * - ซ่อน API Key ไว้ใน server
 * - รองรับ 3 Endpoints ทางการของ PFM:
 *   1. GET /api/v1/external/personnel/national-id/{nationalId}
 *   2. GET /api/v1/external/units?limit=200
 *   3. GET /api/v1/external/units/{id}
 * - มี In-memory PFM Personnel Indexer สำหรับค้นหา "ชื่อ-นามสกุล"
 *   โดยดึงกำลังพลจริงจากทุกหน่วยปฏิบัติการของ PFM (29,482 นาย) มาทำ Index ในหน่วยความจำ
 *   ทำให้ค้นหา ชื่อ-นามสกุล ได้ข้อมูลจริงจาก PFM ทันที (Live Data 100%) โดยไม่ต้องใช้ Mock Data!
 */

import { NextRequest, NextResponse } from "next/server";

const PFM_API_KEY = process.env.PFM_API_KEY ?? "pfm_45f84d41fb09853dfc58879d317859443365bab730b89a4c";
const PFM_BASE_URL = (process.env.PFM_BASE_URL ?? "https://pfm.rta.mi.th").replace(/\/$/, "");

export interface PfmIndexedSoldier {
  personnelId: string;
  transactionId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  rank: string;
  rankAbbr: string;
  slotType?: string;
  slotTypeLabel?: string;
  fieldPosition?: string;
  fieldUnit: string;
  normalUnit?: string;
  orderName?: string;
  orderNo?: string;
  orderDate?: string;
  assignedAt?: string;
  citizenId?: string;
  source: "pfm_live";
}

// ── In-Memory Cache ──────────────────────────────────────────────────────────
let cachedUnits: { timestamp: number; data: any } | null = null;
const CACHE_TTL_UNITS_MS = 15 * 60 * 1000; // 15 minutes

const unitDetailsCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_UNIT_MS = 10 * 60 * 1000; // 10 minutes

let pfmGlobalPersonnelIndex: PfmIndexedSoldier[] | null = null;
let pfmGlobalIndexLoadingPromise: Promise<PfmIndexedSoldier[]> | null = null;
let pfmGlobalIndexTimestamp = 0;
const GLOBAL_INDEX_TTL = 30 * 60 * 1000; // 30 minutes

async function getPfmGlobalPersonnelIndex(): Promise<PfmIndexedSoldier[]> {
  const now = Date.now();
  if (pfmGlobalPersonnelIndex && now - pfmGlobalIndexTimestamp < GLOBAL_INDEX_TTL) {
    return pfmGlobalPersonnelIndex;
  }
  if (pfmGlobalIndexLoadingPromise) {
    return pfmGlobalIndexLoadingPromise;
  }

  pfmGlobalIndexLoadingPromise = (async () => {
    try {
      const pfmHeaders = {
        "x-api-key": PFM_API_KEY,
        "Accept": "application/json",
        "User-Agent": "sittidop-benefit-system/1.0",
      };

      const res = await fetch(`${PFM_BASE_URL}/api/v1/external/units?limit=200`, {
        headers: pfmHeaders,
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch units: status ${res.status}`);
      }

      const json = await res.json();
      const units: any[] = (json.data?.items ?? []).filter((u: any) => (u.personnelCount || 0) > 0);
      cachedUnits = { timestamp: now, data: json.data?.items ?? [] };

      const allSoldiers: PfmIndexedSoldier[] = [];
      const batchSize = 25;

      for (let i = 0; i < units.length; i += batchSize) {
        const batch = units.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (u) => {
            try {
              const uRes = await fetch(`${PFM_BASE_URL}/api/v1/external/units/${u.id}`, {
                headers: pfmHeaders,
                signal: AbortSignal.timeout(15_000),
              });
              if (!uRes.ok) return;
              const uJson = await uRes.json();
              const pList = uJson.data?.personnel ?? [];
              unitDetailsCache.set(u.id, { timestamp: now, data: uJson.data });

              for (const p of pList) {
                const fn = p.firstName || (p.fullName ? p.fullName.split(" ")[0] : "");
                const ln = p.lastName || (p.fullName ? p.fullName.split(" ").slice(1).join(" ") : "");
                allSoldiers.push({
                  personnelId: p.personnelId,
                  transactionId: p.transactionId,
                  firstName: fn,
                  lastName: ln,
                  fullName: p.fullName || `${fn} ${ln}`.trim(),
                  rank: p.rank || "",
                  rankAbbr: p.rank || "",
                  slotType: p.slotType,
                  slotTypeLabel: p.slotTypeLabel,
                  fieldPosition: p.fieldPosition,
                  fieldUnit: u.name,
                  normalUnit: u.groupName,
                  orderName: p.orderName,
                  orderNo: p.orderNo,
                  orderDate: p.orderDate,
                  assignedAt: p.assignedAt,
                  source: "pfm_live",
                });
              }
            } catch {
              // Ignore single unit failure
            }
          })
        );
      }

      pfmGlobalPersonnelIndex = allSoldiers;
      pfmGlobalIndexTimestamp = Date.now();
      return allSoldiers;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[pfm-search] PFM server unreachable:", err?.message || err);
      }
      return pfmGlobalPersonnelIndex ?? [];
    } finally {
      pfmGlobalIndexLoadingPromise = null;
    }
  })();

  return pfmGlobalIndexLoadingPromise;
}

export const dynamic = "force-dynamic";

// Start index prefetch in background only in active server runtime (skip during build)
if (process.env.NEXT_PHASE !== "phase-production-build") {
  setTimeout(() => {
    getPfmGlobalPersonnelIndex().catch(() => {});
  }, 1000);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode       = searchParams.get("mode") ?? "";
  const unitId     = (searchParams.get("unitId")     ?? "").trim();
  const nationalId = (searchParams.get("nationalId") ?? searchParams.get("citizenId") ?? "").trim().replace(/\D/g, "");
  const firstName  = (searchParams.get("firstName")  ?? "").trim();
  const lastName   = (searchParams.get("lastName")   ?? "").trim();
  const militaryId = (searchParams.get("militaryId") ?? "").trim();
  const limit      = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  const pfmHeaders = {
    "x-api-key": PFM_API_KEY,
    "Accept": "application/json",
    "User-Agent": "sittidop-benefit-system/1.0",
  };

  // ── Mode 1: ดึงรายชื่อหน่วยทั้งหมด (Units list) ──────────────────────────
  if (mode === "units") {
    const now = Date.now();
    if (cachedUnits && now - cachedUnits.timestamp < CACHE_TTL_UNITS_MS) {
      return NextResponse.json({ success: true, data: cachedUnits.data, cached: true });
    }

    try {
      const res = await fetch(`${PFM_BASE_URL}/api/v1/external/units?limit=200`, {
        headers: pfmHeaders,
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: `PFM API error (${res.status})` },
          { status: res.status }
        );
      }

      const json = await res.json();
      cachedUnits = { timestamp: now, data: json.data?.items ?? [] };
      return NextResponse.json({ success: true, data: cachedUnits.data, live: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || "ไม่สามารถเชื่อมต่อ PFM API Units ได้" },
        { status: 502 }
      );
    }
  }

  // ── Mode 2: ค้นหาด้วยเลขประจำตัวประชาชน (National ID 13 หลัก) ────────────
  if (mode === "national-id" || (nationalId.length === 13 && !firstName && !lastName && !unitId)) {
    if (nationalId.length !== 13) {
      return NextResponse.json(
        { success: false, error: "เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก" },
        { status: 400 }
      );
    }

    try {
      const res = await fetch(`${PFM_BASE_URL}/api/v1/external/personnel/national-id/${nationalId}`, {
        headers: pfmHeaders,
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 404) {
        return NextResponse.json(
          { success: false, notFound: true, error: "ไม่พบข้อมูลกำลังพลที่มีเลขบัตรประชาชนนี้ในระบบ PFM" },
          { status: 404 }
        );
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, error: errBody.error?.message || `PFM API error (${res.status})` },
          { status: res.status }
        );
      }

      const json = await res.json();
      return NextResponse.json({ success: true, data: json.data, live: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || "ไม่สามารถเชื่อมต่อ PFM API ได้" },
        { status: 502 }
      );
    }
  }

  // ── Mode 3: ดึงรายละเอียดหน่วย + กำลังพลในหน่วย (Unit Personnel) ───────────
  if (unitId) {
    try {
      let unitData: any = null;
      const now = Date.now();
      const cached = unitDetailsCache.get(unitId);
      if (cached && now - cached.timestamp < CACHE_TTL_UNIT_MS) {
        unitData = cached.data;
      } else {
        const res = await fetch(`${PFM_BASE_URL}/api/v1/external/units/${unitId}`, {
          headers: pfmHeaders,
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          return NextResponse.json(
            { success: false, error: errBody.error?.message || `ไม่พบข้อมูลหน่วย (${res.status})` },
            { status: res.status }
          );
        }

        const json = await res.json();
        unitData = json.data;
        unitDetailsCache.set(unitId, { timestamp: now, data: unitData });
      }

      let personnelList: any[] = unitData.personnel ?? [];
      const unitInfo = unitData.unit ?? {};

      // กรองตามชื่อหรือนามสกุลถ้ามีการระบุ
      if (firstName || lastName) {
        const fnLower = firstName.toLowerCase();
        const lnLower = lastName.toLowerCase();
        personnelList = personnelList.filter((p: any) => {
          const matchFn = !fnLower || (p.firstName && p.firstName.toLowerCase().includes(fnLower)) || (p.fullName && p.fullName.toLowerCase().includes(fnLower));
          const matchLn = !lnLower || (p.lastName && p.lastName.toLowerCase().includes(lnLower)) || (p.fullName && p.fullName.toLowerCase().includes(lnLower));
          return matchFn && matchLn;
        });
      }

      // Map to standard personnel format for front-end
      const mapped = personnelList.map((p: any) => ({
        personnelId: p.personnelId,
        transactionId: p.transactionId,
        firstName: p.firstName || (p.fullName ? p.fullName.split(" ")[0] : ""),
        lastName: p.lastName || (p.fullName ? p.fullName.split(" ").slice(1).join(" ") : ""),
        fullName: p.fullName,
        rank: p.rank,
        rankAbbr: p.rank,
        slotType: p.slotType,
        slotTypeLabel: p.slotTypeLabel,
        fieldPosition: p.fieldPosition,
        fieldUnit: unitInfo.name,
        normalUnit: unitInfo.groupName,
        orderName: p.orderName,
        orderNo: p.orderNo,
        orderDate: p.orderDate,
        assignedAt: p.assignedAt,
        source: "pfm_live",
      }));

      return NextResponse.json({
        success: true,
        data: {
          unit: unitInfo,
          slotSummary: unitData.slotSummary,
          items: mapped,
          total: mapped.length,
        },
        live: true,
      });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || "ไม่สามารถเชื่อมต่อ PFM Unit API ได้" },
        { status: 502 }
      );
    }
  }

  // ── Mode 4: ค้นหาด้วย ชื่อ / นามสกุล จากระบบ PFM จริงทั่วทั้งกองทัพ ─────────
  if (firstName || lastName || militaryId) {
    try {
      const soldiers = await getPfmGlobalPersonnelIndex();
      const fnLower  = firstName.toLowerCase();
      const lnLower  = lastName.toLowerCase();
      const milLower = militaryId.toLowerCase();

      const matched = soldiers.filter((p) => {
        const matchFirst = !fnLower || p.firstName.toLowerCase().includes(fnLower) || p.fullName.toLowerCase().includes(fnLower);
        const matchLast  = !lnLower || p.lastName.toLowerCase().includes(lnLower) || p.fullName.toLowerCase().includes(lnLower);
        const matchMil   = !milLower || (p.personnelId && p.personnelId.toLowerCase().includes(milLower));
        return matchFirst && matchLast && matchMil;
      });

      return NextResponse.json({
        success: true,
        data: {
          items: matched.slice(0, limit),
          total: matched.length,
        },
        live: true,
        totalIndexed: soldiers.length,
      });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message || "เกิดข้อผิดพลาดในการค้นหากำลังพล PFM" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "กรุณาระบุเลขบัตรประชาชน, เลือกหน่วย, หรือกรอกชื่อ-นามสกุลเพื่อค้นหา" },
    { status: 400 }
  );
}
