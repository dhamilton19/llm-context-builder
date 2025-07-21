import type React from "react";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LLM Context Builder",
  description:
    "Prepare your code for AI conversations with elegant file selection",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-system antialiased">{children}</body>
    </html>
  );
}
