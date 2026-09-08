"use client";

import React, { useState } from "react";
import { DimensionOption, DimensionType } from "@/core/domain/entities/BenefitRule";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Plus, Pencil, Trash2, X, Check, Search } from "lucide-react";

interface DimensionChipsEditorProps {
    options: DimensionOption[];
    dimensionType: DimensionType;
    selected: string[];
    onChange: (nextSelected: string[]) => void;
    tone?: "emerald" | "purple" | "rose";
    onOptionsChanged?: () => void;
    addPlaceholder?: string;
    readOnlySelection?: boolean;
}

const TONE_STYLES: Record<string, { active: string; edit: string }> = {
    emerald: {
        active: "bg-emerald-800 text-white font-bold border-emerald-900",
        edit: "border-emerald-400 dark:border-emerald-700",
    },
    purple: {
        active: "bg-purple-800 text-white font-bold border-purple-900",
        edit: "border-purple-400 dark:border-purple-700",
    },
    rose: {
        active: "bg-rose-800 text-white font-bold border-rose-900",
        edit: "border-rose-400 dark:border-rose-700",
    },
};

export function DimensionChipsEditor({
    options,
    dimensionType,
    selected,
    onChange,
    tone = "emerald",
    onOptionsChanged,
    addPlaceholder = "พิมพ์ชื่อตัวเลือกใหม่...",
    readOnlySelection = false,
}: DimensionChipsEditorProps) {
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const styles = TONE_STYLES[tone] ?? TONE_STYLES.emerald;

    const filtered = options.filter((o) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
    });

    const toggleOption = (id: string) => {
        if (readOnlySelection) return;
        if (selected.includes(id)) {
            onChange(selected.filter((x) => x !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const handleAdd = async () => {
        if (!newLabel.trim()) return;
        try {
            setAdding(true);
            const res = await fetch("/api/rules/dimensions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: newLabel.trim(), type: dimensionType }),
            });
            const json = await res.json();
            if (json.success && json.data?.id) {
                if (!readOnlySelection) {
                    onChange([...selected, json.data.id]);
                }
                setNewLabel("");
                setShowAdd(false);
                onOptionsChanged?.();
            } else {
                alert(json.error || "ไม่สามารถเพิ่มตัวเลือกใหม่ได้");
            }
        } catch (err: any) {
            alert(err.message || "Failed to create option");
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (opt: DimensionOption) => {
        setEditingId(opt.id);
        setEditLabel(opt.label);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editLabel.trim()) return;
        try {
            setSavingEdit(true);
            const res = await fetch(`/api/rules/dimensions?id=${encodeURIComponent(editingId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ label: editLabel.trim() }),
            });
            const json = await res.json();
            if (json.success) {
                setEditingId(null);
                setEditLabel("");
                onOptionsChanged?.();
            } else {
                alert(json.error || "ไม่สามารถแก้ไขตัวเลือกได้");
            }
        } catch (err: any) {
            alert(err.message || "Failed to update option");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDelete = async (opt: DimensionOption) => {
        const isSystem = !!opt.isSystem;
        const confirmMsg = isSystem
            ? `ตัวเลือก "${opt.label}" เป็นตัวเลือกมาตรฐานของระบบ\n\nยืนยันการลบถาวร? ระบบจะลบออกจากรายการหลัก และนำออกจากกฎเกณฑ์สิทธิที่อ้างอิงด้วย (cascade)`
            : `ยืนยันการลบตัวเลือก "${opt.label}"?\n\nระบบจะลบออกจากรายการหลัก และนำออกจากกฎเกณฑ์สิทธิที่อ้างอิงด้วย (cascade)`;
        if (!confirm(confirmMsg)) return;

        try {
            setDeletingId(opt.id);
            const res = await fetch(`/api/rules/dimensions?id=${encodeURIComponent(opt.id)}&cascade=true`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (json.success) {
                if (!readOnlySelection) {
                    onChange(selected.filter((x) => x !== opt.id));
                }
                onOptionsChanged?.();
                if (json.message) console.info(json.message);
            } else {
                alert(json.error || "ไม่สามารถลบตัวเลือกได้");
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete option");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาตัวเลือก..."
                        className="h-8 text-xs pl-7"
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-[11px] h-8 gap-1 shrink-0"
                >
                    {showAdd ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {showAdd ? "ยกเลิก" : "เพิ่มตัวเลือกใหม่"}
                </Button>
            </div>

            {showAdd && (
                <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-slate-300 dark:border-slate-700">
                    <Input
                        autoFocus
                        placeholder={addPlaceholder}
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                        }}
                        className="text-xs h-8"
                    />
                    <Button
                        size="sm"
                        onClick={handleAdd}
                        disabled={adding || !newLabel.trim()}
                        className="text-xs h-8 bg-emerald-800 text-white shrink-0"
                    >
                        {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
                    </Button>
                </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
                {filtered.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">ไม่พบตัวเลือกที่ตรงกับการค้นหา</p>
                ) : (
                    filtered.map((opt) => {
                        const isChecked = selected.includes(opt.id);
                        const isEditing = editingId === opt.id;
                        return (
                            <div
                                key={opt.id}
                                className={`group relative flex items-center gap-1 rounded-lg border transition-all ${isEditing ? `${styles.edit} bg-background px-1.5 py-0.5` : ""}`}
                            >
                                {isEditing ? (
                                    <>
                                        <Input
                                            autoFocus
                                            value={editLabel}
                                            onChange={(e) => setEditLabel(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveEdit();
                                                if (e.key === "Escape") setEditingId(null);
                                            }}
                                            className="text-xs h-7 w-52"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            disabled={savingEdit || !editLabel.trim()}
                                            title="บันทึก"
                                            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            title="ยกเลิก"
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => toggleOption(opt.id)}
                                            disabled={readOnlySelection}
                                            className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left ${
                                                isChecked && !readOnlySelection
                                                    ? styles.active
                                                    : `bg-background text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${readOnlySelection ? "opacity-85" : ""}`
                                            }`}
                                        >
                                            {opt.label}
                                            {opt.isSystem && (
                                                <span className={`ml-1 text-[9px] ${isChecked ? "opacity-80" : "opacity-50"}`}>
                                                    ★
                                                </span>
                                            )}
                                        </button>

                                        <span className="hidden group-hover:flex items-center absolute -top-1.5 -right-1.5 gap-0.5">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    startEdit(opt);
                                                }}
                                                title="แก้ไขชื่อตัวเลือก"
                                                className="p-0.5 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                            >
                                                <Pencil className="h-2.5 w-2.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(opt);
                                                }}
                                                disabled={deletingId === opt.id}
                                                title="ลบตัวเลือก (cascade)"
                                                className="p-0.5 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <p className="text-[10px] text-muted-foreground">
                ★ = ตัวเลือกมาตรฐานของระบบ · ชี้เมาส์ที่ตัวเลือกเพื่อ แก้ไข/ลบ · การลบจะนำตัวเลือกออกจากกฎเกณฑ์ที่อ้างอิงด้วย (cascade)
            </p>
        </div>
    );
}