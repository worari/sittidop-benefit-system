import { BenefitClaimsWorkflowManager } from "@/presentation/components/claims/BenefitClaimsWorkflowManager";
import { claimStoreManager } from "@/infrastructure/database/repositories/ClaimStoreManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";

export const dynamic = "force-dynamic";

export default async function ClaimsPage() {
  const claims = claimStoreManager.getAll();
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "OFFICER";

  return <BenefitClaimsWorkflowManager initialClaims={claims} userRole={userRole} />;
}
