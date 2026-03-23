import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Tables } from '@/integrations/supabase/types';

export type CartProduct = Tables<"products">;

export interface CartItem {
  product: CartProduct;
  quantity: number;
  variantId?: string;
  variantAttributes?: Record<string, string>;
  variantPrice?: number;
  variantSku?: string;
  variantStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number, variant?: { id: string; attributes: Record<string, string>; price?: number; sku?: string; stock?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getItemKey = (productId: string, variantId?: string) => `${productId}_${variantId || 'default'}`;

const CART_STORAGE_KEY = 'lovable-cart';

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist to localStorage on every change
  React.useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback((product: CartProduct, quantity = 1, variant?: { id: string; attributes: Record<string, string>; price?: number; sku?: string; stock?: number }) => {
    // When a variant is provided, use variant stock; otherwise use product stock
    const effectiveStock = variant?.stock ?? product.stock;
    if (effectiveStock <= 0 && !product.unlimited_stock && !product.allow_backorder && !product.is_digital) return;
    
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => 
        item.product.id === product.id && item.variantId === variant?.id
      );
      
      if (existingItem) {
        const uncapped = product.unlimited_stock || product.is_digital || product.allow_backorder;
        const maxQty = uncapped ? existingItem.quantity + quantity : effectiveStock;
        const newQuantity = Math.min(existingItem.quantity + quantity, maxQty);
        return currentItems.map((item) =>
          item.product.id === product.id && item.variantId === variant?.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      const uncappedNew = product.unlimited_stock || product.is_digital || product.allow_backorder;
      const maxQty = uncappedNew ? quantity : Math.min(quantity, effectiveStock);
      return [...currentItems, { 
        product, 
        quantity: maxQty,
        variantId: variant?.id,
        variantAttributes: variant?.attributes,
        variantPrice: variant?.price,
        variantSku: variant?.sku,
        variantStock: variant?.stock,
      }];
    });
    
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((currentItems) => currentItems.filter((item) => 
      !(item.product.id === productId && item.variantId === variantId)
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.product.id !== productId || item.variantId !== variantId) return item;
        const stock = item.variantStock ?? item.product.stock;
        const uncappedUpd = item.product.unlimited_stock || item.product.is_digital || item.product.allow_backorder;
        return { ...item, quantity: uncappedUpd ? quantity : Math.min(quantity, stock) };
      })
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => {
    const price = item.variantPrice ?? item.product.price;
    return total + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
