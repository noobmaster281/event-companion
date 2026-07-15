import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Event Companion",
  description: "Find your squad at the festival.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Event Companion",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F6F2EC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body className="min-h-screen">
        <ServiceWorkerRegistrar />
        <TopNav />
        <main className="mx-auto max-w-md min-h-screen flex flex-col pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
