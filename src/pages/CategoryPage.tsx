import { useState, useMemo, useCallback } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, SlidersHorizontal, Grid3X3, Grid2X2, X, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontFilters } from '@/components/StorefrontFilters';
import { useProductsByCategory } from '@/hooks/usePublicProducts';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { usePublicFilters, applyFilters } from '@/hooks/usePublicFilters';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'discount' | 'newest';

export default function CategoryPage() {
  const { category, subcategory } = useParams<{ category: string; subcategory?: string }>();
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [gridSize, setGridSize] = useState<2 | 4>(4);

  const activeSlug = subcategory || category;
  const { data: rawProducts = [], isLoading } = useProductsByCategory(activeSlug);
  const { data: allCategories = [] } = usePublicCategories();

  const currentCategory = allCategories.find(c => c.slug === category);
  const childCategories = allCategories.filter(c => c.parent_id === currentCategory?.id);
  const currentSubcategory = subcategory ? allCategories.find(c => c.slug === subcategory) : null;

  const { data: filters = [] } = usePublicFilters(currentCategory?.id);

  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: values }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setPriceRange([0, 50000]);
  }, []);

  const activeFilterCount = Object.values(activeFilters).filter(v => v.length > 0).length +
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let result = applyFilters(rawProducts, filters, activeFilters, priceRange);
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'discount': result.sort((a, b) => {
        const dA = a.compare_at_price ? ((a.compare_at_price - a.price) / a.compare_at_price) * 100 : 0;
        const dB = b.compare_at_price ? ((b.compare_at_price - b.price) / b.compare_at_price) * 100 : 0;
        return dB - dA;
      }); break;
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [rawProducts, filters, activeFilters, priceRange, sortBy]);

  const pageTitle = currentSubcategory?.name || currentCategory?.name || 'Todos os Produtos';

  useDocumentHead({
    title: `${pageTitle} | Loja`,
    description: currentCategory?.description || `Confira os produtos de ${pageTitle}`,
  });

  const filterSidebar = (
    <div className="space-y-6">
      <h3 className="font-semibold text-sm">Filtros</h3>
      {childCategories.length > 0 && (
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase tracking-wider text-muted-foreground">Subcategorias</h4>
          <ul className="space-y-1.5">
            {childCategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  to={`/categoria/${category}/${sub.slug}`}
                  className={`text-sm hover:text-primary transition-colors block py-1 ${
                    subcategory === sub.slug ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <StorefrontFilters
        filters={filters}
        products={rawProducts}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
      />
      {activeFilterCount > 0 && (
        <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
          Limpar todos os filtros ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="bg-secondary/50">
          <div className="container-shop py-2.5 sm:py-3">
            <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
              <Link to="/" className="hover:text-primary transition-colors flex-shrink-0">Home</Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              {currentCategory && (
                <>
                  <Link to={`/categoria/${currentCategory.slug}`} className="hover:text-primary transition-colors flex-shrink-0">
                    {currentCategory.name}
                  </Link>
                  {currentSubcategory && (
                    <>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-foreground">{currentSubcategory.name}</span>
                    </>
                  )}
                </>
              )}
              {!currentCategory && <span className="text-foreground">Todos os Produtos</span>}
            </nav>
          </div>
        </div>

        {/* Category header */}
        <div className="container-shop pt-6 sm:pt-8 pb-4 sm:pb-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            {pageTitle}
          </motion.h1>
          {currentCategory?.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{currentCategory.description}</p>
          )}
        </div>

        {/* Toolbar */}
        <div className="container-shop pb-4 sm:pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
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
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isLoading ? '...' : `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-border rounded-xl bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="relevance">Relevância</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="discount">Maior desconto</option>
                <option value="newest">Novidades</option>
              </select>

              <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
                <button onClick={() => setGridSize(4)} className={`p-2 transition-colors ${gridSize === 4 ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setGridSize(2)} className={`p-2 transition-colors ${gridSize === 2 ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                  <Grid2X2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container-shop pb-10 sm:pb-12">
          <div className="flex gap-6 lg:gap-8">
            {/* Sidebar filters - desktop */}
            <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
              <div className="sticky top-24">
                {filterSidebar}
              </div>
            </aside>

            {/* Mobile filters drawer */}
            {showFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowFilters(false)}>
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute left-0 top-0 h-full w-[85vw] max-w-xs bg-card p-5 overflow-y-auto safe-bottom">
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

            {/* Products grid */}
            <div className="flex-grow min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4 text-sm">Nenhum produto encontrado</p>
                  <button onClick={clearAllFilters} className="text-primary hover:underline text-sm">Limpar filtros</button>
                </div>
              ) : (
                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
                  gridSize === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {filteredProducts.map((product, index) => (
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
