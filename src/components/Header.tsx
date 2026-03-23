import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useCategoriesWithChildren } from '@/hooks/usePublicCategories';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import logoImage from '@/assets/logo.png';

export function Header() {
  const navigate = useNavigate();
  const { itemCount, openCart } = useCart();
  const { parentCategories, getChildren, isLoading: categoriesLoading } = useCategoriesWithChildren();
  const { data: settings, isLoading: settingsLoading } = usePublicStoreSettings();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  const storeName = settings?.store_name || 'Loja';
  const announcementText = settings?.announcement_text || '';
  const announcementActive = settings?.announcement_active ?? true;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      {announcementActive && announcementText && (
        <div className="bg-primary text-primary-foreground py-2 text-center text-xs sm:text-sm font-medium">
          <div className="container-shop">
            <span>🎉 {announcementText}</span>
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="glass shadow-sm">
        <div className="container-shop">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 hover:bg-secondary rounded-xl transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              {settingsLoading ? (
                <Skeleton className="h-8 sm:h-10 w-24 sm:w-32" />
              ) : (
                <img 
                  src={settings?.store_logo || logoImage} 
                  alt={storeName} 
                  className="h-8 sm:h-10 object-contain" 
                />
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {categoriesLoading ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-20" />
                  ))}
                </div>
              ) : (
                parentCategories.map((category) => {
                  const children = getChildren(category.id);
                  return (
                    <div
                      key={category.id}
                      className="relative group"
                      onMouseEnter={() => setActiveMegaMenu(category.id)}
                      onMouseLeave={() => setActiveMegaMenu(null)}
                    >
                      <Link
                        to={`/categoria/${category.slug}`}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-lg",
                          activeMegaMenu === category.id && "text-primary bg-primary/5"
                        )}
                      >
                        {category.name}
                        {children.length > 0 && <ChevronDown className="w-3.5 h-3.5" />}
                      </Link>
                      
                      {children.length > 0 && (
                        <AnimatePresence>
                          {activeMegaMenu === category.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 w-56 glass rounded-xl shadow-lg p-2 z-50 mt-1"
                            >
                              {children.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/categoria/${category.slug}/${sub.slug}`}
                                  className="block px-3 py-2.5 text-sm text-foreground/80 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  );
                })
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop search */}
              <div className="hidden sm:block relative">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.form
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden"
                      onSubmit={handleSearch}
                    >
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 px-4 pr-10 border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                        autoFocus
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors relative z-10"
                  aria-label="Buscar"
                >
                  {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              {/* Mobile search */}
              <button
                onClick={() => { setSearchOpen(!searchOpen); setIsMobileMenuOpen(false); }}
                className="sm:hidden p-2 hover:bg-secondary rounded-xl transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                to="/conta"
                className="hidden sm:flex p-2 hover:bg-secondary rounded-xl transition-colors"
                aria-label="Minha conta"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 hover:bg-secondary rounded-xl transition-colors"
                aria-label="Carrinho"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden overflow-hidden bg-card border-b border-border"
          >
            <form onSubmit={handleSearch} className="container-shop py-3">
              <input
                type="text"
                placeholder="O que você está buscando?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-[85vw] max-w-xs bg-card z-50 lg:hidden shadow-2xl overflow-y-auto safe-bottom"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <img 
                  src={settings?.store_logo || logoImage} 
                  alt={storeName} 
                  className="h-8 object-contain" 
                />
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-secondary rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {parentCategories.map((category) => {
                  const children = getChildren(category.id);
                  const isExpanded = expandedMobileCategory === category.id;
                  return (
                    <div key={category.id}>
                      <div className="flex items-center">
                        <Link
                          to={`/categoria/${category.slug}`}
                          className="flex-1 px-3 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                        {children.length > 0 && (
                          <button
                            onClick={() => setExpandedMobileCategory(isExpanded ? null : category.id)}
                            className="p-3 hover:bg-secondary rounded-lg"
                          >
                            <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {isExpanded && children.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-3"
                          >
                            {children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/categoria/${category.slug}/${sub.slug}`}
                                className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-border mt-2">
                <Link
                  to="/conta"
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Minha Conta
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
