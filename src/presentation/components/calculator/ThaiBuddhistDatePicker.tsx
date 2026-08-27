"use client";

import React, { useState, useEffect, useRef } from "react";
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
    const nativeInputRef = useRef<HTMLInputElement>(null);

    // Sync text value from ISO value
    useEffect(() => {
        const parts = toThaiDateParts(value);
        if (parts) {
            setTextValue(
                `${parts.day.toString().padStart(2, "0")}/${parts.month
                    .toString()
                    .padStart(2, "0")}/${parts.yearBE}`
            );
        } else {
            setTextValue("");
        }
    }, [value]);

    const parseThaiDateText = (text: string): ThaiDateParts | null => {
        const clean = text.trim();
        if (!clean) return null;

        // Accept "dd/mm/yyyy" or "dd-mm-yyyy" where year is B.E.
        const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (!match) return null;

        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const yearBE = parseInt(match[3], 10);

        if (
            isNaN(day) ||
            isNaN(month) ||
            isNaN(yearBE) ||
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
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setTextValue(text);
        setError(null);

        const parts = parseThaiDateText(text);
        if (parts) {
            try {
                const iso = fromThaiDateParts(parts);
                onChange(iso);
            } catch {
                setError("วันที่ไม่ถูกต้อง");
            }
        } else if (text.trim() === "") {
            onChange(undefined);
        }
    };

    const handleTextBlur = () => {
        if (textValue.trim() && !parseThaiDateText(textValue)) {
            setError("รูปแบบไม่ถูกต้อง (วว/ดด/ปปปป พ.ศ.)");
        } else {
            setError(null);
        }
    };

    const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value;
        onChange(iso || undefined);
        setError(null);
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <Label htmlFor={inputId} className="text-xs">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
            )}
            <div className="relative">
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
                    onClick={() => nativeInputRef.current?.showPicker?.()}
                    disabled={disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-600 disabled:opacity-50"
                    aria-label="เปิดปฏิทิน"
                >
                    <Calendar className="h-4 w-4" />
                </button>
                <input
                    ref={nativeInputRef}
                    type="date"
                    value={value || ""}
                    onChange={handleNativeChange}
                    disabled={disabled}
                    className="sr-only"
                    tabIndex={-1}
                />
            </div>
            {value && !error && (
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    {formatThaiBE(value)}
                </p>
            )}
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            <p className="text-[10px] text-muted-foreground">
                ตัวอย่าง: 01/05/2567 (พ.ศ.) หรือเลือกจากปฏิทิน
            </p>
        </div>
    );
}
