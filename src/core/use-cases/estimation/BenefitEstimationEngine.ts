import {
  BenefitCategory,
  PaymentFrequency,
  VulnerabilityLevel,
} from "../../domain/value-objects/enums";
import {
  EstimateInput,
  BenefitEligibilityResult,
  BenefitCalculationSummary,
} from "../../domain/value-objects/types";

export class BenefitEstimationEngine {
  /**
   * Main calculation engine that evaluates all Thai DOP & welfare programs
   */
  public static calculate(input: EstimateInput): BenefitCalculationSummary {
    const age = Number(input.age) || 0;
    const monthlyIncome = Number(input.monthlyIncome) || 0;
    const hasDisability = Boolean(input.hasDisability);
    const hasStateWelfareCard = Boolean(input.hasStateWelfareCard);
    const livingCondition = input.livingCondition || "FAMILY";
    const hardshipFactors = input.hardshipFactors || {};

    const eligiblePrograms: BenefitEligibilityResult[] = [];
    const ineligiblePrograms: BenefitEligibilityResult[] = [];

    // Calculate Vulnerability Score
    let vulnerabilityScore = 0;
    if (age >= 90) vulnerabilityScore += 30;
    else if (age >= 80) vulnerabilityScore += 25;
    else if (age >= 70) vulnerabilityScore += 15;
    else if (age >= 60) vulnerabilityScore += 10;

    if (monthlyIncome === 0) vulnerabilityScore += 30;
    else if (monthlyIncome < 3000) vulnerabilityScore += 25;
    else if (monthlyIncome < 8000) vulnerabilityScore += 15;
    else if (monthlyIncome < 15000) vulnerabilityScore += 5;

    if (hasStateWelfareCard) vulnerabilityScore += 15;
    if (hasDisability) vulnerabilityScore += 20;
    if (livingCondition === "ALONE" || livingCondition === "BEDRIDDEN") vulnerabilityScore += 15;
    if (hardshipFactors.inadequateHousing) vulnerabilityScore += 10;
    if (hardshipFactors.noCaregiver) vulnerabilityScore += 10;
    if (hardshipFactors.chronicIllness) vulnerabilityScore += 10;

    vulnerabilityScore = Math.min(100, vulnerabilityScore);

    let vulnerabilityLevel = VulnerabilityLevel.LOW;
    if (vulnerabilityScore >= 75) vulnerabilityLevel = VulnerabilityLevel.CRITICAL;
    else if (vulnerabilityScore >= 50) vulnerabilityLevel = VulnerabilityLevel.HIGH;
    else if (vulnerabilityScore >= 25) vulnerabilityLevel = VulnerabilityLevel.MODERATE;

    // ----------------------------------------------------
    // 1. เบี้ยยังชีพผู้สูงอายุ (Elderly Living Allowance)
    // ----------------------------------------------------
    const eldProgramId = "dop-eld-001";
    if (age >= 60) {
      let monthlyRate = 600;
      let ageTier = "60-69 ปี (600 บาท/เดือน)";
      if (age >= 90) {
        monthlyRate = 1000;
        ageTier = "90 ปีขึ้นไป (1,000 บาท/เดือน)";
      } else if (age >= 80) {
        monthlyRate = 800;
        ageTier = "80-89 ปี (800 บาท/เดือน)";
      } else if (age >= 70) {
        monthlyRate = 700;
        ageTier = "70-79 ปี (700 บาท/เดือน)";
      }

      eligiblePrograms.push({
        programId: eldProgramId,
        programCode: "DOP-ELD-001",
        programName: "เบี้ยยังชีพผู้สูงอายุ (แบบขั้นบันได)",
        category: BenefitCategory.LIVING_ALLOWANCE,
        isEligible: true,
        estimatedAmount: monthlyRate,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: monthlyRate,
        annualAmountEquivalent: monthlyRate * 12,
        eligibilityReasons: [
          `อายุครบ ${age} ปี (อยู่ในเกณฑ์ขั้นบันได ${ageTier})`,
          "สัญชาติไทยและมีภูมิลำเนาในเขตองค์กรปกครองส่วนท้องถิ่น",
        ],
        ineligibilityReasons: [],
        legalBasis: "ระเบียบกระทรวงมหาดไทยว่าด้วยหลักเกณฑ์การจ่ายเงินเบี้ยยังชีพผู้สูงอายุของ อปท. พ.ศ. 2566",
        requiredDocuments: [
          "สำเนาบัตรประจำตัวประชาชน",
          "สำเนาทะเบียนบ้าน",
          "สำเนาสมุดบัญชีเงินฝากธนาคาร",
        ],
        priorityLevel: "HIGH",
      });
    } else {
      const yearsLeft = 60 - age;
      ineligiblePrograms.push({
        programId: eldProgramId,
        programCode: "DOP-ELD-001",
        programName: "เบี้ยยังชีพผู้สูงอายุ (แบบขั้นบันได)",
        category: BenefitCategory.LIVING_ALLOWANCE,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          `อายุปัจจุบัน ${age} ปี (ยังไม่ครบ 60 ปีบริบูรณ์ - อีก ${yearsLeft} ปีจึงจะเริ่มมีสิทธิลงทะเบียน)`,
        ],
        legalBasis: "ระเบียบกระทรวงมหาดไทยว่าด้วยหลักเกณฑ์การจ่ายเงินเบี้ยยังชีพผู้สูงอายุของ อปท. พ.ศ. 2566",
        requiredDocuments: ["สำเนาบัตรประจำตัวประชาชน", "สำเนาทะเบียนบ้าน"],
        priorityLevel: "HIGH",
      });
    }

    // ----------------------------------------------------
    // 2. เบี้ยความพิการ (Disability Benefit)
    // ----------------------------------------------------
    const disProgramId = "dop-dis-002";
    if (hasDisability) {
      const disMonthly = hasStateWelfareCard ? 1000 : 800;
      eligiblePrograms.push({
        programId: disProgramId,
        programCode: "DOP-DIS-002",
        programName: "เบี้ยความพิการสำหรับผู้สูงอายุ",
        category: BenefitCategory.DISABILITY_BENEFIT,
        isEligible: true,
        estimatedAmount: disMonthly,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: disMonthly,
        annualAmountEquivalent: disMonthly * 12,
        eligibilityReasons: [
          "มีสมุด/บัตรประจำตัวคนพิการถูกต้องตามกฎหมาย",
          hasStateWelfareCard
            ? "ได้รับเงินเพิ่มพิเศษ 200 บาท/เดือนเนื่องจากถือบัตรสวัสดิการแห่งรัฐ (รวม 1,000 บาท/เดือน)"
            : "อัตราพื้นฐานคนพิการอายุ 18 ปีขึ้นไป 800 บาท/เดือน",
        ],
        ineligibilityReasons: [],
        legalBasis: "พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550 และที่แก้ไขเพิ่มเติม",
        requiredDocuments: [
          "สมุดประจำตัวคนพิการ",
          "สำเนาบัตรประชาชน",
          "สำเนาทะเบียนบ้าน",
          "สำเนาหน้าสมุดบัญชีธนาคาร",
        ],
        priorityLevel: "HIGH",
      });
    } else {
      ineligiblePrograms.push({
        programId: disProgramId,
        programCode: "DOP-DIS-002",
        programName: "เบี้ยความพิการสำหรับผู้สูงอายุ",
        category: BenefitCategory.DISABILITY_BENEFIT,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          "ไม่มีการจดทะเบียนหรือไม่ได้ระบุสถานะความพิการ",
        ],
        legalBasis: "พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ พ.ศ. 2550",
        requiredDocuments: ["สมุดประจำตัวคนพิการ", "ใบรับรองความพิการทางการแพทย์"],
        priorityLevel: "MEDIUM",
      });
    }

    // ----------------------------------------------------
    // 3. สิทธิสวัสดิการแห่งรัฐเสริมสำหรับผู้สูงอายุ (State Welfare Card Subsidies)
    // ----------------------------------------------------
    const swcProgramId = "dop-swc-003";
    if (hasStateWelfareCard) {
      const swcMonthly = 300 + 100; // 300 essentials + 100 elderly cost-of-living topup
      eligiblePrograms.push({
        programId: swcProgramId,
        programCode: "DOP-SWC-003",
        programName: "สิทธิสวัสดิการแห่งรัฐสำหรับผู้สูงอายุ (วงเงินซื้อสินค้า + เงินเพิ่มเบี้ยยังชีพ)",
        category: BenefitCategory.STATE_WELFARE_TOPUP,
        isEligible: true,
        estimatedAmount: swcMonthly,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: swcMonthly,
        annualAmountEquivalent: swcMonthly * 12,
        eligibilityReasons: [
          "เป็นผู้ได้รับสิทธิตามโครงการลงทะเบียนเพื่อสวัสดิการแห่งรัฐ",
          "วงเงินรูดซื้อสินค้าอุปโภคบริโภค 300 บาท/เดือน",
          "เงินสงเคราะห์เพื่อการยังชีพผู้สูงอายุที่มีรายได้น้อยเพิ่มเติม 100 บาท/เดือน",
          "สิทธิส่วนลดค่าก๊าซหุงต้มและค่ายานพาหนะสาธารณะตามที่กระทรวงการคลังกำหนด",
        ],
        ineligibilityReasons: [],
        legalBasis: "มติคณะรัฐมนตรี มาตรการช่วยเหลือผู้มีรายได้น้อยผ่านบัตรสวัสดิการแห่งรัฐ",
        requiredDocuments: ["บัตรประจำตัวประชาชน Smart Card (ยืนยันสิทธิ e-KYC แล้ว)"],
        priorityLevel: "HIGH",
      });
    } else {
      ineligiblePrograms.push({
        programId: swcProgramId,
        programCode: "DOP-SWC-003",
        programName: "สิทธิสวัสดิการแห่งรัฐสำหรับผู้สูงอายุ",
        category: BenefitCategory.STATE_WELFARE_TOPUP,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.MONTHLY,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          "ยังไม่มีสิทธิในโครงการลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (สามารถสมัครได้ในรอบเปิดลงทะเบียนรอบใหม่)",
        ],
        legalBasis: "โครงการลงทะเบียนเพื่อสวัสดิการแห่งรัฐ กระทรวงการคลัง",
        requiredDocuments: ["บัตรประจำตัวประชาชน Smart Card"],
        priorityLevel: "MEDIUM",
      });
    }

    // ----------------------------------------------------
    // 4. เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก (Emergency Hardship Grant)
    // ----------------------------------------------------
    const emgProgramId = "dop-emg-004";
    const isHardshipEligible =
      age >= 60 &&
      (monthlyIncome < 5000 || hasStateWelfareCard) &&
      (vulnerabilityScore >= 40 || livingCondition === "ALONE" || livingCondition === "BEDRIDDEN" || hardshipFactors.chronicIllness);

    if (isHardshipEligible) {
      eligiblePrograms.push({
        programId: emgProgramId,
        programCode: "DOP-EMG-004",
        programName: "เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก",
        category: BenefitCategory.EMERGENCY_GRANT,
        isEligible: true,
        estimatedAmount: 3000,
        frequency: PaymentFrequency.PER_OCCURRENCE,
        monthlyAmountEquivalent: (3000 * 3) / 12, // averaged annualized value
        annualAmountEquivalent: 9000, // up to 3 times/year
        eligibilityReasons: [
          "อายุ 60 ปีขึ้นไปและอยู่ในสภาวะยากลำบาก ขาดผู้อุปการะ หรือมีภาระค่าครองชีพสูง",
          `คะแนนความเปราะบาง ${vulnerabilityScore}/100 อยู่ในเกณฑ์ได้รับการช่วยเหลือเร่งด่วน`,
          "สิทธิช่วยเหลือสูงสุด 3,000 บาท/ครั้ง (ไม่เกิน 3 ครั้งต่อปีงบประมาณ)",
        ],
        ineligibilityReasons: [],
        legalBasis: "ระเบียบกรมกิจการผู้สูงอายุว่าด้วยการคุ้มครองและช่วยเหลือผู้สูงอายุที่ประสบปัญหาความเดือดร้อน พ.ศ. 2560",
        requiredDocuments: [
          "สำเนาบัตรประชาชนผู้สูงอายุ",
          "สำเนาทะเบียนบ้าน",
          "หนังสือรับรองความยากลำบาก/แบบสอบข้อเท็จจริงโดย อพม. หรือผู้นำชุมชน",
          "ภาพถ่ายสภาพความเป็นอยู่",
        ],
        priorityLevel: "HIGH",
      });
    } else {
      ineligiblePrograms.push({
        programId: emgProgramId,
        programCode: "DOP-EMG-004",
        programName: "เงินสงเคราะห์ผู้สูงอายุในภาวะยากลำบาก",
        category: BenefitCategory.EMERGENCY_GRANT,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.PER_OCCURRENCE,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          age < 60
            ? `อายุ ${age} ปี ยังไม่ครบ 60 ปี`
            : "รายได้หรือดัชนีความเปราะบางยังไม่เข้าเกณฑ์ภาวะยากลำบากฉุกเฉิน (รายได้ต้องน้อยกว่า 5,000 บ./ด. หรือผ่านการประเมินสังคมสงเคราะห์)",
        ],
        legalBasis: "ระเบียบกรมกิจการผู้สูงอายุว่าด้วยการคุ้มครองและช่วยเหลือผู้สูงอายุที่ประสบปัญหาความเดือดร้อน พ.ศ. 2560",
        requiredDocuments: ["แบบบันทึกการสอบข้อเท็จจริงสภาพความเดือดร้อน"],
        priorityLevel: "MEDIUM",
      });
    }

    // ----------------------------------------------------
    // 5. เงินช่วยเหลือปรับปรุงบ้านผู้สูงอายุ (Housing Renovation Grant)
    // ----------------------------------------------------
    const hsgProgramId = "dop-hsg-005";
    const isHousingEligible =
      age >= 60 &&
      (monthlyIncome < 10000 || hasStateWelfareCard) &&
      (hardshipFactors.inadequateHousing || hasDisability || livingCondition === "ALONE" || livingCondition === "BEDRIDDEN");

    if (isHousingEligible) {
      const grantAmount = hasDisability ? 40000 : 22500;
      eligiblePrograms.push({
        programId: hsgProgramId,
        programCode: "DOP-HSG-005",
        programName: "เงินช่วยเหลือปรับปรุงสภาพแวดล้อมที่อยู่อาศัยสำหรับผู้สูงอายุ",
        category: BenefitCategory.HOUSING_RENOVATION,
        isEligible: true,
        estimatedAmount: grantAmount,
        frequency: PaymentFrequency.ONE_TIME,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: grantAmount,
        eligibilityReasons: [
          "อายุ 60 ปีขึ้นไปและมีบ้านพักอาศัยที่มีสภาพทรุดโทรม ไม่ปลอดภัย หรือไม่เอื้อต่อสุขอนามัย",
          hasDisability
            ? "ได้รับเกณฑ์วงเงินพิเศษเพื่อการปรับสภาพแวดล้อมคนพิการ/ผู้สูงอายุสูงสุด 40,000 บาท"
            : "เกณฑ์วงเงินสนับสนุนปรับปรุงห้องน้ำ/ทางลาด/หลังคา สูงสุด 22,500 บาท/หลังคาเรือน",
          "ที่ดินและบ้านพักอาศัยมีกรรมสิทธิ์หรือได้รับการยินยอมจากเจ้าของบ้านอย่างถูกต้อง",
        ],
        ineligibilityReasons: [],
        legalBasis: "ระเบียบกรมกิจการผู้สูงอายุว่าด้วยโครงการปรับปรุงสภาพแวดล้อมและสิ่งอำนวยความสะดวกของผู้สูงอายุให้เหมาะสมและปลอดภัย",
        requiredDocuments: [
          "สำเนาบัตรประชาชนและทะเบียนบ้าน",
          "หนังสือยินยอมให้ปรับปรุงบ้านจากเจ้าของกรรมสิทธิ์",
          "ภาพถ่ายสภาพบ้านพักอาศัยปัจจุบัน (ก่อนปรับปรุง)",
          "ประมาณการค่าวัสดุและอุปกรณ์ปรับปรุง",
        ],
        priorityLevel: "HIGH",
      });
    } else {
      ineligiblePrograms.push({
        programId: hsgProgramId,
        programCode: "DOP-HSG-005",
        programName: "เงินช่วยเหลือปรับปรุงสภาพแวดล้อมที่อยู่อาศัยสำหรับผู้สูงอายุ",
        category: BenefitCategory.HOUSING_RENOVATION,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.ONE_TIME,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          age < 60
            ? `อายุ ${age} ปี ยังไม่ครบเกณฑ์ 60 ปี`
            : "ไม่ได้ระบุปัญหาด้านสภาพที่อยู่อาศัยไม่ปลอดภัย หรือรายได้เกินเกณฑ์สนับสนุน",
        ],
        legalBasis: "ระเบียบกรมกิจการผู้สูงอายุ",
        requiredDocuments: ["ภาพถ่ายที่อยู่อาศัย", "หนังสือยินยอมเจ้าของบ้าน"],
        priorityLevel: "STANDARD",
      });
    }

    // ----------------------------------------------------
    // 6. เงินสงเคราะห์ค่าทำศพผู้สูงอายุตามประเพณี (Funeral Assistance Grant)
    // ----------------------------------------------------
    const fnlProgramId = "dop-fnl-006";
    if (age >= 60 && (hasStateWelfareCard || monthlyIncome < 10000)) {
      eligiblePrograms.push({
        programId: fnlProgramId,
        programCode: "DOP-FNL-006",
        programName: "เงินสงเคราะห์ในการจัดการศพผู้สูงอายุตามประเพณี",
        category: BenefitCategory.FUNERAL_AID,
        isEligible: true,
        estimatedAmount: 3000,
        frequency: PaymentFrequency.PER_OCCURRENCE,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 3000,
        eligibilityReasons: [
          "ผู้สูงอายุสัญชาติไทย อายุ 60 ปีขึ้นไปและเป็นผู้มีรายได้น้อย/ถือบัตรสวัสดิการแห่งรัฐ",
          "ทายาทหรือผู้จัดการศพสามารถยื่นคำขอรับเงินช่วยเหลือ 3,000 บาท ภายใน 6 เดือนนับแต่วันออกใบมรณบัตร",
        ],
        ineligibilityReasons: [],
        legalBasis: "ประกาศกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ เรื่อง การสงเคราะห์ในการจัดการศพตามประเพณี พ.ศ. 2557",
        requiredDocuments: [
          "ใบมรณบัตรผู้สูงอายุ",
          "บัตรประจำตัวประชาชนและทะเบียนบ้านของผู้ยื่นคำขอ/ผู้จัดการศพ",
          "หนังสือรับรองจาก อพม. หรือผู้นำชุมชน/วัดที่จัดพิธีศพ",
        ],
        priorityLevel: "STANDARD",
      });
    } else {
      ineligiblePrograms.push({
        programId: fnlProgramId,
        programCode: "DOP-FNL-006",
        programName: "เงินสงเคราะห์ในการจัดการศพผู้สูงอายุตามประเพณี",
        category: BenefitCategory.FUNERAL_AID,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.PER_OCCURRENCE,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          age < 60
            ? `อายุ ${age} ปี ยังไม่ครบ 60 ปี`
            : "ไม่เข้าเกณฑ์ผู้มีรายได้น้อยตามหลักเกณฑ์ของ พม.",
        ],
        legalBasis: "ประกาศกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์",
        requiredDocuments: ["ใบมรณบัตร"],
        priorityLevel: "STANDARD",
      });
    }

    // ----------------------------------------------------
    // 7. เงินทุนกู้ยืมเพื่อการประกอบอาชีพสำหรับผู้สูงอายุ (Occupational Revolving Loan)
    // ----------------------------------------------------
    const loanProgramId = "dop-loan-007";
    if (age >= 60 && age <= 75 && livingCondition !== "BEDRIDDEN") {
      eligiblePrograms.push({
        programId: loanProgramId,
        programCode: "DOP-LOAN-007",
        programName: "เงินทุนกู้ยืมเพื่อการประกอบอาชีพ (กองทุนผู้สูงอายุ ปลอดดอกเบี้ย 0%)",
        category: BenefitCategory.OCCUPATIONAL_LOAN,
        isEligible: true,
        estimatedAmount: 30000,
        frequency: PaymentFrequency.ONE_TIME,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 30000,
        eligibilityReasons: [
          `อายุ ${age} ปี อยู่ในเกณฑ์ผู้สูงอายุที่มีศักยภาพประกอบอาชีพ (อายุ 60-75 ปี)`,
          "กู้ยืมรายบุคคลวงเงินสูงสุด 30,000 บาท หรือรายกลุ่ม (5 คนขึ้นไป) สูงสุด 100,000 บาท",
          "อัตราดอกเบี้ย 0% (ไม่มีดอกเบี้ย) ผ่อนชำระคืนภายใน 3 ปี",
        ],
        ineligibilityReasons: [],
        legalBasis: "ระเบียบคณะกรรมการกองทุนผู้สูงอายุว่าด้วยการบริหารกองทุนผู้สูงอายุ พ.ศ. 2547",
        requiredDocuments: [
          "สำเนาบัตรประชาชนและทะเบียนบ้านของผู้กู้และผู้ค้ำประกัน",
          "แผนการประกอบอาชีพ/ประมาณการค่าใช้จ่าย",
          "หนังสือรับรองสุขภาพจากแพทย์",
        ],
        priorityLevel: "MEDIUM",
      });
    } else {
      ineligiblePrograms.push({
        programId: loanProgramId,
        programCode: "DOP-LOAN-007",
        programName: "เงินทุนกู้ยืมเพื่อการประกอบอาชีพ (กองทุนผู้สูงอายุ)",
        category: BenefitCategory.OCCUPATIONAL_LOAN,
        isEligible: false,
        estimatedAmount: 0,
        frequency: PaymentFrequency.ONE_TIME,
        monthlyAmountEquivalent: 0,
        annualAmountEquivalent: 0,
        eligibilityReasons: [],
        ineligibilityReasons: [
          age < 60
            ? `อายุ ${age} ปี ยังไม่ครบ 60 ปีบริบูรณ์`
            : age > 75
            ? `อายุ ${age} ปี เกินเกณฑ์เพดานการกู้ยืมตามระเบียบกองทุน (สูงสุด 75 ปี)`
            : "สุขภาพหรือสภาวะร่างกายไม่เอื้อต่อการประกอบอาชีพ",
        ],
        legalBasis: "ระเบียบคณะกรรมการกองทุนผู้สูงอายุ",
        requiredDocuments: ["แผนการประกอบอาชีพ"],
        priorityLevel: "STANDARD",
      });
    }

    // Totals calculations
    const totalMonthlyEstimate = eligiblePrograms.reduce((sum, p) => {
      return p.frequency === PaymentFrequency.MONTHLY ? sum + p.estimatedAmount : sum;
    }, 0);

    const totalOneTimeEstimate = eligiblePrograms.reduce((sum, p) => {
      return p.frequency === PaymentFrequency.ONE_TIME || p.frequency === PaymentFrequency.PER_OCCURRENCE
        ? sum + p.estimatedAmount
        : sum;
    }, 0);

    const totalAnnualEstimate = (totalMonthlyEstimate * 12) + eligiblePrograms.reduce((sum, p) => {
      if (p.frequency === PaymentFrequency.PER_OCCURRENCE && p.category === BenefitCategory.EMERGENCY_GRANT) {
        return sum + p.annualAmountEquivalent;
      }
      return sum;
    }, 0);

    // Summary recommendations
    const summaryRecommendations: string[] = [];
    if (eligiblePrograms.length > 0) {
      summaryRecommendations.push(
        `ท่านมีสิทธิได้รับสวัสดิการรวม ${eligiblePrograms.length} รายการ มูลค่าประมาณการรวม ${totalMonthlyEstimate.toLocaleString("th-TH")} บาท/เดือน`
      );
    }
    if (vulnerabilityLevel === VulnerabilityLevel.CRITICAL || vulnerabilityLevel === VulnerabilityLevel.HIGH) {
      summaryRecommendations.push(
        "ตรวจพบดัชนีความเปราะบางระดับสูง ขอแนะนำให้ติดต่อเจ้าหน้าที่พัฒนาสังคมและความมั่นคงของมนุษย์ (พมจ.) หรือ อพม. เพื่อรับการคุ้มครองสิทธิแบบบูรณาการเร่งด่วน"
      );
    }
    if (hasDisability && !hasStateWelfareCard) {
      summaryRecommendations.push(
        "ขอแนะนำให้ลงทะเบียนบัตรสวัสดิการแห่งรัฐในรอบถัดไปเพื่อรับเบี้ยคนพิการเพิ่มพิเศษอีก 200 บาท/เดือน"
      );
    }
    if (age < 60 && age >= 59) {
      summaryRecommendations.push(
        "ท่านสามารถลงทะเบียนขอรับเบี้ยยังชีพผู้สูงอายุล่วงหน้าได้ที่องค์กรปกครองส่วนท้องถิ่นตามภูมิลำเนา ตั้งแต่วันที่ 1 ตุลาคมของปีนี้"
      );
    }

    return {
      input,
      calculatedAt: new Date().toISOString(),
      totalMonthlyEstimate,
      totalAnnualEstimate,
      totalOneTimeEstimate,
      vulnerabilityScore,
      vulnerabilityLevel,
      eligibleProgramsCount: eligiblePrograms.length,
      eligiblePrograms,
      ineligiblePrograms,
      summaryRecommendations,
    };
  }
}
