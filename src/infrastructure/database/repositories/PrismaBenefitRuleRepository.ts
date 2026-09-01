import { BenefitRule, Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export class PrismaBenefitRuleRepository {
    async findAll(options?: { isActive?: boolean }): Promise<BenefitRule[]> {
        const where = options?.isActive !== undefined ? { isActive: options.isActive } : {};
        return prisma.benefitRule.findMany({ where });
    }

    async findById(id: string): Promise<BenefitRule | null> {
        return prisma.benefitRule.findUnique({ where: { id } });
    }

    async findByRuleCode(ruleCode: string): Promise<BenefitRule | null> {
        return prisma.benefitRule.findFirst({ where: { ruleCode } });
    }

    async create(data: Prisma.BenefitRuleUncheckedCreateInput): Promise<BenefitRule> {
        return prisma.benefitRule.create({ data });
    }

    async update(id: string, data: Prisma.BenefitRuleUncheckedUpdateInput): Promise<BenefitRule> {
        return prisma.benefitRule.update({ where: { id }, data });
    }

    async delete(id: string): Promise<boolean> {
        try {
            await prisma.benefitRule.delete({ where: { id } });
            return true;
        } catch (error) {
            return false;
        }
    }

    async findByProgramId(programId: string): Promise<BenefitRule[]> {
        return prisma.benefitRule.findMany({ where: { programId } });
    }
}