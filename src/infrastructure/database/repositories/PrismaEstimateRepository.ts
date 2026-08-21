import { IEstimateRepository, BenefitEstimateRecord } from "../../../core/domain/repositories/IEstimateRepository";
import { BenefitCalculationSummary } from "../../../core/domain/value-objects/types";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaEstimateRepository implements IEstimateRepository {
  async create(summary: BenefitCalculationSummary, citizenId?: string): Promise<BenefitEstimateRecord> {
    const newRecord: BenefitEstimateRecord = {
      id: `est-${Date.now()}`,
      citizenId: citizenId || null,
      nationalId: summary.input.nationalId || null,
      calculatedAge: summary.input.age,
      inputMonthlyIncome: summary.input.monthlyIncome,
      hasDisability: summary.input.hasDisability,
      hasStateWelfareCard: summary.input.hasStateWelfareCard,
      hardshipScore: summary.vulnerabilityScore,
      totalMonthlyEstimate: summary.totalMonthlyEstimate,
      totalAnnualEstimate: summary.totalAnnualEstimate,
      totalOneTimeEstimate: summary.totalOneTimeEstimate,
      breakdownJson: JSON.stringify(summary.eligiblePrograms),
      summaryNotes: summary.summaryRecommendations.join("\n"),
      createdAt: new Date(),
    };

    try {
      await prisma.benefitEstimate.create({
        data: {
          nationalId: newRecord.nationalId,
          calculatedAge: newRecord.calculatedAge,
          inputMonthlyIncome: newRecord.inputMonthlyIncome,
          hasDisability: newRecord.hasDisability,
          hasStateWelfareCard: newRecord.hasStateWelfareCard,
          hardshipScore: newRecord.hardshipScore,
          totalMonthlyEstimate: newRecord.totalMonthlyEstimate,
          totalAnnualEstimate: newRecord.totalAnnualEstimate,
          totalOneTimeEstimate: newRecord.totalOneTimeEstimate,
          breakdownJson: newRecord.breakdownJson,
          summaryNotes: newRecord.summaryNotes,
        },
      });
    } catch {
      // fallback
    }

    storeManager.estimates.unshift(newRecord);
    return newRecord;
  }

  async findById(id: string): Promise<BenefitEstimateRecord | null> {
    const item = storeManager.estimates.find((e) => e.id === id);
    return item || null;
  }

  async findByNationalId(nationalId: string): Promise<BenefitEstimateRecord[]> {
    return storeManager.estimates.filter((e) => e.nationalId === nationalId);
  }

  async findRecent(limit = 10): Promise<BenefitEstimateRecord[]> {
    return storeManager.estimates.slice(0, limit);
  }
}
