"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/types/bakery";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  UploadCloud,
  Check,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import { INITIAL_CATEGORIES } from "@/lib/data/seed-cakes";
import { Button } from "@/components/ui/Button";
import { MotionIcon } from "@/components/ui/MotionIcon";

interface UploadedImageItem {
  id: string;
  previewUrl: string;
  isPrimary: boolean;
  file?: File;
  uploadedUrl?: string;
  storagePath?: string;
  status?: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
}

export default function NewProductDraftPage() {
  const router = useRouter();

  // Mode: "new_cake" | "append_existing"
  const [mode, setMode] = useState<"new_cake" | "append_existing">("new_cake");
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  // Form Fields
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [leadTime, setLeadTime] = useState<number>(2);
  const [flavorNotesStr, setFlavorNotesStr] = useState("");
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    cakeService.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    });
  }, []);

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => [...prev, data.category]);
        setCategoryId(data.category.id);
        setNewCategoryName("");
        setIsAddingNewCategory(false);
      } else {
        setFeedbackMessage(data.error || "Gagal membuat kategori baru");
      }
    } catch {
      setFeedbackMessage("Gagal membuat kategori baru");
    } finally {
      setCreatingCategory(false);
    }
  };

  const uploadFile = async (item: UploadedImageItem) => {
    if (!item.file) return;

    setImages((prev) =>
      prev.map((img) =>
        img.id === item.id ? { ...img, status: "uploading", errorMsg: undefined } : img
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", item.file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah foto");
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id
            ? {
                ...img,
                status: "success",
                uploadedUrl: data.url,
                storagePath: data.storage_path,
              }
            : img
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal upload";
      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id ? { ...img, status: "error", errorMsg: msg } : img
        )
      );
    }
  };

  // Handle Multi-file Selection from Mobile Gallery / File picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems: UploadedImageItem[] = files.map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0,
      status: "pending",
    }));

    setImages((prev) => [...prev, ...newItems]);
    e.currentTarget.value = "";

    // Upload in background
    newItems.forEach((item) => uploadFile(item));
  };

  const requestAiAssistant = async () => {
    const uploaded = images.find((img) => img.status === "success" && img.uploadedUrl);
    if (!uploaded?.uploadedUrl) {
      setFeedbackMessage("Tunggu minimal 1 foto selesai diunggah sebelum meminta saran AI.");
      return;
    }

    setAiLoading(true);
    setFeedbackMessage("");

    try {
      const res = await fetch("/api/ai/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploaded.uploadedUrl }),
      });

      const data = await res.json();
      if (!data.available) {
        setFeedbackMessage(data.message || "Saran AI belum tersedia.");
        return;
      }

      if (data.suggestions) {
        if (data.suggestions.draft_description) {
          setDescription(data.suggestions.draft_description);
        }
        if (data.suggestions.flavor_notes && data.suggestions.flavor_notes.length > 0) {
          setFlavorNotesStr(data.suggestions.flavor_notes.join(", "));
        }
        if (data.suggestions.suggested_category) {
          setCategoryId(data.suggestions.suggested_category);
        }
        setFeedbackMessage("Saran AI untuk deskripsi dan rasa berhasil diterapkan. Mama bebas mengubahnya.");
      }
    } catch {
      setFeedbackMessage("Layanan saran AI sedang tidak dapat dijangkau.");
    } finally {
      setAiLoading(false);
    }
  };

  const setPrimary = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSave = async (isPublish: boolean) => {
    if (!name.trim()) {
      setFeedbackMessage("Nama produk wajib diisi.");
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 1000) {
      setFeedbackMessage("Harga dasar minimal Rp1.000.");
      return;
    }
    if (images.length === 0) {
      setFeedbackMessage("Minimal pilih 1 foto produk.");
      return;
    }

    if (images.some((img) => img.status === "uploading")) {
      setFeedbackMessage("Foto masih sedang diunggah ke cloud storage. Harap tunggu sebentar.");
      return;
    }

    if (images.some((img) => img.status === "error")) {
      setFeedbackMessage("Ada foto yang gagal diunggah. Ketuk 'Coba lagi' pada foto bermasalah.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage("");

    try {
      const flavorNotes = flavorNotesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await cakeService.createProduct({
        name: name.trim(),
        category_id: categoryId,
        description: description.trim() || `${name.trim()} dibuat segar sesuai pesanan dari dapur SofizCake.`,
        flavor_notes: flavorNotes.length > 0 ? flavorNotes : ["Freshly Baked", "Artisan"],
        base_price: Number(basePrice),
        minimum_lead_time_days: Number(leadTime),
        is_active: isPublish,
        is_featured: false,
        variants: variants.map((v, idx) => ({
          name: v.name,
          price: Number(v.price),
          is_default: idx === 0,
          display_order: idx + 1,
        })),
        images: images.map((img, idx) => ({
          storage_path: img.uploadedUrl || img.storagePath || img.previewUrl,
          alt_text: `${name} foto ${idx + 1}`,
          is_primary: img.isPrimary,
          display_order: idx + 1,
        })),
      });

      setIsSubmitting(false);
      router.push("/admin/products");
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan produk.";
      setFeedbackMessage(msg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="touch-target p-2 rounded-full hover:bg-vanilla-200 text-cocoa-700"
          aria-label="Kembali ke daftar produk"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-cocoa-950 dark:text-white">
            Tambah Produk Baru
          </h1>
          <p className="text-xs text-cocoa-600 dark:text-stone-300">
            Isi nama, kategori, deskripsi, harga, dan upload foto produk.
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* SECTION 1: BULK IMAGE UPLOADER (HIGH PRIORITY) */}
      <div className="rounded-3xl bg-white border border-caramel-200/80 shadow-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-cocoa-900 block">
            1. Foto Produk ({images.length} foto dipilih)
          </label>
          <span className="text-[11px] text-cocoa-500">
            Pilih satu foto utama
          </span>
        </div>

        {/* Upload Zone */}
        <label className="touch-target border-2 border-dashed border-caramel-300 hover:border-caramel-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-vanilla-50/60 hover:bg-butter-50 transition-all text-center">
          <MotionIcon icon={UploadCloud} size={32} className="mb-2 text-caramel-600" />
          <span className="font-bold text-xs text-cocoa-900">
            Sentuh untuk Pilih Foto dari Galeri HP / Kamera
          </span>
          <span className="text-[11px] text-cocoa-500 mt-1">
            Bisa pilih 1 hingga 10 foto sekaligus
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Thumbnail Previews Grid with Reorder & Primary Controls */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative rounded-2xl overflow-hidden border-2 bg-white shadow-sm p-1.5 transition-all ${
                  img.isPrimary
                    ? "border-amber-500 ring-2 ring-amber-200"
                    : "border-caramel-200"
                }`}
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-vanilla-200">
                  <Image
                    src={img.previewUrl}
                    alt="Preview foto kue"
                    fill
                    unoptimized
                    sizes="180px"
                    className="object-cover"
                  />

                  {img.isPrimary && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-sm">
                      Foto Utama
                    </div>
                  )}
                </div>

                {/* Control Actions Row (Touch Friendly) */}
                <div className="flex items-center justify-between pt-2 px-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "left")}
                      disabled={idx === 0}
                      className="touch-target p-1 rounded-md text-cocoa-600 hover:bg-vanilla-200 disabled:opacity-30"
                      title="Geser ke kiri"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "right")}
                      disabled={idx === images.length - 1}
                      className="touch-target p-1 rounded-md text-cocoa-600 hover:bg-vanilla-200 disabled:opacity-30"
                      title="Geser ke kanan"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimary(img.id)}
                      className={`touch-target p-1.5 rounded-full ${
                        img.isPrimary
                          ? "text-amber-500"
                          : "text-cocoa-400 hover:text-amber-500"
                      }`}
                      title="Jadikan Foto Utama"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="touch-target p-1.5 rounded-full text-rose-500 hover:bg-rose-50"
                      title="Hapus foto ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: PRODUCT DATA FORM */}
      <div className="rounded-3xl bg-white border border-caramel-200/80 shadow-soft p-5 sm:p-6 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-cocoa-900 block border-b border-caramel-100 pb-2">
          2. Informasi Kue
        </label>

        {/* Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-cocoa-800">
            Nama Kue <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Triple Chocolate Fudge Cake"
            required
            className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs font-semibold text-cocoa-900 focus:outline-none focus:border-caramel-600"
          />
        </div>

        {/* Category & Lead Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-cocoa-800 dark:text-stone-200">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewCategory((v) => !v)}
                className="text-[11px] font-semibold text-caramel-700 hover:text-caramel-900 dark:text-amber-400"
              >
                {isAddingNewCategory ? "Batal" : "+ Kategori Baru"}
              </button>
            </div>

            {isAddingNewCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="flex-1 px-3 py-2 rounded-xl bg-vanilla-50 border border-caramel-300 text-xs font-medium text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-[#2C2421] dark:text-stone-100 dark:border-white/20"
                />
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-3 py-2 rounded-xl bg-caramel-600 text-white text-xs font-semibold hover:bg-caramel-700 disabled:opacity-50"
                >
                  {creatingCategory ? "..." : "Simpan"}
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs font-semibold text-cocoa-900 focus:outline-none focus:border-caramel-600 dark:bg-[#2C2421] dark:text-stone-100 dark:border-white/20"
              >
                <option value="">(Tanpa Kategori / Bebas)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-cocoa-800">
              Waktu Persiapan (Lead Time)
            </label>
            <select
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs font-semibold text-cocoa-900 focus:outline-none focus:border-caramel-600"
            >
              <option value={0}>H-0 (Ready Stock Hari Ini)</option>
              <option value={1}>H-1 (Butuh 1 Hari)</option>
              <option value={2}>H-2 (Butuh 2 Hari - Standar)</option>
              <option value={3}>H-3 (Butuh 3 Hari - Hampers)</option>
            </select>
          </div>
        </div>

        {/* Description with AI Suggestion Button */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-cocoa-800">
              Deskripsi Rasa & Keistimewaan
            </label>
            {images.some((img) => img.status === "success" && img.uploadedUrl) && (
              <button
                type="button"
                onClick={requestAiAssistant}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-caramel-700 hover:text-caramel-800 bg-caramel-50 px-2.5 py-1 rounded-full border border-caramel-200"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>Saran AI dari Foto</span>
              </button>
            )}
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan bahan utama, rasa, dan kelembutan kuenya..."
            className="w-full p-3 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
          />
        </div>

        {/* Flavor Notes Tag */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-cocoa-800">
            Kata Kunci Rasa (Pisahkan koma)
          </label>
          <input
            type="text"
            value={flavorNotesStr}
            onChange={(e) => setFlavorNotesStr(e.target.value)}
            placeholder="Contoh: Dark Chocolate, Cream Cheese, Berry"
            className="w-full px-4 py-2.5 rounded-2xl bg-vanilla-50 border border-caramel-300 text-xs text-cocoa-900 focus:outline-none focus:border-caramel-600"
          />
        </div>

        {/* Base Price & Variants */}
        <div className="space-y-2 pt-2 border-t border-caramel-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-cocoa-800">
              Varian Ukuran & Harga
            </label>
            <button
              type="button"
              onClick={() =>
                setVariants((prev) => [
                  ...prev,
                  { name: `Varian Baru`, price: basePrice },
                ])
              }
              className="text-xs font-semibold text-caramel-700 hover:text-caramel-900 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Varian</span>
            </button>
          </div>

          <div className="space-y-2">
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariants((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                    );
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-vanilla-50 border border-caramel-300 text-xs"
                  placeholder="Nama varian (cth: 16cm)"
                />
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVariants((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                    );
                    if (idx === 0) setBasePrice(val);
                  }}
                  className="w-28 px-3 py-2 rounded-xl bg-vanilla-50 border border-caramel-300 text-xs font-semibold"
                  placeholder="Harga"
                />
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="p-1.5 text-cocoa-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Button
          type="button"
          onClick={() => handleSave(true)}
          isLoading={isSubmitting}
          className="w-full sm:flex-1 py-3.5"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          <span>Terbitkan Sekarang ke Toko</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          isLoading={isSubmitting}
          className="w-full sm:w-auto px-6 py-3.5"
        >
          <span>Simpan Sebagai Draf</span>
        </Button>
      </div>
    </div>
  );
}
