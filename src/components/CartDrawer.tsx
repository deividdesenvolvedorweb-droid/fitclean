import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/data';

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isCartOpen, closeCart, subtotal, itemCount } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm sm:max-w-md bg-card shadow-2xl z-50 flex flex-col safe-bottom"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-display text-base sm:text-lg font-semibold">Carrinho ({itemCount})</h2>
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-secondary rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto scrollbar-thin">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <ShoppingBag className="w-14 h-14 text-muted-foreground/20 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">Seu carrinho está vazio</p>
                  <button onClick={closeCart} className="text-primary font-medium hover:underline text-sm">
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <div className="p-3 sm:p-4 space-y-3">
                  {items.map((item) => {
                    const images = item.product.images ?? [];
                    const mainImage = images[0] || '/placeholder.svg';
                    const itemPrice = item.variantPrice ?? item.product.price;
                    const itemKey = `${item.product.id}_${item.variantId || 'default'}`;
                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="flex gap-3 bg-secondary/30 rounded-xl p-2.5 sm:p-3"
                      >
                        <Link to={`/produto/${item.product.slug}`} onClick={closeCart} className="flex-shrink-0">
                          <img src={mainImage} alt={item.product.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg" />
                        </Link>
                        <div className="flex-grow min-w-0">
                          <Link to={`/produto/${item.product.slug}`} onClick={closeCart} className="font-medium text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors">
                            {item.product.name}
                          </Link>
                          {item.variantAttributes && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                          <p className="text-primary font-semibold text-xs sm:text-sm mt-1">{formatPrice(itemPrice)}</p>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                            <div className="flex items-center border border-border rounded-lg">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)} className="p-1 sm:p-1.5 hover:bg-secondary transition-colors rounded-l-lg"><Minus className="w-3 h-3" /></button>
                              <span className="px-2 sm:px-3 text-xs sm:text-sm font-medium">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)} disabled={!item.product.unlimited_stock && !item.product.is_digital && !item.product.allow_backorder && item.quantity >= (item.variantStock ?? item.product.stock)} className="p-1 sm:p-1.5 hover:bg-secondary transition-colors disabled:opacity-50 rounded-r-lg"><Plus className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => removeItem(item.product.id, item.variantId)} className="text-[10px] sm:text-xs text-destructive hover:underline">
                              Remover
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-lg sm:text-xl font-bold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  Cupons calculados no checkout
                </p>
                <Link to="/carrinho" onClick={closeCart} className="btn-buy w-full flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>Finalizar compra</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={closeCart} className="w-full py-2 text-xs sm:text-sm text-primary font-medium hover:underline">
                  Continuar comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
