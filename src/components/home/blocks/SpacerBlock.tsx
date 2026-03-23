interface SpacerBlockProps {
  config: { height?: number };
}

export function SpacerBlock({ config }: SpacerBlockProps) {
  return <div style={{ height: `${config.height || 40}px` }} />;
}
