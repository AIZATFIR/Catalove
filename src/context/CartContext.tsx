"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product, ProductVariant } from "@/types/catalove";

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface CartContextValue {
  items: CartItem[];
  savedIds: string[];
  likeCounts: Record<string, number>;
  isDrawerOpen: boolean;
  drawerTab: "cart" | "wishlist";
  setIsDrawerOpen: (open: boolean) => void;
  setDrawerTab: (tab: "cart" | "wishlist") => void;
  openCart: () => void;
  openWishlist: () => void;
  addItem: (
    product: Product,
    variant?: ProductVariant,
    quantity?: number,
    notes?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleLike: (productId: string) => boolean;
  isLiked: (productId: string) => boolean;
  getLikeCount: (productId: string) => number;
  totalItems: number;
  totalAmount: number;
  lastToast: string | null;
}

const CART_STORAGE_KEY = "catalove-cart-v1";
const WISHLIST_STORAGE_KEY = "catalove-wishlist-v1";

function deterministicSeedLikes(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) % 350;
  }
  return 68 + hash;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"cart" | "wishlist">("cart");
  const [lastToast, setLastToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const rawWishlist = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (rawWishlist) {
        const parsedWish = JSON.parse(rawWishlist);
        if (Array.isArray(parsedWish)) setSavedIds(parsedWish);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota error
    }
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // ignore quota error
    }
  }, [savedIds]);

  const showToast = useCallback((msg: string) => {
    setLastToast(msg);
    setTimeout(() => {
      setLastToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  const addItem = useCallback(
    (product: Product, variant?: ProductVariant, quantity = 1, notes?: string) => {
      const chosenVariant =
        variant || product.variants?.find((v) => v.is_default) || product.variants?.[0];
      const unitPrice = chosenVariant ? chosenVariant.price : product.base_price;
      const itemId = `${product.id}__${chosenVariant?.id || "default"}`;

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === itemId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
            notes: notes || updated[existingIdx].notes,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: itemId,
            product,
            variant: chosenVariant,
            quantity,
            unitPrice,
            notes,
          },
        ];
      });

      showToast(`"${product.name}" masuk keranjang`);
    },
    [showToast]
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleLike = useCallback(
    (productId: string): boolean => {
      let nowLiked = false;
      setSavedIds((prev) => {
        if (prev.includes(productId)) {
          nowLiked = false;
          return prev.filter((id) => id !== productId);
        }
        nowLiked = true;
        return [productId, ...prev];
      });

      setLikeCounts((prev) => {
        const base = prev[productId] ?? deterministicSeedLikes(productId);
        return {
          ...prev,
          [productId]: nowLiked ? base + 1 : Math.max(1, base - 1),
        };
      });

      return nowLiked;
    },
    []
  );

  const isLiked = useCallback(
    (productId: string) => savedIds.includes(productId),
    [savedIds]
  );

  const getLikeCount = useCallback(
    (productId: string) => {
      if (likeCounts[productId] !== undefined) return likeCounts[productId];
      const base = deterministicSeedLikes(productId);
      return savedIds.includes(productId) ? base + 1 : base;
    },
    [likeCounts, savedIds]
  );

  const openCart = useCallback(() => {
    setDrawerTab("cart");
    setIsDrawerOpen(true);
  }, []);

  const openWishlist = useCallback(() => {
    setDrawerTab("wishlist");
    setIsDrawerOpen(true);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        savedIds,
        likeCounts,
        isDrawerOpen,
        drawerTab,
        setIsDrawerOpen,
        setDrawerTab,
        openCart,
        openWishlist,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleLike,
        isLiked,
        getLikeCount,
        totalItems,
        totalAmount,
        lastToast,
      }}
    >
      {children}

      {/* Micro-feedback floating toast for attention & delight */}
      {lastToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 rounded-full bg-stone-900 text-white px-5 py-2.5 text-xs font-semibold shadow-2xl border border-white/15 animate-slide-up dark:bg-stone-100 dark:text-stone-900"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lastToast}</span>
          <button
            type="button"
            onClick={openCart}
            className="underline font-bold text-amber-300 dark:text-amber-700 ml-1"
          >
            Lihat
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
