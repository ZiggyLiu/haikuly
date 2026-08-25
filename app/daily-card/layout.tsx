import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Haiku-ly daily card",
  robots: { index: false, follow: false },
};

export default function DailyCardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
