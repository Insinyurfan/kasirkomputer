import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shinzi Computer POS",
  description: "Kasir & nota Shinzi Computer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
