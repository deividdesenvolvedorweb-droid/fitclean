interface HeadingBlockProps {
  config: Record<string, any>;
}

export function HeadingBlock({ config }: HeadingBlockProps) {
  const Tag = (config.tag || "h2") as keyof JSX.IntrinsicElements;
  const align = config.align === "left" ? "text-left" : config.align === "right" ? "text-right" : "text-center";
  const color = config.color;
  const size = config.size;

  return (
    <div className={`py-4 ${align}`}>
      <Tag
        className="font-display font-bold leading-tight"
        style={{
          color: color || undefined,
          fontSize: size ? `${size}px` : undefined,
        }}
      >
        {config.text || "Título"}
      </Tag>
      {config.subtitle && (
        <p className="text-muted-foreground mt-2" style={{ color: config.subtitle_color || undefined }}>
          {config.subtitle}
        </p>
      )}
    </div>
  );
}
