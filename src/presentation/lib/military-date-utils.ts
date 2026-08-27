/**
 * Thai Buddhist Era (B.E.) date utilities for military benefit estimation.
 * Internal storage uses Christian Era (C.E./ค.ศ.) ISO date strings.
 * UI display uses Buddhist Era (B.E./พ.ศ.) which is C.E. + 543.
 */

export interface ThaiDateParts {
    day: number;
    month: number; // 1-12
    yearBE: number;
}

export interface ServiceTimeBreakdown {
    years: number;
    months: number;
    days: number;
}

/**
 * Convert ISO date string (C.E.) to Thai Buddhist date parts.
 */
export function toThaiDateParts(isoDate: string | undefined | null): ThaiDateParts | null {
    if (!isoDate) return null;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return null;
    return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        yearBE: d.getFullYear() + 543,
    };
}

/**
 * Convert Thai Buddhist date parts to ISO date string (C.E.).
 */
export function fromThaiDateParts(parts: ThaiDateParts): string {
    const yearCE = parts.yearBE - 543;
    const d = new Date(yearCE, parts.month - 1, parts.day);
    const yyyy = d.getFullYear().toString().padStart(4, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format ISO date to Thai Buddhist display string e.g. "1 พ.ค. 2569".
 */
export function formatThaiBE(isoDate: string | undefined | null): string {
    const parts = toThaiDateParts(isoDate);
    if (!parts) return "-";
    const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    ];
    return `${parts.day} ${thaiMonths[parts.month - 1]} ${parts.yearBE}`;
}

/**
 * Convert a C.E. ISO date input value to B.E. display value for an HTML date input.
 * HTML date inputs only accept C.E. yyyy-mm-dd, so we keep the underlying value
 * as C.E. and transform the displayed label separately.
 */
export function toBEDisplayLabel(isoDate: string | undefined | null): string {
    return formatThaiBE(isoDate);
}

/**
 * Calculate service time breakdown between two dates.
 * Returns years, months, days using calendar-aware subtraction.
 */
export function calculateServiceTime(
    startIso: string | undefined | null,
    endIso: string | undefined | null
): ServiceTimeBreakdown {
    const defaultResult: ServiceTimeBreakdown = { years: 0, months: 0, days: 0 };
    if (!startIso) return defaultResult;

    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return defaultResult;

    // Ensure start <= end
    if (start > end) return defaultResult;

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years, months, days };
}

/**
 * Calculate total service time = normal service + multiplier service.
 * Multiplier service is counted as 2x per regulation (1 year of field service = 2 years total).
 */
export function calculateTotalServiceTime(
    normal: ServiceTimeBreakdown,
    multiplier: ServiceTimeBreakdown,
    options: { multiplierFactor?: number } = {}
): ServiceTimeBreakdown {
    const factor = options.multiplierFactor ?? 2;

    // Convert everything to days approximated for total calculation
    const normalDays = normal.years * 365 + normal.months * 30 + normal.days;
    const multiplierDays = multiplier.years * 365 + multiplier.months * 30 + multiplier.days;
    const totalDays = normalDays + multiplierDays * factor;

    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    return { years, months, days };
}

/**
 * Format service time breakdown as Thai string e.g. "10 ปี 7 เดือน 7 วัน".
 */
export function formatServiceTime(breakdown: ServiceTimeBreakdown): string {
    const parts: string[] = [];
    if (breakdown.years > 0) parts.push(`${breakdown.years} ปี`);
    if (breakdown.months > 0) parts.push(`${breakdown.months} เดือน`);
    if (breakdown.days > 0 || parts.length === 0) parts.push(`${breakdown.days} วัน`);
    return parts.join(" ");
}
