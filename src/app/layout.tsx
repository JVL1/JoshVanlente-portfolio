import type { Metadata } from "next";
import "@/styles/globals.css";
import { instrumentSerif, inter, jetbrainsMono } from "@/lib/fonts";

export const metadata: Metadata = { title: "Josh Van Lente" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
