"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/presentation/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/presentation/components/ui/dialog";
import {
  UserCog,
  Search,
  Plus,
  Shield,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  KeyRound,
  ShieldAlert,
  Users,
  Trash2,
} from "lucide-react";
import { Role } from "@/core/domain/value-objects/enums";
import { RoleDescriptions } from "@/core/domain/security/rbac";

export function UserManagementTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>(Role.COMMANDER);
  const [newDepartment, setNewDepartment] = useState("กรมกำลังพลทหารบก (กพ.ทบ.)");
  const [newPassword, setNewPassword] = useState("password1234");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleUserStatus = async (user: any, newStatus: boolean) => {
    const actionText = newStatus ? "อนุมัติสิทธิ์เข้าใช้งาน" : "ระงับสิทธิ์การใช้งาน";
    if (!confirm(`ยืนยันการ ${actionText} ของ "${user.name}" หรือไม่?`)) return;

    try {
      setActionLoadingId(user.id);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || `เกิดข้อผิดพลาดในการ ${actionText}`);
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`ยืนยันการลบบัญชีผู้ใช้งาน "${user.name}" (${user.email}) หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

    try {
      setActionLoadingId(user.id);
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการลบผู้ใช้งาน");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          department: newDepartment,
          password: newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        fetchUsers();
      } else {
        alert(json.error || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role: Role) => {
    const info = RoleDescriptions[role] || RoleDescriptions[Role.READONLY];
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${info.badgeColor}`}>
        {info.thaiTitle} ({role})
      </span>
    );
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && !u.isActive) ||
      (statusFilter === "ACTIVE" && u.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  const pendingCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <UserCog className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              การจัดการผู้ใช้งานระบบและการอนุมัติสิทธิ์ (User Management & Approval)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            พิจารณาอนุมัติบัญชีผู้ลงทะเบียนใหม่ และกำหนดระดับสิทธิ์การเข้าถึงข้อมูลกำลังพลสายสนาม กองทัพบก
          </p>
        </div>

        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          เพิ่มผู้ใช้งานใหม่
        </Button>
      </div>

      {/* Pending Approval Banner */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-300">
                มีผู้ลงทะเบียนใหม่รอการอนุมัติเข้าใช้งาน {pendingCount} บัญชี
              </p>
              <p className="text-xs text-slate-300">
                ผู้ลงทะเบียนใหม่จะไม่สามารถเข้าใช้งานระบบจนกว่าผู้ดูแลระบบจะกดอนุมัติสิทธิ์
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 self-start sm:self-auto"
          >
            {statusFilter === "PENDING" ? "แสดงทั้งหมด" : "ดูเฉพาะรออนุมัติ"}
          </Button>
        </div>
      )}

      {/* 6 Roles Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(RoleDescriptions).map(([roleKey, r]) => {
          const count = users.filter((u) => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              onClick={() => setRoleFilter(roleFilter === roleKey ? "ALL" : roleKey)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${roleFilter === roleKey
                  ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-600"
                  : "border-slate-200 dark:border-slate-800 bg-card hover:border-slate-300"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-muted-foreground">{roleKey}</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{count}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {r.thaiTitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, อีเมล, หรือหน่วยงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="ALL">ทุกสถานะ ({users.length})</option>
              <option value="PENDING">รออนุมัติ ({pendingCount})</option>
              <option value="ACTIVE">อนุมัติแล้ว ({users.length - pendingCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">สิทธิ์:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="ALL">ทุกระดับสิทธิ์</option>
              <option value={Role.SUPERADMIN}>SUPERADMIN</option>
              <option value={Role.ADMIN}>ADMIN</option>
              <option value={Role.STAFF}>STAFF</option>
              <option value={Role.COMMANDER}>COMMANDER</option>
              <option value={Role.AUDITOR}>AUDITOR</option>
              <option value={Role.READONLY}>READONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold w-12">ลำดับ</TableHead>
                <TableHead className="text-xs font-bold">ชื่อ - สกุล</TableHead>
                <TableHead className="text-xs font-bold">อีเมล / บัญชี</TableHead>
                <TableHead className="text-xs font-bold">ระดับสิทธิ์ (RBAC Role)</TableHead>
                <TableHead className="text-xs font-bold">สังกัด / หน่วยงาน</TableHead>
                <TableHead className="text-xs font-bold text-center">สถานะการใช้งาน</TableHead>
                <TableHead className="text-xs font-bold text-center w-36">การอนุมัติ / จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u, idx) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="text-xs font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(u.role)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.department || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.isActive ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                          อนุมัติแล้ว (ใช้งานได้)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold animate-pulse">
                          รออนุมัติเข้าใช้งาน
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!u.isActive ? (
                          <Button
                            size="sm"
                            onClick={() => handleToggleUserStatus(u, true)}
                            disabled={actionLoadingId === u.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2.5 font-bold shadow-xs gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            อนุมัติ
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleUserStatus(u, false)}
                            disabled={actionLoadingId === u.id}
                            className="text-[11px] h-7 px-2 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            ระงับ
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(u)}
                          disabled={actionLoadingId === u.id}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="ลบผู้ใช้งาน"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCog className="h-5 w-5 text-emerald-600" />
              เพิ่มผู้ใช้งานและกำหนดระดับสิทธิ์ (New RBAC User)
            </DialogTitle>
            <DialogDescription className="text-xs">
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่และกำหนดระดับสิทธิ์ตามบทบาทหน้าที่
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">ชื่อ - สกุล</Label>
              <Input
                placeholder="เช่น พันตรี วราดร พิทักษ์ไทย"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">อีเมลราชการ (@mod.go.th)</Label>
              <Input
                type="email"
                placeholder="officer@mod.go.th"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">ระดับสิทธิ์ (RBAC Role)</Label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value={Role.SUPERADMIN}>SUPERADMIN - ผู้ดูแลระบบสูงสุด</option>
                <option value={Role.ADMIN}>ADMIN - ผู้ดูแลระบบฝ่ายกำลังพล</option>
                <option value={Role.STAFF}>STAFF - เจ้าหน้าที่ธุรการ / สวัสดิการ</option>
                <option value={Role.COMMANDER}>COMMANDER - ผู้บังคับบัญชา / ผู้อนุมัติ</option>
                <option value={Role.AUDITOR}>AUDITOR - ผู้ตรวจสอบภายใน / สตง.</option>
                <option value={Role.READONLY}>READONLY - กำลังพล / ทายาท (อ่านอย่างเดียว)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">สังกัด / หน่วยงาน</Label>
              <Input
                placeholder="เช่น กรมกำลังพลทหารบก"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">รหัสผ่านเริ่มต้น (Default Password)</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)} className="text-xs">
              ยกเลิก
            </Button>
            <Button size="sm" onClick={handleCreateUser} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
              บันทึกผู้ใช้งาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
