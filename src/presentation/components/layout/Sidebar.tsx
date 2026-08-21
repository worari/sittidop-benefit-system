"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Shield,
  Users2,
  HeartHandshake,
  Calculator,
  Sliders,
  FileBarChart,
  FileText,
  UserCog,
  History,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Role } from "../../../core/domain/value-objects/enums";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as Role;

  const navigation = [
    {
      title: "ภาพรวมสถิติ (Dashboard)",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.CITIZEN, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "ทะเบียนกำลังพล (Personnel)",
      href: "/personnel",
      icon: Shield,
      badge: "4 นาย",
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "ข้อมูลครอบครัว (Family)",
      href: "/family",
      icon: Users2,
      badge: null,
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "ข้อมูลทายาท (Heir Info)",
      href: "/heirs",
      icon: HeartHandshake,
      badge: "สัดส่วน %",
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "คำนวณประมาณการสิทธิ",
      href: "/calculator",
      icon: Calculator,
      badge: "4 หมวด",
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.CITIZEN, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "สูตร & กฎเกณฑ์สิทธิประโยชน์",
      href: "/rules",
      icon: Sliders,
      badge: "Config",
      roles: [Role.ADMIN, Role.OFFICER, Role.MILITARY_OFFICER],
    },
    {
      title: "รายงาน & สถิติภาพรวม",
      href: "/reports",
      icon: FileBarChart,
      badge: "Export",
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.MILITARY_OFFICER],
    },
    {
      title: "สร้างหนังสือรับรองสิทธิทางการ",
      href: "/documents",
      icon: FileText,
      badge: "Printable",
      roles: [Role.ADMIN, Role.OFFICER, Role.AUDITOR, Role.MILITARY_OFFICER, Role.BENEFIT_REVIEWER],
    },
    {
      title: "จัดการผู้ใช้งาน (User Management)",
      href: "/users",
      icon: UserCog,
      badge: null,
      roles: [Role.ADMIN],
    },
    {
      title: "ประวัติการทำงาน (Audit Trail)",
      href: "/audit-logs",
      icon: History,
      badge: "ISO",
      roles: [Role.ADMIN, Role.AUDITOR],
    },
  ];

  const visibleNav = navigation.filter((item) => {
    if (!userRole) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        "flex flex-col h-[calc(100vh-4rem)] w-64 border-r bg-card/60 backdrop-blur-md border-slate-200/80 dark:border-slate-800 p-4 justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            ระบบงานหลัก (Main Navigation)
          </p>
        </div>

        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
          {visibleNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-bold shadow-xs dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </div>

                {item.badge && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "text-[9px] px-1.5 py-0 font-normal shrink-0",
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Security & Branch Classification Banner */}
      <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-3 dark:border-emerald-900/40 dark:from-emerald-950/30 space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>ระบบความปลอดภัยกลาโหม</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          คุ้มครองข้อมูลสิทธิกำลังพลและทายาทตามระเบียบชั้นความลับทางราชการ
        </p>
      </div>
    </aside>
  );
}
