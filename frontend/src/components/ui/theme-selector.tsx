"use client";

import { useState, useEffect } from "react";
import { useAppTheme } from "@/lib/utils/theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSelector() {
  const { theme, setTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'claude-light' ? 'claude-dark' : 'claude-light';
    setTheme(newTheme);
  };

  // Show moon when light (to toggle to dark), sun when dark (to toggle to light)
  const getThemeIcon = () => {
    if (!mounted) return <Moon className="h-4 w-4" />;
    return theme === 'claude-light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 rounded-xl border cursor-pointer"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        borderColor: 'var(--border)'
      }}
    >
      {getThemeIcon()}
    </Button>
  );
}