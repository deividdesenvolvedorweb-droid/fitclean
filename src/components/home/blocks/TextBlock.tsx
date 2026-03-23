import { motion } from "framer-motion";

interface TextBlockProps {
  config: { title?: string; subtitle?: string; description?: string; align?: string };
}

export function TextBlock({ config }: TextBlockProps) {
  const align = config.align === "left" ? "text-left" : config.align === "right" ? "text-right" : "text-center";

  return (
    <section className="container-shop py-12 lg:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={align}>
        {config.title && <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">{config.title}</h2>}
        {config.subtitle && <p className="text-lg text-muted-foreground mb-4">{config.subtitle}</p>}
        {config.description && <p className="text-foreground max-w-3xl mx-auto">{config.description}</p>}
      </motion.div>
    </section>
  );
}
