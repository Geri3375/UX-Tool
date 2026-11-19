import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Clarity | UX knowledge assistant",
  description: "Private, evidence-based UX research assistance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
