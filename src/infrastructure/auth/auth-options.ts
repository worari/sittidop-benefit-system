import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "../database/repositories/PrismaUserRepository";
import { PrismaAuditLogRepository } from "../database/repositories/PrismaAuditLogRepository";
import { Role } from "../../core/domain/value-objects/enums";

const userRepository = new PrismaUserRepository();
const auditLogRepository = new PrismaAuditLogRepository();

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@dop.go.th" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        const user = await userRepository.findByEmail(credentials.email);
        if (!user || !user.isActive) {
          throw new Error("ไม่พบข้อมูลผู้ใช้หรือบัญชีถูกระงับ");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        // Record Audit Log for login
        try {
          const forwarded = req?.headers ? (req.headers as any)["x-forwarded-for"] : null;
          const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]) : "127.0.0.1";
          const userAgent = req?.headers ? (req.headers as any)["user-agent"] : "Unknown";

          await auditLogRepository.create({
            userId: user.id,
            userName: user.name,
            role: user.role,
            action: "USER_LOGIN_SUCCESS",
            resource: "Auth",
            resourceId: user.id,
            detailsJson: JSON.stringify({ email: user.email, role: user.role }),
            ipAddress: ip,
            userAgent: userAgent,
          });
        } catch {
          // non-blocking
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || undefined,
          image: user.avatarUrl || undefined,
          citizenId: user.citizenId || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as Role;
        token.department = (user as any).department;
        token.citizenId = (user as any).citizenId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
        (session.user as any).department = token.department as string;
        (session.user as any).citizenId = token.citizenId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "sittidop-enterprise-secure-jwt-secret-key-2026",
};
