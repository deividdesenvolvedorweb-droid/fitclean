import { usePublicThemeSettings } from "@/hooks/usePublicThemeSettings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  usePublicThemeSettings();
  return <>{children}</>;
}
