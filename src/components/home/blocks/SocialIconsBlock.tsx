import { Facebook, Instagram, Youtube, Twitter, Linkedin, MessageCircle, Music2, Pin } from "lucide-react";

const SOCIAL_ICONS: Record<string, { icon: any; label: string }> = {
  facebook: { icon: Facebook, label: "Facebook" },
  instagram: { icon: Instagram, label: "Instagram" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  youtube: { icon: Youtube, label: "YouTube" },
  tiktok: { icon: Music2, label: "TikTok" },
  twitter: { icon: Twitter, label: "X / Twitter" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  pinterest: { icon: Pin, label: "Pinterest" },
};

interface SocialIconsBlockProps {
  config: Record<string, any>;
}

export function SocialIconsBlock({ config }: SocialIconsBlockProps) {
  const items: { platform: string; url: string }[] = config.items || [];
  const format = config.format || "icon";
  const size = config.style_size || 24;
  const color = config.style_color || "currentColor";
  const gap = config.style_gap || 16;
  const align = config.align || "center";

  const justifyClass = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <div className={`flex flex-wrap ${justifyClass}`} style={{ gap: `${gap}px` }}>
      {items.map((item, idx) => {
        const social = SOCIAL_ICONS[item.platform];
        if (!social || !item.url) return null;
        const Icon = social.icon;
        return (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color }}
          >
            <Icon size={size} />
            {format === "icon_text" && <span className="text-sm font-medium">{social.label}</span>}
          </a>
        );
      })}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma rede social configurada</p>
      )}
    </div>
  );
}
