/**
 * BN-Aura Theme & White-Label Configuration System
 * Supports clinic-level branding customization
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface BrandingConfig {
  logo?: string;
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  appName?: string;
  tagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    line?: string;
    website?: string;
  };
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: { light: ThemeColors; dark: ThemeColors };
  borderRadius: 'sm' | 'md' | 'lg';
  branding?: BrandingConfig;
  fonts?: {
    heading?: string;
    body?: string;
  };
}

export const defaultTheme: ThemeConfig = {
  id: 'bnaura-default',
  name: 'BN-Aura Premium',
  colors: {
    light: {
      primary: '#8B5CF6',
      secondary: '#F3F4F6',
      accent: '#EC4899',
      background: '#FFFFFF',
      foreground: '#1F2937',
      muted: '#6B7280',
      border: '#E5E7EB',
    },
    dark: {
      primary: '#A78BFA',
      secondary: '#374151',
      accent: '#F472B6',
      background: '#111827',
      foreground: '#F9FAFB',
      muted: '#9CA3AF',
      border: '#374151',
    },
  },
  borderRadius: 'lg',
};

export const presetThemes: ThemeConfig[] = [
  defaultTheme,
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    colors: {
      light: { ...defaultTheme.colors.light, primary: '#D4AF37', accent: '#B8860B' },
      dark: { ...defaultTheme.colors.dark, primary: '#FFD700', accent: '#DAA520' },
    },
    borderRadius: 'md',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: {
      light: { ...defaultTheme.colors.light, primary: '#0EA5E9', accent: '#06B6D4' },
      dark: { ...defaultTheme.colors.dark, primary: '#38BDF8', accent: '#22D3EE' },
    },
    borderRadius: 'lg',
  },
];

export function applyTheme(theme: ThemeConfig, mode: 'light' | 'dark'): void {
  const colors = theme.colors[mode];
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  root.style.setProperty('--radius', theme.borderRadius === 'sm' ? '0.25rem' : theme.borderRadius === 'md' ? '0.5rem' : '0.75rem');
  
  // Apply fonts if specified
  if (theme.fonts?.heading) {
    root.style.setProperty('--font-heading', theme.fonts.heading);
  }
  if (theme.fonts?.body) {
    root.style.setProperty('--font-body', theme.fonts.body);
  }
}

// Get clinic theme from storage or API
export async function getClinicTheme(clinicId: string): Promise<ThemeConfig | null> {
  try {
    const response = await fetch(`/api/clinic/${clinicId}/theme`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Save clinic theme
export async function saveClinicTheme(clinicId: string, theme: ThemeConfig): Promise<boolean> {
  try {
    const response = await fetch(`/api/clinic/${clinicId}/theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Generate CSS variables string
export function generateCSSVariables(theme: ThemeConfig, mode: 'light' | 'dark'): string {
  const colors = theme.colors[mode];
  const vars = Object.entries(colors)
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n  ');
  
  return `:root {\n  ${vars}\n  --radius: ${
    theme.borderRadius === 'sm' ? '0.25rem' : theme.borderRadius === 'md' ? '0.5rem' : '0.75rem'
  };\n}`; 
}
