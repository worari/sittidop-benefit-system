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
} from "lucide-react";
import { Role } from "@/core/domain/value-objects/enums";
import { RoleDescriptions } from "@/core/domain/security/rbac";

export function UserManagementTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>(Role.STAFF);
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

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <UserCog className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              การจัดการผู้ใช้งานระบบ (User Management & RBAC)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            กำหนดระดับสิทธิ์การเข้าถึงข้อมูลกำลังพลและสิทธิประโยชน์ 6 ระดับ (SUPERADMIN, ADMIN, STAFF, COMMANDER, AUDITOR, READONLY)
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

      {/* 6 Roles Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(RoleDescriptions).map(([roleKey, r]) => {
          const count = users.filter((u) => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              onClick={() => setRoleFilter(roleFilter === roleKey ? "ALL" : roleKey)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                roleFilter === roleKey
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">กรองสิทธิ์:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="ALL">ทุกระดับสิทธิ์ ({users.length})</option>
            <option value={Role.SUPERADMIN}>SUPERADMIN</option>
            <option value={Role.ADMIN}>ADMIN</option>
            <option value={Role.STAFF}>STAFF</option>
            <option value={Role.COMMANDER}>COMMANDER</option>
            <option value={Role.AUDITOR}>AUDITOR</option>
            <option value={Role.READONLY}>READONLY</option>
          </select>
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
                <TableHead className="text-xs font-bold text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
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
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-300">
                          ระงับชั่วคราว
                        </Badge>
                      )}
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
