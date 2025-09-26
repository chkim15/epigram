"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only modify DOM after component is mounted (client-side only)
    if (!mounted) return;

    // Add or remove 'dark' class based on theme
    const isDark = theme === 'claude-dark' || resolvedTheme === 'claude-dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, resolvedTheme, mounted]);

  return <>{children}</>;
}