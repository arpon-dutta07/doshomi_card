import type { Metadata, Viewport } from "next";
import { Atma, Galada, Hind_Siliguri } from "next/font/google";
import type { CSSProperties } from "react";
import { art } from "@/lib/art";
import "./globals.css";

const galada = Galada({ variable: "--font-galada", weight: "400", subsets: ["bengali", "latin"] });
const atma = Atma({ variable: "--font-atma", weight: ["400", "500", "600"], subsets: ["bengali", "latin"] });
const hind = Hind_Siliguri({ variable: "--font-hind", weight: ["400", "500", "600", "700"], subsets: ["bengali", "latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:5200"),
  title: "বিজয়ার চিঠি",
  description: "আগে পোস্টকার্ডে যেত, এবার WhatsApp-এ যাবে। নিজের লোককে একটা বিজয়ার চিঠি পাঠাও।",
};

export const viewport: Viewport = {
  themeColor: "#f5eee0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Real textures (from art/, see npm run art) handed to the CSS; each rule falls back to its drawn version. */
const TEXTURES = { "--saree-photo": "saree-fabric", "--inland-photo": "inland-paper", "--cord-h": "cord", "--cord-v": "cord-v" };
const textureVars = Object.fromEntries(
  Object.entries(TEXTURES).flatMap(([v, name]) => {
    const a = art(name);
    return a ? [[v, `url(${a.src})`]] : [];
  }),
) as CSSProperties;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${galada.variable} ${atma.variable} ${hind.variable}`} style={textureVars}>
      <body>{children}</body>
    </html>
  );
}
