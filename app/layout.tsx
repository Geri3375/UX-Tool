import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Clarity | UX literature search",
  description: "Search a personal UX literature library by keyword and PDF page.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
