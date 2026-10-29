"use client";

import React, { useState } from "react";
import { Product, ProductVariant, OrderRequest } from "@/types/bakery";
import { formatIDR } from "@/lib/utils/formatters";
import { FulfillmentDatePicker } from "./FulfillmentDatePicker";
import { Button } from "@/components/ui/Button";
import { WhatsAppConfirmationModal } from "./WhatsAppConfirmationModal";
import { Minus, Plus, MessageCircle, AlertCircle } from "lucide-react";
import { orderService } from "@/lib/services/order-service";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

interface OrderFormProps {
  product: Product;
}

export const OrderForm: React.FC<OrderFormProps> = ({ product }) => {
  const settings = useBusinessSettings();
  const isBakery = settings.industry_preset === "bakery";
  const isPreorderMode = settings.workflow_mode === "preorder_calendar";
  const isInquiryMode = settings.workflow_mode === "inquiry_only";

  const defaultVariant = product.variants?.find((v) => v.is_default) || product.variants?.[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [quantity, setQuantity] = useState<number>(1);
  const [requestedDate, setRequestedDate] = useState<string>(() => {
    if (!isPreorderMode) {
      return new Date().toISOString().split("T")[0];
    }
    return "";
  });
  const [isDateValid, setIsDateValid] = useState<boolean>(true);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState<string>("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [cakeInscription, setCakeInscription] = useState<string>("");
  const [candleCount, setCandleCount] = useState<number>(1);
  const [customerNotes, setCustomerNotes] = useState<string>("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createdOrder, setCreatedOrder] = useState<OrderRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Calculated Price
  const unitPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const subtotal = unitPrice * quantity;

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
        requestedDate: requestedDate || new Date().toISOString().split("T")[0],
        fulfillmentMethod,
        deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress.trim() : undefined,
        cakeInscription: cakeInscription.trim() || undefined,
        candleCount: isBakery ? candleCount : 0,
        customerNotes: customerNotes.trim() || undefined,
      });

      setIsSubmitting(false);

      if (res.error || !res.order) {
        setErrorMessage(res.error || "Gagal mencatat pesanan. Silakan periksa formulir.");
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
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800">
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
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 text-cocoa-950 shadow-sm font-semibold"
                        : "border-caramel-200 bg-white text-cocoa-700 hover:bg-vanilla-50"
                    }`}
                  >
                    <span className="block text-xs font-bold">{variant.name}</span>
                    <span className="block text-xs text-caramel-800 mt-0.5">
                      {formatIDR(variant.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800">
            Jumlah Pesanan
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="touch-target h-10 w-10 rounded-xl border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-40"
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
              className="touch-target h-10 w-10 rounded-xl border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fulfillment Date Picker (if Preorder Mode) */}
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
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-cocoa-800">
            Metode Pengambilan / Pengiriman
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFulfillmentMethod("pickup")}
              className={`touch-target p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                fulfillmentMethod === "pickup"
                  ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 text-cocoa-900 shadow-sm"
                  : "border-caramel-200 bg-white text-cocoa-700 hover:bg-vanilla-50"
              }`}
            >
              Ambil di Toko / Studio
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentMethod("delivery")}
              className={`touch-target p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                fulfillmentMethod === "delivery"
                  ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 text-cocoa-900 shadow-sm"
                  : "border-caramel-200 bg-white text-cocoa-700 hover:bg-vanilla-50"
              }`}
            >
              Pengantaran Kurir
            </button>
          </div>
        </div>

        {/* Delivery Address Field */}
        {fulfillmentMethod === "delivery" && (
          <div className="space-y-1.5 animate-slide-up">
            <label className="block text-xs font-bold text-cocoa-800">
              Alamat Lengkap Pengiriman <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Selatan (Patokan seberang gedung BCA)"
              className="w-full p-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
            />
          </div>
        )}

        {/* Customization Details */}
        <div className="space-y-3 pt-2 border-t border-caramel-100">
          <span className="block text-xs font-bold uppercase tracking-wider text-caramel-700">
            {isBakery ? "Personalisasi Kue" : "Catatan Pesanan"}
          </span>

          {isBakery ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-cocoa-800">
                  Tulisan di atas kue (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={cakeInscription}
                  onChange={(e) => setCakeInscription(e.target.value)}
                  placeholder="Contoh: Happy 25th Birthday Sarah"
                  className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-cocoa-800">
                    Jumlah Lilin Batang
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={candleCount}
                    onChange={(e) => setCandleCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-cocoa-800">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Contoh: Pisahkan saus"
                    className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-cocoa-800">
                Catatan Khusus (Warna, Ukuran, Kartu Ucapan, dll)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Tuliskan detail request khusus Anda di sini..."
                className="w-full p-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
              />
            </div>
          )}
        </div>

        {/* Customer Contact Information */}
        <div className="space-y-3 pt-2 border-t border-caramel-100">
          <span className="block text-xs font-bold uppercase tracking-wider text-caramel-700">
            Data Pemesan
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-cocoa-800">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-cocoa-800">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={customerWhatsapp}
                onChange={(e) => setCustomerWhatsapp(e.target.value)}
                placeholder="081234567890"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
              />
            </div>
          </div>
        </div>

        {/* Price Summary & Submit CTA */}
        <div className="pt-4 border-t border-caramel-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-cocoa-500 block">Estimasi Total</span>
              <span className="font-serif text-2xl font-bold text-cocoa-950">
                {formatIDR(subtotal)}
              </span>
            </div>
            <span className="text-[11px] text-cocoa-500">Belum termasuk ongkir</span>
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
                : "Ajukan Pesanan & Chat WhatsApp"}
            </span>
          </Button>

          <p className="text-[11px] text-center text-cocoa-500 leading-normal">
            Sistem akan menyimpan ringkasan pesanan dan membuka WhatsApp dengan pesan terformat rapi untuk konfirmasi dengan penjual.
          </p>
        </div>
      </form>

      {/* Confirmation & WhatsApp Launch Modal */}
      <WhatsAppConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={createdOrder}
      />
    </>
  );
};

export default OrderForm;
