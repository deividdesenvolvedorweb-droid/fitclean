interface DividerBlockProps {
  config: Record<string, any>;
}

export function DividerBlock({ config }: DividerBlockProps) {
  const style = config.style || "solid";
  const width = config.width || 100;
  const thickness = config.thickness || 1;
  const color = config.color || "hsl(var(--border))";
  const align = config.align || "center";
  const gap = config.gap || 20;

  const alignClass = align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";

  return (
    <div style={{ paddingTop: `${gap}px`, paddingBottom: `${gap}px` }}>
      <hr
        className={alignClass}
        style={{
          width: `${width}%`,
          borderStyle: style,
          borderWidth: 0,
          borderTopWidth: `${thickness}px`,
          borderColor: color,
        }}
      />
    </div>
  );
}
