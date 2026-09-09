import { describe, it, expect } from "vitest";
import { HeirValidation } from "@/core/validation/HeirValidation";
import { HeirFormState } from "@/core/validation/HeirValidation";

describe("HeirValidation", () => {
    describe("validateHeir", () => {
        it("should accept valid heir input", () => {
            const valid: HeirFormState = {
                nationalId: "1234567890123",
                title: "นาย",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                relationship: "SPOUSE_LEGAL",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                isAlive: true,
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                allocationPercentage: 50,
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const result = HeirValidation.validateHeir(valid, 0);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject missing required fields", () => {
            const invalid: HeirFormState = {
                nationalId: "",
                title: "",
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                age: 0,
                relationship: "",
                phone: "",
                address: "",
                isAlive: true,
                bankName: "",
                bankAccountNumber: "",
                allocationPercentage: 0,
                isDesignatedSuccessor: false,
                documentsVerified: false,
            };

            const result = HeirValidation.validateHeir(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject invalid national ID", () => {
            const invalid: HeirFormState = {
                nationalId: "123456789012", // 12 digits instead of 13
                title: "นาย",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                relationship: "SPOUSE_LEGAL",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                isAlive: true,
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                allocationPercentage: 50,
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const result = HeirValidation.validateHeir(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เลขบัตรประชาชน 13 หลักไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid phone number", () => {
            const invalid: HeirFormState = {
                nationalId: "1234567890123",
                title: "นาย",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                relationship: "SPOUSE_LEGAL",
                phone: "123456789", // 9 digits instead of 10
                address: "123/456 กรุงเทพมหานคร",
                isAlive: true,
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                allocationPercentage: 50,
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const result = HeirValidation.validateHeir(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("หมายเลขโทรศัพท์ไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid age", () => {
            const invalid: HeirFormState = {
                nationalId: "1234567890123",
                title: "นาย",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 150, // Age > 120
                relationship: "SPOUSE_LEGAL",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                isAlive: true,
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                allocationPercentage: 50,
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const result = HeirValidation.validateHeir(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("อายุไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid allocation percentage", () => {
            const invalid: HeirFormState = {
                nationalId: "1234567890123",
                title: "นาย",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                relationship: "SPOUSE_LEGAL",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                isAlive: true,
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                allocationPercentage: 150, // > 100
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const result = HeirValidation.validateHeir(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100"))).toBe(true);
        });
    });

    describe("validateAllHeirs", () => {
        it("should accept valid heirs list with total 100%", () => {
            const validHeirs: HeirFormState[] = [
                {
                    nationalId: "1234567890123",
                    title: "นาย",
                    firstName: "สมชาย",
                    lastName: "ใจดี",
                    dateOfBirth: "1990-01-01",
                    age: 35,
                    relationship: "SPOUSE_LEGAL",
                    phone: "1234567890",
                    address: "123/456 กรุงเทพมหานคร",
                    isAlive: true,
                    bankName: "กรุงไทย",
                    bankAccountNumber: "1234567890",
                    allocationPercentage: 50,
                    isDesignatedSuccessor: false,
                    documentsVerified: true,
                },
                {
                    nationalId: "1234567890124",
                    title: "นาง",
                    firstName: "สมหญิง",
                    lastName: "ใจดี",
                    dateOfBirth: "1992-02-02",
                    age: 33,
                    relationship: "CHILD_LEGITIMATE",
                    phone: "1234567891",
                    address: "123/456 กรุงเทพมหานคร",
                    isAlive: true,
                    bankName: "กรุงไทย",
                    bankAccountNumber: "1234567891",
                    allocationPercentage: 50,
                    isDesignatedSuccessor: false,
                    documentsVerified: true,
                },
            ];

            const result = HeirValidation.validateAllHeirs(validHeirs);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject heirs list with total percentage not 100%", () => {
            const invalidHeirs: HeirFormState[] = [
                {
                    nationalId: "1234567890123",
                    title: "นาย",
                    firstName: "สมชาย",
                    lastName: "ใจดี",
                    dateOfBirth: "1990-01-01",
                    age: 35,
                    relationship: "SPOUSE_LEGAL",
                    phone: "1234567890",
                    address: "123/456 กรุงเทพมหานคร",
                    isAlive: true,
                    bankName: "กรุงไทย",
                    bankAccountNumber: "1234567890",
                    allocationPercentage: 50, // 50% (total 50+40 = 90% != 100%)
                    isDesignatedSuccessor: false,
                    documentsVerified: true,
                },
                {
                    nationalId: "1234567890124",
                    title: "นาง",
                    firstName: "สมหญิง",
                    lastName: "ใจดี",
                    dateOfBirth: "1992-02-02",
                    age: 33,
                    relationship: "CHILD_LEGITIMATE",
                    phone: "1234567891",
                    address: "123/456 กรุงเทพมหานคร",
                    isAlive: true,
                    bankName: "กรุงไทย",
                    bankAccountNumber: "1234567891",
                    allocationPercentage: 40, // 40%
                    isDesignatedSuccessor: false,
                    documentsVerified: true,
                },
            ];

            const result = HeirValidation.validateAllHeirs(invalidHeirs);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("ผลรวมสัดส่วนทั้งหมดต้องเป็น 100%"))).toBe(true);
        });
    });

    describe("sanitizeHeir", () => {
        it("should strip malicious content from heir data", () => {
            const dirty: HeirFormState = {
                nationalId: "<script>alert('xss')1234567890123",
                title: "นาย<script>alert('xss')",
                firstName: "สมชาย<script>alert('xss')",
                lastName: "ใจดี<script>alert('xss')",
                dateOfBirth: "1990-01-01",
                age: 35,
                relationship: "SPOUSE_LEGAL<script>alert('xss')",
                phone: "1234567890<script>alert('xss')",
                address: "123/456 กรุงเทพมหานคร<script>alert('xss')",
                isAlive: true,
                bankName: "กรุงไทย<script>alert('xss')",
                bankAccountNumber: "1234567890<script>alert('xss')",
                allocationPercentage: 50,
                isDesignatedSuccessor: false,
                documentsVerified: true,
            };

            const clean = HeirValidation.sanitizeHeir(dirty);
            expect(clean.nationalId).toBe("scriptalert(xss)1234567890123");
            expect(clean.title).toBe("นายscriptalert(xss)");
            expect(clean.firstName).toBe("สมชายscriptalert(xss)");
            expect(clean.lastName).toBe("ใจดีscriptalert(xss)");
            expect(clean.relationship).toBe("SPOUSE_LEGALscriptalert(xss)");
            expect(clean.phone).toBe("1234567890<script>alert('xss')");
            expect(clean.address).toBe("123/456 กรุงเทพมหานคร<script>alert('xss')");
            expect(clean.bankName).toBe("กรุงไทย<script>alert('xss')");
            expect(clean.bankAccountNumber).toBe("1234567890<script>alert('xss')");
        });
    });
});