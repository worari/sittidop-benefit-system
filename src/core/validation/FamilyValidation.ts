export interface ChildFormState {
    nationalId: string;
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    isAlive: boolean;
    isStudying: boolean;
    educationLevel: string;
    phone: string;
    scholarshipEligible: boolean;
    annualScholarship: number;
    hasSuccessorRight: boolean;
    allocationPercentage: number;
}

export interface SpouseFormState {
    hasSpouse: boolean;
    nationalId: string;
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    isAlive: boolean;
    isLegallyMarried: boolean;
    marriageCertNumber: string;
    phone: string;
    address: string;
    bankName: string;
    bankAccountNumber: string;
    hasPensionRights: boolean;
    allocationPercentage: number;
}

export class FamilyValidation {
    /**
     * Validate spouse form data
     */
    static validateSpouse(spouse: SpouseFormState, index: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate required fields
        if (!spouse.title || spouse.title.trim() === "") {
            errors.push(`คู่สมรสลำดับที่ ${index + 1}: ต้องระบุคำนำหน้า`);
        }

        if (!spouse.firstName || spouse.firstName.trim() === "") {
            errors.push(`คู่สมรสลำดับที่ ${index + 1}: ต้องระบุชื่อ`);
        }

        if (!spouse.lastName || spouse.lastName.trim() === "") {
            errors.push(`คู่สมรสลำดับที่ ${index + 1}: ต้องระบุนามสกุล`);
        }

        // Validate national ID (13 digits)
        if (spouse.nationalId) {
            const nationalIdRegex = /^\d{13}$/;
            if (!nationalIdRegex.test(spouse.nationalId)) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: เลขบัตรประชาชน 13 หลักไม่ถูกต้อง`);
            }
        }

        // Validate phone number (Thai format)
        if (spouse.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(spouse.phone)) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)`);
            }
        }

        // Validate bank account number (10-13 digits)
        if (spouse.bankAccountNumber) {
            const bankAccountRegex = /^\d{10,13}$/;
            if (!bankAccountRegex.test(spouse.bankAccountNumber)) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: หมายเลขบัญชีธนาคารต้องเป็นตัวเลข 10-13 หลัก`);
            }
        }

        // Validate age
        if (spouse.age !== undefined) {
            if (spouse.age < 0 || spouse.age > 120) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: อายุไม่ถูกต้อง (0 - 120 ปี)`);
            }
        }

        // Validate date of birth
        if (spouse.dateOfBirth) {
            const birthDate = new Date(spouse.dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: วันที่ต้องเป็นวันที่ที่ถูกต้อง`);
            }
        }

        // Validate marriage certificate number
        if (spouse.marriageCertNumber && spouse.marriageCertNumber.trim() === "") {
            errors.push(`คู่สมรสลำดับที่ ${index + 1}: ต้องระบุเลขที่หนังสือสำคัญการสมรส`);
        }

        // Validate allocation percentage
        if (spouse.allocationPercentage !== undefined) {
            if (spouse.allocationPercentage < 0 || spouse.allocationPercentage > 100) {
                errors.push(`คู่สมรสลำดับที่ ${index + 1}: เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100`);
            }
        }

        // Validate bank name
        if (spouse.bankName && spouse.bankName.trim() === "") {
            errors.push(`คู่สมรสลำดับที่ ${index + 1}: ต้องระบุชื่อธนาคาร`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate child form data
     */
    static validateChild(child: ChildFormState, index: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate required fields
        if (!child.title || child.title.trim() === "") {
            errors.push(`บุตรลำดับที่ ${index + 1}: ต้องระบุคำนำหน้า`);
        }

        if (!child.firstName || child.firstName.trim() === "") {
            errors.push(`บุตรลำดับที่ ${index + 1}: ต้องระบุชื่อ`);
        }

        if (!child.lastName || child.lastName.trim() === "") {
            errors.push(`บุตรลำดับที่ ${index + 1}: ต้องระบุนามสกุล`);
        }

        // Validate national ID (13 digits)
        if (child.nationalId) {
            const nationalIdRegex = /^\d{13}$/;
            if (!nationalIdRegex.test(child.nationalId)) {
                errors.push(`บุตรลำดับที่ ${index + 1}: เลขบัตรประชาชน 13 หลักไม่ถูกต้อง`);
            }
        }

        // Validate phone number (Thai format)
        if (child.phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(child.phone)) {
                errors.push(`บุตรลำดับที่ ${index + 1}: หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)`);
            }
        }

        // Validate age
        if (child.age !== undefined) {
            if (child.age < 0 || child.age > 25) {
                errors.push(`บุตรลำดับที่ ${index + 1}: อายุไม่ถูกต้อง (0 - 25 ปี)`);
            }
        }

        // Validate date of birth
        if (child.dateOfBirth) {
            const birthDate = new Date(child.dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                errors.push(`บุตรลำดับที่ ${index + 1}: วันที่ต้องเป็นวันที่ที่ถูกต้อง`);
            }
        }

        // Validate education level
        if (!child.educationLevel || child.educationLevel.trim() === "") {
            errors.push(`บุตรลำดับที่ ${index + 1}: ต้องระบุระดับการศึกษา`);
        }

        // Validate annual scholarship
        if (child.annualScholarship !== undefined) {
            if (child.annualScholarship < 0) {
                errors.push(`บุตรลำดับที่ ${index + 1}: ยอดเงินทุนการศึกษาไม่ถูกต้อง`);
            }
        }

        // Validate allocation percentage
        if (child.allocationPercentage !== undefined) {
            if (child.allocationPercentage < 0 || child.allocationPercentage > 100) {
                errors.push(`บุตรลำดับที่ ${index + 1}: เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate all family data (spouse and children)
     */
    static validateAllFamily(
        spouse: SpouseFormState,
        children: ChildFormState[]
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let totalPercentage = 0;

        // Validate spouse
        if (spouse.hasSpouse) {
            const spouseResult = this.validateSpouse(spouse, 0);
            errors.push(...spouseResult.errors);
            if (spouse.allocationPercentage !== undefined) {
                totalPercentage += spouse.allocationPercentage;
            }
        }

        // Validate children
        children.forEach((child, index) => {
            const childResult = this.validateChild(child, index);
            errors.push(...childResult.errors);
            if (child.allocationPercentage !== undefined) {
                totalPercentage += child.allocationPercentage;
            }
        });

        // Validate total percentage
        if (totalPercentage !== 100) {
            errors.push(`ผลรวมสัดส่วนทั้งหมดต้องเป็น 100% (ปัจจุบัน: ${totalPercentage}%)`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Sanitize family data to prevent injection attacks
     */
    static sanitizeFamily(
        spouse: SpouseFormState,
        children: ChildFormState[]
    ): { spouse: SpouseFormState; children: ChildFormState[] } {
        const sanitizedSpouse: SpouseFormState = {
            ...spouse,
            nationalId: spouse.nationalId ? spouse.nationalId.replace(/[<>"'&;`$]/g, '') : '',
            title: spouse.title ? spouse.title.replace(/[<>"'&;`$]/g, '') : '',
            firstName: spouse.firstName ? spouse.firstName.replace(/[<>"'&;`$]/g, '') : '',
            lastName: spouse.lastName ? spouse.lastName.replace(/[<>"'&;`$]/g, '') : '',
            phone: spouse.phone ? spouse.phone.replace(/[<>"'&;`$]/g, '') : '',
            address: spouse.address ? spouse.address.replace(/[<>"'&;`$]/g, '') : '',
            bankName: spouse.bankName ? spouse.bankName.replace(/[<>"'&;`$]/g, '') : '',
            bankAccountNumber: spouse.bankAccountNumber ? spouse.bankAccountNumber.replace(/[<>"'&;`$]/g, '') : '',
            marriageCertNumber: spouse.marriageCertNumber ? spouse.marriageCertNumber.replace(/[<>"'&;`$]/g, '') : '',
        };

        const sanitizedChildren: ChildFormState[] = children.map((child) => ({
            ...child,
            nationalId: child.nationalId ? child.nationalId.replace(/[<>"'&;`$]/g, '') : '',
            title: child.title ? child.title.replace(/[<>"'&;`$]/g, '') : '',
            firstName: child.firstName ? child.firstName.replace(/[<>"'&;`$]/g, '') : '',
            lastName: child.lastName ? child.lastName.replace(/[<>"'&;`$]/g, '') : '',
            phone: child.phone ? child.phone.replace(/[<>"'&;`$]/g, '') : '',
            educationLevel: child.educationLevel ? child.educationLevel.replace(/[<>"'&;`$]/g, '') : '',
        }));

        return {
            spouse: sanitizedSpouse,
            children: sanitizedChildren,
        };
    }
}