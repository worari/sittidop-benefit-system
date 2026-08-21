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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { User, LogOut, ShieldCheck, RefreshCw, KeyRound } from "lucide-react";
import { Role } from "../../../core/domain/value-objects/enums";

export function UserNav() {
  const { data: session } = useSession();

  const user = session?.user as any;

  const roleLabels: Record<Role, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple" }> = {
    [Role.ADMIN]: { label: "ผู้ดูแลระบบสูงสุด (ADMIN)", variant: "purple" },
    [Role.OFFICER]: { label: "เจ้าหน้าที่พิจารณาสิทธิ (OFFICER)", variant: "success" },
    [Role.AUDITOR]: { label: "ผู้ตรวจสอบ (AUDITOR)", variant: "info" },
    [Role.CITIZEN]: { label: "ประชาชนผู้รับบริการ (CITIZEN)", variant: "secondary" },
    [Role.MILITARY_OFFICER]: { label: "นายทหารฝ่ายกำลังพล (MIL_OFFICER)", variant: "success" },
    [Role.BENEFIT_REVIEWER]: { label: "นายทหารพิจารณาสิทธิ (REVIEWER)", variant: "info" },
    [Role.PERSONNEL_VIEWER]: { label: "กำลังพล / ทายาท (VIEWER)", variant: "secondary" },
  };

  const currentRole = (user?.role as Role) || Role.ADMIN;
  const roleInfo = roleLabels[currentRole] || { label: currentRole, variant: "secondary" };

  const handleQuickSwitch = async (email: string) => {
    let password = "admin1234";
    if (email === "officer@dop.go.th") password = "officer1234";
    if (email === "auditor@dop.go.th") password = "auditor1234";
    if (email === "citizen@dop.go.th") password = "citizen1234";

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
              {user?.name ? user.name.slice(0, 2) : "DOP"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1.5 p-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                {user?.name || "ดร.วิชัย ศรีสุขสง่า"}
              </p>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "admin@dop.go.th"}
            </p>
            <div className="pt-1.5">
              <Badge variant={roleInfo.variant} className="text-[11px] font-normal">
                <ShieldCheck className="h-3 w-3 mr-1" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
            สลับบัญชีทดสอบระบบ (Demo Role Switcher)
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("admin@dop.go.th")}
          >
            <span>👨‍💼 Admin (ผู้ดูแลระบบ)</span>
            {currentRole === Role.ADMIN && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("officer@dop.go.th")}
          >
            <span>👩‍💼 Officer (เจ้าหน้าที่พิจารณา)</span>
            {currentRole === Role.OFFICER && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("auditor@dop.go.th")}
          >
            <span>🕵️ Auditor (ผู้ตรวจสอบภายใน)</span>
            {currentRole === Role.AUDITOR && <span className="text-emerald-600 font-bold">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs flex items-center justify-between"
            onClick={() => handleQuickSwitch("citizen@dop.go.th")}
          >
            <span>👴 Citizen (ประชาชน/ผู้สูงอายุ)</span>
            {currentRole === Role.CITIZEN && <span className="text-emerald-600 font-bold">✓</span>}
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
