import type { Metadata } from "next";
import "@/styles/globals.css";
import { Rail } from "@/components/site/Rail";
import { profile } from "@/data/profile";
import { instrumentSerif, inter, jetbrainsMono } from "@/lib/fonts";

export const metadata: Metadata = { title: profile.name };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="absolute left-[-9999px] focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-[18px] focus:py-2.5 focus:text-base focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        <div className="mx-auto grid max-w-[1440px] grid-cols-[330px_1fr]">
          <Rail />
          <main id="main" tabIndex={-1} className="min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
