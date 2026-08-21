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
} from "lucide-react";

export function UserManagementTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("MILITARY_OFFICER");
  const [newDepartment, setNewDepartment] = useState("กองส่งเสริมสวัสดิการและสิทธิกำลังพล");
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-red-600 text-white">ผู้ดูแลระบบสูงสุด (Admin)</Badge>;
      case "MILITARY_OFFICER":
      case "OFFICER":
        return <Badge className="bg-emerald-600 text-white">นายทหารฝ่ายกำลังพล (Officer)</Badge>;
      case "AUDITOR":
        return <Badge className="bg-blue-600 text-white">ผู้ตรวจสอบภายใน (Auditor)</Badge>;
      default:
        return <Badge variant="secondary">กำลังพล / ทายาท</Badge>;
    }
  };

  const filtered = users.filter(
    (u) =>
      search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <UserCog className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              การจัดการผู้ใช้งานระบบ (User Management)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            กำหนดระดับสิทธิ์การเข้าถึงข้อมูลกำลังพล สิทธิประโยชน์ และชั้นความลับทางราชการ
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

      {/* Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-card shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, อีเมล, หรือหน่วยงาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-xs font-bold">ชื่อ-นามสกุล / อีเมล</TableHead>
                <TableHead className="text-xs font-bold">ระดับสิทธิ์ (Role)</TableHead>
                <TableHead className="text-xs font-bold">หน่วยงาน / สังกัด</TableHead>
                <TableHead className="text-xs font-bold">สถานะ</TableHead>
                <TableHead className="text-xs font-bold text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                    กำลังโหลดข้อมูลผู้ใช้...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                    ไม่พบข้อมูลผู้ใช้
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {user.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-xs">
                      <span className="text-slate-800 dark:text-slate-200">
                        {user.department || "หน่วยงานกลาโหม"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge className="bg-emerald-600 text-white text-[9px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        เปิดใช้งาน
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 hover:text-emerald-600">
                        แก้ไขสิทธิ์
                      </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">เพิ่มผู้ใช้งานระบบใหม่</DialogTitle>
            <DialogDescription className="text-xs">
              กำหนดข้อมูลบัญชีผู้ใช้และระดับสิทธิ์การเข้าถึงระบบ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">ชื่อ-นามสกุล / ตำแหน่ง</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="เช่น พ.ท. ธนากร พิทักษ์สิทธิ์"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">อีเมลราชการ</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="officer@mod.go.th"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ระดับสิทธิ์ (Role)</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="MILITARY_OFFICER">นายทหารฝ่ายกำลังพล (Officer)</option>
                <option value="ADMIN">ผู้ดูแลระบบสูงสุด (Admin)</option>
                <option value="AUDITOR">ผู้ตรวจสอบภายใน (Auditor)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">หน่วยงาน / สังกัด</Label>
              <Input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">รหัสผ่านเริ่มต้น</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleCreateUser}
            >
              <CheckCircle2 className="h-4 w-4" />
              บันทึกผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
