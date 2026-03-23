import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export function getResponsiveKey(baseKey: string, deviceMode: DeviceMode): string {
  if (deviceMode === "desktop") return baseKey;
  return `${baseKey}_${deviceMode}`;
}

export function getResponsiveValue(
  config: Record<string, any>,
  baseKey: string,
  deviceMode: DeviceMode
) {
  const key = getResponsiveKey(baseKey, deviceMode);
  const val = config[key];
  if (val != null && val !== "") return val;
  if (deviceMode === "mobile") {
    const tabletVal = config[`${baseKey}_tablet`];
    if (tabletVal != null && tabletVal !== "") return tabletVal;
  }
  return config[baseKey];
}

export function hasResponsiveOverride(
  config: Record<string, any>,
  baseKey: string
): boolean {
  return (
    (config[`${baseKey}_tablet`] != null && config[`${baseKey}_tablet`] !== "") ||
    (config[`${baseKey}_mobile`] != null && config[`${baseKey}_mobile`] !== "")
  );
}

export function ResponsiveIndicator({
  configKey,
  config,
  deviceMode,
}: {
  configKey: string;
  config: Record<string, any>;
  deviceMode: DeviceMode;
}) {
  const hasOverride = hasResponsiveOverride(config, configKey);
  if (deviceMode === "desktop" && !hasOverride) return null;

  const Icon = DEVICE_ICONS[deviceMode];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] ml-1",
        deviceMode !== "desktop" ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {hasOverride && deviceMode === "desktop" && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </span>
  );
}

export function DeviceToggle({
  deviceMode,
  onChange,
}: {
  deviceMode: DeviceMode;
  onChange: (mode: DeviceMode) => void;
}) {
  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden">
      {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((mode) => {
        const Icon = DEVICE_ICONS[mode];
        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={cn(
              "p-1.5 transition-colors",
              deviceMode === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            title={mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobile"}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
