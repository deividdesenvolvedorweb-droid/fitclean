import { useState, useMemo, useCallback } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2, Grid3X3, Grid2X2, SlidersHorizontal, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontFilters } from '@/components/StorefrontFilters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePublicFilters, applyFilters } from '@/hooks/usePublicFilters';
import type { Tables } from '@/integrations/supabase/types';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [gridSize, setGridSize] = useState<2 | 4>(4);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  useDocumentHead({
    title: query ? `Busca: "${query}" | Loja` : 'Buscar Produtos | Loja',
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const sanitized = query.replace(/[%_(),"{}]/g, '');
      if (!sanitized.trim()) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
        .limit(50);
      if (error) throw error;
      return data as Tables<'products'>[];
    },
    enabled: !!query.trim(),
  });

  const { data: filters = [] } = usePublicFilters();

  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: values }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setPriceRange([0, 50000]);
  }, []);

  const activeFilterCount = Object.values(activeFilters).filter(v => v.length > 0).length +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0);

  const sorted = useMemo(() => {
    let result = applyFilters(products, filters, activeFilters, priceRange);
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [products, filters, activeFilters, priceRange, sortBy]);

  const filterSidebar = (
    <StorefrontFilters
      filters={filters}
      products={products}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      priceRange={priceRange}
      onPriceRangeChange={setPriceRange}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-grow">
        <div className="container-shop py-6 sm:py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {query ? `Resultados para "${query}"` : 'Buscar Produtos'}
            </h1>
            {!isLoading && query && (
              <p className="text-sm text-muted-foreground mb-5 sm:mb-6">
                {sorted.length} produto{sorted.length !== 1 ? 's' : ''} encontrado{sorted.length !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>

          {products.length > 0 && (
            <div className="flex items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-border mb-5 sm:mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl hover:bg-secondary transition-colors text-sm lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="px-3 py-2 border border-border rounded-xl bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="relevance">Relevância</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="newest">Novidades</option>
                </select>
              </div>
              <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
                <button onClick={() => setGridSize(4)} className={`p-2 transition-colors ${gridSize === 4 ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setGridSize(2)} className={`p-2 transition-colors ${gridSize === 2 ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}><Grid2X2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div className="flex gap-6 lg:gap-8">
            {/* Desktop sidebar */}
            {products.length > 0 && (
              <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <h3 className="font-semibold text-sm mb-4">Filtros</h3>
                  {filterSidebar}
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-xs text-primary hover:underline mt-4">
                      Limpar todos os filtros ({activeFilterCount})
                    </button>
                  )}
                </div>
              </aside>
            )}

            {/* Mobile filters drawer */}
            {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowFilters(false)}>
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute left-0 top-0 h-full w-[85vw] max-w-xs bg-card p-5 overflow-y-auto">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold">Filtros</h3>
                    <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-secondary rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                  {filterSidebar}
                  <button onClick={() => setShowFilters(false)} className="w-full mt-6 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
                    Aplicar filtros
                  </button>
                </motion.div>
              </motion.div>
            )}

            {/* Products */}
            <div className="flex-grow min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !query ? (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Digite algo para buscar produtos</p>
                </div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhum produto encontrado</p>
                  <p className="text-sm text-muted-foreground mb-4">Tente buscar por outros termos</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} className="text-primary hover:underline text-sm mb-2 block mx-auto">Limpar filtros</button>
                  )}
                  <Link to="/" className="text-primary hover:underline text-sm">Voltar para a loja</Link>
                </div>
              ) : (
                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
                  gridSize === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {sorted.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
