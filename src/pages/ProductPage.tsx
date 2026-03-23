import { useState, useEffect } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Minus, Plus, ShoppingCart, Shield, CreditCard,
  Check, Loader2, Truck, Package, Zap, Award,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { BlockRenderer } from '@/components/home/BlockRenderer';
import { useProductBySlug, useRelatedProducts } from '@/hooks/usePublicProducts';
import { formatPrice, calculateDiscount } from '@/lib/data';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { usePublicPaymentSettings, calculateInstallmentValue } from '@/hooks/usePublicPaymentSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  image_url: string | null;
  active: boolean;
}

// ─── Gallery ────────────────────────────────────────────────────────────────
function ProductGallery({
  images, mainImage, activeImage, setActiveImage, discount, isDigital, name,
}: {
  images: string[]; mainImage: string; activeImage: number;
  setActiveImage: (i: number) => void; discount: number; isDigital: boolean; name: string;
}) {
  return (
    <div className="lg:sticky lg:top-24 space-y-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border/40">
        <AnimatePresence mode="wait">
          <motion.img
            key={mainImage}
            src={mainImage}
            alt={name}
            className="w-full h-full object-contain"
            loading="lazy"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="badge-discount text-xs">-{discount}%</span>
          )}
          {isDigital && (
            <Badge className="bg-accent text-accent-foreground text-[10px]">Digital</Badge>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeImage === i
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border/40 hover:border-border'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProductBySlug(slug);
  const { data: relatedProducts = [] } = useRelatedProducts(product?.category_id, product?.id);
  const { addItem } = useCart();
  const { data: storeSettings } = usePublicStoreSettings();
  const { data: globalPaymentSettings } = usePublicPaymentSettings();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product!.id)
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return data.map(v => ({
        ...v,
        attributes: v.attributes as Record<string, string>,
      })) as unknown as ProductVariant[];
    },
    enabled: !!product?.id,
  });

  const productPaymentConfig = product?.payment_config as Record<string, any> | null;
  const variantPaymentConfig = selectedVariant ? (selectedVariant as any).payment_config as Record<string, any> | null : null;
  // Variant payment config overrides product payment config
  const paymentConfig = variantPaymentConfig || productPaymentConfig;

  const attributeOptions = variants.length > 0
    ? Object.keys(variants[0].attributes).reduce((acc, key) => {
        acc[key] = [...new Set(variants.map(v => v.attributes[key]).filter(Boolean))];
        return acc;
      }, {} as Record<string, string[]>)
    : {};

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (variants.length > 0 && !selectedVariant) {
      setSelectedVariant(variants[0]);
      setSelectedAttributes(variants[0].attributes);
    }
  }, [variants]);

  useEffect(() => {
    if (variants.length === 0) return;
    const match = variants.find(v =>
      Object.entries(selectedAttributes).every(([key, val]) => v.attributes[key] === val)
    );
    if (match) setSelectedVariant(match);
  }, [selectedAttributes, variants]);

  const handleAttributeChange = (key: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [key]: value }));
  };

  useDocumentHead({
    title: product?.seo_title || (product ? `${product.name} | Loja` : 'Carregando...'),
    description: product?.seo_description || product?.description?.slice(0, 160) || '',
    ogImage: product?.og_image || product?.images?.[0] || undefined,
    ogType: 'product',
  });

  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
    setSelectedVariant(null);
    setSelectedAttributes({});
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Produto não encontrado</h1>
            <Link to="/" className="text-primary hover:underline">Voltar para a loja</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isDigital = product.is_digital === true;
  const displayName = product.name;
  const displayDescription = product.description;
  const displayImages = product.images ?? [];
  const mainImage = selectedVariant?.image_url || displayImages[activeImage] || displayImages[0] || '/placeholder.svg';

  const effectivePrice = selectedVariant?.price ?? product.price;
  const comparePrice = selectedVariant?.compare_at_price ?? product.compare_at_price;
  const discount = calculateDiscount(effectivePrice, comparePrice ?? undefined);
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = !isDigital && effectiveStock <= 0 && !product.unlimited_stock && !product.allow_backorder;
  const categoryName = product.categories?.name || '';
  const categorySlug = product.categories?.slug || '';

  const pixEnabled = paymentConfig ? paymentConfig.pix_enabled !== false : true;
  const boletoEnabled = paymentConfig ? paymentConfig.boleto_enabled !== false : true;
  const creditCardEnabled = paymentConfig ? paymentConfig.credit_card_enabled !== false : true;
  const storeMaxInstallments = storeSettings?.max_installments || 12;
  const maxInstallments = paymentConfig?.max_installments ? Math.min(paymentConfig.max_installments, storeMaxInstallments) : storeMaxInstallments;
  const pixDiscountPercent = storeSettings?.pix_discount_percent || 5;
  const hasFreeShipping = product.free_shipping;

  // Interest config: variant > product > global
  const installmentType = paymentConfig?.installment_type ?? globalPaymentSettings?.installment_type ?? "sem_juros";
  const interestRate = paymentConfig?.installment_interest_rate ?? globalPaymentSettings?.installment_interest_rate ?? 1.99;
  const installmentValue = calculateInstallmentValue(effectivePrice, maxInstallments, installmentType, interestRate);

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      if (selectedVariant) {
        addItem(product, quantity, {
          id: selectedVariant.id,
          attributes: selectedVariant.attributes,
          price: selectedVariant.price ?? undefined,
          sku: selectedVariant.sku ?? undefined,
          stock: selectedVariant.stock,
        });
      } else {
        addItem(product, quantity);
      }
    }
  };

  const specs = product.specifications as Record<string, string> | null;
  const descBlocks = product.description_blocks;
  const hasBlocks = Array.isArray(descBlocks) && descBlocks.length > 0;
  const hasSpecs = specs && Object.keys(specs).length > 0;
  const hasDescription = hasBlocks || !!displayDescription;
  const sku = selectedVariant?.sku || product.sku;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border/40">
          <div className="container-shop py-3">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-thin">
              <Link to="/" className="hover:text-primary transition-colors">Início</Link>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              {categorySlug && (
                <>
                  <Link to={`/categoria/${categorySlug}`} className="hover:text-primary transition-colors">
                    {categoryName}
                  </Link>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                </>
              )}
              <span className="text-foreground/70 truncate max-w-[200px]">{displayName}</span>
            </nav>
          </div>
        </div>

        {/* Product Section */}
        <section className="container-shop py-6 sm:py-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
            {/* Gallery */}
            <ProductGallery
              images={displayImages}
              mainImage={mainImage}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
              discount={discount}
              isDigital={isDigital}
              name={displayName}
            />

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col"
            >
              {/* Name */}
              <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight mb-4">
                {displayName}
              </h1>

              {/* Price block */}
              <div className="mb-5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold">
                    {formatPrice(effectivePrice)}
                  </span>
                  {comparePrice && comparePrice > effectivePrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(comparePrice)}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                    {creditCardEnabled && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        {maxInstallments}x de <strong>{formatPrice(installmentValue)}</strong>
                        {installmentType === "sem_juros" ? " sem juros" : " com juros"}
                        {installmentType === "com_juros" && maxInstallments > 1 && (
                          <span className="text-[10px] text-muted-foreground/70">
                            (Total: {formatPrice(installmentValue * maxInstallments)})
                          </span>
                        )}
                      </p>
                    )}
                  {pixEnabled && (
                    <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {formatPrice(effectivePrice * (1 - pixDiscountPercent / 100))} no Pix
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-0 font-bold">
                        -{pixDiscountPercent}%
                      </Badge>
                    </p>
                  )}
                </div>
              </div>

              {/* Variant selector */}
              {Object.keys(attributeOptions).length > 0 && (
                <div className="mb-5 space-y-3">
                  {Object.entries(attributeOptions).map(([attrName, values]) => (
                    <div key={attrName}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {attrName}: <span className="normal-case">{selectedAttributes[attrName] || ''}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {values.map(val => {
                          const isSelected = selectedAttributes[attrName] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleAttributeChange(attrName, val)}
                              className={`min-w-[48px] h-10 px-4 rounded-full border text-sm font-medium transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-card hover:border-primary/40'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity & Add to cart */}
              <div className="space-y-3 mb-5">
                {!isOutOfStock ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-border rounded-full bg-card h-11">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-11 h-full flex items-center justify-center hover:bg-secondary transition-colors rounded-l-full disabled:opacity-40"
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-semibold text-sm tabular-nums select-none">{quantity}</span>
                        <button
                          onClick={() => setQuantity(isDigital || product.unlimited_stock ? quantity + 1 : Math.min(effectiveStock, quantity + 1))}
                          className="w-11 h-full flex items-center justify-center hover:bg-secondary transition-colors rounded-r-full disabled:opacity-40"
                          disabled={!isDigital && !product.unlimited_stock && quantity >= effectiveStock}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {isDigital ? (
                          <span className="flex items-center gap-1 text-accent font-medium"><Zap className="w-3 h-3" />Entrega imediata</span>
                        ) : product.unlimited_stock ? (
                          <span className="flex items-center gap-1 text-success"><Check className="w-3 h-3" />Em estoque</span>
                        ) : effectiveStock > 0 ? (
                          <span className="flex items-center gap-1 text-success"><Check className="w-3 h-3" />{effectiveStock} disponíveis</span>
                        ) : null}
                      </span>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Adicionar ao Carrinho
                    </button>
                  </>
                ) : (
                  <div className="w-full h-14 rounded-full bg-muted text-muted-foreground font-bold text-base flex items-center justify-center gap-2 cursor-not-allowed">
                    Produto esgotado
                  </div>
                )}
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Compra segura</span>
                </div>
                <div className="flex items-center gap-2 text-xs p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <Award className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Garantia de qualidade</span>
                </div>
                {hasFreeShipping && (
                  <div className="col-span-2 flex items-center gap-2 text-xs p-3 rounded-xl bg-success/5 border border-success/20">
                    <Truck className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="font-medium text-success">Frete grátis para este produto</span>
                  </div>
                )}
              </div>

              {/* Payment methods accordion */}
              <Accordion type="single" collapsible className="border border-border/40 rounded-xl overflow-hidden">
                <AccordionItem value="payment" className="border-0">
                  <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline hover:bg-secondary/30 transition-colors">
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Formas de pagamento
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2.5 text-xs text-muted-foreground">
                      {pixEnabled && (
                        <div className="flex items-center gap-2.5">
                          <Zap className="w-4 h-4 text-success" />
                          <span>Pix com <strong className="text-success">{pixDiscountPercent}% de desconto</strong></span>
                        </div>
                      )}
                      {creditCardEnabled && (
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span>Cartão em até <strong>{maxInstallments}x sem juros</strong></span>
                        </div>
                      )}
                      {boletoEnabled && (
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>Boleto bancário</span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {sku && (
                <p className="text-[10px] text-muted-foreground mt-4">SKU: {sku}</p>
              )}
            </motion.div>
          </div>
        </section>

        {/* Description / Specs Tabs */}
        {(hasDescription || hasSpecs) && (
          <section className="border-t border-border/40">
            <div className="container-shop py-8 sm:py-12">
              <Tabs defaultValue={hasDescription ? "description" : "specs"} className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-auto p-0 gap-0">
                  {hasDescription && (
                    <TabsTrigger
                      value="description"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 sm:px-6 py-3 text-sm font-semibold"
                    >
                      Descrição
                    </TabsTrigger>
                  )}
                  {hasSpecs && (
                    <TabsTrigger
                      value="specs"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 sm:px-6 py-3 text-sm font-semibold"
                    >
                      Especificações
                    </TabsTrigger>
                  )}
                </TabsList>

                {hasDescription && (
                  <TabsContent value="description" className="mt-6">
                    {hasBlocks ? (
                      <div className="max-w-4xl overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_iframe]:max-w-full [&_.container-shop]:!max-w-none [&_.container-shop]:!px-0 [&_.container-shop]:!mx-0 [&_section]:!py-3 [&_section]:!px-0">
                        {(descBlocks as any[]).map((block: any, idx: number) => (
                          <BlockRenderer key={idx} block={{ id: `desc-${idx}`, type: block.type, config: block.config || {} }} />
                        ))}
                      </div>
                    ) : displayDescription ? (
                      <div className="max-w-3xl">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed break-words whitespace-pre-line">
                          {displayDescription}
                        </p>
                      </div>
                    ) : null}
                  </TabsContent>
                )}

                {hasSpecs && (
                  <TabsContent value="specs" className="mt-6">
                    <div className="max-w-2xl rounded-xl border border-border overflow-hidden">
                      {Object.entries(specs!).map(([key, value], i) => (
                        <div
                          key={key}
                          className={`flex justify-between py-3 px-4 text-sm ${
                            i % 2 === 0 ? 'bg-secondary/30' : 'bg-card'
                          }`}
                        >
                          <dt className="text-muted-foreground">{key}</dt>
                          <dd className="font-semibold text-right">{value}</dd>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border/40 bg-secondary/20 py-10 sm:py-14">
            <div className="container-shop">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Você também pode gostar</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {relatedProducts.map((p, index) => (
                  <ProductCard key={p.id} product={p} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
