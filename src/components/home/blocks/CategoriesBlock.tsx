import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCategoriesWithChildren } from "@/hooks/usePublicCategories";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoriesBlockProps {
  config: { title?: string; subtitle?: string; max?: number };
}

export function CategoriesBlock({ config }: CategoriesBlockProps) {
  const { parentCategories, isLoading } = useCategoriesWithChildren();
  const max = config.max || 6;

  return (
    <section className="container-shop py-12 lg:py-16">
      {(config.title || config.subtitle) && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          {config.title && <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">{config.title}</h2>}
          {config.subtitle && <p className="text-muted-foreground">{config.subtitle}</p>}
        </motion.div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading
          ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
          : parentCategories.slice(0, max).map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={`/categoria/${cat.slug}`} className="group block relative h-48 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <h3 className="font-display text-xl lg:text-2xl font-bold mb-2">{cat.name}</h3>
                    <span className="text-sm opacity-80 group-hover:opacity-100 flex items-center gap-1">Ver produtos <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>
              </motion.div>
            ))
        }
      </div>
    </section>
  );
}
