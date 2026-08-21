import * as XLSX from "xlsx";
import { BenefitCategoryCode, MilitaryPersonnelInput } from "@/core/domain/value-objects/military-types";
import { BenefitRuleDefinition } from "@/core/domain/entities/BenefitRule";
import { militaryStore } from "@/infrastructure/database/repositories/MilitaryStoreManager";
import { militaryRuleRepository } from "@/infrastructure/database/repositories/PrismaMilitaryRuleRepository";

export interface ImportErrorItem {
  sheet: "Personnel" | "Family" | "Benefits" | "General";
  rowNumber: number;
  column: string;
  invalidValue: string | number | null | undefined;
  severity: "ERROR" | "WARNING";
  message: string;
  suggestedFix: string;
}

export interface ImportValidationResult {
  fileName: string;
  isValid: boolean;
  sheetsFound: string[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  warningsCount: number;
  errors: ImportErrorItem[];
  parsedData: {
    personnel: any[];
    family: any[];
    benefits: any[];
  };
}

export class ExcelImportService {
  /**
   * Thai National Citizen ID 13-digit Checksum Validator
   */
  public static validateCitizenId(id: string): boolean {
    if (!id || typeof id !== "string") return false;
    const cleanId = id.replace(/[^0-9]/g, "");
    if (cleanId.length !== 13) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleanId.charAt(12), 10);
  }

  /**
   * Parses and validates Excel workbook from Buffer
   */
  public static parseAndValidate(buffer: Buffer, fileName: string): ImportValidationResult {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetsFound = workbook.SheetNames;
    const errors: ImportErrorItem[] = [];

    const parsedPersonnel: any[] = [];
    const parsedFamily: any[] = [];
    const parsedBenefits: any[] = [];

    let totalRows = 0;
    let validRowsCount = 0;
    let invalidRowsCount = 0;

    // Set of military IDs parsed in this batch or already existing in store
    const knownMilitaryIds = new Set<string>(
      militaryStore.getAllPersonnel().map((p) => p.militaryId.toUpperCase())
    );

    // ========================================================================
    // 1. Process "Personnel" Sheet
    // ========================================================================
    const personnelSheetName = sheetsFound.find(
      (s) => s.toLowerCase() === "personnel" || s.includes("กำลังพล")
    );

    if (personnelSheetName) {
      const sheet = workbook.Sheets[personnelSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      rows.forEach((row, idx) => {
        const rowNum = idx + 2; // 1-indexed header + 1
        totalRows++;
        let rowHasError = false;

        const militaryId = String(row["militaryId"] || row["เลขประจำตัวทหาร"] || "").trim();
        const citizenId = String(row["citizenId"] || row["เลขบัตรประชาชน"] || "").trim();
        const rankAbbr = String(row["rankAbbr"] || row["ยศ"] || "").trim();
        const firstName = String(row["firstName"] || row["ชื่อ"] || "").trim();
        const lastName = String(row["lastName"] || row["นามสกุล"] || "").trim();
        const normalUnit = String(row["normalUnit"] || row["สังกัดปกติ"] || "").trim();
        const fieldUnit = String(row["fieldUnit"] || row["สังกัดสนาม"] || "").trim();
        const salary = Number(row["salary"] || row["เงินเดือน"] || 0);
        const serviceYearsNormal = Number(row["serviceYearsNormal"] || row["อายุราชการปกติ"] || 0);
        const serviceYearsMultiplier = Number(row["serviceYearsMultiplier"] || row["เวลาราชการทวีคูณ"] || 0);
        const lossType = String(row["lossType"] || row["ประเภทความสูญเสีย"] || "KIA_COMBAT_DEATH").trim();
        const promotionSteps = Number(row["promotionSteps"] || row["ชั้นยศปูนบำเหน็จ"] || 7);

        // Required Validations
        if (!militaryId) {
          errors.push({
            sheet: "Personnel",
            rowNumber: rowNum,
            column: "militaryId",
            invalidValue: militaryId,
            severity: "ERROR",
            message: "ต้องระบุเลขประจำตัวทหาร (Military ID is required)",
            suggestedFix: "กรอกเลขประจำตัวทหาร เช่น MIL-49021884",
          });
          rowHasError = true;
        }

        if (!firstName || !lastName) {
          errors.push({
            sheet: "Personnel",
            rowNumber: rowNum,
            column: "firstName / lastName",
            invalidValue: `${firstName} ${lastName}`,
            severity: "ERROR",
            message: "ต้องระบุชื่อและนามสกุลกำลังพล",
            suggestedFix: "กรอกชื่อและนามสกุลให้ครบถ้วน",
          });
          rowHasError = true;
        }

        if (citizenId && !this.validateCitizenId(citizenId)) {
          errors.push({
            sheet: "Personnel",
            rowNumber: rowNum,
            column: "citizenId",
            invalidValue: citizenId,
            severity: "WARNING",
            message: "เลขบัตรประชาชน 13 หลักไม่ถูกต้องตามสูตรคำนวณ Checksum",
            suggestedFix: "ตรวจสอบความถูกต้องของเลขประจำตัวประชาชน 13 หลัก",
          });
        }

        if (isNaN(salary) || salary <= 0) {
          errors.push({
            sheet: "Personnel",
            rowNumber: rowNum,
            column: "salary",
            invalidValue: salary,
            severity: "ERROR",
            message: "ฐานเงินเดือนต้องเป็นตัวเลขจำนวนเต็มบวกมากกว่า 0",
            suggestedFix: "ระบุจำนวนเงินเดือน เช่น 35000",
          });
          rowHasError = true;
        }

        if (serviceYearsNormal < 0 || serviceYearsMultiplier < 0) {
          errors.push({
            sheet: "Personnel",
            rowNumber: rowNum,
            column: "serviceYears",
            invalidValue: `${serviceYearsNormal} / ${serviceYearsMultiplier}`,
            severity: "ERROR",
            message: "อายุราชการต้องไม่ติดลบ",
            suggestedFix: "ระบุจำนวนปี เช่น 15 และทวีคูณ 5",
          });
          rowHasError = true;
        }

        if (militaryId) {
          knownMilitaryIds.add(militaryId.toUpperCase());
        }

        if (!rowHasError) {
          validRowsCount++;
          parsedPersonnel.push({
            militaryId,
            citizenId: citizenId || `3100${Date.now().toString().slice(-9)}`,
            rank: "LIEUTENANT_COLONEL",
            rankAbbr: rankAbbr || "พ.ท.",
            firstName,
            lastName,
            militaryBranch: "ROYAL_THAI_ARMY",
            abbreviatedPosition: "ผบ.พัน.สน.",
            normalUnit: normalUnit || "พล.ร.9",
            fieldPosition: "ผบ.ฉก.",
            fieldUnit: fieldUnit || "ฉก.นราธิวาส",
            salary,
            salaryLevel: "น.3",
            salaryStep: 20.0,
            compensationAmount: 3000,
            additionalPay: 2500,
            appointmentDate: "2015-05-01",
            serviceYearsNormal,
            serviceYearsMultiplier,
            totalServiceYears: serviceYearsNormal + serviceYearsMultiplier,
            missionType: "COUNTER_INSURGENCY",
            actionType: "DIRECT_COMBAT",
            incidentType: "COMBAT_ENGAGEMENT",
            lossType,
            promotionSteps,
            promotedRankAbbr: "พล.อ.",
            promotedSalary: Math.round(salary * 1.55),
            spouse: null,
            children: [],
            heirs: [],
          });
        } else {
          invalidRowsCount++;
        }
      });
    }

    // ========================================================================
    // 2. Process "Family" Sheet
    // ========================================================================
    const familySheetName = sheetsFound.find(
      (s) => s.toLowerCase() === "family" || s.includes("ครอบครัว") || s.includes("ทายาท")
    );

    if (familySheetName) {
      const sheet = workbook.Sheets[familySheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        totalRows++;
        let rowHasError = false;

        const personnelMilitaryId = String(row["personnelMilitaryId"] || row["เลขประจำตัวทหาร"] || "").trim();
        const relationship = String(row["relationship"] || row["ความสัมพันธ์"] || "").trim();
        const fullName = String(row["fullName"] || row["ชื่อ-สกุล"] || "").trim();
        const nationalId = String(row["nationalId"] || row["เลขบัตรประชาชน"] || "").trim();
        const age = Number(row["age"] || row["อายุ"] || 0);
        const isStudying = String(row["isStudying"] || row["กำลังศึกษา"] || "").toLowerCase() === "true" || String(row["isStudying"] || row["กำลังศึกษา"] || "") === "ใช่";
        const educationLevel = String(row["educationLevel"] || row["ระดับการศึกษา"] || "PRIMARY").trim().toUpperCase();
        const allocationPercentage = Number(row["allocationPercentage"] || row["สัดส่วนเปอร์เซ็นต์"] || 0);

        if (!personnelMilitaryId) {
          errors.push({
            sheet: "Family",
            rowNumber: rowNum,
            column: "personnelMilitaryId",
            invalidValue: personnelMilitaryId,
            severity: "ERROR",
            message: "ต้องระบุเลขประจำตัวทหารของกำลังพลผู้รับสิทธิ",
            suggestedFix: "กรอกเลขประจำตัวทหาร เช่น MIL-49021884",
          });
          rowHasError = true;
        } else if (!knownMilitaryIds.has(personnelMilitaryId.toUpperCase())) {
          errors.push({
            sheet: "Family",
            rowNumber: rowNum,
            column: "personnelMilitaryId",
            invalidValue: personnelMilitaryId,
            severity: "ERROR",
            message: `ไม่พบเลขประจำตัวทหาร ${personnelMilitaryId} ในระบบหรือในไฟล์นำเข้านี้`,
            suggestedFix: "ตรวจสอบให้แน่ใจว่าได้ระบุข้อมูลกำลังพลใน Sheet Personnel แล้ว",
          });
          rowHasError = true;
        }

        if (!fullName) {
          errors.push({
            sheet: "Family",
            rowNumber: rowNum,
            column: "fullName",
            invalidValue: fullName,
            severity: "ERROR",
            message: "ต้องระบุชื่อ-สกุลของคู่สมรส/บุตร/ทายาท",
            suggestedFix: "กรอกชื่อ-นามสกุล เช่น นางพิมพา ภักดีสยาม",
          });
          rowHasError = true;
        }

        if (!relationship) {
          errors.push({
            sheet: "Family",
            rowNumber: rowNum,
            column: "relationship",
            invalidValue: relationship,
            severity: "ERROR",
            message: "ต้องระบุความสัมพันธ์ (SPOUSE, CHILD, FATHER, MOTHER)",
            suggestedFix: "ระบุความสัมพันธ์ เช่น SPOUSE, CHILD, FATHER, MOTHER",
          });
          rowHasError = true;
        }

        if (!rowHasError) {
          validRowsCount++;
          parsedFamily.push({
            personnelMilitaryId,
            relationship,
            fullName,
            nationalId,
            age,
            isStudying,
            educationLevel,
            allocationPercentage,
          });
        } else {
          invalidRowsCount++;
        }
      });
    }

    // ========================================================================
    // 3. Process "Benefits" Sheet (Rules)
    // ========================================================================
    const benefitsSheetName = sheetsFound.find(
      (s) => s.toLowerCase() === "benefits" || s.includes("สิทธิประโยชน์") || s.includes("กฎเกณฑ์")
    );

    if (benefitsSheetName) {
      const sheet = workbook.Sheets[benefitsSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        totalRows++;
        let rowHasError = false;

        const ruleCode = String(row["ruleCode"] || row["รหัสกฎเกณฑ์"] || "").trim();
        const ruleName = String(row["ruleName"] || row["ชื่อสิทธิประโยชน์"] || "").trim();
        const category = String(row["category"] || row["หมวดหมู่"] || "LUMP_SUM_PAYMENT").trim();
        const formulaExpression = String(row["formulaExpression"] || row["สูตรคำนวณ"] || "").trim();
        const multiplierFactor = Number(row["multiplierFactor"] || row["ตัวคูณ"] || 1);
        const baseAmount = Number(row["baseAmount"] || row["ฐานเงิน"] || 0);
        const legalBasis = String(row["legalBasis"] || row["กฎหมายอ้างอิง"] || "").trim();

        if (!ruleCode) {
          errors.push({
            sheet: "Benefits",
            rowNumber: rowNum,
            column: "ruleCode",
            invalidValue: ruleCode,
            severity: "ERROR",
            message: "ต้องระบุรหัสกฎเกณฑ์ (Rule Code)",
            suggestedFix: "กรอกรหัสกฎเกณฑ์ เช่น RULE-LUMP-INSURANCE",
          });
          rowHasError = true;
        }

        if (!ruleName) {
          errors.push({
            sheet: "Benefits",
            rowNumber: rowNum,
            column: "ruleName",
            invalidValue: ruleName,
            severity: "ERROR",
            message: "ต้องระบุชื่อสิทธิประโยชน์",
            suggestedFix: "กรอกชื่อสิทธิประโยชน์ให้ชัดเจน",
          });
          rowHasError = true;
        }

        if (!formulaExpression && baseAmount <= 0 && !category.includes("NON_MONETARY")) {
          errors.push({
            sheet: "Benefits",
            rowNumber: rowNum,
            column: "formulaExpression / baseAmount",
            invalidValue: formulaExpression,
            severity: "ERROR",
            message: "ต้องระบุสูตรคำนวณ หรือระบุฐานเงินคงที่มากกว่า 0",
            suggestedFix: "เช่น {salary} * 30 หรือระบุฐานเงิน 2000000",
          });
          rowHasError = true;
        }

        if (!rowHasError) {
          validRowsCount++;
          parsedBenefits.push({
            ruleCode,
            ruleName,
            category: (category as BenefitCategoryCode) || BenefitCategoryCode.LUMP_SUM_PAYMENT,
            categoryName: "Benefit Category",
            categoryThaiName: "หมวดสิทธิประโยชน์",
            description: ruleName,
            legalBasis: legalBasis || "ระเบียบกระทรวงกลาโหม",
            paymentType: "ONE_TIME_LUMP_SUM",
            formulaType: formulaExpression ? "EXPRESSION" : "FIXED_AMOUNT",
            formulaExpression: formulaExpression || "{baseAmount}",
            multiplierFactor,
            baseAmount,
            conditions: { allowedLossTypes: ["KIA_COMBAT_DEATH", "TOTAL_PERMANENT_DISABILITY"] },
            isActive: true,
            priorityOrder: 10,
          });
        } else {
          invalidRowsCount++;
        }
      });
    }

    if (!personnelSheetName && !familySheetName && !benefitsSheetName) {
      errors.push({
        sheet: "General",
        rowNumber: 1,
        column: "SheetNames",
        invalidValue: sheetsFound.join(", "),
        severity: "ERROR",
        message: "ไม่พบ Sheet ที่รองรับ (ต้องมี Sheet ชื่อ: Personnel, Family หรือ Benefits)",
        suggestedFix: "ใช้ไฟล์ Excel แม่แบบที่ระบบจัดเตรียมไว้",
      });
    }

    const warningsCount = errors.filter((e) => e.severity === "WARNING").length;

    return {
      fileName,
      isValid: errors.filter((e) => e.severity === "ERROR").length === 0,
      sheetsFound,
      totalRows,
      validRowsCount,
      invalidRowsCount,
      warningsCount,
      errors,
      parsedData: {
        personnel: parsedPersonnel,
        family: parsedFamily,
        benefits: parsedBenefits,
      },
    };
  }

  /**
   * Commits and saves validated data into repository
   */
  public static commitData(data: { personnel: any[]; family: any[]; benefits: any[] }): {
    personnelSaved: number;
    familyLinked: number;
    benefitsSaved: number;
  } {
    let personnelSaved = 0;
    let familyLinked = 0;
    let benefitsSaved = 0;

    // 1. Save Personnel
    for (const p of data.personnel) {
      // Find matching family items
      const spouseItem = data.family.find(
        (f) => f.personnelMilitaryId === p.militaryId && (f.relationship === "SPOUSE" || f.relationship === "SPOUSE_LEGAL")
      );
      const childrenItems = data.family.filter(
        (f) => f.personnelMilitaryId === p.militaryId && (f.relationship === "CHILD" || f.relationship === "CHILD_LEGITIMATE")
      );
      const heirItems = data.family.filter((f) => f.personnelMilitaryId === p.militaryId);

      const completePersonnel = {
        ...p,
        spouse: spouseItem
          ? {
              nationalId: spouseItem.nationalId || "1100400289112",
              fullName: spouseItem.fullName,
              isLegallyMarried: true,
              hasPensionRights: true,
              allocationPercentage: spouseItem.allocationPercentage || 50,
            }
          : null,
        children: childrenItems.map((c) => ({
          nationalId: c.nationalId || "1100400289113",
          fullName: c.fullName,
          age: c.age || 10,
          isStudying: c.isStudying !== undefined ? c.isStudying : true,
          educationLevel: c.educationLevel || "PRIMARY",
          allocationPercentage: c.allocationPercentage || 25,
        })),
        heirs: heirItems.map((h) => ({
          nationalId: h.nationalId || "1100400289112",
          fullName: h.fullName,
          relationship: h.relationship,
          allocationPercentage: h.allocationPercentage || 25,
        })),
      };

      militaryStore.createPersonnel(completePersonnel);
      personnelSaved++;
      familyLinked += heirItems.length;
    }

    // 2. Save Benefits
    for (const b of data.benefits) {
      militaryRuleRepository.createRule(b);
      benefitsSaved++;
    }

    return {
      personnelSaved,
      familyLinked,
      benefitsSaved,
    };
  }

  /**
   * Generates a sample Excel template with 3 pre-formatted sheets
   */
  public static generateTemplateBuffer(): Buffer {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Personnel
    const personnelData = [
      {
        militaryId: "MIL-58091124",
        citizenId: "3100600492811",
        rankAbbr: "พ.ท.",
        firstName: "สมคิด",
        lastName: "มหาราช",
        normalUnit: "ร.19 พัน.1 (พล.ร.9)",
        fieldUnit: "ฉก.นราธิวาส 30",
        salary: 42000,
        serviceYearsNormal: 15,
        serviceYearsMultiplier: 7,
        lossType: "KIA_COMBAT_DEATH",
        promotionSteps: 7,
      },
      {
        militaryId: "MIL-61028441",
        citizenId: "3940100284712",
        rankAbbr: "ร.อ.",
        firstName: "เกรียงไกร",
        lastName: "พิทักษ์ไท",
        normalUnit: "ร.11 พัน.2 รอ.",
        fieldUnit: "ฉก.ปัตตานี 25",
        salary: 31500,
        serviceYearsNormal: 10,
        serviceYearsMultiplier: 5,
        lossType: "TOTAL_PERMANENT_DISABILITY",
        promotionSteps: 5,
      },
    ];
    const wsPersonnel = XLSX.utils.json_to_sheet(personnelData);
    XLSX.utils.book_append_sheet(wb, wsPersonnel, "Personnel");

    // Sheet 2: Family
    const familyData = [
      {
        personnelMilitaryId: "MIL-58091124",
        relationship: "SPOUSE",
        fullName: "นางนฤมล มหาราช",
        nationalId: "1100400289112",
        age: 38,
        isStudying: false,
        educationLevel: "OTHER",
        allocationPercentage: 50,
      },
      {
        personnelMilitaryId: "MIL-58091124",
        relationship: "CHILD",
        fullName: "ด.ช.กรวิชญ์ มหาราช",
        nationalId: "1100400289113",
        age: 12,
        isStudying: true,
        educationLevel: "PRIMARY",
        allocationPercentage: 25,
      },
      {
        personnelMilitaryId: "MIL-58091124",
        relationship: "FATHER",
        fullName: "นายสมพร มหาราช",
        nationalId: "3100600492800",
        age: 68,
        isStudying: false,
        educationLevel: "OTHER",
        allocationPercentage: 25,
      },
    ];
    const wsFamily = XLSX.utils.json_to_sheet(familyData);
    XLSX.utils.book_append_sheet(wb, wsFamily, "Family");

    // Sheet 3: Benefits
    const benefitsData = [
      {
        ruleCode: "RULE-LUMP-SAMPLE-FUND",
        ruleName: "เงินทุนสงเคราะห์พิเศษหน่วยบัญชาการ",
        category: "LUMP_SUM_PAYMENT",
        formulaExpression: "{baseAmount} + ({totalServiceYears} * 5000)",
        multiplierFactor: 1,
        baseAmount: 100000,
        legalBasis: "ระเบียบสวัสดิการหน่วยบัญชาการ พ.ศ. 2565",
      },
    ];
    const wsBenefits = XLSX.utils.json_to_sheet(benefitsData);
    XLSX.utils.book_append_sheet(wb, wsBenefits, "Benefits");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * Generates an Error Report Excel buffer
   */
  public static generateErrorReportBuffer(errors: ImportErrorItem[], fileName: string): Buffer {
    const wb = XLSX.utils.book_new();

    const reportRows = errors.map((e, idx) => ({
      ลำดับ: idx + 1,
      Sheet: e.sheet,
      แถวที่: e.rowNumber,
      คอลัมน์: e.column,
      ระดับความรุนแรง: e.severity === "ERROR" ? "ข้อผิดพลาดร้ายแรง (Error)" : "ข้อควรระวัง (Warning)",
      ข้อความแจ้งเตือน: e.message,
      ค่าที่ไม่ถูกต้อง: String(e.invalidValue || ""),
      คำแนะนำในการแก้ไข: e.suggestedFix,
    }));

    const ws = XLSX.utils.json_to_sheet(reportRows);
    XLSX.utils.book_append_sheet(wb, ws, "Error_Report");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }
}
