import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../presentation/components/layout/Providers";

export const metadata: Metadata = {
  title: "ระบบประมาณการสิทธิประโยชน์และเงินสงเคราะห์กำลังพล กองทัพบก (RTA Benefit System)",
  description:
    "ระบบสารสนเทศประมาณการสิทธิประโยชน์ เงินสงเคราะห์ บำนาญพิเศษ และสิทธิทายาทกำลังพล กองทัพบก (Royal Thai Army Benefit & Welfare Estimation System)",
  keywords: [
    "สิทธิกำลังพลกองทัพบก",
    "ประมาณการสิทธิ",
    "กองทัพบก",
    "กรมกำลังพลทหารบก",
    "กรมสวัสดิการทหารบก",
    "บำนาญพิเศษ",
    "บำเหน็จตกทอด",
    "สินไหมทดแทนภัยสงคราม",
    "ทุนการศึกษาบุตร ทบ.",
    "บรรจุทายาททดแทน",
    "RTA Benefit System",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-emerald-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
