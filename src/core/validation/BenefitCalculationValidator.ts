import { EstimateInput } from "../domain/value-objects/types";
import { MilitaryPersonnelInput } from "../domain/value-objects/military-types";

export class BenefitCalculationValidator {
    /**
     * Validate civilian benefit calculation input
     */
    static validateCivilianInput(input: EstimateInput): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate age
        if (!input.age || input.age < 0 || input.age > 120) {
            errors.push("อายุต้องอยู่ระหว่าง 0-120 ปี");
        }

        // Validate monthly income
        if (input.monthlyIncome !== undefined && input.monthlyIncome < 0) {
            errors.push("รายได้ต้องไม่ติดลบ");
        }

        // Validate living condition
        if (input.livingCondition && !["ALONE", "FAMILY", "BEDRIDDEN", "NURSING_HOME"].includes(input.livingCondition)) {
            errors.push("สภาพการอยู่อาศัยไม่ถูกต้อง");
        }

        // Validate hardship factors
        if (input.hardshipFactors) {
            const { noCaregiver, inadequateHousing, chronicIllness, unemployed, debtBurden } = input.hardshipFactors;
            if (typeof noCaregiver !== 'boolean') errors.push("ข้อมูลผู้ดูแลต้องเป็นจริง/เท็จ");
            if (typeof inadequateHousing !== 'boolean') errors.push("ข้อมูลที่อยู่อาศัยไม่ปลอดภัยต้องเป็นจริง/เท็จ");
            if (typeof chronicIllness !== 'boolean') errors.push("ข้อมูลผู้ป่วยโรคเรื้อรังต้องเป็นจริง/เท็จ");
            if (typeof unemployed !== 'boolean') errors.push("ข้อมูลผู้ว่างงานต้องเป็นจริง/เท็จ");
            if (typeof debtBurden !== 'boolean') errors.push("ข้อมูลภาระหนี้ต้องเป็นจริง/เท็จ");
        }

        // Validate province
        if (input.province && typeof input.province !== 'string') {
            errors.push("จังหวัดต้องเป็นข้อความ");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate military personnel input
     */
    static validateMilitaryInput(input: MilitaryPersonnelInput): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields
        if (!input.militaryId) errors.push("ต้องระบุ ID ทหาร");
        if (!input.citizenId) errors.push("ต้องระบุเลขประจำตัวประชาชน");
        if (!input.rank) errors.push("ต้องระบุยศ/ตำแหน่ง");
        if (!input.rankAbbr) errors.push("ต้องระบุย่อยศ");
        if (!input.firstName) errors.push("ต้องระบุชื่อ");
        if (!input.lastName) errors.push("ต้องระบุนามสกุล");
        if (!input.militaryBranch) errors.push("ต้องแจ้งสังกัดหน่วยงาน");
        if (!input.lossType) errors.push("ต้องแจ้งประเภทความสูญเสีย");
        if (!input.missionType) errors.push("ต้องแจ้งประเภทภารกิจ");

        // Validate numeric fields
        if (input.salary !== undefined && input.salary < 0) errors.push("เงินเดือนต้องไม่ติดลบ");
        if (input.salaryStep !== undefined && input.salaryStep < 0) errors.push("ชั้นเงินเดือนต้องไม่ติดลบ");
        if (input.promotionSteps !== undefined && input.promotionSteps < 0) errors.push("จำนวนขั้นบำเหน็จต้องไม่ติดลบ");

        // Validate service years
        if (input.serviceYearsNormal !== undefined && input.serviceYearsNormal < 0) errors.push("ปีการรับราชการปกติต้องไม่ติดลบ");
        if (input.totalServiceYears !== undefined && input.totalServiceYears < 0) errors.push("ปีการรับราชการรวมต้องไม่ติดลบ");

        // Validate dates
        if (input.appointmentDate && isNaN(Date.parse(input.appointmentDate))) errors.push("วันบรรจุต้องเป็นวันที่ที่ถูกต้อง");
        if (input.incidentDate && isNaN(Date.parse(input.incidentDate))) errors.push("วันเกิดเหตุต้องเป็นวันที่ที่ถูกต้อง");
        if (input.multiplierDate && isNaN(Date.parse(input.multiplierDate))) errors.push("วันทวีคูณต้องเป็นวันที่ที่ถูกต้อง");

        // Validate hospital dates
        if (input.hospitalAdmissionDate && isNaN(Date.parse(input.hospitalAdmissionDate))) errors.push("วันรับการรักษาต้องเป็นวันที่ที่ถูกต้อง");
        if (input.hospitalDischargeDate && isNaN(Date.parse(input.hospitalDischargeDate))) errors.push("วันที่ออกจากโรงพยาบาลต้องเป็นวันที่ที่ถูกต้อง");

        // Validate spouse
        if (input.spouse) {
            if (typeof input.spouse.isLegallyMarried !== 'boolean') errors.push("ข้อมูลคู่สมรสต้องเป็นจริง/เท็จ");
        }

        // Validate children
        if (input.children && Array.isArray(input.children)) {
            input.children.forEach((child, index) => {
                if (!child.fullName) errors.push(`บุตรคนที่ ${index + 1} ต้องระบุชื่อ`);
                if (child.age !== undefined && (child.age < 0 || child.age > 25)) errors.push(`บุตรคนที่ ${index + 1} อายุไม่ถูกต้อง(0 - 25 ปี)`);
                if (typeof child.isStudying !== 'boolean') errors.push(`บุตรคนที่ ${index + 1} ข้อมูลการศึกษาต้องเป็นจริง/เท็จ`);
                if (child.allocationPercentage !== undefined && (child.allocationPercentage < 0 || child.allocationPercentage > 100)) errors.push(`บุตรคนที่ ${index + 1} เปอร์เซ็นต์การจัดสรรไม่ถูกต้อง(0 - 100)`);
            });
        }

        // Validate heirs
        if (input.heirs && Array.isArray(input.heirs)) {
            input.heirs.forEach((heir, index) => {
                if (!heir.fullName) errors.push(`ทายาทคนที่ ${index + 1} ต้องระบุชื่อ`);
                if (!heir.relationship) errors.push(`ทายาทคนที่ ${index + 1} ต้องระบุความสัมพันธ์`);
                if (heir.allocationPercentage !== undefined && (heir.allocationPercentage < 0 || heir.allocationPercentage > 100)) errors.push(`ทายาทคนที่ ${index + 1} เปอร์เซ็นต์การจัดสรรไม่ถูกต้อง (0-100)`);
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate combined input for comprehensive calculation
     */
    static validateComprehensiveInput(
        civilianInput: EstimateInput,
        militaryInput?: MilitaryPersonnelInput
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate civilian input
        const civilianValidation = this.validateCivilianInput(civilianInput);
        errors.push(...civilianValidation.errors.map(err => `ข้อมูลทั่วไป: ${err}`));

        // Validate military input if provided
        if (militaryInput) {
            const militaryValidation = this.validateMilitaryInput(militaryInput);
            errors.push(...militaryValidation.errors.map(err => `ข้อมูลทหาร: ${err}`));
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Sanitize input data to prevent injection attacks
     */
    static sanitizeInput(input: any): any {
        if (typeof input === 'string') {
            // Remove potentially dangerous characters
            return input.replace(/[<>"'&;`$]/g, '');
        }

        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }

        if (input && typeof input === 'object') {
            const sanitized: any = {};
            for (const key in input) {
                if (input.hasOwnProperty(key)) {
                    sanitized[key] = this.sanitizeInput(input[key]);
                }
            }
            return sanitized;
        }

        return input;
    }

    /**
     * Validate calculation results for consistency
     */
    static validateCalculationResults(results: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required fields
        if (!results.eligibleProgramsCount && results.eligibleProgramsCount !== 0) {
            errors.push("ต้องแจ้งจำนวนโปรแกรมที่เข้าเกณฑ์");
        }

        if (results.totalMonthlyEstimate === undefined) {
            errors.push("ต้องแจ้งยอดรวมรายเดือน");
        } else if (results.totalMonthlyEstimate < 0) {
            errors.push("ยอดรวมรายเดือนต้องไม่ติดลบ");
        }

        if (results.totalAnnualEstimate === undefined) {
            errors.push("ต้องแจ้งยอดรวมต่อปี");
        } else if (results.totalAnnualEstimate < 0) {
            errors.push("ยอดรวมต่อปีต้องไม่ติดลบ");
        }

        if (results.totalOneTimeEstimate === undefined) {
            errors.push("ต้องแจ้งยอดรวมเงินก้อน");
        } else if (results.totalOneTimeEstimate < 0) {
            errors.push("ยอดรวมเงินก้อนต้องไม่ติดลบ");
        }

        // Validate vulnerability score
        if (results.vulnerabilityScore === undefined) {
            errors.push("ต้องแจ้งคะแนนความเปราะบาง");
        } else if (results.vulnerabilityScore < 0 || results.vulnerabilityScore > 100) {
            errors.push("คะแนนความเปราะบางต้องอยู่ระหว่าง 0-100");
        }

        // Validate eligible programs
        if (!Array.isArray(results.eligiblePrograms)) {
            errors.push("รายการโปรแกรมที่เข้าเกณฑ์ต้องเป็นอาร์เรย์");
        } else {
            results.eligiblePrograms.forEach((program: any, index: number) => {
                if (!program.programId) errors.push(`โปรแกรมที่เข้าเกณฑ์คนที่ ${index + 1} ต้องแจ้ง ID`);
                if (!program.programName) errors.push(`โปรแกรมที่เข้าเกณฑ์คนที่ ${index + 1} ต้องแจ้งชื่อ`);
                if (program.estimatedAmount === undefined) errors.push(`โปรแกรมที่เข้าเกณฑ์คนที่ ${index + 1} ต้องแจ้งจำนวนเงิน`);
                else if (program.estimatedAmount < 0) errors.push(`โปรแกรมที่เข้าเกณฑ์คนที่ ${index + 1} จำนวนเงินต้องไม่ติดลบ`);
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
