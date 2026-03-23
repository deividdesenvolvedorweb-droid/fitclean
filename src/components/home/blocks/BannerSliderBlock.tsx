import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ImageOff } from "lucide-react";
import { usePublicBanners } from "@/hooks/usePublicBanners";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function BannerSliderBlock() {
  const [current, setCurrent] = useState(0);
  const { data: banners = [], isLoading } = usePublicBanners("home_slider");

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => setCurrent((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (isLoading) return <Skeleton className="w-full aspect-[2/1]" />;

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden">
      <div className="relative aspect-[4/3] sm:aspect-[2/1]">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={false}
            animate={{ opacity: current === index ? 1 : 0, scale: current === index ? 1 : 1.1 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.image_desktop})` }} />
            {/* Clean banner - no dark overlay */}
            <div className="container-shop relative h-full flex items-end pb-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: current === index ? 1 : 0, y: current === index ? 0 : 30 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-xl"
              >
                {(banner.title || banner.subtitle || (banner.button_link && banner.button_text)) && (
                  <div className="bg-background/80 backdrop-blur-sm rounded-xl p-5 shadow-lg">
                    {banner.title && <h2 className="font-display text-2xl lg:text-4xl font-bold mb-2 text-foreground">{banner.title}</h2>}
                    {banner.subtitle && <p className="text-base lg:text-lg mb-4 text-muted-foreground">{banner.subtitle}</p>}
                    {banner.button_link && banner.button_text && (
                      <Link
                        to={banner.button_link}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                        style={{ backgroundColor: banner.button_bg_color || 'hsl(var(--primary))', color: banner.button_text_color || '#ffffff' }}
                      >
                        {banner.button_text} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-3 h-3 rounded-full transition-colors ${current === i ? 'bg-primary' : 'bg-background/50'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
