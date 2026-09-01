import { IEstimateRepository, BenefitEstimateRecord } from "../../../core/domain/repositories/IEstimateRepository";
import { BenefitCalculationSummary } from "../../../core/domain/value-objects/types";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaEstimateRepository implements IEstimateRepository {
  private toRecord(dbItem: any): BenefitEstimateRecord {
    return {
      id: dbItem.id,
      estimateNumber: dbItem.estimateNumber || null,
      citizenId: dbItem.citizenId || null,
      citizenName: dbItem.citizen
        ? `${dbItem.citizen.title}${dbItem.citizen.firstName} ${dbItem.citizen.lastName}`
        : null,
      citizenNationalId: dbItem.citizen?.nationalId || dbItem.nationalId || null,
      province: dbItem.citizen?.province || null,
      nationalId: dbItem.nationalId || null,
      calculatedAge: dbItem.calculatedAge,
      inputMonthlyIncome: dbItem.inputMonthlyIncome,
      hasDisability: dbItem.hasDisability,
      hasStateWelfareCard: dbItem.hasStateWelfareCard,
      hardshipScore: dbItem.hardshipScore,
      totalMonthlyEstimate: dbItem.totalMonthlyEstimate,
      totalAnnualEstimate: dbItem.totalAnnualEstimate,
      totalOneTimeEstimate: dbItem.totalOneTimeEstimate,
      breakdownJson: dbItem.breakdownJson,
      summaryNotes: dbItem.summaryNotes,
      createdAt: dbItem.createdAt,
    };
  }

  private generateEstimateNumber(): string {
    const yearBE = new Date().getFullYear() + 543;
    const seq = (storeManager.estimates.length + 1).toString().padStart(4, "0");
    return `EST-${yearBE}-${seq}`;
  }

  async create(summary: BenefitCalculationSummary, citizenId?: string): Promise<BenefitEstimateRecord> {
    const estimateNumber = this.generateEstimateNumber();

    const newRecord: BenefitEstimateRecord = {
      id: `est-${Date.now()}`,
      estimateNumber,
      citizenId: citizenId || null,
      citizenName: null,
      citizenNationalId: summary.input.nationalId || null,
      province: summary.input.province || null,
      nationalId: summary.input.nationalId || null,
      calculatedAge: summary.input.age,
      inputMonthlyIncome: summary.input.monthlyIncome ?? 0,
      hasDisability: summary.input.hasDisability ?? false,
      hasStateWelfareCard: summary.input.hasStateWelfareCard ?? false,
      hardshipScore: summary.vulnerabilityScore,
      totalMonthlyEstimate: summary.totalMonthlyEstimate,
      totalAnnualEstimate: summary.totalAnnualEstimate,
      totalOneTimeEstimate: summary.totalOneTimeEstimate,
      breakdownJson: JSON.stringify(summary.eligiblePrograms),
      summaryNotes: summary.summaryRecommendations.join("\n"),
      createdAt: new Date(),
    };

    try {
      const dbItem = await prisma.benefitEstimate.create({
        data: {
          estimateNumber,
          nationalId: newRecord.nationalId,
          citizenId: citizenId || null,
          age: summary.input.age,
          calculatedAge: newRecord.calculatedAge,
          monthlyIncome: summary.input.monthlyIncome,
          inputMonthlyIncome: newRecord.inputMonthlyIncome,
          hasDisability: newRecord.hasDisability,
          hasStateWelfareCard: newRecord.hasStateWelfareCard,
          isDisabilityRegistered: summary.input.hasDisability,
          disabilityType: summary.input.disabilityType || null,
          livingCondition: summary.input.livingCondition || null,
          hardshipScore: newRecord.hardshipScore,
          vulnerabilityScore: summary.vulnerabilityScore,
          vulnerabilityLevel: summary.vulnerabilityLevel as any,
          eligibleProgramsCount: summary.eligibleProgramsCount,
          totalMonthlyEstimate: newRecord.totalMonthlyEstimate,
          totalAnnualEstimate: newRecord.totalAnnualEstimate,
          totalOneTimeEstimate: newRecord.totalOneTimeEstimate,
          breakdownJson: newRecord.breakdownJson,
          summaryNotes: newRecord.summaryNotes,
        },
        include: { citizen: true },
      });
      if (dbItem) return this.toRecord(dbItem);
    } catch {
      // fallback to in-memory store
    }

    storeManager.estimates.unshift(newRecord);
    return newRecord;
  }

  async findById(id: string): Promise<BenefitEstimateRecord | null> {
    try {
      const dbItem = await prisma.benefitEstimate.findUnique({
        where: { id },
        include: { citizen: true },
      });
      if (dbItem) return this.toRecord(dbItem);
    } catch {
      // fallback
    }
    const item = storeManager.estimates.find((e) => e.id === id);
    return item || null;
  }

  async findByNationalId(nationalId: string): Promise<BenefitEstimateRecord[]> {
    try {
      const items = await prisma.benefitEstimate.findMany({
        where: { nationalId },
        include: { citizen: true },
        orderBy: { createdAt: "desc" },
      });
      if (items.length > 0) return items.map((i: any) => this.toRecord(i));
    } catch {
      // fallback
    }
    return storeManager.estimates.filter((e) => e.nationalId === nationalId);
  }

  async findByCitizenId(citizenId: string): Promise<BenefitEstimateRecord[]> {
    try {
      const items = await prisma.benefitEstimate.findMany({
        where: { citizenId },
        include: { citizen: true },
        orderBy: { createdAt: "desc" },
      });
      if (items.length > 0) return items.map((i: any) => this.toRecord(i));
    } catch {
      // fallback
    }
    return storeManager.estimates.filter((e) => e.citizenId === citizenId);
  }

  async findRecent(limit = 10): Promise<BenefitEstimateRecord[]> {
    try {
      const items = await prisma.benefitEstimate.findMany({
        include: { citizen: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (items.length > 0) return items.map((i: any) => this.toRecord(i));
    } catch {
      // fallback
    }
    return storeManager.estimates.slice(0, limit);
  }
}
