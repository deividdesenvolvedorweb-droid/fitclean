import { lazy, Suspense } from "react";
import { icons } from "lucide-react";

interface IconBoxBlockProps {
  config: Record<string, any>;
}

const FALLBACK_ICON = "Star";

export function IconBoxBlock({ config }: IconBoxBlockProps) {
  const iconName = config.icon || FALLBACK_ICON;
  const LucideIcon = (icons as any)[iconName];
  const align = config.align || "center";
  const iconSize = config.style_icon_size || 40;
  const iconColor = config.style_icon_color || "currentColor";
  const iconBg = config.style_icon_bg || "transparent";
  const titleColor = config.style_title_color;
  const descColor = config.style_desc_color;
  const link = config.link;

  const alignClass = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";

  const content = (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      <div
        className="inline-flex items-center justify-center rounded-xl p-3"
        style={{ backgroundColor: iconBg }}
      >
        {LucideIcon ? (
          <LucideIcon size={iconSize} color={iconColor} strokeWidth={1.5} />
        ) : (
          <span style={{ width: iconSize, height: iconSize }} />
        )}
      </div>
      {config.title && (
        <h3 className="text-lg font-semibold" style={titleColor ? { color: titleColor } : undefined}>
          {config.title}
        </h3>
      )}
      {config.description && (
        <p className="text-sm text-muted-foreground" style={descColor ? { color: descColor } : undefined}>
          {config.description}
        </p>
      )}
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}
