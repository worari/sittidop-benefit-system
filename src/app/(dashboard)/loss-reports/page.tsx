import { Metadata } from "next";
import { LossIncidentReportTable } from "@/presentation/components/loss-reports/LossIncidentReportTable";

export const metadata: Metadata = {
  title: "ระบบรายงานการสูญเสียจากการปฏิบัติหน้าที่ราชการ (กพ.3 / กพ.4) - Tab 5 | ระบบสิทธิกำลังพล ทบ.",
  description: "แบบรายงานการสูญเสีย กพ.3 / กพ.4 พร้อมระบุพิกัดทางทหาร MGRS และพิมพ์เอกสารราชการ",
};

export default function LossReportsPage() {
  return <LossIncidentReportTable />;
}
