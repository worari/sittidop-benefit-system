"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export interface SystemNotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  metadata: string | null;
  createdAt: string;
}

function timeAgoThai(dateString: string): string {
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return "เมื่อสักครู่";
    if (diff < 3600) return `เมื่อ ${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `เมื่อ ${Math.floor(diff / 3600)} ชม. ที่แล้ว`;
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevCountRef = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Play subtle chime when new unread notification arrives
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or blocked by user gesture policy
    }
  };

  const fetchNotifications = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=25");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const newUnread = json.unreadCount || 0;
          if (newUnread > prevCountRef.current && prevCountRef.current !== 0) {
            playAlertSound();
          }
          prevCountRef.current = newUnread;
          setNotifications(json.data || []);
          setUnreadCount(newUnread);
        }
      }
    } catch (err) {
      console.warn("Error fetching notifications:", err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Poll notifications periodically
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch {
      // silent
    }

    if (link) {
      setOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications(true);
        }}
        className="relative h-9 w-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notifications Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[520px] animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  การแจ้งเตือนเหตุการณ์
                </span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-[10px] py-0 px-1.5 h-4 bg-rose-600 text-white">
                    ใหม่ {unreadCount}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-600" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline px-1.5 py-0.5"
                >
                  <CheckCheck className="h-3 w-3" />
                  อ่านทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Bell className="h-5 w-5 text-slate-400 opacity-60" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">ยังไม่มีการแจ้งเตือนใหม่</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เมื่อมีการบันทึกรายงานการสูญเสียกำลังพล ระบบจะแจ้งเตือนที่นี่ทันที
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isLoss = item.type === "LOSS_INCIDENT";

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.link)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 text-left group ${
                      !item.isRead
                        ? "bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="shrink-0 pt-0.5">
                      {isLoss ? (
                        <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                          <Info className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={`text-xs font-semibold truncate ${
                            !item.isRead
                              ? "text-slate-900 dark:text-slate-100"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-rose-500 mt-1" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {timeAgoThai(item.createdAt)}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium group-hover:underline flex items-center gap-0.5">
                          ดูรายละเอียด <ChevronRight className="h-3 w-3 inline" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-center">
            <Link
              href="/loss-reports"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition py-1"
            >
              <span>ดูบันทึกรายงานการสูญเสียทั้งหมด (กพ.๓ - กพ.๔)</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
