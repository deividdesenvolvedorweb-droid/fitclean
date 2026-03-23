import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ArrowLeft, ArrowRight, ShieldCheck, Truck, Tag, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/data';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { useState } from 'react';
import { usePublicStoreSettings } from '@/hooks/usePublicStoreSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { data: settings } = usePublicStoreSettings();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingLabel, setShippingLabel] = useState('');

  const freeShippingThreshold = Number(settings?.free_shipping_threshold) || 299;
  const hasFreeShipping = subtotal >= freeShippingThreshold;
  const allDigital = items.every(item => item.product.is_digital === true);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const now = new Date().toISOString();
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        toast.error('Cupom inválido ou expirado');
        return;
      }

      // Check date validity
      if (coupon.start_at && coupon.start_at > now) {
        toast.error('Este cupom ainda não está ativo');
        return;
      }
      if (coupon.end_at && coupon.end_at < now) {
        toast.error('Este cupom expirou');
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast.error('Este cupom atingiu o limite de uso');
        return;
      }

      // Check min cart value
      if (coupon.min_cart_value && subtotal < Number(coupon.min_cart_value)) {
        toast.error(`Valor mínimo do carrinho: ${formatPrice(Number(coupon.min_cart_value))}`);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = subtotal * (Number(coupon.value) / 100);
        if (coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
      } else if (coupon.type === 'fixed') {
        discount = Math.min(Number(coupon.value), subtotal);
      } else if (coupon.type === 'free_shipping') {
        // Will be applied at checkout
        discount = 0;
        toast.success('Frete grátis aplicado!');
      }

      setCouponDiscount(discount);
      setCouponApplied(true);
      if (discount > 0) toast.success(`Cupom aplicado! -${formatPrice(discount)}`);
    } catch {
      toast.error('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCalculateShipping = async () => {
    if (cep.length < 8) return;
    if (hasFreeShipping) {
      setShippingCost(0);
      setShippingLabel('Frete grátis');
      setShippingCalculated(true);
      return;
    }

    setShippingLoading(true);
    try {
      const cleanCep = cep.replace(/\D/g, '');
      const { data: rules } = await supabase
        .from('shipping_rules')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (!rules || rules.length === 0) {
        // Fallback if no rules configured
        setShippingCost(0);
        setShippingLabel('Frete a calcular no checkout');
        setShippingCalculated(true);
        return;
      }

      // Find matching rule by ZIP range
      const matched = rules.find(r => {
        const minZip = r.min_zip || '00000000';
        const maxZip = r.max_zip || '99999999';
        return cleanCep >= minZip && cleanCep <= maxZip;
      });

      if (matched) {
        const cost = matched.free_above && subtotal >= Number(matched.free_above) ? 0 : Number(matched.price);
        setShippingCost(cost);
        setShippingLabel(cost === 0 ? 'Frete grátis' : matched.name);
        setShippingCalculated(true);
      } else {
        // Use first rule as default
        setShippingCost(Number(rules[0].price));
        setShippingLabel(rules[0].name);
        setShippingCalculated(true);
      }
    } catch {
      toast.error('Erro ao calcular frete');
    } finally {
      setShippingLoading(false);
    }
  };

  const total = subtotal - couponDiscount + (shippingCalculated ? shippingCost : 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <CartDrawer />
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center"
            >
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-display font-bold mb-2">Seu carrinho está vazio</h1>
            <p className="text-sm text-muted-foreground mb-6">Adicione produtos para continuar comprando</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" />
              Continuar comprando
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-grow">
        <div className="container-shop py-6 sm:py-8 lg:py-12">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8"
          >
            Carrinho de Compras
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item, index) => {
                const images = item.product.images ?? [];
                const mainImage = images[0] || '/placeholder.svg';
                const itemPrice = item.variantPrice ?? item.product.price;
                const comparePrice = item.product.compare_at_price;
                const isDigital = item.product.is_digital;
                const itemKey = `${item.product.id}_${item.variantId || 'default'}`;
                return (
                  <motion.div
                    key={itemKey}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="bg-card rounded-2xl p-3 sm:p-4 border border-border/50 flex gap-3 sm:gap-4"
                  >
                    <Link to={`/produto/${item.product.slug}`} className="flex-shrink-0">
                      <img
                        src={mainImage}
                        alt={item.product.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover rounded-xl"
                      />
                    </Link>
                    <div className="flex-grow min-w-0">
                      <Link
                        to={`/produto/${item.product.slug}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {item.variantAttributes && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          {Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                      {item.product.free_shipping && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-success mt-1">
                          <Truck className="w-3 h-3" /> Frete grátis
                        </span>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <div className="flex items-center border border-border rounded-xl w-fit">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variantId)} className="p-1.5 sm:p-2 hover:bg-secondary transition-colors rounded-l-xl"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="px-3 sm:px-4 font-medium text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variantId)} disabled={!item.product.unlimited_stock && !isDigital && !item.product.allow_backorder && item.quantity >= item.product.stock} className="p-1.5 sm:p-2 hover:bg-secondary transition-colors disabled:opacity-50 rounded-r-xl"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <button onClick={() => removeItem(item.product.id, item.variantId)} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {comparePrice && comparePrice > itemPrice && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground line-through">{formatPrice(comparePrice * item.quantity)}</p>
                      )}
                      <p className="text-sm sm:text-lg font-bold text-primary">{formatPrice(itemPrice * item.quantity)}</p>
                    </div>
                  </motion.div>
                );
              })}

              <div className="flex justify-between items-center pt-3 sm:pt-4">
                <Link to="/" className="text-primary hover:underline flex items-center gap-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Continuar comprando
                </Link>
                <button onClick={clearCart} className="text-destructive hover:underline text-xs sm:text-sm">Limpar carrinho</button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl p-5 sm:p-6 border border-border/50 sticky top-24"
              >
                <h2 className="font-display text-base sm:text-lg font-semibold mb-5 sm:mb-6">Resumo do Pedido</h2>

                {/* Coupon */}
                <div className="mb-5 sm:mb-6">
                  <label className="text-xs sm:text-sm font-medium mb-2 block">Cupom de desconto</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Código" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={couponApplied} className="flex-grow px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-secondary bg-card" />
                    <button onClick={handleApplyCoupon} disabled={couponApplied || !couponCode || couponLoading} className="px-3 sm:px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                    </button>
                  </div>
                  {couponApplied && couponDiscount > 0 && (
                    <p className="text-xs text-success mt-1 flex items-center gap-1"><Tag className="w-3 h-3" /> -{formatPrice(couponDiscount)}</p>
                  )}
                </div>

                {/* Shipping */}
                {!allDigital && (
                  <div className="mb-5 sm:mb-6">
                    <label className="text-xs sm:text-sm font-medium mb-2 block">Calcular frete</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))} className="flex-grow px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" />
                      <button onClick={handleCalculateShipping} disabled={cep.length < 8 || shippingLoading} className="px-3 sm:px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                        {shippingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
                      </button>
                    </div>
                    {shippingCalculated && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${shippingCost === 0 ? 'text-success' : 'text-muted-foreground'}`}>
                        <Truck className="w-3 h-3" /> {shippingLabel}
                        {shippingCost > 0 && ` — ${formatPrice(shippingCost)}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2.5 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Desconto</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {shippingCalculated && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className={shippingCost === 0 ? 'text-success' : ''}>{shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-bold border-t border-border pt-3">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    ou {settings?.max_installments || 12}x de {formatPrice(total / (settings?.max_installments || 12))} sem juros
                  </p>
                </div>

                <Link to="/checkout" className="btn-buy w-full flex items-center justify-center gap-2 mt-5 sm:mt-6">
                  <span>Finalizar compra</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <span>Compra segura e protegida</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}