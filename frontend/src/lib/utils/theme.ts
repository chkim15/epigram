import { useTheme as useNextTheme } from 'next-themes';

export type Theme = 'claude-light' | 'claude-dark';

export interface ThemeConfig {
  name: string;
  label: string;
  description: string;
  preview: {
    background: string;
    foreground: string;
    accent: string;
    border: string;
  };
}

export const themeConfigs: Record<Theme, ThemeConfig> = {
  'claude-light': {
    name: 'claude-light',
    label: 'Light',
    description: 'Clean and modern light theme',
    preview: {
      background: 'oklch(0.9818 0.0054 95.0986)',
      foreground: 'oklch(0.3438 0.0269 95.7226)',
      accent: '#a16207',
      border: 'oklch(0.8847 0.0069 97.3627)',
    }
  },
  'claude-dark': {
    name: 'claude-dark',
    label: 'Dark',
    description: 'Modern dark theme',
    preview: {
      background: 'oklch(0.2679 0.0036 106.6427)',
      foreground: 'oklch(0.8074 0.0142 93.0137)',
      accent: 'oklch(0.6724 0.1308 38.7559)',
      border: 'oklch(0.3618 0.0101 106.8928)',
    }
  }
};

export function useAppTheme() {
  const { theme, setTheme, resolvedTheme, themes } = useNextTheme();

  const isClaudeLight = theme === 'claude-light' || (!theme && resolvedTheme === 'claude-light');
  const isClaudeDark = theme === 'claude-dark';

  return {
    theme: (theme || 'claude-light') as Theme,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
    resolvedTheme: (resolvedTheme || 'claude-light') as Theme,
    themes: themes as Theme[],
    isClaudeLight,
    isClaudeDark,
    themeConfig: themeConfigs[(theme || 'claude-light') as Theme],
  };
}

// Helper function to get CSS variable value
export function getCSSVariable(variableName: string): string {
  if (typeof window === 'undefined') return '';
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(`--${variableName}`).trim();
}

// Helper to apply theme-aware inline styles
export function getThemeStyles(_theme?: Theme) {
  // This will be used for components that still need inline styles
  // Returns an object with common style patterns
  return {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    card: 'var(--card)',
    cardForeground: 'var(--card-foreground)',
    border: 'var(--border)',
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    secondary: 'var(--secondary)',
    secondaryForeground: 'var(--secondary-foreground)',
    accent: 'var(--accent)',
    accentForeground: 'var(--accent-foreground)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    sidebar: 'var(--sidebar)',
    sidebarForeground: 'var(--sidebar-foreground)',
  };
}