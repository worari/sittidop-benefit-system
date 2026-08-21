import { Metadata } from "next";
import { DocumentGenerator } from "@/presentation/components/documents/DocumentGenerator";

export const metadata: Metadata = {
  title: "ระบบสร้างหนังสือรับรองสิทธิทางการ | Official Document Generator",
  description: "ระบบสร้างและพิมพ์หนังสือรับรองสิทธิกำลังพลและทายาททางการ พร้อมระบบตรวจสอบ QR Code",
};

export default function DocumentsPage() {
  return <DocumentGenerator />;
}
