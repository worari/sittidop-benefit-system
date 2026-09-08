"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Calendar } from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import {
    toThaiDateParts,
    fromThaiDateParts,
    formatThaiBE,
    ThaiDateParts,
} from "@/presentation/lib/military-date-utils";

const THAI_MONTHS = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
];

const THAI_BE_YEARS = Array.from({ length: 101 }, (_, index) => 2500 + index);

interface ThaiBuddhistDatePickerProps {
    id?: string;
    label?: string;
    value?: string; // ISO date string (C.E.)
    onChange: (isoDate: string | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

/**
 * Thai Buddhist Era date picker.
 * Underlying value is ISO yyyy-mm-dd (C.E.).
 * User can type in Thai format "dd/mm/yyyy" where year is B.E.
 * A native date picker is also available for C.E. selection with B.E. label.
 */
export function ThaiBuddhistDatePicker({
    id,
    label,
    value,
    onChange,
    placeholder = "ระบุ วว/ดด/ปปปป (พ.ศ.)",
    className,
    disabled,
    required,
}: ThaiBuddhistDatePickerProps) {
    const inputId = id || `thai-date-${Math.random().toString(36).slice(2, 9)}`;
    const [textValue, setTextValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        const current = toThaiDateParts(value);
        const today = new Date();
        const source = current ?? { day: today.getDate(), month: today.getMonth() + 1, yearBE: today.getFullYear() + 543 };
        return new Date(source.yearBE - 543, source.month - 1, 1);
    });
    const calendarRef = useRef<HTMLDivElement>(null);

    // Sync Thai BE text from ISO value
    useEffect(() => {
        const parts = toThaiDateParts(value);
        if (parts) {
            setTextValue(`${parts.day} ${THAI_MONTHS[parts.month - 1]} ${parts.yearBE}`);
            setViewDate(new Date(parts.yearBE - 543, parts.month - 1, 1));
        } else {
            setTextValue("");
            const today = new Date();
            setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
        }
    }, [value]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setCalendarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const parseThaiDateText = (text: string): ThaiDateParts | null => {
        const clean = text.trim();
        if (!clean) return null;

        const numericMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (numericMatch) {
            const day = parseInt(numericMatch[1], 10);
            const month = parseInt(numericMatch[2], 10);
            const yearBE = parseInt(numericMatch[3], 10);
            if (
                Number.isNaN(day) ||
                Number.isNaN(month) ||
                Number.isNaN(yearBE) ||
                day < 1 ||
                day > 31 ||
                month < 1 ||
                month > 12 ||
                yearBE < 2300 ||
                yearBE > 2600
            ) {
                return null;
            }
            return { day, month, yearBE };
        }

        const thaiMonthRegex = `(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)`;
        const thaiMatch = clean.match(new RegExp(`^(\\d{1,2})\\s+${thaiMonthRegex}\\s+(\\d{4})$`));
        if (!thaiMatch) return null;

        const day = parseInt(thaiMatch[1], 10);
        const month = THAI_MONTHS.findIndex((monthLabel) => monthLabel === thaiMatch[2]) + 1;
        const yearBE = parseInt(thaiMatch[3], 10);

        if (
            Number.isNaN(day) ||
            month < 1 ||
            Number.isNaN(yearBE) ||
            day < 1 ||
            day > 31 ||
            yearBE < 2300 ||
            yearBE > 2600
        ) {
            return null;
        }

        return { day, month, yearBE };
    };

    const commitThaiDateText = (text: string) => {
        if (!text.trim()) {
            onChange(undefined);
            return;
        }

        const parts = parseThaiDateText(text);
        if (!parts) {
            setError("รูปแบบไม่ถูกต้อง (เช่น 1 ต.ค. 2567)");
            onChange(undefined);
            return;
        }

        try {
            onChange(fromThaiDateParts(parts));
            setError(null);
        } catch {
            setError("วันที่ไม่ถูกต้อง");
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setTextValue(text);
        setError(null);
        if (!text.trim()) {
            onChange(undefined);
        }
    };

    const handleTextBlur = () => {
        commitThaiDateText(textValue);
    };

    const thaiDayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

    const currentViewYearBE = viewDate.getFullYear() + 543;

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells: Array<{ date?: Date }> = [];

        for (let index = 0; index < firstDay; index += 1) {
            cells.push({});
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            cells.push({ date: new Date(year, month, day) });
        }

        while (cells.length % 7 !== 0) {
            cells.push({});
        }

        return cells;
    }, [viewDate]);

    const selectedParts = toThaiDateParts(value);

    const handleSelectDate = (date: Date) => {
        onChange(fromThaiDateParts({
            day: date.getDate(),
            month: date.getMonth() + 1,
            yearBE: date.getFullYear() + 543,
        }));
        setError(null);
        setCalendarOpen(false);
    };

    const goToPreviousMonth = () => {
        setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <Label htmlFor={inputId} className="text-xs">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
            )}
            <div className="relative" ref={calendarRef}>
                <Input
                    id={inputId}
                    type="text"
                    value={textValue}
                    onChange={handleTextChange}
                    onBlur={handleTextBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "pr-10 text-xs",
                        error && "border-red-500 focus-visible:ring-red-500"
                    )}
                />
                <button
                    type="button"
                    onClick={() => {
                        const current = toThaiDateParts(value);
                        const today = new Date();
                        const source = current ?? { day: today.getDate(), month: today.getMonth() + 1, yearBE: today.getFullYear() + 543 };
                        setViewDate(new Date(source.yearBE - 543, source.month - 1, 1));
                        setCalendarOpen((currentOpen) => !currentOpen);
                    }}
                    disabled={disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600 disabled:opacity-50"
                    aria-label="เปิดปฏิทิน"
                    aria-expanded={calendarOpen}
                >
                    <Calendar className="h-4 w-4" />
                </button>
                {calendarOpen && !disabled && (
                    <div className="absolute z-50 mt-2 w-[20rem] rounded-2xl border border-slate-200 dark:border-slate-800 bg-popover text-popover-foreground shadow-xl p-3">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                type="button"
                                onClick={goToPreviousMonth}
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-bold"
                                aria-label="เดือนก่อนหน้า"
                            >
                                ←
                            </button>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <select
                                        value={viewDate.getMonth()}
                                        onChange={(event) => {
                                            const nextMonth = Number(event.target.value);
                                            setViewDate((current) => new Date(current.getFullYear(), nextMonth, 1));
                                        }}
                                        className="h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-2 text-xs font-semibold"
                                        aria-label="เลือกเดือน"
                                    >
                                        {THAI_MONTHS.map((monthLabel, index) => (
                                            <option key={monthLabel} value={index}>
                                                {monthLabel}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={currentViewYearBE}
                                        onChange={(event) => {
                                            const nextYearBE = Number(event.target.value);
                                            setViewDate((current) => new Date(nextYearBE - 543, current.getMonth(), 1));
                                        }}
                                        className="h-7 rounded-md border border-slate-200 dark:border-slate-800 bg-background px-2 text-xs font-semibold"
                                        aria-label="เลือกปี พ.ศ."
                                    >
                                        {THAI_BE_YEARS.map((yearBE) => (
                                            <option key={yearBE} value={yearBE}>
                                                {yearBE}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="mt-1 text-[10px] text-muted-foreground">ปฏิทิน พ.ศ. ไทย</p>
                            </div>
                            <button
                                type="button"
                                onClick={goToNextMonth}
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-bold"
                                aria-label="เดือนถัดไป"
                            >
                                →
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
                            {thaiDayNames.map((dayName) => (
                                <div key={dayName} className="py-1 font-semibold">
                                    {dayName}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((cell, index) => {
                                if (!cell.date) {
                                    return <div key={index} className="h-8 rounded-md" />;
                                }

                                const cellIso = cell.date.toISOString().slice(0, 10);
                                const isSelected = selectedParts
                                    ? cell.date.getDate() === selectedParts.day &&
                                      cell.date.getMonth() + 1 === selectedParts.month &&
                                      cell.date.getFullYear() + 543 === selectedParts.yearBE
                                    : false;

                                return (
                                    <button
                                        key={cellIso}
                                        type="button"
                                        onClick={() => handleSelectDate(cell.date as Date)}
                                        className={cn(
                                            "h-8 rounded-md text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40",
                                            isSelected
                                                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                                                : "border border-slate-200 dark:border-slate-800"
                                        )}
                                    >
                                        {cell.date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {value && !error && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {formatThaiBE(value)}
                </p>
            )}
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            <p className="text-[10px] text-muted-foreground">
                ตัวอย่าง: 1 ต.ค. 2567 หรือเลือกจากปฏิทิน
            </p>
        </div>
    );
}
