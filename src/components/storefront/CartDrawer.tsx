"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  Trash2,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Tag,
  Gift,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { cakeService } from "@/lib/services/cake-service";
import { orderService } from "@/lib/services/order-service";
import { formatPrice } from "@/lib/utils/formatters";
import { generateCartWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { FulfillmentMethod, Product } from "@/types/catalove";

interface PromoVoucher {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
}

const PROMO_VOUCHERS: Record<string, PromoVoucher> = {
  UMKMBERKAH: { code: "UMKMBERKAH", label: "Diskon 10%", type: "percent", value: 10 },
  CATALOVE20: { code: "CATALOVE20", label: "Diskon 20%", type: "percent", value: 20 },
  HEMAT15: { code: "HEMAT15", label: "Potongan Rp 15.000", type: "fixed", value: 15000 },
  HEMAT10: { code: "HEMAT10", label: "Diskon 10%", type: "percent", value: 10 },
  DISKON20: { code: "DISKON20", label: "Diskon 20%", type: "percent", value: 20 },
};

const QUICK_VOUCHER_PILLS = [
  PROMO_VOUCHERS.UMKMBERKAH,
  PROMO_VOUCHERS.CATALOVE20,
  PROMO_VOUCHERS.HEMAT15,
];

const REWARD_THRESHOLD = 250000;

export function CartDrawer() {
  const settings = useBusinessSettings();
  const {
    items,
    savedIds,
    isDrawerOpen,
    drawerTab,
    setIsDrawerOpen,
    setDrawerTab,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleLike,
    getLikeCount,
    totalItems,
    totalAmount,
  } = useCart();

  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<FulfillmentMethod>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [lastWaUrl, setLastWaUrl] = useState<string>("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<PromoVoucher | null>(null);
  const [voucherError, setVoucherError] = useState("");

  const currency = settings.currency_symbol || "Rp";

  const discountAmount = appliedVoucher
    ? appliedVoucher.type === "percent"
      ? Math.round((totalAmount * appliedVoucher.value) / 100)
      : Math.min(totalAmount, appliedVoucher.value)
    : 0;
  const finalTotal = Math.max(0, totalAmount - discountAmount);
  const rewardProgress = Math.min(100, Math.round((totalAmount / REWARD_THRESHOLD) * 100));
  const rewardRemaining = Math.max(0, REWARD_THRESHOLD - totalAmount);

  const applyPromoCode = (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    setVoucherError("");
    if (!normalized) {
      setAppliedVoucher(null);
      return;
    }
    const found = PROMO_VOUCHERS[normalized];
    if (!found) {
      setVoucherError("Kode promo tidak ditemukan. Coba UMKMBERKAH, CATALOVE20, atau HEMAT15.");
      return;
    }
    setVoucherInput(found.code);
    setAppliedVoucher(found);
  };

  useEffect(() => {
    if (!isDrawerOpen || drawerTab !== "wishlist") return;
    cakeService.getProducts({ includeInactive: false }).then((prods) => {
      setCatalogProducts(prods || []);
    });
  }, [isDrawerOpen, drawerTab, savedIds]);

  const savedProducts = catalogProducts.filter((p) => savedIds.includes(p.id));

  if (!isDrawerOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (items.length === 0) {
      setErrorMsg("Keranjang Anda masih kosong.");
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg("Mohon masukkan nama Anda.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg("Mohon masukkan nomor WhatsApp aktif.");
      return;
    }
    if ((deliveryType === "delivery" || deliveryType === "shipping") && !deliveryAddress.trim()) {
      setErrorMsg("Mohon isi alamat pengiriman Anda.");
      return;
    }

    const voucherNote = appliedVoucher
      ? `[Voucher ${appliedVoucher.code}: -${formatPrice(discountAmount, currency)}]`
      : "";
    const combinedNotes = [notes.trim(), voucherNote].filter(Boolean).join(" • ") || undefined;

    setSubmitting(true);
    try {
      const orderRes = await orderService.createCartOrder({
        customerName: customerName.trim(),
        customerWhatsapp: customerPhone.trim(),
        fulfillmentMethod: deliveryType,
        deliveryAddress: deliveryType === "pickup" ? undefined : deliveryAddress.trim(),
        customerNotes: combinedNotes,
        voucherCode: appliedVoucher?.code,
        items: items.map((it) => ({
          productId: it.product.id,
          variantId: it.variant?.id || null,
          productName: it.product.name,
          variantName: it.variant?.name || null,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          imageUrl: it.product.images?.[0]?.storage_path,
        })),
      });

      if (orderRes.error) {
        setErrorMsg(orderRes.error);
        return;
      }

      const refCode = orderRes.order?.reference_code;
      const waUrl = generateCartWhatsAppUrl({
        storeName: settings.store_name || "Catalove",
        whatsappNumber: settings.seller_whatsapp || "6285946689168",
        currencySymbol: currency,
        referenceCode: refCode,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        deliveryAddress: deliveryType === "pickup" ? undefined : deliveryAddress.trim(),
        notes: combinedNotes,
        items: items.map((it) => ({
          name: it.product.name,
          variantName: it.variant?.name,
          quantity: it.quantity,
          subtotal: it.unitPrice * it.quantity,
        })),
        totalAmount: finalTotal,
      });

      setSubmittedRef(refCode || "#CTL-NEW");
      setLastWaUrl(waUrl);
      setAppliedVoucher(null);
      setVoucherInput("");
      clearCart();
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErrorMsg("Gagal memproses checkout. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => {
          setIsDrawerOpen(false);
          setSubmittedRef(null);
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md bg-[#FCFAF6] dark:bg-[#1E1815] text-stone-900 dark:text-stone-100 shadow-2xl border-l border-stone-200 dark:border-white/10 flex flex-col h-full">
        {/* Top Header */}
        <div className="p-5 border-b border-stone-200/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--storefront-accent)]">
              {settings.store_name || "Catalove"}
            </p>
            <h2 className="font-serif text-xl font-bold mt-0.5">
              {drawerTab === "cart" ? "Keranjang Belanja" : "Koleksi Disukai"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false);
              setSubmittedRef(null);
            }}
            className="touch-target p-2 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10 transition-colors"
            aria-label="Tutup drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-stone-200/60 dark:border-white/10 flex gap-2">
          <button
            type="button"
            onClick={() => setDrawerTab("cart")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              drawerTab === "cart"
                ? "bg-[var(--storefront-accent)] text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Keranjang ({totalItems})</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab("wishlist")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              drawerTab === "wishlist"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Disukai ({savedIds.length})</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {drawerTab === "cart" ? (
            submittedRef ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Pesanan Tercatat
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-1">
                    Siap Dikonfirmasi Seller!
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Kode Referensi: <strong className="font-mono text-stone-900 dark:text-white">{submittedRef}</strong>
                  </p>
                </div>

                <a
                  href={lastWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#25D366] text-white font-bold text-sm shadow-lg hover:opacity-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka WhatsApp Jika Belum Terbuka</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedRef(null);
                    setIsDrawerOpen(false);
                  }}
                  className="text-xs font-semibold text-stone-500 underline"
                >
                  Lanjut Eksplor Katalog
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/5 mx-auto flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">Keranjang Kosong</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
                    Tambahkan item dari katalog.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--storefront-accent)] px-5 py-2.5 text-xs font-bold text-white"
                >
                  <span>Katalog</span>
                </button>
              </div>
            ) : (
              <>
                {/* Priority Reward Progress Bar */}
                <div className="rounded-2xl border border-[var(--storefront-accent)]/25 bg-[var(--storefront-accent)]/10 p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-[var(--storefront-accent)] shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold leading-snug text-stone-800 dark:text-stone-100">
                      {rewardRemaining > 0
                        ? `Tambah ${formatPrice(rewardRemaining, currency)} lagi untuk bonus kemasan.`
                        : "Bonus aktif: Prioritas proses & kemasan gratis."}
                    </p>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--storefront-accent)] transition-all duration-500"
                      style={{ width: `${rewardProgress}%` }}
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const thumb =
                      item.product.images?.find((img) => img.is_primary)?.storage_path ||
                      item.product.images?.[0]?.storage_path;
                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10"
                      >
                        <div className="w-16 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                          {thumb && (
                            <img
                              src={thumb}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.product.slug}`}
                              onClick={() => setIsDrawerOpen(false)}
                              className="text-xs font-bold leading-snug hover:underline line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-stone-400 hover:text-rose-500 p-1"
                              aria-label="Hapus item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {item.variant && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                              {item.variant.name}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--storefront-accent)]">
                              {formatPrice(item.unitPrice * item.quantity, currency)}
                            </span>

                            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-white/10 rounded-full px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-white/10"
                                aria-label="Kurangi"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-white/10"
                                aria-label="Tambah"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Voucher / Kode Promo Engine */}
                <div className="space-y-2.5 pt-4 border-t border-stone-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      <Tag className="w-3.5 h-3.5 text-[var(--storefront-accent)]" />
                      <span>Kode Promo / Voucher</span>
                    </span>
                    {appliedVoucher && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedVoucher(null);
                          setVoucherInput("");
                          setVoucherError("");
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:underline"
                      >
                        Hapus ({appliedVoucher.code})
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => {
                        setVoucherInput(e.target.value.toUpperCase());
                        if (voucherError) setVoucherError("");
                      }}
                      placeholder="Masukkan kode (cth: UMKMBERKAH)"
                      className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-mono uppercase outline-none focus:border-[var(--storefront-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => applyPromoCode(voucherInput)}
                      className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-[var(--storefront-accent)] text-white text-xs font-bold hover:opacity-90"
                    >
                      Pakai
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_VOUCHER_PILLS.map((pill) => {
                      const active = appliedVoucher?.code === pill.code;
                      return (
                        <button
                          key={pill.code}
                          type="button"
                          onClick={() => applyPromoCode(pill.code)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                            active
                              ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                              : "border-dashed border-[var(--storefront-accent)]/50 bg-[var(--storefront-accent)]/5 text-[var(--storefront-accent)] hover:bg-[var(--storefront-accent)]/15"
                          }`}
                        >
                          {pill.code} · {pill.label}
                        </button>
                      );
                    })}
                  </div>

                  {voucherError && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      {voucherError}
                    </p>
                  )}
                  {appliedVoucher && !voucherError && (
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Voucher {appliedVoucher.code} aktif — hemat{" "}
                      {formatPrice(discountAmount, currency)}!
                    </p>
                  )}
                </div>

                {/* Inline Checkout Form */}
                <form
                  id="cart-checkout-form"
                  onSubmit={handleCheckout}
                  className="space-y-3 pt-4 border-t border-stone-200 dark:border-white/10"
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Detail Pengiriman & Pemesan
                  </h3>

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama Lengkap *"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs outline-none focus:border-[var(--storefront-accent)]"
                    />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="No. WhatsApp *"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs outline-none focus:border-[var(--storefront-accent)]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "pickup", label: "Ambil di Toko" },
                      { id: "delivery", label: "Kurir Instan" },
                      { id: "shipping", label: "Ekspedisi" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDeliveryType(opt.id as FulfillmentMethod)}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                          deliveryType === opt.id
                            ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/15 text-[var(--storefront-accent)]"
                            : "border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {deliveryType !== "pickup" && (
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Alamat lengkap penerima, kelurahan, patokan..."
                      className="w-full p-3 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs outline-none focus:border-[var(--storefront-accent)]"
                    />
                  )}

                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan pesanan (opsional: warna, kartu ucapan, request...)"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs outline-none focus:border-[var(--storefront-accent)]"
                  />
                </form>
              </>
            )
          ) : savedProducts.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 mx-auto flex items-center justify-center text-rose-400">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-bold">Belum Ada Produk Disukai</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Ketuk ikon hati atau ketuk dua kali foto produk mana saja saat scroll untuk menyimpannya di sini!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedProducts.map((product) => {
                const thumb =
                  product.images?.find((img) => img.is_primary)?.storage_path ||
                  product.images?.[0]?.storage_path;
                return (
                  <div
                    key={product.id}
                    className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-white/5 border border-stone-200/80 dark:border-white/10"
                  >
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-20 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0"
                    >
                      {thumb && (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={() => setIsDrawerOpen(false)}
                            className="text-xs font-bold leading-snug hover:underline line-clamp-2"
                          >
                            {product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleLike(product.id)}
                            className="text-rose-500 p-1 shrink-0"
                            aria-label="Hapus dari disukai"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-[var(--storefront-accent)] mt-1">
                          {formatPrice(product.base_price, currency)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => addItem(product, undefined, 1)}
                          className="flex-1 py-1.5 px-3 rounded-full bg-[var(--storefront-accent)] text-white text-[11px] font-bold hover:opacity-90"
                        >
                          + Bag
                        </button>
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className="p-1.5 rounded-full border border-stone-200 dark:border-white/15 hover:bg-stone-100 dark:hover:bg-white/10"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Sticky Footer for Cart Checkout */}
        {drawerTab === "cart" && items.length > 0 && !submittedRef && (
          <div className="p-5 border-t border-stone-200 dark:border-white/10 bg-white/80 dark:bg-[#16110F]/95 backdrop-blur-md space-y-2.5">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span>Subtotal ({totalItems} item)</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {formatPrice(totalAmount, currency)}
                </span>
              </div>
              {appliedVoucher && discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Diskon Voucher ({appliedVoucher.code})</span>
                  <span>-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/70 dark:border-white/10">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-200">
                  Total Akhir
                </span>
                <span className="font-serif text-xl font-bold text-stone-900 dark:text-white">
                  {formatPrice(finalTotal, currency)}
                </span>
              </div>
            </div>
            <button
              type="submit"
              form="cart-checkout-form"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-full bg-[#25D366] text-white font-bold text-sm shadow-lg hover:bg-[#20BD5A] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {submitting ? "Memproses Pesanan..." : "Checkout Sekarang via WhatsApp"}
              </span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
