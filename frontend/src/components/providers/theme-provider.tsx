"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

export function ThemeProvider({
  children,
  ...props
}: {
  children: ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: string;
  enableSystem?: boolean;
  storageKey?: string;
  themes?: string[];
}) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="claude-light"
      enableSystem={false}
      storageKey="epigram-theme"
      themes={["claude-light", "claude-dark"]}
      enableColorScheme={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}