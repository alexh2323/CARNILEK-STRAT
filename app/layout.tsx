import type { Metadata } from "next";
import "./globals.css";
import { uiSans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Trading",
  description: "Plateforme de trading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${uiSans.className} min-h-screen bg-[#0f0f0f] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}

