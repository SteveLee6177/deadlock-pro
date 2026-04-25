import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deadlock Pro",
  description:
    "Team discovery, live scrim scheduling, tournament tracking, and Twitch embeds for the Deadlock esports scene.",
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
