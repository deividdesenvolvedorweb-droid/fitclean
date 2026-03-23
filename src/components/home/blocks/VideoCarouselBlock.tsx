import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface VideoCarouselBlockProps {
  config: Record<string, any>;
}

function getEmbedUrl(url: string, autoplay: boolean, muted: boolean, loop: boolean): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`;
  return null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm)$/i.test(url);
}

export function VideoCarouselBlock({ config }: VideoCarouselBlockProps) {
  const videos: string[] = config.videos || [];
  const autoplay = config.autoplay || false;
  const muted = config.muted ?? true;
  const loop = config.loop ?? true;
  const height = config.style_height || 400;
  const controlColor = config.style_control_color || "#ffffff";

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (videos.length === 0) {
    return <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}><p className="text-sm text-muted-foreground">Nenhum vídeo no carrossel</p></div>;
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {videos.map((url, i) => {
            const embedUrl = getEmbedUrl(url, autoplay, muted, loop);
            const isDirect = isDirectVideo(url);
            return (
              <div key={i} className="flex-[0_0_100%] min-w-0">
                {isDirect ? (
                  <video src={url} controls autoPlay={autoplay} muted={muted} loop={loop} className="w-full object-cover rounded-lg" style={{ height }} />
                ) : embedUrl ? (
                  <iframe src={embedUrl} className="w-full rounded-lg" style={{ height, border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
                ) : (
                  <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}>
                    <p className="text-sm text-muted-foreground">URL inválida</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {videos.length > 1 && (
        <>
          <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100" style={{ color: controlColor }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100" style={{ color: controlColor }}>
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
