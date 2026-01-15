import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viiiide - AI Video Editor",
  description: "AI-powered TikTok-style video editor with Whisper subtitles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
