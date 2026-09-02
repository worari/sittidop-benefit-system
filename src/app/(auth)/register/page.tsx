"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { Badge } from "../../../presentation/components/ui/badge";
import { ThemeToggle } from "../../../presentation/components/layout/ThemeToggle";
import {
    Lock,
    Mail,
    UserPlus,
    ShieldCheck,
    AlertCircle,
    Sparkles,
    KeyRound,
    Eye,
    EyeOff,
    X,
    CheckCircle,
    User,
    Building,
    Phone,
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STAFF",
        phone: "",
        department: "ระบบปฏิบัติการสิทธิ",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const validateEmail = (email: string) => {
        const thaiArmyEmailPattern = /@(army\.mod\.go\.th|ทบ\.go\.th|กองทัพบก\.go\.th)$/;
        if (!email.includes("@")) {
            setEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
            return false;
        }
        if (!thaiArmyEmailPattern.test(email)) {
            setEmailError("อีเมลต้องเป็นโดเมน @army.mod.go.th เท่านั้น");
            return false;
        }
        setEmailError(null);
        return true;
    };

    const validatePassword = (password: string) => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
        }
        if (!/[A-Z]/.test(password)) {
            errors.push("ต้องมีตัวอักษรตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว");
        }
        if (!/[a-z]/.test(password)) {
            errors.push("ต้องมีตัวอักษรตัวพิมพ์เล็กอย่างน้อย 1 ตัว");
        }
        if (!/[0-9]/.test(password)) {
            errors.push("ต้องมีตัวเลขอย่างน้อย 1 ตัว");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");
        }
        setPasswordErrors(errors);
        setPasswordStrength(Math.max(0, 100 - errors.length * 20));
        return errors.length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === "email") {
            validateEmail(value);
        }
        if (name === "password") {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate form
        if (!formData.name || !formData.email || !formData.password) {
            setError("กรุณากรอกข้อมูลให้ครบถ้วน");
            setIsLoading(false);
            return;
        }

        if (!validateEmail(formData.email)) {
            setIsLoading(false);
            return;
        }

        if (!validatePassword(formData.password)) {
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login?registered=true");
                }, 2000);
            } else {
                setError(data.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
            }
        } catch {
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 20) return "bg-red-500";
        if (passwordStrength <= 60) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 20) return "อ่อนมาก";
        if (passwordStrength <= 60) return "ปานกลาง";
        return "แข็งแรง";
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md space-y-6">
                {/* Branding Logo */}
                <div className="text-center space-y-2">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-emerald-900/30 border border-emerald-600/40 bg-white mx-auto">
                            <Image
                                src="/images/logo.png"
                                alt="ตรากรมกำลังพลทหารบก"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-black tracking-tight text-slate-100">
                        ระบบสิทธิประโยชน์กำลังพล ทบ.
                    </h1>
                    <p className="text-xs text-slate-400">
                        กรมกำลังพลทหารบก (กพ.ทบ.) • กองสิทธิกำลังพล สำนักปกครองและบริการกำลังพล กองทัพบก
                    </p>
                </div>

                {/* Registration Form Card */}
                <Card className="border-emerald-800/30 dark:border-slate-800 bg-card/95 backdrop-blur-md shadow-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">สมัครสมาชิก (Sign Up)</CardTitle>
                        <CardDescription className="text-xs">
                            สร้างบัญชีผู้ใช้งานใหม่เพื่อเข้าสู่ระบบงานประมาณการสิทธิประโยชน์
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0" />
                                <span>ลงทะเบียนสำเร็จ! กำลังเปลี่ยนเข้าสู่หน้าเข้าสู่ระบบ...</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">ชื่อ-นามสกุล (Name)</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="pl-9 text-xs font-mono"
                                        placeholder="พ.อ. พงศกร พิทักษ์สิทธิ์"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">อีเมลผู้ใช้งาน (Email)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-9 text-xs font-mono"
                                        placeholder="name@army.mod.go.th"
                                    />
                                </div>
                                {emailError && (
                                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {emailError}
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">อีเมลต้องเป็นโดเมน @army.mod.go.th เท่านั้น</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">รหัสผ่าน (Password)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-9 text-xs"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="space-y-2 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">ความปลอดภัยของรหัสผ่าน:</span>
                                            <span className={`text-xs font-medium ${passwordStrength <= 20 ? 'text-red-600' : passwordStrength <= 60 ? 'text-yellow-600' : 'text-green-600'}`}>{getPasswordStrengthText()}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                                                style={{ width: `${passwordStrength}%` }}
                                            ></div>
                                        </div>
                                        {passwordErrors.length > 0 && (
                                            <ul className="text-xs text-rose-600 dark:text-rose-400 space-y-1">
                                                {passwordErrors.map((error, idx) => (
                                                    <li key={idx} className="flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {error}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน (Confirm Password)</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-9 text-xs"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-slate-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        รหัสผ่านไม่ตรงกัน
                                    </p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        รหัสผ่านตรงกัน
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="role">บทบาท (Role)</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-4 py-2 text-xs border rounded-md bg-background"
                                    >
                                        <option value="STAFF">นายทหารฝ่ายสวัสดิการ (Staff)</option>
                                        <option value="COMMANDER">ผู้บังคับบัญชา (Commander)</option>
                                        <option value="AUDITOR">ผู้ตรวจสอบภายใน (Auditor)</option>
                                        <option value="READONLY">กำลังพล / ทายาท (Personnel)</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-emerald-900/30 gap-1.5"
                            >
                                <UserPlus className="h-4 w-4 text-amber-400" />
                                {isLoading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
                            </Button>
                        </form>

                        {/* Login Links */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-slate-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1"
                                >
                                    ← เข้าสู่ระบบ
                                </Link>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Link
                                    href="/"
                                    className="text-slate-400 hover:text-slate-100 font-medium inline-flex items-center gap-1"
                                >
                                    ← กลับสู่หน้าหลักพอร์ทัลกำลังพล กองทัพบก
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Notice */}
                <div className="text-center">
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        ระบบมีความปลอดภัยระดับองค์กร - เข้ารหัสข้อมูลทั้งหมด
                    </p>
                </div>
            </div>
        </div>
    );
}