"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import {
  Calculator,
  LayoutDashboard,
  FileCheck2,
  Users,
  Layers,
  FileBarChart,
  History,
  Settings,
  Bell,
  Search,
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md border-slate-200/80 dark:border-slate-800">
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  sittidop
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                ระบบประมาณการสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ (DOP)
              </p>
            </div>
          </Link>
        </div>

        {/* Global Fast Estimate Quick Action & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/calculator">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs sm:text-sm font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">คำนวณประมาณการสิทธิ</span>
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
