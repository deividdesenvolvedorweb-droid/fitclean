import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { useFilteredProducts } from "@/hooks/usePublicProducts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsBlockProps {
  config: Record<string, any>;
}

export function ProductsBlock({ config }: ProductsBlockProps) {
  const { data: products = [], isLoading } = useFilteredProducts(config);

  const styleOverrides = {
    cardBg: config.style_card_bg,
    nameColor: config.style_name_color,
    priceColor: config.style_price_color,
    buttonColor: config.style_button_color,
    buttonTextColor: config.style_button_text_color,
    freeShippingColor: config.style_free_shipping_color,
    discountBgColor: config.style_discount_bg_color,
    discountTextColor: config.style_discount_text_color,
  };

  const hasOverrides = Object.values(styleOverrides).some(Boolean);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="container-shop py-12 lg:py-16">
      {(config.title || config.subtitle) && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          {config.title && <h2 className="font-display text-2xl lg:text-3xl font-bold mb-2">{config.title}</h2>}
          {config.subtitle && <p className="text-muted-foreground">{config.subtitle}</p>}
        </motion.div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)
          : products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              styleOverrides={hasOverrides ? styleOverrides : undefined}
            />
          ))
        }
      </div>
    </section>
  );
}
