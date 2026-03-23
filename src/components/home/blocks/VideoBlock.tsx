import { motion } from "framer-motion";
import { VideoOff } from "lucide-react";
import { buildBlockStyle, buildBlockClasses } from "@/lib/blockStyles";

interface VideoBlockProps {
  config: Record<string, any>;
}

function getEmbedUrl(url: string, autoplay: boolean, loop: boolean, muted: boolean): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) {
    const params = new URLSearchParams();
    if (autoplay) params.set("autoplay", "1");
    if (loop) { params.set("loop", "1"); params.set("playlist", ytMatch[1]); }
    if (muted) params.set("mute", "1");
    return `https://www.youtube.com/embed/${ytMatch[1]}?${params.toString()}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    const params = new URLSearchParams();
    if (autoplay) params.set("autoplay", "1");
    if (loop) params.set("loop", "1");
    if (muted) params.set("muted", "1");
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
  }

  return null;
}

export function VideoBlock({ config }: VideoBlockProps) {
  const url = config.video_url || "";
  const autoplay = config.autoplay || false;
  const loop = config.loop || false;
  const muted = config.muted ?? true;
  const aspectRatio = config.aspect_ratio || "16/9";
  const fullWidth = config.full_width || false;

  const blockStyle = buildBlockStyle(config);
  const blockClasses = buildBlockClasses(config);

  if (!url) {
    return (
      <section className={`${fullWidth ? "w-full" : "container-shop"} py-8 ${blockClasses}`} style={blockStyle}>
        <div className="flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed border-border rounded-2xl py-16">
          <VideoOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum vídeo selecionado</p>
        </div>
      </section>
    );
  }

  const embedUrl = getEmbedUrl(url, autoplay, loop, muted);
  const isDirectVideo = !embedUrl && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg"));

  return (
    <section className={`${fullWidth ? "w-full" : "container-shop"} py-8 ${blockClasses}`} style={blockStyle}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-2xl overflow-hidden" style={{ aspectRatio }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title="Video"
          />
        ) : isDirectVideo ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            controls={!autoplay}
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/50 border-2 border-dashed border-border">
            <VideoOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">URL de vídeo inválida</p>
          </div>
        )}
      </motion.div>
    </section>
  );
}
