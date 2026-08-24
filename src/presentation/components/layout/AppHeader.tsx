"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import {
  Shield,
  Calculator,
  LayoutDashboard,
  FileText,
  Sparkles,
  Menu,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md border-emerald-800/20 dark:border-slate-800 shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 flex items-center justify-center shadow-md shadow-emerald-900/25 border border-emerald-600/40 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  ระบบสิทธิกำลังพล ทบ.
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  กองทัพบก
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                กรมกำลังพลทหารบก (กพ.ทบ.) • กรมสวัสดิการทหารบก (สก.ทบ.)
              </p>
            </div>
          </Link>
        </div>

        {/* Global Fast Estimate Quick Action & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/calculator">
            <Button
              size="sm"
              className="bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm flex items-center gap-1.5 text-xs sm:text-sm font-medium"
            >
              <Calculator className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">คำนวณสิทธิ 4 หมวด</span>
              <span className="sm:hidden">คำนวณสิทธิ</span>
            </Button>
          </Link>

          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
