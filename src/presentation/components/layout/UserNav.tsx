"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { User, LogOut, ShieldCheck, Settings, Users, Building, Shield } from "lucide-react";
import { Role } from "../../../core/domain/value-objects/enums";

export function UserNav() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const roleLabels: Record<Role, { label: string; badgeVariant: "army" | "gold" | "secondary" | "destructive" | "outline" | "info" | "warning" }> = {
    [Role.SUPERADMIN]: { label: "ผู้ดูแลระบบสูงสุด (Superadmin)", badgeVariant: "destructive" },
    [Role.ADMIN]: { label: "ผู้ดูแลระบบกำลังพล (Admin)", badgeVariant: "army" },
    [Role.COMMANDER]: { label: "ผู้บังคับบัญชา / ผู้อนุมัติ (Commander)", badgeVariant: "gold" },
    [Role.STAFF]: { label: "เจ้าหน้าที่กำลังพลและสิทธิ (Staff)", badgeVariant: "army" },
    [Role.AUDITOR]: { label: "ผู้ตรวจสอบภายใน (Auditor)", badgeVariant: "info" },
    [Role.READONLY]: { label: "กำลังพล / ทายาท (Personnel)", badgeVariant: "secondary" },
  };

  const currentRole = (user?.role as Role) || Role.ADMIN;
  const roleInfo = roleLabels[currentRole] || { label: currentRole, badgeVariant: "secondary" };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
    : "ทบ";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-md p-0 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Avatar className="h-8 w-8 rounded-md">
            <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
            <AvatarFallback className="bg-[#1b4332] text-white font-semibold text-xs rounded-md">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-md border-slate-200 dark:border-slate-800" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.name || "กำลังพลผู้ใช้งาน ทบ."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {user?.email || "-"}
            </p>
            {user?.department && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 pt-0.5">
                <Building className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{user.department}</span>
              </p>
            )}
            <div className="pt-2">
              <Badge variant={roleInfo.badgeVariant} className="text-[10px] font-semibold">
                <ShieldCheck className="h-3 w-3 mr-1 shrink-0" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup className="p-1">
          {(currentRole === Role.SUPERADMIN || currentRole === Role.ADMIN) && (
            <DropdownMenuItem asChild className="cursor-pointer text-xs rounded">
              <Link href="/users" className="flex items-center gap-2 w-full">
                <Users className="h-4 w-4 text-slate-500" />
                <span>จัดการผู้ใช้งานในระบบ (User Management)</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer text-xs rounded">
            <Link href="/settings" className="flex items-center gap-2 w-full">
              <Settings className="h-4 w-4 text-slate-500" />
              <span>การตั้งค่าระบบ (System Settings)</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-xs text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-700 m-1 rounded"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>ออกจากระบบงาน (Sign Out)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
