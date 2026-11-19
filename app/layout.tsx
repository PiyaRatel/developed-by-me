import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./tokens.css";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--next-display", weight: ["600", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--next-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--next-mono", weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Developed by Me",
  description: "A 10-stop tour of AI interaction and design-system work, one tiny real interaction at a time.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-density="comfortable" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
