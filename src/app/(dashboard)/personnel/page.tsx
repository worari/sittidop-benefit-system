import { Metadata } from "next";
import { PersonnelTable } from "@/presentation/components/personnel/PersonnelTable";

export const metadata: Metadata = {
  title: "ทะเบียนและประวัติกำลังพล | Military Personnel Management",
  description: "ระบบบริหารจัดการทะเบียนประวัติกำลังพล สังกัดปกติ สังกัดสนาม และสถานะความสูญเสีย",
};

export default function PersonnelPage() {
  return <PersonnelTable />;
}
