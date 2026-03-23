import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselBlockProps {
  config: Record<string, any>;
}

export function ImageCarouselBlock({ config }: ImageCarouselBlockProps) {
  const images: string[] = config.images || [];
  const autoplay = config.autoplay || false;
  const interval = config.interval || 3000;
  const loop = config.loop ?? true;
  const showArrows = config.show_arrows ?? true;
  const showDots = config.show_dots ?? true;
  const height = config.style_height || 400;
  const borderRadius = config.style_border_radius || 8;
  const arrowColor = config.style_arrow_color || "#ffffff";
  const dotColor = config.style_dot_color || "#ffffff";

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop });
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

  useEffect(() => {
    if (!autoplay || !emblaApi) return;
    const timer = setInterval(() => emblaApi.scrollNext(), interval);
    return () => clearInterval(timer);
  }, [autoplay, interval, emblaApi]);

  if (images.length === 0) {
    return <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}><p className="text-sm text-muted-foreground">Nenhuma imagem no carrossel</p></div>;
  }

  return (
    <div className="relative group" style={{ borderRadius }}>
      <div className="overflow-hidden" ref={emblaRef} style={{ borderRadius }}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <img src={src} alt={`Slide ${i + 1}`} className="w-full object-cover" style={{ height, borderRadius }} />
            </div>
          ))}
        </div>
      </div>

      {showArrows && images.length > 1 && (
        <>
          <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100" style={{ color: arrowColor }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100" style={{ color: arrowColor }}>
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                backgroundColor: i === selectedIndex ? dotColor : `${dotColor}66`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
