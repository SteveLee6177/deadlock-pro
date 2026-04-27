import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scrimlock",
  description:
    "Fast scrim scheduling, team discovery, and practice calendars for serious Deadlock players.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
