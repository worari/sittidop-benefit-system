import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../presentation/components/layout/Providers";

export const metadata: Metadata = {
  title: "sittidop - ระบบประมาณการสิทธิสวัสดิการ กรมกิจการผู้สูงอายุ",
  description:
    "ระบบประมาณการสิทธิสวัสดิการผู้สูงอายุ กรมกิจการผู้สูงอายุ กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ (DOP Benefit Estimation & Management System)",
  keywords: [
    "เบี้ยยังชีพผู้สูงอายุ",
    "ประมาณการสิทธิ",
    "กรมกิจการผู้สูงอายุ",
    "สวัสดิการแห่งรัฐ",
    "เบี้ยคนพิการ",
    "เงินสงเคราะห์ผู้สูงอายุ",
    "sittidop",
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
