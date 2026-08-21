import { IBenefitProgramRepository } from "../../../core/domain/repositories/IBenefitProgramRepository";
import { BenefitProgramEntity, BenefitRuleEntity } from "../../../core/domain/entities/BenefitProgram";
import { BenefitCategory } from "../../../core/domain/value-objects/enums";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaBenefitProgramRepository implements IBenefitProgramRepository {
  async findById(id: string): Promise<BenefitProgramEntity | null> {
    try {
      const dbItem = await prisma.benefitProgram.findUnique({
        where: { id },
        include: { rules: true },
      });
      if (dbItem) return dbItem as unknown as BenefitProgramEntity;
    } catch {
      // fallback
    }
    const item = storeManager.programs.find((p) => p.id === id);
    return item || null;
  }

  async findByCode(code: string): Promise<BenefitProgramEntity | null> {
    try {
      const dbItem = await prisma.benefitProgram.findUnique({
        where: { code },
        include: { rules: true },
      });
      if (dbItem) return dbItem as unknown as BenefitProgramEntity;
    } catch {
      // fallback
    }
    const item = storeManager.programs.find((p) => p.code === code);
    return item || null;
  }

  async findAll(params?: { category?: BenefitCategory; activeOnly?: boolean }): Promise<BenefitProgramEntity[]> {
    try {
      const where: any = {};
      if (params?.category) where.category = params.category;
      if (params?.activeOnly) where.isActive = true;

      const items = await prisma.benefitProgram.findMany({
        where,
        include: { rules: true },
        orderBy: { createdAt: "asc" },
      });
      if (items.length > 0) return items as unknown as BenefitProgramEntity[];
    } catch {
      // fallback
    }

    let list = [...storeManager.programs];
    if (params?.category) list = list.filter((p) => p.category === params.category);
    if (params?.activeOnly) list = list.filter((p) => p.isActive);

    return list;
  }

  async create(data: Omit<BenefitProgramEntity, "id" | "createdAt" | "updatedAt">): Promise<BenefitProgramEntity> {
    const newItem: BenefitProgramEntity = {
      ...data,
      id: `prog-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const dbItem = await prisma.benefitProgram.create({
        data: {
          code: data.code,
          name: data.name,
          thaiName: data.thaiName,
          description: data.description,
          category: data.category as any,
          targetGroup: data.targetGroup,
          budgetTotal: data.budgetTotal,
          budgetDisbursed: data.budgetDisbursed,
          maxAmount: data.maxAmount,
          paymentFrequency: data.paymentFrequency as any,
          legalBasis: data.legalBasis,
          isActive: data.isActive,
        },
      });
      if (dbItem) return dbItem as unknown as BenefitProgramEntity;
    } catch {
      // fallback
    }

    storeManager.programs.push(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<BenefitProgramEntity>): Promise<BenefitProgramEntity> {
    try {
      const dbItem = await prisma.benefitProgram.update({
        where: { id },
        data: data as any,
      });
      if (dbItem) return dbItem as unknown as BenefitProgramEntity;
    } catch {
      // fallback
    }

    const idx = storeManager.programs.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Benefit Program not found");

    storeManager.programs[idx] = {
      ...storeManager.programs[idx],
      ...data,
      updatedAt: new Date(),
    };

    return storeManager.programs[idx];
  }

  async addRule(programId: string, rule: Omit<BenefitRuleEntity, "id">): Promise<BenefitRuleEntity> {
    const newRule: BenefitRuleEntity = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    return newRule;
  }

  async updateRule(ruleId: string, rule: Partial<BenefitRuleEntity>): Promise<BenefitRuleEntity> {
    return {
      id: ruleId,
      programId: "dop-eld-001",
      ruleName: "Updated Rule",
      requiresDisability: false,
      requiresStateWelfareCard: false,
      requiresHardship: false,
      baseAmount: 600,
      formulaType: "FIXED",
      isActive: true,
      ...rule,
    };
  }
}
