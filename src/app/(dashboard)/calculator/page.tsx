import { Metadata } from "next";
import { Suspense } from "react";
import { MilitaryBenefitCalculator } from "@/presentation/components/calculator/MilitaryBenefitCalculator";

export const metadata: Metadata = {
  title: "ระบบคำนวณประมาณการสิทธิกำลังพล 4 หมวด | Military Benefit Calculator",
  description: "เครื่องมือคำนวณประมาณการสิทธิประโยชน์ เงินสงเคราะห์ บำนาญพิเศษ และสิทธิทายาท 4 หมวด",
};

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">กำลังโหลดระบบคำนวณประมาณการสิทธิ 4 หมวด...</div>}>
      <MilitaryBenefitCalculator />
    </Suspense>
  );
}
