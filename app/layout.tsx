import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sip Happens",
  description: "Das Entscheidungs Trinkspiel"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
