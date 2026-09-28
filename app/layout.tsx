import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import { ToastProvider } from "@/components/ToastProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import type { Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Gym Membership & Renewal Manager`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Gym Membership & Renewal Manager`,
    description: SITE_DESCRIPTION,
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "GymDeskManager dashboard showing members, renewals and status"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Gym Membership & Renewal Manager`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"]
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#1E293B",
  viewportFit: "cover",
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
