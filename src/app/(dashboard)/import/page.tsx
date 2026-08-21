import { Metadata } from "next";
import { ExcelImportWizard } from "@/presentation/components/import/ExcelImportWizard";

export const metadata: Metadata = {
  title: "ระบบนำเข้าข้อมูล Excel | Excel Import Module",
  description: "ระบบนำเข้าข้อมูลกำลังพล ครอบครัว และสิทธิประโยชน์ พร้อมการตรวจสอบความถูกต้องก่อนบันทึก",
};

export default function ImportPage() {
  return <ExcelImportWizard />;
}
