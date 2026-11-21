"use client";

import Link from "next/link";
import Image from "next/image";
import { UserNav } from "./UserNav";
import { NotificationBell } from "./NotificationBell";
import { Calculator, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#162136] border-[#283b5c] shadow-sm">
      {/* Official Government Blue & Gold Top Bar Stripe */}
      <div className="h-1 w-full bg-[#1877F2] flex">
        <div className="h-full w-28 bg-amber-400" />
      </div>

      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-200 hover:bg-[#1f2e4a]"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-blue-400/50 bg-[#0d1526] shrink-0 shadow-sm">
              <Image
                src="/images/logo.png"
                alt="ตรากรมกำลังพลทหารบก"
                fill
                sizes="44px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  ระบบ WeR-RTA
                </span>
                <span className="text-xs font-semibold text-blue-200 hidden md:inline">
                  : บริหารจัดการสิทธิและสวัสดิการกำลังพล
                </span>
                <Badge variant="army" className="text-[10px] font-semibold uppercase tracking-wider py-0 px-2">
                  ศปก.ทบ. • กพ.ทบ.
                </Badge>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                ศูนย์ปฏิบัติการกองทัพบก • กรมกำลังพลทหารบก (Welfare and Rights RTA)
              </p>
            </div>
          </Link>
        </div>

        {/* Global Fast Estimate Quick Action & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/calculator">
            <Button
              size="sm"
              className="bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center gap-1.5 text-xs sm:text-sm font-medium rounded-md shadow-xs border-0"
            >
              <Calculator className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">คำนวณสิทธิ 4 หมวด</span>
              <span className="sm:hidden">คำนวณสิทธิ</span>
            </Button>
          </Link>

          {/* Notification Bell */}
          <NotificationBell />

          <UserNav />
        </div>
      </div>
    </header>
  );
}
