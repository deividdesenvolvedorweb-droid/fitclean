import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { buildBlockStyle, buildBlockClasses } from "@/lib/blockStyles";

interface ImageBlockProps {
  config: { image_url?: string; link?: string; alt?: string; full_width?: boolean; [key: string]: any };
}

export function ImageBlock({ config }: ImageBlockProps) {
  const blockStyle = buildBlockStyle(config);
  const blockClasses = buildBlockClasses(config);

  if (!config.image_url) {
    return (
      <section className={`${config.full_width ? "w-full" : "container-shop"} py-8 ${blockClasses}`} style={blockStyle}>
        <div className="flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed border-border rounded-2xl py-16">
          <ImageOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma imagem selecionada</p>
        </div>
      </section>
    );
  }

  const img = (
    <motion.img
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      src={config.image_url}
      alt={config.alt || ""}
      className={`w-full rounded-2xl object-cover ${config.full_width ? '' : 'max-h-[500px]'}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        const parent = (e.target as HTMLImageElement).parentElement;
        if (parent) {
          parent.innerHTML = '<div class="flex flex-col items-center justify-center py-16"><svg class="h-12 w-12 text-muted-foreground/40 mb-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" y1="13.5" x2="6" y2="21"/><path d="M18 12l3-3"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg><p class="text-sm text-muted-foreground">Imagem não encontrada</p></div>';
        }
      }}
    />
  );

  const wrapper = config.full_width ? (
    <section className={`w-full ${blockClasses}`} style={blockStyle}>{config.link ? <Link to={config.link}>{img}</Link> : img}</section>
  ) : (
    <section className={`container-shop py-8 ${blockClasses}`} style={blockStyle}>{config.link ? <Link to={config.link}>{img}</Link> : img}</section>
  );

  return wrapper;
}
