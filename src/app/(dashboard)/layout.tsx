"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { AppHeader } from "../../presentation/components/layout/AppHeader";
import { Sidebar } from "../../presentation/components/layout/Sidebar";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirectUrl = `/login?callbackUrl=${encodeURIComponent(pathname || "/dashboard")}`;
      router.replace(redirectUrl);
    } else if (status === "authenticated" && (session?.user as any)?.isActive === false) {
      router.replace("/login?error=PendingApproval");
    }
  }, [status, session, router, pathname]);

  // Loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1526] text-slate-100 p-4">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin absolute" />
          <div className="relative h-14 w-14 rounded-full overflow-hidden p-0.5 bg-[#162136] border border-[#283b5c]">
            <Image
              src="/images/logo.png"
              alt="ตรากรมกำลังพลทหารบก"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#1877F2]" />
          กำลังตรวจสอบสิทธิ์การเข้าถึงระบบ WeR-RTA...
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          กรมกำลังพลทหารบก (กพ.ทบ.) • ศปก.ทบ.
        </p>
      </div>
    );
  }

  // If unauthenticated or pending approval, prevent showing any protected dashboard UI
  if (status === "unauthenticated" || (session?.user as any)?.isActive === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1526] text-slate-100">
      {/* Top Application Header */}
      <AppHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Fixed Sidebar */}
        <Sidebar className="hidden md:flex shrink-0 sticky top-16" />

        {/* Mobile Slide-out Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <Sidebar
              className="relative z-50 w-72 h-full bg-[#162136] p-4 border-r border-[#283b5c]"
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
