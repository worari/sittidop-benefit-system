export interface HeirFormState {
    nationalId: string;
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    relationship: string;
    phone: string;
    address: string;
    isAlive: boolean;
    bankName: string;
    bankAccountNumber: string;
    allocationPercentage: number;
    isDesignatedSuccessor: boolean;
    documentsVerified: boolean;
    // Additional optional fields for blood relatives (siblings, cousins, etc.)
    isBloodRelative?: boolean;
    familyConnection?: string; // e.g., "ELDER_BROTHER", "YOUNGER_SISTER"
}

export class HeirValidation {
    /**
     * Validate heir form data
     */
    static validateHeir(heir: HeirFormState, index: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate required fields
        if (!heir.title || heir.title.trim() === "") {
            errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุคำนำหน้า`);
        }

        if (!heir.firstName || heir.firstName.trim() === "") {
            errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุชื่อ`);
        }

        if (!heir.lastName || heir.lastName.trim() === "") {
            errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุนามสกุล`);
        }

        // Validate national ID (13 digits, supports formatted X-XXXX-XXXXX-XX-X)
        if (heir.nationalId) {
            const cleanId = heir.nationalId.replace(/\D/g, "");
            const nationalIdRegex = /^\d{13}$/;
            if (!nationalIdRegex.test(cleanId)) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: เลขบัตรประชาชน 13 หลักไม่ถูกต้อง`);
            }
        }

        // Validate phone number (Thai format 10 digits)
        if (heir.phone) {
            const cleanPhone = heir.phone.replace(/\D/g, "");
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(cleanPhone)) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)`);
            }
        }

        // Validate bank account number (10-15 digits)
        if (heir.bankAccountNumber) {
            const cleanBank = heir.bankAccountNumber.replace(/\D/g, "");
            const bankAccountRegex = /^\d{10,15}$/;
            if (!bankAccountRegex.test(cleanBank)) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: หมายเลขบัญชีธนาคารต้องเป็นตัวเลข 10-15 หลัก`);
            }
        }

        // Validate age
        if (heir.age !== undefined) {
            if (heir.age < 0 || heir.age > 120) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: อายุไม่ถูกต้อง (0 - 120 ปี)`);
            }
        }

        // Validate date of birth
        if (heir.dateOfBirth) {
            const birthDate = new Date(heir.dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: วันที่ต้องเป็นวันที่ที่ถูกต้อง`);
            } else {
                const today = new Date();
                const ageFromBirth = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    // If birthday hasn't occurred this year yet
                }
                if (ageFromBirth > 120) {
                    errors.push(`ทายาทลำดับที่ ${index + 1}: อายุจากวันเกิดไม่ถูกต้อง (ต้องไม่เกิน 120 ปี)`);
                }
            }
        }

        // Validate relationship
        if (!heir.relationship || heir.relationship.trim() === "") {
            errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุความสัมพันธ์`);
        }

        // Validate blood relative specific fields
        if (heir.isBloodRelative) {
            if (!heir.familyConnection || heir.familyConnection.trim() === "") {
                errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุเครือญาติ (พี่ชาย น้องสาว ลุง น้า อา หลาน)`);
            }
        }

        // Validate allocation percentage
        if (heir.allocationPercentage !== undefined) {
            if (heir.allocationPercentage < 0 || heir.allocationPercentage > 100) {
                errors.push(`ทายาทลำดับที่ ${index + 1}: เปอร์เซ็นต์การจัดสรรต้องอยู่ระหว่าง 0 - 100`);
            }
        }

        // Validate bank name
        if (heir.bankName && heir.bankName.trim() === "") {
            errors.push(`ทายาทลำดับที่ ${index + 1}: ต้องระบุชื่อธนาคาร`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate all heirs in the list
     */
    static validateAllHeirs(heirs: HeirFormState[]): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        let totalPercentage = 0;

        // Validate each heir
        heirs.forEach((heir, index) => {
            const result = this.validateHeir(heir, index);
            errors.push(...result.errors);
            if (heir.allocationPercentage !== undefined) {
                totalPercentage += heir.allocationPercentage;
            }
        });

        // Validate total percentage only when heirs are present
        if (heirs.length > 0 && Math.round(totalPercentage) !== 100) {
            errors.push(`ผลรวมสัดส่วนทั้งหมดต้องเป็น 100% (ปัจจุบัน: ${Number(totalPercentage.toFixed(2))}%)`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Sanitize heir data to prevent injection attacks
     */
    static sanitizeHeir(heir: HeirFormState): HeirFormState {
        return {
            ...heir,
            nationalId: heir.nationalId ? heir.nationalId.replace(/[<>"'&;`$]/g, '') : '',
            title: heir.title ? heir.title.replace(/[<>"'&;`$]/g, '') : '',
            firstName: heir.firstName ? heir.firstName.replace(/[<>"'&;`$]/g, '') : '',
            lastName: heir.lastName ? heir.lastName.replace(/[<>"'&;`$]/g, '') : '',
            relationship: heir.relationship ? heir.relationship.replace(/[<>"'&;`$]/g, '') : '',
            familyConnection: heir.familyConnection ? heir.familyConnection.replace(/[<>"'&;`$]/g, '') : '',
        };
    }
}