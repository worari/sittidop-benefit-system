"use client";

import React, { useState } from "react";
import { AuditLogEntity } from "../../../core/domain/entities/AuditLog";
import { formatThaiDateTime } from "../../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, ShieldAlert, User, History, Terminal, Globe } from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLogEntity[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(s) ||
      (log.userName && log.userName.toLowerCase().includes(s)) ||
      log.resource.toLowerCase().includes(s) ||
      (log.detailsJson && log.detailsJson.toLowerCase().includes(s));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-4">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, กิจกรรม (Action), หรือทรัพยากร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 font-mono">
            <History className="h-3 w-3 mr-1" />
            ISO 27001 / PDPA Compliant
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">วัน-เวลา (Timestamp)</TableHead>
              <TableHead>ผู้ดำเนินการ (Actor & Role)</TableHead>
              <TableHead>กิจกรรม (Action)</TableHead>
              <TableHead>ทรัพยากร (Resource)</TableHead>
              <TableHead>รายละเอียด (Audit Payload)</TableHead>
              <TableHead className="text-right">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {formatThaiDateTime(log.timestamp)}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {log.userName || "System Service"}
                    </p>
                    {log.role && (
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {log.role}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {log.action}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                  {log.resource} {log.resourceId ? `(${log.resourceId})` : ""}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-mono max-w-xs truncate">
                  {log.detailsJson || "-"}
                </TableCell>
                <TableCell className="text-right text-xs font-mono text-muted-foreground">
                  {log.ipAddress || "127.0.0.1"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
