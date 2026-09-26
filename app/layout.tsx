import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { ToastProvider } from "@/components/ToastProvider";


export const metadata: Metadata = {
  title: "Gym Management Dashboard",
  description: "Gym Management SaaS Portfolio Project",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex bg-slate-50 text-slate-900">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
