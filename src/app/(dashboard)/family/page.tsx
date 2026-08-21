import { Metadata } from "next";
import { FamilyTable } from "@/presentation/components/family/FamilyTable";

export const metadata: Metadata = {
  title: "ข้อมูลครอบครัวกำลังพล | Family Information",
  description: "ระบบทะเบียนข้อมูลคู่สมรส บุตร สิทธิทุนการศึกษา และคุณสมบัติทายาททดแทน",
};

export default function FamilyPage() {
  return <FamilyTable />;
}
