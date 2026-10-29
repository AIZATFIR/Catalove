"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Sparkles, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { Product } from "@/types/bakery";
import { formatIDR } from "@/lib/utils/formatters";

interface RecommendationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const RecommendationDrawer: React.FC<RecommendationDrawerProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [step, setStep] = useState<number>(1);
  const [occasion, setOccasion] = useState<string>("");
  const [flavor, setFlavor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("");

  if (!isOpen) return null;

  // Simple deterministic scoring matching products based on selections
  const getRecommendations = () => {
    return products
      .map((p) => {
        let score = 0;
        const text = (p.name + " " + p.description + " " + (p.flavor_notes || []).join(" ")).toLowerCase();

        if (flavor && text.includes(flavor.toLowerCase())) score += 3;
        if (occasion === "ultah" && p.category_id === "cat-whole") score += 2;
        if (occasion === "personal" && (p.category_id === "cat-bento" || p.category_id === "cat-slices")) score += 3;
        if (occasion === "gift" && (p.category_id === "cat-hampers" || p.category_id === "cat-whole")) score += 3;
        if (urgency === "today" && p.minimum_lead_time_days === 0) score += 4;
        if (urgency === "future" && p.minimum_lead_time_days > 0) score += 2;

        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.product);
  };

  const matches = getRecommendations();

  const resetQuiz = () => {
    setStep(1);
    setOccasion("");
    setFlavor("");
    setSize("");
    setUrgency("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-cocoa-950/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-lg bg-vanilla-50 h-full shadow-2xl flex flex-col z-10 border-l border-caramel-200 animate-slide-up">
        {/* Drawer Header */}
        <div className="p-6 border-b border-caramel-200/80 bg-vanilla-100/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-butter-500 flex items-center justify-center text-cocoa-900">
              <Sparkles className="w-4 h-4 text-caramel-800" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-cocoa-900 leading-none">
                Bantu Pilih Kue
              </h2>
              <p className="text-[11px] text-cocoa-500 mt-1">
                Rekomendasi rasa & ukuran sesuai acaramu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="touch-target inline-flex items-center justify-center p-2 rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-vanilla-200"
            aria-label="Tutup rekomendasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-caramel-600 uppercase tracking-wider">
                Langkah 1 dari 4
              </span>
              <h3 className="font-serif text-2xl font-bold text-cocoa-950">
                Untuk momen apa kue ini disiapkan?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "ultah", label: "Pesta Ulang Tahun Spesial", desc: "Kue utuh bundar dengan lilin & ucapan" },
                  { id: "personal", label: "Hadiah Personal / Bento", desc: "Ukuran mini 1-2 orang bernuansa estetik" },
                  { id: "camilan", label: "Camilan Santai / Kumpul Sore", desc: "Dessert box potong siap santap" },
                  { id: "gift", label: "Hampers & Bingkisan Bingkisan", desc: "Kotak mewah dengan kemasan pita pita" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setOccasion(opt.id);
                      setStep(2);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white border border-caramel-200/80 hover:border-caramel-500 hover:bg-butter-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                  >
                    <div>
                      <div className="font-bold text-sm text-cocoa-900 group-hover:text-caramel-700">
                        {opt.label}
                      </div>
                      <div className="text-xs text-cocoa-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-caramel-400 group-hover:text-caramel-700 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-caramel-600 uppercase tracking-wider">
                Langkah 2 dari 4
              </span>
              <h3 className="font-serif text-2xl font-bold text-cocoa-950">
                Karakter rasa apa yang paling disukai?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "cheese", label: "Gurih Creamy Keju (Cheesecake)", desc: "Sensasi lumer Basque & mascarpone lembut" },
                  { id: "chocolate", label: "Pekat Legit Dark Chocolate", desc: "Cokelat Belgia asli 70% kaya rasa" },
                  { id: "fruit", label: "Segar Buah & Strawberry", desc: "Sponge chiffon ringan dengan buah asli" },
                  { id: "caramel", label: "Lotus Biscoff & Karamel Rempah", desc: "Aroma biskuit karamel renyah & manis pas" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFlavor(opt.id);
                      setStep(3);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white border border-caramel-200/80 hover:border-caramel-500 hover:bg-butter-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                  >
                    <div>
                      <div className="font-bold text-sm text-cocoa-900 group-hover:text-caramel-700">
                        {opt.label}
                      </div>
                      <div className="text-xs text-cocoa-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-caramel-400 group-hover:text-caramel-700 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-caramel-600 uppercase tracking-wider">
                Langkah 3 dari 4
              </span>
              <h3 className="font-serif text-2xl font-bold text-cocoa-950">
                Berapa perkiraan jumlah penikmatnya?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "small", label: "1 - 2 Orang (Porsi Personal)", desc: "Bento Cake atau Dessert Box 250ml" },
                  { id: "medium", label: "4 - 6 Orang (Keluarga Kecil)", desc: "Whole Cake Diameter 16cm" },
                  { id: "large", label: "8 - 10 Orang (Pesta Ramai)", desc: "Whole Cake Diameter 20cm atau Paket Hampers" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSize(opt.id);
                      setStep(4);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white border border-caramel-200/80 hover:border-caramel-500 hover:bg-butter-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                  >
                    <div>
                      <div className="font-bold text-sm text-cocoa-900 group-hover:text-caramel-700">
                        {opt.label}
                      </div>
                      <div className="text-xs text-cocoa-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-caramel-400 group-hover:text-caramel-700 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-caramel-600 uppercase tracking-wider">
                Langkah Terakhir
              </span>
              <h3 className="font-serif text-2xl font-bold text-cocoa-950">
                Kapan kue ini perlu disajikan?
              </h3>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {[
                  { id: "today", label: "Hari Ini / Besok (Ready Stock)", desc: "Pilih produk yang siap langsung dikirim" },
                  { id: "future", label: "Lebih dari H-2 (Pre-Order)", desc: "Pilihan lengkap bebas kustom tulisan & tanggal" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setUrgency(opt.id);
                      setStep(5);
                    }}
                    className="touch-target w-full p-4 rounded-2xl text-left bg-white border border-caramel-200/80 hover:border-caramel-500 hover:bg-butter-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                  >
                    <div>
                      <div className="font-bold text-sm text-cocoa-900 group-hover:text-caramel-700">
                        {opt.label}
                      </div>
                      <div className="text-xs text-cocoa-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-caramel-400 group-hover:text-caramel-700 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Rekomendasi Ditemukan</span>
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-cocoa-950 mt-1">
                    Kue Paling Pas Buat Kamu
                  </h3>
                </div>
                <button
                  onClick={resetQuiz}
                  className="touch-target text-xs text-cocoa-500 hover:text-caramel-700 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi</span>
                </button>
              </div>

              <div className="space-y-4">
                {matches.map((product) => {
                  const img = product.images.find((i) => i.is_primary) || product.images[0];
                  return (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl bg-white border border-caramel-200/80 shadow-soft flex gap-4 items-center group hover:border-caramel-400 transition-all"
                    >
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-vanilla-200">
                        {img && (
                          <Image
                            src={img.storage_path}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-caramel-700 uppercase tracking-wider">
                          {product.minimum_lead_time_days === 0 ? "Ready Stock" : `Pre-Order H-${product.minimum_lead_time_days}`}
                        </div>
                        <h4 className="font-serif font-bold text-sm text-cocoa-900 truncate mt-0.5">
                          {product.name}
                        </h4>
                        <p className="text-xs font-bold text-cocoa-950 mt-1">
                          {formatIDR(product.base_price)}
                        </p>
                      </div>

                      <Link
                        href={`/product/${product.slug}`}
                        onClick={onClose}
                        className="touch-target shrink-0 p-2.5 rounded-full bg-caramel-50 hover:bg-caramel-600 hover:text-white text-caramel-700 border border-caramel-200 transition-all"
                        aria-label={`Lihat kue ${product.name}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-butter-100/70 border border-butter-300 text-xs text-cocoa-800 leading-relaxed dark:bg-[#2C2421] dark:border-white/10 dark:text-[#D8CBC0]">
                <span className="font-semibold text-cocoa-900 dark:text-[#FAF4EE]">Tips Mama:</span> Kamu bisa request kustom tulisan ucapan pada saat mengisi tanggal pemesanan.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
