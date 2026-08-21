import { ICitizenRepository } from "../../../core/domain/repositories/ICitizenRepository";
import { CitizenEntity } from "../../../core/domain/entities/Citizen";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaCitizenRepository implements ICitizenRepository {
  async findById(id: string): Promise<CitizenEntity | null> {
    try {
      const dbItem = await prisma.citizen.findUnique({ where: { id } });
      if (dbItem) return dbItem as unknown as CitizenEntity;
    } catch {
      // fallback to store
    }
    const item = storeManager.citizens.find((c) => c.id === id);
    return item || null;
  }

  async findByNationalId(nationalId: string): Promise<CitizenEntity | null> {
    try {
      const dbItem = await prisma.citizen.findUnique({ where: { nationalId } });
      if (dbItem) return dbItem as unknown as CitizenEntity;
    } catch {
      // fallback to store
    }
    const item = storeManager.citizens.find((c) => c.nationalId === nationalId);
    return item || null;
  }

  async findAll(params?: {
    search?: string;
    province?: string;
    vulnerabilityLevel?: string;
    skip?: number;
    take?: number;
  }): Promise<{ citizens: CitizenEntity[]; total: number }> {
    try {
      const where: any = {};
      if (params?.province) where.province = params.province;
      if (params?.vulnerabilityLevel) where.vulnerabilityLevel = params.vulnerabilityLevel;
      if (params?.search) {
        where.OR = [
          { firstName: { contains: params.search } },
          { lastName: { contains: params.search } },
          { nationalId: { contains: params.search } },
        ];
      }
      const [citizens, total] = await Promise.all([
        prisma.citizen.findMany({
          where,
          skip: params?.skip ?? 0,
          take: params?.take ?? 50,
          orderBy: { createdAt: "desc" },
        }),
        prisma.citizen.count({ where }),
      ]);
      if (citizens.length > 0) {
        return { citizens: citizens as unknown as CitizenEntity[], total };
      }
    } catch {
      // fallback to store
    }

    let filtered = [...storeManager.citizens];
    if (params?.province) {
      filtered = filtered.filter((c) => c.province === params.province);
    }
    if (params?.vulnerabilityLevel) {
      filtered = filtered.filter((c) => c.vulnerabilityLevel === params.vulnerabilityLevel);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(s) ||
          c.lastName.toLowerCase().includes(s) ||
          c.nationalId.includes(s) ||
          c.province.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const skip = params?.skip ?? 0;
    const take = params?.take ?? 50;
    const citizens = filtered.slice(skip, skip + take);

    return { citizens, total };
  }

  async create(data: Omit<CitizenEntity, "id" | "createdAt" | "updatedAt">): Promise<CitizenEntity> {
    const newItem: CitizenEntity = {
      ...data,
      id: `cit-${Date.now().toString().slice(-5)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const dbItem = await prisma.citizen.create({
        data: {
          ...newItem,
          dateOfBirth: new Date(data.dateOfBirth),
        },
      });
      if (dbItem) return dbItem as unknown as CitizenEntity;
    } catch {
      // fallback
    }

    storeManager.citizens.unshift(newItem);
    return newItem;
  }

  async update(id: string, data: Partial<CitizenEntity>): Promise<CitizenEntity> {
    try {
      const dbItem = await prisma.citizen.update({
        where: { id },
        data: data as any,
      });
      if (dbItem) return dbItem as unknown as CitizenEntity;
    } catch {
      // fallback
    }

    const idx = storeManager.citizens.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Citizen not found");

    storeManager.citizens[idx] = {
      ...storeManager.citizens[idx],
      ...data,
      updatedAt: new Date(),
    };

    return storeManager.citizens[idx];
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.citizen.delete({ where: { id } });
      return true;
    } catch {
      // fallback
    }
    const idx = storeManager.citizens.findIndex((c) => c.id === id);
    if (idx !== -1) {
      storeManager.citizens.splice(idx, 1);
      return true;
    }
    return false;
  }

  async count(): Promise<number> {
    try {
      return await prisma.citizen.count();
    } catch {
      return storeManager.citizens.length;
    }
  }
}
