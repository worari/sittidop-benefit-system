import { Metadata } from "next";
import { HeirIntentDocumentForm } from "@/presentation/components/heirs/HeirIntentDocumentForm";

export const metadata: Metadata = {
  title: "หนังสือแสดงเจตนาระบุตัวทายาทผู้รับบำเหน็จตกทอด & เงินสงเคราะห์ | WeR-RTA",
  description: "กรอกข้อมูลและพิมพ์หนังสือแสดงเจตนาระบุตัวทายาทผู้รับผลประโยชน์ สัดส่วนร้อยละ พร้อมพิมพ์สำหรับลงลายมือชื่อ กรมกำลังพลทหารบก",
};

export default function HeirIntentFormPage() {
  return <HeirIntentDocumentForm />;
}
