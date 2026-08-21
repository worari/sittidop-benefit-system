import { IUserRepository } from "../../../core/domain/repositories/IUserRepository";
import { UserEntity } from "../../../core/domain/entities/User";
import { Role } from "../../../core/domain/value-objects/enums";
import { storeManager } from "./StoreManager";
import { prisma } from "../prisma";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const dbItem = await prisma.user.findUnique({ where: { id } });
      if (dbItem) {
        const { passwordHash: _, ...user } = dbItem;
        return user as unknown as UserEntity;
      }
    } catch {
      // fallback
    }
    const item = storeManager.users.find((u) => u.id === id);
    if (!item) return null;
    const { passwordHash: _, ...user } = item;
    return user;
  }

  async findByEmail(email: string): Promise<(UserEntity & { passwordHash: string }) | null> {
    try {
      const dbItem = await prisma.user.findUnique({ where: { email } });
      if (dbItem) return dbItem as unknown as UserEntity & { passwordHash: string };
    } catch {
      // fallback
    }
    const item = storeManager.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return item || null;
  }

  async findAll(params?: { role?: Role; search?: string }): Promise<UserEntity[]> {
    try {
      const where: any = {};
      if (params?.role) where.role = params.role;
      if (params?.search) {
        where.OR = [
          { name: { contains: params.search } },
          { email: { contains: params.search } },
          { department: { contains: params.search } },
        ];
      }
      const items = await prisma.user.findMany({ where, orderBy: { name: "asc" } });
      if (items.length > 0) {
        return items.map(({ passwordHash: _, ...u }) => u as unknown as UserEntity);
      }
    } catch {
      // fallback
    }

    let list = storeManager.users.map(({ passwordHash: _, ...u }) => u);
    if (params?.role) list = list.filter((u) => u.role === params.role);
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    return list;
  }

  async create(data: Omit<UserEntity, "id" | "createdAt" | "updatedAt"> & { passwordHash: string }): Promise<UserEntity> {
    const newUser = {
      ...data,
      id: `usr-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role as any,
          department: data.department,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          isActive: data.isActive,
        },
      });
    } catch {
      // fallback
    }

    storeManager.users.push(newUser);
    const { passwordHash: _, ...user } = newUser;
    return user;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const idx = storeManager.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");

    storeManager.users[idx] = {
      ...storeManager.users[idx],
      ...data,
      updatedAt: new Date(),
    };

    const { passwordHash: _, ...user } = storeManager.users[idx];
    return user;
  }
}
