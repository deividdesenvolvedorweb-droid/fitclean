interface ButtonBlockProps {
  config: Record<string, any>;
}

export function ButtonBlock({ config }: ButtonBlockProps) {
  const align = config.align === "left" ? "text-left" : config.align === "right" ? "text-right" : "text-center";
  const variant = config.variant || "filled";
  const size = config.size || "md";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-10 py-5 text-xl",
  }[size] || "px-6 py-3 text-base";

  const baseStyle: React.CSSProperties = {
    borderRadius: config.border_radius != null ? `${config.border_radius}px` : "8px",
    fontWeight: config.font_weight || 600,
  };

  if (variant === "filled") {
    baseStyle.backgroundColor = config.bg_color || "hsl(var(--primary))";
    baseStyle.color = config.text_color || "hsl(var(--primary-foreground))";
  } else if (variant === "outline") {
    baseStyle.backgroundColor = "transparent";
    baseStyle.color = config.text_color || "hsl(var(--primary))";
    baseStyle.border = `2px solid ${config.border_color || config.text_color || "hsl(var(--primary))"}`;
  } else {
    baseStyle.backgroundColor = "transparent";
    baseStyle.color = config.text_color || "hsl(var(--primary))";
  }

  const Tag = config.link ? "a" : "span";
  const linkProps = config.link ? { href: config.link, target: config.new_tab ? "_blank" : undefined, rel: config.new_tab ? "noopener noreferrer" : undefined } : {};

  return (
    <div className={`py-4 ${align}`}>
      <Tag
        {...linkProps}
        className={`inline-block ${sizeClasses} transition-all hover:opacity-90 cursor-pointer`}
        style={baseStyle}
      >
        {config.text || "Botão"}
      </Tag>
    </div>
  );
}
