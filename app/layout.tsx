import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Federal Tax Worksheet · TY2026",
  description: "Educational 2026 federal income tax estimate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
