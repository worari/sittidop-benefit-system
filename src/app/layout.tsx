import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../presentation/components/layout/Providers";

export const metadata: Metadata = {
  title: "ระบบสารสนเทศเพื่อการบริหารจัดการสิทธิและสวัสดิการกำลังพล (WeR-RTA : Welfare and Rights Royal Thai Army)",
  description:
    "ระบบสารสนเทศเพื่อการบริหารจัดการสิทธิและสวัสดิการกำลังพล กองทัพบก (WeR-RTA) บันทึกกำลังพลราชการสายสนาม จชต. กองกำลังป้องกันชายแดน พื้นที่เสี่ยงภัย ตามคำสั่งรับรอง ศปก.ทบ. รายงานการสูญเสีย กพ.4 / กพ.3 ประมาณการสิทธิ 4 หมวด และติดตามสิทธิสวัสดิการจนปิดจบขั้นตอน",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  keywords: [
    "WeR-RTA",
    "Welfare and Rights Royal Thai Army",
    "สิทธิกำลังพลกองทัพบก",
    "ศูนย์ปฏิบัติการกองทัพบก",
    "ศปก.ทบ.",
    "กพ.ทบ.",
    "กพ.3",
    "กพ.4",
    "ราชการสายสนาม",
    "จชต.",
    "กองกำลังป้องกันชายแดน",
    "พื้นที่เสี่ยงภัย",
    "ประมาณการสิทธิ 4 หมวด",
    "เงินสงเคราะห์กำลังพล",
    "บำนาญพิเศษ",
    "บำเหน็จตกทอด",
    "สินไหมทดแทนภัยสงคราม",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0d1526] text-slate-100 font-sans antialiased selection:bg-[#1877F2] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
