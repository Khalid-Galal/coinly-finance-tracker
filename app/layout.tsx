import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteNav from "./_components/SiteNav";

const description =
  "Self-hosted personal finance tracker with AI categorization, insights, and voice Q&A";

export const metadata: Metadata = {
  title: "Coinly",
  description,
  openGraph: { title: "Coinly", description, type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Skip link (WCAG 2.4.1): lets keyboard users bypass the nav straight to the content. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteNav />
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
