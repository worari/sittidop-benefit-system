"use client";

import { useSession, signOut, signIn } from "next-auth/react";
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
import { User, LogOut, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { Role } from "../../../core/domain/value-objects/enums";
import { RoleDescriptions } from "@/core/domain/security/rbac";

export function UserNav() {
  const { data: session } = useSession();

  const user = session?.user as any;

  const roleLabels: Record<Role, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
    [Role.SUPERADMIN]: { label: "ผู้ดูแลระบบสูงสุด (SUPERADMIN)", variant: "destructive" },
    [Role.ADMIN]: { label: "ผู้ดูแลระบบกำลังพล (ADMIN)", variant: "purple" },
    [Role.STAFF]: { label: "เจ้าหน้าที่กำลังพล (STAFF)", variant: "success" },
    [Role.COMMANDER]: { label: "ผู้บังคับบัญชา (COMMANDER)", variant: "warning" },
    [Role.AUDITOR]: { label: "ผู้ตรวจสอบภายใน (AUDITOR)", variant: "info" },
    [Role.READONLY]: { label: "กำลังพล/ทายาท (READONLY)", variant: "secondary" },
  };

  const currentRole = (user?.role as Role) || Role.SUPERADMIN;
  const roleInfo = roleLabels[currentRole] || { label: currentRole, variant: "secondary" };

  const handleQuickSwitch = async (email: string) => {
    let password = "superadmin1234";
    if (email === "admin@mod.go.th") password = "admin1234";
    if (email === "staff@mod.go.th") password = "staff1234";
    if (email === "commander@mod.go.th") password = "commander1234";
    if (email === "auditor@mod.go.th") password = "auditor1234";
    if (email === "readonly@mod.go.th") password = "readonly1234";

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 border-2 border-emerald-500/30">
            <AvatarImage src={user?.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"} alt={user?.name || "User"} />
            <AvatarFallback className="bg-emerald-600 text-white">
              {user?.name ? user.name.slice(0, 2) : "MOD"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1.5 p-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                {user?.name || "พลเอก ภูมิพัฒน์ ภักดีชนม์"}
              </p>
            </div>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {user?.email || "superadmin@mod.go.th"}
            </p>
            <div className="pt-1.5">
              <Badge variant={roleInfo.variant} className="text-[10px] font-normal">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
            สลับสิทธิ์การใช้งาน 6 ระดับ (RBAC Role Switcher)
          </DropdownMenuLabel>
          
          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("superadmin@mod.go.th")}
          >
            <span>🛡️ SUPERADMIN (ผู้ดูแลระบบสูงสุด)</span>
            {currentRole === Role.SUPERADMIN && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("admin@mod.go.th")}
          >
            <span>👨‍💼 ADMIN (ผู้ดูแลระบบกำลังพล)</span>
            {currentRole === Role.ADMIN && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("staff@mod.go.th")}
          >
            <span>✍️ STAFF (เจ้าหน้าที่กำลังพล/ธุรการ)</span>
            {currentRole === Role.STAFF && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("commander@mod.go.th")}
          >
            <span>🎖️ COMMANDER (ผู้บังคับบัญชา/ผู้อนุมัติ)</span>
            {currentRole === Role.COMMANDER && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("auditor@mod.go.th")}
          >
            <span>🕵️ AUDITOR (ผู้ตรวจสอบภายใน/สตง.)</span>
            {currentRole === Role.AUDITOR && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("readonly@mod.go.th")}
          >
            <span>👁️ READONLY (กำลังพล/ทายาท)</span>
            {currentRole === Role.READONLY && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/30"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>ออกจากระบบ (Sign out)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
