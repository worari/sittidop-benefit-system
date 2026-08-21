import { Metadata } from "next";
import { DocumentStudio } from "@/presentation/components/documents/DocumentStudio";

export const metadata: Metadata = {
  title: "ระบบสร้างและส่งออกเอกสารทางการ 4 แม่แบบ | Document Generator Studio",
  description: "ระบบสร้างหนังสือรับรองสิทธิ 4 แม่แบบ รองรับการส่งออก PDF, Word DOCX, ตราสัญลักษณ์, QR Code e-Verification, และ e-Signature",
};

export default function DocumentsPage() {
  return <DocumentStudio />;
}
