import { Metadata } from "next";
import { RuleManager } from "@/presentation/components/rules/RuleManager";

export const metadata: Metadata = {
  title: "จัดการสูตรและกฎเกณฑ์สิทธิประโยชน์ 4 หมวด | Military Benefit Rule Engine",
  description: "ระบบกำหนดสูตรและกฎเกณฑ์การประมาณการสิทธิกำลังพล 4 หมวด (Admin Rule Configuration Engine)",
};

export default function RulesPage() {
  return <RuleManager />;
}
