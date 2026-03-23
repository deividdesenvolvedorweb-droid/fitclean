import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/lib/data';
import { useCart } from '@/contexts/CartContext';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { usePublicPaymentSettings, calculateInstallmentValue } from '@/hooks/usePublicPaymentSettings';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

export interface ProductStyleOverrides {
  cardBg?: string;
  nameColor?: string;
  priceColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  freeShippingColor?: string;
  discountBgColor?: string;
  discountTextColor?: string;
}

interface ProductCardProps {
  product: Tables<"products">;
  index?: number;
  styleOverrides?: ProductStyleOverrides;
}

export function ProductCard({ product, index = 0, styleOverrides }: ProductCardProps) {
  const { addItem } = useCart();
  const { data: settings } = usePublicStoreSettings();
  const { data: globalPaymentSettings } = usePublicPaymentSettings();
  const maxInstallments = settings?.max_installments || 12;
  
  const hasVariants = (product as any).has_variants === true;
  const minVariantPrice = (product as any).min_variant_price;
  const maxVariantPrice = (product as any).max_variant_price;
  
  const displayPrice = hasVariants && minVariantPrice != null ? minVariantPrice : product.price;
  const comparePrice = product.compare_at_price;
  const discount = calculateDiscount(displayPrice, comparePrice ?? undefined);
  const isOutOfStock = product.stock <= 0 && !product.unlimited_stock && !product.allow_backorder && !product.is_digital;
  const hasFreeShipping = product.free_shipping;
  const showPriceRange = hasVariants && minVariantPrice != null && maxVariantPrice != null && minVariantPrice !== maxVariantPrice;
  
  const images = product.images ?? [];
  const mainImage = images[0] || '/placeholder.svg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="product-card group relative flex flex-col"
      style={styleOverrides?.cardBg ? { backgroundColor: styleOverrides.cardBg } : undefined}
    >
      {/* Image container */}
      <Link to={`/produto/${product.slug}`} className="relative overflow-hidden aspect-square">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className={cn(
            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            isOutOfStock && "opacity-50 grayscale"
          )}
        />
        
        {/* Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span
              className="badge-discount text-[10px] sm:text-xs"
              style={
                styleOverrides?.discountBgColor || styleOverrides?.discountTextColor
                  ? {
                      backgroundColor: styleOverrides.discountBgColor || undefined,
                      color: styleOverrides.discountTextColor || undefined,
                    }
                  : undefined
              }
            >
              -{discount}%
            </span>
          )}
          {hasFreeShipping && !isOutOfStock && (
            <span
              className="badge-free-shipping text-[10px] sm:text-xs"
              style={styleOverrides?.freeShippingColor ? { color: styleOverrides.freeShippingColor } : undefined}
            >
              Frete grátis
            </span>
          )}
          {isOutOfStock && (
            <span className="badge-sold-out text-[10px] sm:text-xs">Esgotado</span>
          )}
        </div>

        {/* Quick view - desktop only */}
        {!isOutOfStock && (
          <div className="absolute bottom-3 right-3 hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/produto/${product.slug}`}
              className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link to={`/produto/${product.slug}`}>
          <h3
            className="font-medium text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors mb-1.5 sm:mb-2 leading-snug"
            style={styleOverrides?.nameColor ? { color: styleOverrides.nameColor } : undefined}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto">
          {showPriceRange ? (
            <div className="mb-1.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">A partir de</p>
              <span className="price-current text-sm sm:text-lg" style={styleOverrides?.priceColor ? { color: styleOverrides.priceColor } : undefined}>
                {formatPrice(minVariantPrice)}
              </span>
            </div>
          ) : comparePrice && comparePrice > displayPrice ? (
            <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1.5">
              <span className="price-original text-[10px] sm:text-sm">{formatPrice(comparePrice)}</span>
              <span className="price-sale text-sm sm:text-lg" style={styleOverrides?.priceColor ? { color: styleOverrides.priceColor } : undefined}>{formatPrice(displayPrice)}</span>
            </div>
          ) : (
            <p className="price-current text-sm sm:text-lg mb-1.5" style={styleOverrides?.priceColor ? { color: styleOverrides.priceColor } : undefined}>{formatPrice(displayPrice)}</p>
          )}

          {(() => {
            const installmentType = globalPaymentSettings?.installment_type ?? "sem_juros";
            const interestRate = globalPaymentSettings?.installment_interest_rate ?? 1.99;
            const instValue = calculateInstallmentValue(displayPrice, maxInstallments, installmentType, interestRate);
            return (
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                ou {maxInstallments}x de {formatPrice(instValue)}
                {installmentType === "sem_juros" ? " s/ juros" : ""}
              </p>
            );
          })()}

          {hasVariants ? (
            <Link
              to={`/produto/${product.slug}`}
              className={cn(
                "w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5",
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              )}
              style={!isOutOfStock && styleOverrides?.buttonColor ? {
                backgroundColor: styleOverrides.buttonColor,
                color: styleOverrides.buttonTextColor || '#ffffff',
              } : undefined}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOutOfStock ? "Esgotado" : "Ver Opções"}
            </Link>
          ) : (
            <button
              onClick={() => !isOutOfStock && addItem(product)}
              disabled={isOutOfStock}
              className={cn(
                "w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5",
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              )}
              style={!isOutOfStock && styleOverrides?.buttonColor ? {
                backgroundColor: styleOverrides.buttonColor,
                color: styleOverrides.buttonTextColor || '#ffffff',
              } : undefined}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isOutOfStock ? "Esgotado" : "Comprar"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
