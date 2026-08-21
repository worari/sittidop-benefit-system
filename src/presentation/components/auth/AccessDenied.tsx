"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { Role } from "@/core/domain/value-objects/enums";
import { RoleDescriptions } from "@/core/domain/security/rbac";

interface AccessDeniedProps {
  requiredRoles?: Role[];
  currentRole?: Role;
  message?: string;
}

export function AccessDenied({
  requiredRoles = [Role.SUPERADMIN, Role.ADMIN],
  currentRole = Role.READONLY,
  message = "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ตามระเบียบการรักษาความปลอดภัยของระบบ (RBAC Access Denied)",
}: AccessDeniedProps) {
  const currentRoleInfo = RoleDescriptions[currentRole] || RoleDescriptions[Role.READONLY];

  return (
    <div className="flex items-center justify-center min-h-[65vh] p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 shadow-xl rounded-3xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            ปฏิเสธการเข้าถึง (403 Forbidden)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">สิทธิ์การใช้งานปัจจุบันของคุณ:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentRoleInfo.badgeColor}`}>
              {currentRole}
            </span>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            {currentRoleInfo.thaiTitle}
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-muted-foreground block mb-1">สิทธิ์ที่อนุญาตให้เข้าถึงหน้านี้:</span>
            <div className="flex flex-wrap gap-1">
              {requiredRoles.map((r) => (
                <span key={r} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm">
              <Home className="h-4 w-4" />
              กลับสู่หน้าหลัก (Dashboard)
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
