"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Shield,
  Users2,
  HeartHandshake,
  MapPinned,
  Calculator,
  Sliders,
  FileBarChart,
  FileText,
  FileSpreadsheet,
  FileCheck,
  UserCog,
  History,
  ShieldCheck,
  ClipboardList,
  Send,
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
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);

  const fetchPersonnelCount = async () => {
    try {
      const res = await fetch("/api/personnel");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPersonnelCount(json.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch personnel count:", err);
    }
  };

  useEffect(() => {
    fetchPersonnelCount();

    // Listen to custom update event dispatched when personnel data changes
    const handleUpdate = () => fetchPersonnelCount();
    window.addEventListener("personnel-updated", handleUpdate);
    return () => window.removeEventListener("personnel-updated", handleUpdate);
  }, [pathname]);

  const navSections = [
    {
      label: "งานสารสนเทศและทะเบียน",
      items: [
        {
          title: "ภาพรวมสถิติ (Dashboard)",
          href: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "ทะเบียนกำลังพล (Personnel)",
          href: "/personnel",
          icon: Shield,
          badge: personnelCount !== null ? `${personnelCount} นาย` : null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "ข้อมูลครอบครัว (Family)",
          href: "/family",
          icon: Users2,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "ข้อมูลทายาทและสัดส่วน",
          href: "/heirs",
          icon: HeartHandshake,
          badge: "%",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "หนังสือแสดงเจตนาทายาท",
          href: "/heirs/intent-form",
          icon: FileCheck,
          badge: "แบบ ทบ.",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "รายงานการสูญเสีย (กพ.3 / กพ.4)",
          href: "/loss-reports",
          icon: MapPinned,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
      ],
    },
    {
      label: "งานสิทธิและเงินสงเคราะห์",
      items: [
        {
          title: "คำนวณประมาณการสิทธิ 4 หมวด",
          href: "/calculator",
          icon: Calculator,
          badge: "4 หมวด",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "เสนอขอรับสิทธิและสวัสดิการ",
          href: "/claims",
          icon: Send,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "ติดตามสถานะสิทธิและเงินสงเคราะห์",
          href: "/benefit-tracking",
          icon: ClipboardList,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
      ],
    },
    {
      label: "งานเอกสารและรายงานราชการ",
      items: [
        {
          title: "สร้างหนังสือรับรองสิทธิ (กพ.ทบ.)",
          href: "/documents",
          icon: FileText,
          badge: "แบบพิมพ์",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR, Role.READONLY],
        },
        {
          title: "รายงาน & สถิติภาพรวม",
          href: "/reports",
          icon: FileBarChart,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.COMMANDER, Role.AUDITOR],
        },
        {
          title: "นำเข้าข้อมูล Excel",
          href: "/import",
          icon: FileSpreadsheet,
          badge: "Excel",
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF],
        },
      ],
    },
    {
      label: "งานบริหารและควบคุมระบบ",
      items: [
        {
          title: "สูตร & กฎเกณฑ์สิทธิประโยชน์",
          href: "/rules",
          icon: Sliders,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN, Role.STAFF, Role.AUDITOR],
        },
        {
          title: "จัดการผู้ใช้งาน (Users)",
          href: "/users",
          icon: UserCog,
          badge: null,
          roles: [Role.SUPERADMIN, Role.ADMIN],
        },
        {
          title: "ประวัติการทำงาน (Audit Trail)",
          href: "/audit-logs",
          icon: History,
          badge: "Audit",
          roles: [Role.SUPERADMIN, Role.AUDITOR],
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-[calc(100vh-4rem)] w-64 border-r bg-[#111b2e] border-[#243656] p-3 justify-between",
        className
      )}
    >
      <div className="space-y-3 overflow-y-auto pr-1">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) => {
            if (!userRole) return true;
            return item.roles.includes(userRole);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className={cn("space-y-1", sIdx > 0 && "pt-2 border-t border-[#243656]")}>
              <div className="px-2 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/80">
                  {section.label}
                </p>
              </div>

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors group",
                        isActive
                          ? "bg-[#1877F2] text-white font-semibold shadow-sm"
                          : "text-slate-300 hover:bg-[#1c2b47] hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive
                              ? "text-amber-300"
                              : "text-blue-300/70 group-hover:text-blue-200"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#1f2e4a] text-blue-200"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Branch Classification Banner */}
      <div className="rounded-md border border-[#283b5c] bg-[#162136] p-2.5 space-y-1 mt-2 shadow-xs">
        <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold">
          <ShieldCheck className="h-4 w-4 text-[#1877F2] shrink-0" />
          <span>ระบบ WeR-RTA • ศปก.ทบ.</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          บริหารจัดการสิทธิและสวัสดิการกำลังพลสายสนาม จชต. กองกำลังป้องกันชายแดน และพื้นที่เสี่ยงภัย
        </p>
      </div>
    </aside>
  );
}
