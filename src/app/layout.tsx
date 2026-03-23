import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";

const muli = Mulish({
  variable: "--font-muli",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Climb10 - Nature Advisory Platform",
  description: "Agentic advisory placement tool for ocean conservation leadership",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${muli.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
