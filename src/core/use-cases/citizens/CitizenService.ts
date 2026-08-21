import { PrismaCitizenRepository } from "../../../infrastructure/database/repositories/PrismaCitizenRepository";
import { CitizenEntity } from "../../domain/entities/Citizen";
import { AuditLogger } from "../../../infrastructure/logging/audit-logger";

export class CitizenService {
  private citizenRepo = new PrismaCitizenRepository();

  public async getCitizens(params?: {
    search?: string;
    province?: string;
    vulnerabilityLevel?: string;
    skip?: number;
    take?: number;
  }) {
    return await this.citizenRepo.findAll(params);
  }

  public async getCitizenById(id: string): Promise<CitizenEntity | null> {
    return await this.citizenRepo.findById(id);
  }

  public async getCitizenByNationalId(nationalId: string): Promise<CitizenEntity | null> {
    return await this.citizenRepo.findByNationalId(nationalId);
  }

  public async createCitizen(
    data: Omit<CitizenEntity, "id" | "createdAt" | "updatedAt">,
    actor?: { userId?: string; userName?: string }
  ): Promise<CitizenEntity> {
    const created = await this.citizenRepo.create(data);
    if (actor) {
      await AuditLogger.log({
        userId: actor.userId,
        userName: actor.userName,
        action: "CITIZEN_REGISTERED",
        resource: "Citizen",
        resourceId: created.id,
        details: { nationalId: created.nationalId, name: `${created.firstName} ${created.lastName}` },
      });
    }
    return created;
  }
}
