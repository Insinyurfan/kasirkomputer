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
      {/* Ekstensi browser (pengisi form / password manager) sering menambah
          atribut ke <body> sebelum React hydrate — abaikan mismatch itu. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
