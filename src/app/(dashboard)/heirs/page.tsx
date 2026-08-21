import { Metadata } from "next";
import { HeirTable } from "@/presentation/components/heirs/HeirTable";

export const metadata: Metadata = {
  title: "ข้อมูลทายาทและการจัดสรรสิทธิประโยชน์ | Heir Information",
  description: "ระบบทะเบียนข้อมูลทายาทผู้มีสิทธิรับมรดกและบำเหน็จตกทอด สัดส่วนร้อยละ และบัญชีธนาคาร",
};

export default function HeirsPage() {
  return <HeirTable />;
}
