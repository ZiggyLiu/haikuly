import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "现代短俳实验室",
  description: "测试自然、当代、有生活感的中文三行短诗。",
};

export default function ModernTestLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
