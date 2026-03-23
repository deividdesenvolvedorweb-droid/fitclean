import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { BlockRenderer } from '@/components/home/BlockRenderer';
import { useCategoriesWithChildren } from '@/hooks/usePublicCategories';
import { usePublicBanners } from '@/hooks/usePublicBanners';
import { useFeaturedProducts, useBestsellerProducts, useDiscountedProducts } from '@/hooks/usePublicProducts';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { usePublicHomeBlocks } from '@/hooks/usePublicHomeBlocks';
import { useState, useEffect, useCallback } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { Skeleton } from '@/components/ui/skeleton';

function FallbackHome() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: banners = [], isLoading: bannersLoading } = usePublicBanners("home_slider");
  const { parentCategories, isLoading: categoriesLoading } = useCategoriesWithChildren();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts(8);
  const { data: bestsellerProducts = [], isLoading: bestsellersLoading } = useBestsellerProducts(8);
  const { data: discountedProducts = [], isLoading: discountedLoading } = useDiscountedProducts(4);
  const { data: settings } = usePublicStoreSettings();

  const maxInstallments = settings?.max_installments || 12;
  const pixDiscount = Number(settings?.pix_discount_percent) || 5;

  const nextBanner = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextBanner]);

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="relative h-[50vh] min-h-[280px] sm:h-[55vh] lg:h-[65vh] lg:max-h-[600px]">
          {bannersLoading ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : banners.length > 0 ? (
            banners.map((banner, index) => (
              <motion.div key={banner.id} initial={false} animate={{ opacity: currentBanner === index ? 1 : 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.image_desktop})` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
                <div className="container-shop relative h-full flex items-center">
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: currentBanner === index ? 1 : 0, y: currentBanner === index ? 0 : 24 }} transition={{ duration: 0.4, delay: 0.15 }} className="max-w-lg text-background">
                    {banner.title && <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 lg:mb-4 leading-tight">{banner.title}</h2>}
                    {banner.subtitle && <p className="text-sm sm:text-base lg:text-lg mb-4 lg:mb-6 text-background/80 line-clamp-2">{banner.subtitle}</p>}
                    {banner.button_link && banner.button_text && (
                      <Link to={banner.button_link} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all hover:scale-105" style={{ backgroundColor: banner.button_bg_color || '#f97316', color: banner.button_text_color || '#ffffff' }}>
                        {banner.button_text} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <div className="text-center text-primary-foreground px-4">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl font-bold mb-3">Bem-vindo à loja</h2>
                <p className="text-sm sm:text-base opacity-80">Configure seus banners no painel administrativo</p>
              </div>
            </div>
          )}
        </div>
        {banners.length > 1 && (
          <>
            <button onClick={prevBanner} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center text-background hover:bg-card/50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextBanner} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center text-background hover:bg-card/50 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button key={index} onClick={() => setCurrentBanner(index)} className={`h-1.5 rounded-full transition-all ${currentBanner === index ? 'bg-primary w-6' : 'bg-background/40 w-1.5'}`} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Categories */}
      <section className="container-shop py-10 sm:py-14 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-10">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Departamentos</h2>
          <p className="text-sm text-muted-foreground">Explore nossas categorias de produtos</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {categoriesLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-32 sm:h-44 lg:h-48 rounded-2xl" />) : parentCategories.length > 0 ? parentCategories.slice(0,6).map((category, index) => (
            <motion.div key={category.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
              <Link to={`/categoria/${category.slug}`} className="group block relative h-32 sm:h-44 lg:h-48 rounded-2xl overflow-hidden">
                {category.image_url ? <img src={category.image_url} alt={category.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/60" />}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-background">
                  <h3 className="font-display text-sm sm:text-base lg:text-xl font-bold text-center">{category.name}</h3>
                  <span className="text-[10px] sm:text-xs mt-1 opacity-0 group-hover:opacity-80 transition-opacity flex items-center gap-1">Ver produtos <ArrowRight className="w-3 h-3" /></span>
                </div>
              </Link>
            </motion.div>
          )) : <div className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhuma categoria cadastrada.</div>}
        </div>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="bg-secondary/40 py-10 sm:py-14 lg:py-16">
          <div className="container-shop">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6 sm:mb-8">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">Destaques</h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {featuredLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-64 sm:h-80 rounded-xl" />) : featuredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellerProducts.length > 0 && (
        <section className="container-shop py-10 sm:py-14 lg:py-16">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6 sm:mb-8">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">Mais Vendidos</h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {bestsellersLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-64 sm:h-80 rounded-xl" />) : bestsellerProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* Offers */}
      {discountedProducts.length > 0 && (
        <section className="bg-secondary/40 py-10 sm:py-14 lg:py-16">
          <div className="container-shop">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center gap-3 mb-6 sm:mb-8">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold">Ofertas Especiais</h2>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {discountedLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-64 sm:h-80 rounded-xl" />) : discountedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

    </>
  );
}

export default function HomePage() {
  const { data: blocks = [], isLoading } = usePublicHomeBlocks();
  const { data: storeSettings } = usePublicStoreSettings();

  useDocumentHead({
    title: storeSettings?.meta_title || storeSettings?.store_name || 'Loja',
    description: storeSettings?.meta_description || storeSettings?.store_description || '',
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-grow">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="w-full aspect-[4/3] sm:aspect-[2/1]" />
            <div className="container-shop space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-32 sm:h-44 rounded-2xl" />)}
              </div>
            </div>
          </div>
        ) : blocks.length > 0 ? (
          blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
        ) : (
          <FallbackHome />
        )}
      </main>
      <Footer />
    </div>
  );
}
