import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillMate - Chi tiêu rõ ràng, tình bạn bền lâu",
  description: "Ứng dụng chia tiền nhóm tối giản, minh bạch và tối ưu hóa các khoản nợ chéo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.className} h-screen overflow-hidden antialiased`}
    >
      <body className="h-screen overflow-hidden bg-slate-50 text-slate-900 select-none">
        {children}
      </body>
    </html>
  );
}
