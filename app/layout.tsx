import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Dancing_Script,
  Geist,
  Geist_Mono,
  Lato,
  Shippori_Mincho,
  Zhi_Mang_Xing,
} from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import RscBootstrap from "./rsc-bootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const lato = Lato({
  variable: "--font-lato",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const zhiMangXing = Zhi_Mang_Xing({
  variable: "--font-zhi-mang-xing",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-poem-en",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-poem-ja",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "localhost";
  const protocol = incomingHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "Spring Whispers, Haiku-ly~";
  const description = "Create a strict 5–7–5 haiku or a modern three-line haiku by chance or from a word on your mind.";

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.png", width: 1730, height: 909, alt: "Haiku-ly — Three lines. One quiet world." }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} ${dancingScript.variable} ${zhiMangXing.variable} ${cormorantGaramond.variable} ${shipporiMincho.variable}`}>
        <RscBootstrap />
        {children}
      </body>
    </html>
  );
}
