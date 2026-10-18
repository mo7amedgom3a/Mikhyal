import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Baloo_Bhaijaan_2 } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});
const latin = Inter({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const display = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["700", "800"],
  variable: "--font-display-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مِخيال — ماتحفظش القانون، اكتشفه",
  description:
    "منصة تعلم تفاعلية بالذكاء الاصطناعي للفيزياء والرياضيات لطلاب الثانوية العامة في مصر: تحدّى، توقّع، جرّب، اكتشف، طبّق.",
};

export const viewport: Viewport = { themeColor: "#5146E8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} ${latin.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.motion='ok'",
          }}
        />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
