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
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Search,
  ShieldAlert,
  User,
  History,
  Terminal,
  Globe,
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound,
  PlusCircle,
  Edit,
  Trash2,
  LogIn,
  Eye,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";

interface AuditLogViewerProps {
  logs: AuditLogEntity[];
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntity | null>(null);

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
      case "USER_CREATED":
      case "PERSONNEL_CREATED":
      case "RULE_CREATED":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] gap-1">
            <PlusCircle className="h-3 w-3" /> CREATE
          </Badge>
        );
      case "UPDATE":
      case "USER_UPDATED":
      case "PERSONNEL_UPDATED":
      case "RULE_UPDATED":
      case "RULE_FORMULA_UPDATED":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] gap-1">
            <Edit className="h-3 w-3" /> UPDATE
          </Badge>
        );
      case "DELETE":
      case "USER_DELETED":
      case "PERSONNEL_DELETED":
      case "RULE_DELETED":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] gap-1">
            <Trash2 className="h-3 w-3" /> DELETE
          </Badge>
        );
      case "EXPORT_PDF":
      case "DOCUMENT_EXPORTED_PDF":
        return (
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] gap-1">
            <FileText className="h-3 w-3" /> EXPORT PDF
          </Badge>
        );
      case "EXPORT_DOCX":
      case "DOCUMENT_EXPORTED":
      case "DOCUMENT_EXPORTED_DOCX":
        return (
          <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] gap-1">
            <FileSpreadsheet className="h-3 w-3" /> EXPORT DOCX
          </Badge>
        );
      case "LOGIN":
      case "USER_LOGIN_SUCCESS":
        return (
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] gap-1">
            <LogIn className="h-3 w-3" /> LOGIN
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            {action}
          </Badge>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(s) ||
      (log.userName && log.userName.toLowerCase().includes(s)) ||
      (log.userId && log.userId.toLowerCase().includes(s)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(s)) ||
      log.resource.toLowerCase().includes(s) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(s)) ||
      (log.detailsJson && log.detailsJson.toLowerCase().includes(s));

    let matchesAction = actionFilter === "ALL";
    if (actionFilter === "CREATE") {
      matchesAction = log.action.toUpperCase().includes("CREATE");
    } else if (actionFilter === "UPDATE") {
      matchesAction = log.action.toUpperCase().includes("UPDATE");
    } else if (actionFilter === "DELETE") {
      matchesAction = log.action.toUpperCase().includes("DELETE");
    } else if (actionFilter === "EXPORT_PDF") {
      matchesAction = log.action.toUpperCase().includes("PDF");
    } else if (actionFilter === "EXPORT_DOCX") {
      matchesAction = log.action.toUpperCase().includes("DOCX") || log.action.toUpperCase().includes("EXPORTED");
    } else if (actionFilter === "LOGIN") {
      matchesAction = log.action.toUpperCase().includes("LOGIN");
    }

    return matchesSearch && matchesAction;
  });

  const handleExportCsv = () => {
    const exportData = filteredLogs.map((l, idx) => ({
      ลำดับ: idx + 1,
      วันเวลา: formatThaiDateTime(l.timestamp),
      กิจกรรม_Action: l.action,
      ผู้ปฏิบัติงาน: l.userName || "-",
      ระดับสิทธิ์_Role: l.role || "-",
      IP_Address: l.ipAddress || "-",
      ทรัพยากร_Resource: l.resource,
      รหัสทรัพยากร_ResourceID: l.resourceId || "-",
      User_Agent: l.userAgent || "-",
      รายละเอียด_JSON: l.detailsJson || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit_Trail");
    XLSX.writeFile(wb, `Audit_Trail_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const actionCounts = {
    ALL: logs.length,
    CREATE: logs.filter((l) => l.action.toUpperCase().includes("CREATE")).length,
    UPDATE: logs.filter((l) => l.action.toUpperCase().includes("UPDATE")).length,
    DELETE: logs.filter((l) => l.action.toUpperCase().includes("DELETE")).length,
    EXPORT_PDF: logs.filter((l) => l.action.toUpperCase().includes("PDF")).length,
    EXPORT_DOCX: logs.filter((l) => l.action.toUpperCase().includes("DOCX") || l.action.toUpperCase().includes("EXPORTED")).length,
    LOGIN: logs.filter((l) => l.action.toUpperCase().includes("LOGIN")).length,
  };

  return (
    <div className="space-y-4">
      {/* 6 Tracked Actions Filter Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { key: "ALL", label: "ทั้งหมด (All)", count: actionCounts.ALL, icon: Filter },
          { key: "CREATE", label: "Create", count: actionCounts.CREATE, icon: PlusCircle },
          { key: "UPDATE", label: "Update", count: actionCounts.UPDATE, icon: Edit },
          { key: "DELETE", label: "Delete", count: actionCounts.DELETE, icon: Trash2 },
          { key: "EXPORT_PDF", label: "Export PDF", count: actionCounts.EXPORT_PDF, icon: FileText },
          { key: "EXPORT_DOCX", label: "Export DOCX", count: actionCounts.EXPORT_DOCX, icon: FileSpreadsheet },
          { key: "LOGIN", label: "Login", count: actionCounts.LOGIN, icon: LogIn },
        ].map((item) => {
          const isSelected = actionFilter === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setActionFilter(item.key)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-600"
                  : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  {item.label}
                </span>
                <span className="font-mono text-xs">{item.count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อผู้ปฏิบัติงาน, IP Address, หรือกิจกรรม..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            ส่งออกบันทึกประวัติ (Export Excel)
          </Button>
          <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 font-mono py-1">
            <History className="h-3 w-3 mr-1 text-emerald-600" />
            ISO 27001 / PDPA
          </Badge>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold w-40">วัน-เวลาประทับ (Timestamp)</TableHead>
                <TableHead className="text-xs font-bold w-28">กิจกรรม (Action)</TableHead>
                <TableHead className="text-xs font-bold">ผู้ปฏิบัติงาน / สิทธิ์ (User & Role)</TableHead>
                <TableHead className="text-xs font-bold">IP Address</TableHead>
                <TableHead className="text-xs font-bold">ข้อมูลเป้าหมาย (Resource)</TableHead>
                <TableHead className="text-xs font-bold text-center w-20">รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    ไม่พบบันทึกประวัติการปฏิบัติงานที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                      {formatThaiDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {log.userName || "System"}
                        </span>
                        {log.role && (
                          <span className="text-[10px] font-mono text-muted-foreground block">
                            [{log.role}]
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                        <Globe className="h-3 w-3 text-emerald-600" />
                        {log.ipAddress || "127.0.0.1"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {log.resource}
                        </span>
                        {log.resourceId && (
                          <span className="font-mono text-[10px] text-muted-foreground block">
                            ID: {log.resourceId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-emerald-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* JSON Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-600" />
              รายละเอียดบันทึกการปฏิบัติงาน (Audit Log Payload)
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              Log ID: {selectedLog?.id} • {selectedLog?.timestamp && formatThaiDateTime(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-muted-foreground text-[10px] block">กิจกรรม (Action):</span>
                  <span className="font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">ผู้ปฏิบัติงาน:</span>
                  <span className="font-bold">{selectedLog.userName} ({selectedLog.role})</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">IP Address:</span>
                  <span className="font-mono">{selectedLog.ipAddress || "127.0.0.1"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">Resource:</span>
                  <span className="font-semibold">{selectedLog.resource} ({selectedLog.resourceId || "-"})</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-[10px] block mb-1">User Agent / Client Browser:</span>
                <p className="p-2 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[10px] break-all border">
                  {selectedLog.userAgent || "Internal"}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-[10px] block mb-1">Payload Details (JSON):</span>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-52 border border-slate-800">
                  {selectedLog.detailsJson
                    ? JSON.stringify(JSON.parse(selectedLog.detailsJson), null, 2)
                    : "// No additional payload"}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
