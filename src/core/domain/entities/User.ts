import { Role } from "../value-objects/enums";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  citizenId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
}
