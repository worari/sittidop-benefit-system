"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../presentation/components/ui/card";
import { Button } from "../../../presentation/components/ui/button";
import { Input } from "../../../presentation/components/ui/input";
import { Label } from "../../../presentation/components/ui/label";
import { ThemeToggle } from "../../../presentation/components/layout/ThemeToggle";
import {
    Lock,
    Mail,
    ShieldCheck,
    AlertCircle,
    CheckCircle,
    KeyRound,
    Eye,
    EyeOff,
    RotateCcw,
    ArrowLeft,
} from "lucide-react";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950">
                <div className="text-white text-sm">กำลังโหลด...</div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [formData, setFormData] = useState({
        email: "",
        token: token || "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

    // Validate password strength
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
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
            errors.push("ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");
        }
        setPasswordErrors(errors);
        setPasswordStrength(Math.max(0, 100 - errors.length * 20));
        return errors.length === 0;
    };

    // Verify token on component mount
    useEffect(() => {
        if (token) {
            verifyToken();
        }
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await fetch("/api/auth/verify-reset-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const data = await response.json();
            setIsTokenValid(data.valid);
        } catch {
            setIsTokenValid(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === "newPassword") {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate form
        if (!token || isTokenValid === false) {
            // Request reset flow
            if (!formData.email) {
                setError("กรุณากรอกอีเมล");
                setIsLoading(false);
                return;
            }
        } else {
            // Reset password flow
            if (!formData.token) {
                setError("ไม่พบโทเค็นการรีเซ็ต");
                setIsLoading(false);
                return;
            }

            if (!formData.newPassword || !formData.confirmPassword) {
                setError("กรุณากรอกข้อมูลให้ครบถ้วน");
                setIsLoading(false);
                return;
            }

            if (!validatePassword(formData.newPassword)) {
                setIsLoading(false);
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                setError("รหัสผ่านไม่ตรงกัน");
                setIsLoading(false);
                return;
            }
        }

        try {
            const endpoint = token && isTokenValid === true
                ? "/api/auth/reset-password"
                : "/api/auth/reset-password";

            const payload = token && isTokenValid === true
                ? { token: formData.token, newPassword: formData.newPassword }
                : { email: formData.email };

            const response = await fetch(endpoint, {
                method: token && isTokenValid === true ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login?reset=true");
                }, 3000);
            } else {
                setError(data.error || "เกิดข้อผิดพลาด");
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

                {/* Reset Password Form Card */}
                <Card className="border-emerald-800/30 dark:border-slate-800 bg-card/95 backdrop-blur-md shadow-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">รีเซ็ตรหัสผ่าน (Reset Password)</CardTitle>
                        <CardDescription className="text-xs">
                            {token && isTokenValid === true
                                ? "กรุณาตั้งรหัสผ่านใหม่"
                                : "กรุณากรอกอีเมลเพื่อรับลิงค์รีเซ็ตรหัสผ่าน"
                            }
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
                                <span>รีเซ็ตรหัสผ่านสำเร็จ! กำลังเปลี่ยนเข้าสู่หน้าเข้าสู่ระบบ...</span>
                            </div>
                        )}

                        {!token || isTokenValid === false ? (
                            // Request reset form
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">อีเมลที่ลงทะเบียน (Email)</Label>
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
                                    <p className="text-xs text-slate-500">กรุณากรอกอีเมลที่ลงทะเบียนไว้ในระบบ</p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-emerald-900/30 gap-1.5"
                                >
                                    <Mail className="h-4 w-4 text-amber-400" />
                                    {isLoading ? "กำลังส่งลิงค์..." : "ส่งลิงค์รีเซ็ต"}
                                </Button>
                            </form>
                        ) : (
                            // Reset password form
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-xs">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                        <ShieldCheck className="h-5 w-5" />
                                        <p className="font-medium">โทเค็นถูกต้อง กรุณาตั้งรหัสผ่านใหม่</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="newPassword">รหัสผ่านใหม่ (New Password)</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="newPassword"
                                            name="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.newPassword}
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
                                    {formData.newPassword && (
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
                                    <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่ (Confirm New Password)</Label>
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
                                    {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            รหัสผ่านไม่ตรงกัน
                                        </p>
                                    )}
                                    {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            รหัสผ่านตรงกัน
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm py-2.5 shadow-md shadow-emerald-900/30 gap-1.5"
                                >
                                    <RotateCcw className="h-4 w-4 text-amber-400" />
                                    {isLoading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
                                </Button>
                            </form>
                        )}

                        {/* Back Links */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-slate-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    กลับสู่หน้าเข้าสู่ระบบ
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