import type { Metadata } from "next";
import "@/styles/globals.css";
import { Rail } from "@/components/site/Rail";
import { instrumentSerif, inter, jetbrainsMono } from "@/lib/fonts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.baseURL),
  title: {
    default: "Josh Van Lente — Staff Product Manager",
    template: "%s — Josh Van Lente",
  },
  description:
    "Ten years building 0→1 products and platforms in vertical SaaS and fintech. Currently building an AI agent platform at Evernest.",
  openGraph: {
    type: "website",
    siteName: "Josh Van Lente",
    images: [site.defaultOgImage],
  },
  twitter: { card: "summary_large_image" },
};

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
