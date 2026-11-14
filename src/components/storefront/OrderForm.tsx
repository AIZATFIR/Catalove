"use client";

import React, { useState } from "react";
import { Product, ProductVariant, OrderRequest, FulfillmentMethod } from "@/types/bakery";
import { formatPrice, getTodayJakarta } from "@/lib/utils/formatters";
import { FulfillmentDatePicker } from "./FulfillmentDatePicker";
import { Button } from "@/components/ui/Button";
import { WhatsAppConfirmationModal } from "./WhatsAppConfirmationModal";
import { Minus, Plus, MessageCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { orderService } from "@/lib/services/order-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useCart } from "@/context/CartContext";

interface OrderFormProps {
  product: Product;
}

export const OrderForm: React.FC<OrderFormProps> = ({ product }) => {
  const settings = useBusinessSettings();
  const { addItem, openCart } = useCart();

  const isBakery = settings.industry_preset === "bakery";
  const isPreorderMode = settings.workflow_mode === "preorder_calendar";
  const isCartMode = settings.workflow_mode === "cart_checkout";
  const isInquiryMode = settings.workflow_mode === "inquiry_only";
  const currency = settings.currency_symbol || "Rp";

  const defaultVariant =
    product.variants?.find((v) => v.is_default) || product.variants?.[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    defaultVariant
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [requestedDate, setRequestedDate] = useState<string>(() => {
    if (!isPreorderMode) {
      return getTodayJakarta();
    }
    return "";
  });
  const [isDateValid, setIsDateValid] = useState<boolean>(true);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [cakeInscription, setCakeInscription] = useState<string>("");
  const [candleCount, setCandleCount] = useState<number>(1);
  const [customerNotes, setCustomerNotes] = useState<string>("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createdOrder, setCreatedOrder] = useState<OrderRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const unitPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const subtotal = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(
      product,
      selectedVariant,
      quantity,
      customerNotes.trim() || cakeInscription.trim() || undefined
    );
    openCart();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerName.trim()) {
      setErrorMessage("Silakan masukkan nama pemesan.");
      return;
    }
    if (!customerWhatsapp.trim()) {
      setErrorMessage("Silakan masukkan nomor WhatsApp aktif.");
      return;
    }
    if (isPreorderMode && (!requestedDate || !isDateValid)) {
      setErrorMessage("Silakan pilih tanggal acara/pengiriman yang tersedia.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await orderService.createOrder({
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
        customerName: customerName.trim(),
        customerWhatsapp: customerWhatsapp.trim(),
        requestedDate: requestedDate || getTodayJakarta(),
        fulfillmentMethod,
        deliveryAddress:
          fulfillmentMethod !== "pickup" ? deliveryAddress.trim() : undefined,
        cakeInscription: cakeInscription.trim() || undefined,
        candleCount: isBakery ? candleCount : 0,
        customerNotes: customerNotes.trim() || undefined,
      });

      setIsSubmitting(false);

      if (res.error || !res.order) {
        setErrorMessage(
          res.error || "Gagal mencatat pesanan. Silakan periksa formulir."
        );
        return;
      }

      setCreatedOrder(res.order);
      setIsModalOpen(true);
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-300">
              Pilih Opsi Varian
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`touch-target p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 text-cocoa-950 dark:text-white shadow-sm font-semibold"
                        : "border-caramel-200 dark:border-white/15 bg-white dark:bg-white/5 text-cocoa-700 dark:text-stone-300 hover:bg-vanilla-50 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="block text-xs font-bold">{variant.name}</span>
                    <span className="block text-xs text-[var(--storefront-accent)] mt-0.5 font-semibold">
                      {formatPrice(variant.price, currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Stepper */}
        {!isInquiryMode && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-300">
              Jumlah Pesanan
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="touch-target h-10 w-10 rounded-xl border border-stone-300 dark:border-white/15 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-40"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-base min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="touch-target h-10 w-10 rounded-xl border border-stone-300 dark:border-white/15 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Cart Action when Cart Workflow is active */}
        {isCartMode && (
          <div className="p-4 rounded-2xl bg-[var(--storefront-accent)]/10 border border-[var(--storefront-accent)]/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                Subtotal item ini:
              </span>
              <span className="font-serif text-lg font-bold text-[var(--storefront-accent)]">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="touch-target w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-[var(--storefront-accent)] text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tambahkan ke Keranjang Belanja</span>
            </button>
            <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
              Atau pesan instan 1 produk saja melalui formulir WhatsApp di bawah.
            </p>
          </div>
        )}

        {/* Fulfillment Date Picker (only when Preorder Calendar Mode) */}
        {isPreorderMode && (
          <FulfillmentDatePicker
            productId={product.id}
            leadTimeDays={product.minimum_lead_time_days}
            selectedDate={requestedDate}
            onChangeDate={setRequestedDate}
            onValidationChange={setIsDateValid}
          />
        )}

        {/* Fulfillment Method */}
        {!isInquiryMode && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800 dark:text-stone-300">
              Metode Pengambilan / Pengiriman
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "pickup", label: "Ambil di Toko" },
                { id: "delivery", label: "Kurir Instan" },
                { id: "shipping", label: "Ekspedisi" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFulfillmentMethod(m.id as FulfillmentMethod)}
                  className={`touch-target p-2.5 rounded-2xl text-xs font-bold border transition-all text-center ${
                    fulfillmentMethod === m.id
                      ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 text-cocoa-900 dark:text-white shadow-sm"
                      : "border-caramel-200 dark:border-white/15 bg-white dark:bg-white/5 text-cocoa-700 dark:text-stone-300 hover:bg-vanilla-50 dark:hover:bg-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Address Field */}
        {!isInquiryMode && fulfillmentMethod !== "pickup" && (
          <div className="space-y-1.5 animate-slide-up">
            <label className="block text-xs font-bold text-cocoa-800 dark:text-stone-200">
              Alamat Lengkap Pengiriman <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Selatan (Patokan seberang gedung)"
              className="w-full p-3 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
            />
          </div>
        )}

        {/* Customization Details */}
        <div className="space-y-3 pt-2 border-t border-caramel-100 dark:border-white/10">
          <span className="block text-xs font-bold uppercase tracking-wider text-caramel-700 dark:text-amber-300">
            {isBakery
              ? "Personalisasi Kue"
              : isInquiryMode
              ? "Kebutuhan & Brief Anda"
              : "Catatan Pesanan"}
          </span>

          {isBakery ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                  Tulisan di atas kue (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={cakeInscription}
                  onChange={(e) => setCakeInscription(e.target.value)}
                  placeholder="Contoh: Happy 25th Birthday Sarah"
                  className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                    Jumlah Lilin Batang
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={candleCount}
                    onChange={(e) => setCandleCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Contoh: Pisahkan saus"
                    className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                {isInquiryMode
                  ? "Jelaskan detail proyek / jadwal yang diinginkan"
                  : "Catatan Khusus (Warna, Ukuran, Kartu Ucapan, Request)"}
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Tuliskan detail kebutuhan atau request khusus Anda di sini..."
                className="w-full p-3 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
              />
            </div>
          )}
        </div>

        {/* Customer Contact Information */}
        <div className="space-y-3 pt-2 border-t border-caramel-100 dark:border-white/10">
          <span className="block text-xs font-bold uppercase tracking-wider text-caramel-700 dark:text-amber-300">
            Data Pemesan
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-cocoa-800 dark:text-stone-200">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="081234567890"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 dark:bg-white/5 border border-caramel-300 dark:border-white/15 text-xs text-cocoa-900 dark:text-white focus:outline-none focus:border-[var(--storefront-accent)]"
              />
            </div>
          </div>
        </div>

        {/* Price Summary & Submit CTA */}
        <div className="pt-4 border-t border-caramel-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-cocoa-500 dark:text-stone-400 block">
                Estimasi Total
              </span>
              <span className="font-serif text-2xl font-bold text-cocoa-950 dark:text-white">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <span className="text-[11px] text-cocoa-500 dark:text-stone-400">
              {isInquiryMode ? "Estimasi awal paket" : "Belum termasuk ongkir"}
            </span>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="whatsapp"
            isLoading={isSubmitting}
            className="w-full gap-2 text-sm shadow-warm"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span>
              {isInquiryMode
                ? "Konsultasi / Request Quote via WhatsApp"
                : "Pesan Instan & Chat WhatsApp"}
            </span>
          </Button>

          {!isCartMode && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="touch-target w-full flex items-center justify-center gap-2 py-3 rounded-full border border-stone-300 dark:border-white/15 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Atau Simpan ke Keranjang Dulu</span>
            </button>
          )}

          <p className="text-[11px] text-center text-cocoa-500 dark:text-stone-400 leading-normal">
            Sistem akan mencatat pesanan dan menyiapkan pesan WhatsApp terformat rapi ke admin toko.
          </p>
        </div>
      </form>

      <WhatsAppConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={createdOrder}
      />
    </>
  );
};

export default OrderForm;
