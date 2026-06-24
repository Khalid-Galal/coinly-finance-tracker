import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coinly",
  description:
    "Self-hosted personal finance tracker with AI categorization, insights, and voice Q&A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
