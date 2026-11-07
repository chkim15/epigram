import type { Metadata } from "next";

export const metadata: Metadata = { title: "Current Job Openings | Epigram" };

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
