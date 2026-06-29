import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteNav from "./_components/SiteNav";

export const metadata: Metadata = {
  title: "Coinly",
  description:
    "Self-hosted personal finance tracker with AI categorization, insights, and voice Q&A",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
