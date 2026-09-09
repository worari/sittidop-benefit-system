import { describe, it, expect } from "vitest";
import { FamilyValidation } from "@/core/validation/FamilyValidation";
import { SpouseFormState, ChildFormState } from "@/core/validation/FamilyValidation";

describe("FamilyValidation", () => {
    describe("validateSpouse", () => {
        it("should accept valid spouse input", () => {
            const valid: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const result = FamilyValidation.validateSpouse(valid, 0);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject missing required fields", () => {
            const invalid: SpouseFormState = {
                hasSpouse: false,
                nationalId: "",
                title: "",
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                age: 0,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "",
                phone: "",
                address: "",
                bankName: "",
                bankAccountNumber: "",
                hasPensionRights: true,
                allocationPercentage: 0,
            };

            const result = FamilyValidation.validateSpouse(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject invalid national ID", () => {
            const invalid: SpouseFormState = {
                hasSpouse: true,
                nationalId: "123456789012", // 12 digits instead of 13
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const result = FamilyValidation.validateSpouse(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เลขบัตรประชาชน 13 หลักไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid phone number", () => {
            const invalid: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "123456789", // 9 digits instead of 10
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const result = FamilyValidation.validateSpouse(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("หมายเลขโทรศัพท์ไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid age", () => {
            const invalid: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 150, // Age > 120
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const result = FamilyValidation.validateSpouse(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("อายุไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid allocation percentage", () => {
            const invalid: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 150, // > 100
            };

            const result = FamilyValidation.validateSpouse(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100"))).toBe(true);
        });
    });

    describe("validateChild", () => {
        it("should accept valid child input", () => {
            const valid: ChildFormState = {
                nationalId: "1234567890123",
                title: "ด.ช.",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "2010-01-01",
                age: 15,
                isAlive: true,
                isStudying: true,
                educationLevel: "PRIMARY",
                phone: "1234567890",
                scholarshipEligible: true,
                annualScholarship: 15000,
                hasSuccessorRight: false,
                allocationPercentage: 25,
            };

            const result = FamilyValidation.validateChild(valid, 0);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject missing required fields", () => {
            const invalid: ChildFormState = {
                nationalId: "",
                title: "",
                firstName: "",
                lastName: "",
                dateOfBirth: "",
                age: 0,
                isAlive: true,
                isStudying: true,
                educationLevel: "",
                phone: "",
                scholarshipEligible: true,
                annualScholarship: 0,
                hasSuccessorRight: false,
                allocationPercentage: 0,
            };

            const result = FamilyValidation.validateChild(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject invalid national ID", () => {
            const invalid: ChildFormState = {
                nationalId: "123456789012", // 12 digits instead of 13
                title: "ด.ช.",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "2010-01-01",
                age: 15,
                isAlive: true,
                isStudying: true,
                educationLevel: "PRIMARY",
                phone: "1234567890",
                scholarshipEligible: true,
                annualScholarship: 15000,
                hasSuccessorRight: false,
                allocationPercentage: 25,
            };

            const result = FamilyValidation.validateChild(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เลขบัตรประชาชน 13 หลักไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid age", () => {
            const invalid: ChildFormState = {
                nationalId: "1234567890123",
                title: "ด.ช.",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "2010-01-01",
                age: 30, // Age > 25
                isAlive: true,
                isStudying: true,
                educationLevel: "PRIMARY",
                phone: "1234567890",
                scholarshipEligible: true,
                annualScholarship: 15000,
                hasSuccessorRight: false,
                allocationPercentage: 25,
            };

            const result = FamilyValidation.validateChild(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("อายุไม่ถูกต้อง"))).toBe(true);
        });

        it("should reject invalid education level", () => {
            const invalid: ChildFormState = {
                nationalId: "1234567890123",
                title: "ด.ช.",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "2010-01-01",
                age: 15,
                isAlive: true,
                isStudying: true,
                educationLevel: "", // Empty education level
                phone: "1234567890",
                scholarshipEligible: true,
                annualScholarship: 15000,
                hasSuccessorRight: false,
                allocationPercentage: 25,
            };

            const result = FamilyValidation.validateChild(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("ต้องระบุระดับการศึกษา"))).toBe(true);
        });

        it("should reject invalid allocation percentage", () => {
            const invalid: ChildFormState = {
                nationalId: "1234567890123",
                title: "ด.ช.",
                firstName: "สมชาย",
                lastName: "ใจดี",
                dateOfBirth: "2010-01-01",
                age: 15,
                isAlive: true,
                isStudying: true,
                educationLevel: "PRIMARY",
                phone: "1234567890",
                scholarshipEligible: true,
                annualScholarship: 15000,
                hasSuccessorRight: false,
                allocationPercentage: 150, // > 100
            };

            const result = FamilyValidation.validateChild(invalid, 0);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100"))).toBe(true);
        });
    });

    describe("validateAllFamily", () => {
        it("should accept valid family data with total 100%", () => {
            const validSpouse: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const validChildren: ChildFormState[] = [
                {
                    nationalId: "1234567890124",
                    title: "ด.ช.",
                    firstName: "สมชาย",
                    lastName: "ใจดี",
                    dateOfBirth: "2010-01-01",
                    age: 15,
                    isAlive: true,
                    isStudying: true,
                    educationLevel: "PRIMARY",
                    phone: "1234567891",
                    scholarshipEligible: true,
                    annualScholarship: 15000,
                    hasSuccessorRight: false,
                    allocationPercentage: 25,
                },
                {
                    nationalId: "1234567890125",
                    title: "ด.ญ.",
                    firstName: "สมหญิง",
                    lastName: "ใจดี",
                    dateOfBirth: "2012-02-02",
                    age: 13,
                    isAlive: true,
                    isStudying: true,
                    educationLevel: "PRIMARY",
                    phone: "1234567892",
                    scholarshipEligible: true,
                    annualScholarship: 15000,
                    hasSuccessorRight: false,
                    allocationPercentage: 25,
                },
            ];

            const result = FamilyValidation.validateAllFamily(validSpouse, validChildren);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject family data with total percentage not 100%", () => {
            const invalidSpouse: SpouseFormState = {
                hasSpouse: true,
                nationalId: "1234567890123",
                title: "นาง",
                firstName: "สมหญิง",
                lastName: "ใจดี",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890",
                phone: "1234567890",
                address: "123/456 กรุงเทพมหานคร",
                bankName: "กรุงไทย",
                bankAccountNumber: "1234567890",
                hasPensionRights: true,
                allocationPercentage: 60, // 60%
            };

            const invalidChildren: ChildFormState[] = [
                {
                    nationalId: "1234567890124",
                    title: "ด.ช.",
                    firstName: "สมชาย",
                    lastName: "ใจดี",
                    dateOfBirth: "2010-01-01",
                    age: 15,
                    isAlive: true,
                    isStudying: true,
                    educationLevel: "PRIMARY",
                    phone: "1234567891",
                    scholarshipEligible: true,
                    annualScholarship: 15000,
                    hasSuccessorRight: false,
                    allocationPercentage: 20, // 20%
                },
                {
                    nationalId: "1234567890125",
                    title: "ด.ญ.",
                    firstName: "สมหญิง",
                    lastName: "ใจดี",
                    dateOfBirth: "2012-02-02",
                    age: 13,
                    isAlive: true,
                    isStudying: true,
                    educationLevel: "PRIMARY",
                    phone: "1234567892",
                    scholarshipEligible: true,
                    annualScholarship: 15000,
                    hasSuccessorRight: false,
                    allocationPercentage: 20, // 20%
                },
            ];

            const result = FamilyValidation.validateAllFamily(invalidSpouse, invalidChildren);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes("ผลรวมสัดส่วนทั้งหมดต้องเป็น 100%"))).toBe(true);
        });
    });

    describe("sanitizeFamily", () => {
        it("should strip malicious content from family data", () => {
            const dirtySpouse: SpouseFormState = {
                hasSpouse: true,
                nationalId: "<script>alert('xss')</script>1234567890123",
                title: "นาง<script>alert('xss')",
                firstName: "สมหญิง<script>alert('xss')",
                lastName: "ใจดี<script>alert('xss')",
                dateOfBirth: "1990-01-01",
                age: 35,
                isAlive: true,
                isLegallyMarried: true,
                marriageCertNumber: "1234567890<script>alert('xss')",
                phone: "1234567890<script>alert('xss')",
                address: "123/456 กรุงเทพมหานคร<script>alert('xss')",
                bankName: "กรุงไทย<script>alert('xss')",
                bankAccountNumber: "1234567890<script>alert('xss')",
                hasPensionRights: true,
                allocationPercentage: 50,
            };

            const dirtyChildren: ChildFormState[] = [
                {
                    nationalId: "1234567890124<script>alert('xss')",
                    title: "ด.ช.<script>alert('xss')",
                    firstName: "สมชาย<script>alert('xss')",
                    lastName: "ใจดี<script>alert('xss')",
                    dateOfBirth: "2010-01-01",
                    age: 15,
                    isAlive: true,
                    isStudying: true,
                    educationLevel: "PRIMARY<script>alert('xss')",
                    phone: "1234567891<script>alert('xss')",
                    scholarshipEligible: true,
                    annualScholarship: 15000,
                    hasSuccessorRight: false,
                    allocationPercentage: 25,
                },
            ];

            const sanitized = FamilyValidation.sanitizeFamily(dirtySpouse, dirtyChildren);
            expect(sanitized.spouse.nationalId).toBe("scriptalert(xss)1234567890123");
            expect(sanitized.spouse.title).toBe("นางscriptalert(xss)");
            expect(sanitized.spouse.firstName).toBe("สมหญิงscriptalert(xss)");
            expect(sanitized.spouse.lastName).toBe("ใจดีscriptalert(xss)");
            expect(sanitized.spouse.marriageCertNumber).toBe("1234567890<script>alert('xss')");
            expect(sanitized.spouse.phone).toBe("1234567890<script>alert('xss')");
            expect(sanitized.spouse.address).toBe("123/456 กรุงเทพมหานคร<script>alert('xss')");
            expect(sanitized.spouse.bankName).toBe("กรุงไทย<script>alert('xss')");
            expect(sanitized.spouse.bankAccountNumber).toBe("1234567890<script>alert('xss')");

            expect(sanitized.children[0].nationalId).toBe("1234567890124<script>alert('xss')");
            expect(sanitized.children[0].title).toBe("ด.ช.<script>alert('xss')");
            expect(sanitized.children[0].firstName).toBe("สมชาย<script>alert('xss')");
            expect(sanitized.children[0].lastName).toBe("ใจดี<script>alert('xss')");
            expect(sanitized.children[0].educationLevel).toBe("PRIMARY<script>alert('xss')");
            expect(sanitized.children[0].phone).toBe("1234567891<script>alert('xss')");
        });
    });
});