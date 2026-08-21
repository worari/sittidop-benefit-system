import { CitizenEntity } from "../entities/Citizen";

export interface ICitizenRepository {
  findById(id: string): Promise<CitizenEntity | null>;
  findByNationalId(nationalId: string): Promise<CitizenEntity | null>;
  findAll(params?: {
    search?: string;
    province?: string;
    vulnerabilityLevel?: string;
    skip?: number;
    take?: number;
  }): Promise<{ citizens: CitizenEntity[]; total: number }>;
  create(data: Omit<CitizenEntity, "id" | "createdAt" | "updatedAt">): Promise<CitizenEntity>;
  update(id: string, data: Partial<CitizenEntity>): Promise<CitizenEntity>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
