import { BenefitProgramEntity, BenefitRuleEntity } from "../entities/BenefitProgram";
import { BenefitCategory } from "../value-objects/enums";

export interface IBenefitProgramRepository {
  findById(id: string): Promise<BenefitProgramEntity | null>;
  findByCode(code: string): Promise<BenefitProgramEntity | null>;
  findAll(params?: {
    category?: BenefitCategory;
    activeOnly?: boolean;
  }): Promise<BenefitProgramEntity[]>;
  create(data: Omit<BenefitProgramEntity, "id" | "createdAt" | "updatedAt">): Promise<BenefitProgramEntity>;
  update(id: string, data: Partial<BenefitProgramEntity>): Promise<BenefitProgramEntity>;
  addRule(programId: string, rule: Omit<BenefitRuleEntity, "id">): Promise<BenefitRuleEntity>;
  updateRule(ruleId: string, rule: Partial<BenefitRuleEntity>): Promise<BenefitRuleEntity>;
}
