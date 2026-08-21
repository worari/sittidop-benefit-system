import { UserEntity } from "../entities/User";
import { Role } from "../value-objects/enums";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<(UserEntity & { passwordHash: string }) | null>;
  findAll(params?: { role?: Role; search?: string }): Promise<UserEntity[]>;
  create(data: Omit<UserEntity, "id" | "createdAt" | "updatedAt"> & { passwordHash: string }): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
}
