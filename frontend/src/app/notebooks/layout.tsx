import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notebooks | Epigram" };

export default function NotebooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
