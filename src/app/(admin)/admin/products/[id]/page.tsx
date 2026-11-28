"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FolderPlus,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import type { Category, Product, ProductImage, ProductVariant } from "@/types/bakery";
import { formatIDR } from "@/lib/utils/formatters";
import { prepareCatalogImage } from "@/lib/prepare-catalog-image";
import { withStoreSlug } from "@/lib/store-routing";
import { discardUnattachedStoreImage } from "@/lib/services/store-media-client";
import { ExternalCheckoutUrlField } from "@/components/admin/ExternalCheckoutUrlField";

interface EditImageItem {
  id: string;
  storage_path: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  file?: File;
  previewUrl?: string;
  status?: "saved" | "uploading" | "error";
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Product Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [externalCheckoutUrl, setExternalCheckoutUrl] = useState("");
  const [leadTime, setLeadTime] = useState<number>(2);
  const [flavorNotesStr, setFlavorNotesStr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<EditImageItem[]>([]);
  const [variants, setVariants] = useState<{ id?: string; name: string; price: number; is_default: boolean }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [prod, cats] = await Promise.all([
          cakeService.getProductById(productId),
          cakeService.getCategories(),
        ]);

        setCategories(cats);

        if (!prod) {
          setFeedback({ text: "Produk tidak ditemukan.", type: "error" });
          setLoading(false);
          return;
        }

        setName(prod.name);
        setSlug(prod.slug);
        setCategoryId(prod.category_id || (cats[0]?.id ?? ""));
        setDescription(prod.description);
        setBasePrice(prod.base_price);
        setExternalCheckoutUrl(prod.external_checkout_url || "");
        setLeadTime(prod.minimum_lead_time_days);
        setFlavorNotesStr((prod.flavor_notes || []).join(", "));
        setIsActive(prod.is_active);
        setIsFeatured(prod.is_featured);

        setImages(
          (prod.images || []).map((img, idx) => ({
            id: img.id || `img-${idx}`,
            storage_path: img.storage_path,
            alt_text: img.alt_text || prod.name,
            is_primary: img.is_primary,
            display_order: img.display_order ?? idx + 1,
            status: "saved",
          }))
        );

        setVariants(
          (prod.variants || []).map((v, idx) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            is_default: v.is_default ?? idx === 0,
          }))
        );
      } catch (err) {
        setFeedback({ text: "Gagal memuat data produk.", type: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch(withStoreSlug("/api/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => [...prev, data.category]);
        setCategoryId(data.category.id);
        setNewCatName("");
        setShowAddCategory(false);
        setFeedback({ text: `Kategori "${data.category.name}" berhasil dibuat.`, type: "success" });
      }
    } catch {
      setFeedback({ text: "Gagal membuat kategori baru.", type: "error" });
    } finally {
      setCreatingCat(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const tempId = `new-${Date.now()}-${i}`;

      const newItem: EditImageItem = {
        id: tempId,
        storage_path: previewUrl,
        alt_text: `${name} foto`,
        is_primary: images.length === 0 && i === 0,
        display_order: images.length + i + 1,
        file,
        previewUrl,
        status: "uploading",
      };

      setImages((prev) => [...prev, newItem]);

      // Upload via /api/upload
      try {
        const formData = new FormData();
        formData.append("file", await prepareCatalogImage(file));
        const res = await fetch(withStoreSlug("/api/upload"), {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId
                ? { ...img, storage_path: data.url, status: "saved" }
                : img
            )
          );
        } else {
          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId ? { ...img, status: "error" } : img
            )
          );
        }
      } catch {
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId ? { ...img, status: "error" } : img
          )
        );
      }
    }
  };

  const setPrimaryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.id === id,
      }))
    );
  };

  const removeImage = (id: string) => {
    const removed = images.find((image) => image.id === id);
    if (removed?.file && removed.status === "saved") {
      void discardUnattachedStoreImage(removed.storage_path).catch((error: unknown) => {
        setFeedback({ text: error instanceof Error ? error.message : "Foto belum berhasil dihapus dari penyimpanan.", type: "error" });
      });
    }
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
        remaining[0].is_primary = true;
      }
      return remaining;
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[to];
      copy[to] = temp;
      return copy;
    });
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: `Ukuran ${prev.length + 1}`,
        price: basePrice || 0,
        is_default: prev.length === 0,
      },
    ]);
  };

  const updateVariant = (index: number, field: "name" | "price" | "is_default", value: any) => {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (field === "is_default") {
          return { ...v, is_default: idx === index };
        }
        if (idx === index) {
          return { ...v, [field]: field === "price" ? Math.max(0, Number(value)) : value };
        }
        return v;
      })
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      const remaining = prev.filter((_, idx) => idx !== index);
      if (remaining.length > 0 && !remaining.some((v) => v.is_default)) {
        remaining[0].is_default = true;
      }
      return remaining;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ text: "Nama kue wajib diisi.", type: "error" });
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 1000) {
      setFeedback({ text: "Harga dasar minimal Rp1.000.", type: "error" });
      return;
    }
    if (images.length === 0) {
      setFeedback({ text: "Minimal harus ada 1 foto produk.", type: "error" });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const flavorNotes = flavorNotesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        description: description.trim() || `${name.trim()} dari katalog kami.`,
        flavor_notes: flavorNotes.length > 0 ? flavorNotes : ["Freshly Baked"],
        base_price: Number(basePrice),
        external_checkout_url: externalCheckoutUrl.trim() || null,
        minimum_lead_time_days: Number(leadTime),
        is_active: isActive,
        is_featured: isFeatured,
        variants: variants.map((v, idx) => ({
          name: v.name.trim(),
          price: Number(v.price),
          is_default: v.is_default,
          display_order: idx + 1,
        })),
        images: images.map((img, idx) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || name,
          is_primary: img.is_primary,
          display_order: idx + 1,
        })),
      };

      const updated = await cakeService.updateProduct(productId, payload);
      if (updated) {
        setFeedback({ text: `Perubahan "${name}" berhasil disimpan!`, type: "success" });
        setTimeout(() => {
          router.push("/admin/products");
        }, 1000);
      } else {
        setFeedback({ text: "Gagal memperbarui produk.", type: "error" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setFeedback({ text: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      `Yakin ingin menghapus produk "${name}"?\n\nTindakan ini akan menghapus produk dari etalase.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const result = await cakeService.deleteProduct(productId);
      if (result.success) {
        alert(result.message || `Produk "${name}" berhasil dihapus.`);
        router.push("/admin/products");
      } else {
        alert(result.message || "Gagal menghapus produk.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk.";
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8794A]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DBD0C5] pb-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="touch-target inline-flex items-center justify-center p-2 text-[#4D3040] hover:text-[#B8794A] dark:text-stone-300"
            aria-label="Kembali ke daftar kue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#8D624C] dark:text-[#C88A42]">
              Edit Produk
            </p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-[#4D3040] dark:text-white">
              {name || "Edit Kue"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/product/${slug}`}
            target="_blank"
            className="touch-target inline-flex items-center gap-1.5 border border-[#BFAE9F] px-3.5 py-2 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200 dark:hover:bg-white/10"
          >
            <Eye size={14} /> Lihat di Toko
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="touch-target inline-flex items-center gap-1.5 border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>Hapus Produk</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`border-l-2 p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10">
        {/* Section 1: Informasi Utama */}
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white border-b border-[#DBD0C5] pb-2 dark:border-white/10">
            1. Informasi Kue
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                Nama Kue *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-base font-semibold text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                placeholder="Contoh: Basque Burnt Cheesecake Caramel"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                  Kategori
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-xs text-[#B8794A] hover:underline dark:text-amber-400"
                >
                  {showAddCategory ? "Batal" : "+ Kategori Baru"}
                </button>
              </div>

              {showAddCategory ? (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    className="flex-1 border-b border-[#B8794A] bg-transparent py-1.5 text-sm text-[#33262A] outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={creatingCat || !newCatName.trim()}
                    className="border border-[#B8794A] bg-[#B8794A] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {creatingCat ? "..." : "Tambah"}
                  </button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:bg-[#1A1412] dark:text-white"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <ExternalCheckoutUrlField value={externalCheckoutUrl} onChange={setExternalCheckoutUrl} />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                Harga Dasar (Rp) *
              </label>
              <input
                type="number"
                min="1000"
                step="5000"
                required
                value={basePrice || ""}
                onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm font-semibold tabular-nums text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
              />
              <span className="text-[11px] text-[#806C71] dark:text-stone-400 mt-1 block">
                Tampil sebagai {formatIDR(basePrice || 0)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                Minimum Waktu Persiapan (Lead Time)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Math.max(0, Number(e.target.value)))}
                  className="w-24 border-b border-[#BFAE9F] bg-transparent py-2 text-sm font-semibold text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
                <span className="text-sm text-[#55464B] dark:text-stone-300">
                  {leadTime === 0 ? "Hari ini (Ready stock)" : `Hari (Pesan H-${leadTime})`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                Catatan Rasa / Tagar (Pisahkan koma)
              </label>
              <input
                type="text"
                value={flavorNotesStr}
                onChange={(e) => setFlavorNotesStr(e.target.value)}
                placeholder="Contoh: Dark Chocolate, Espresso, Cream Cheese"
                className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                Deskripsi Kue *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan cita rasa kue, bahan-bahan pilihan, dan keistimewaannya..."
                className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm leading-relaxed text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-8 pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#4D3040] focus:ring-[#B8794A]"
                />
                <span className="text-sm font-medium text-[#33262A] dark:text-white">
                  Tayangkan di Etalase Toko (Aktif)
                </span>
              </label>

              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#4D3040] focus:ring-[#B8794A]"
                />
                <span className="text-sm font-medium text-[#33262A] dark:text-white">
                  Jadikan Produk Unggulan di Beranda
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Section 2: Foto Kue */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#DBD0C5] pb-2 dark:border-white/10">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white">
                2. Foto Kue ({images.length})
              </h2>
              <p className="text-xs text-[#67575B] dark:text-stone-300">
                Pilih foto utama yang akan tampil di katalog. Kamu juga bisa menambah foto dari perangkat.
              </p>
            </div>
            <label className="touch-target inline-flex items-center gap-2 border border-[#B8794A] bg-[#B8794A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#9E6433] cursor-pointer">
              <UploadCloud size={16} />
              <span>+ Tambah Foto</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`group relative aspect-[4/5] overflow-hidden rounded-xl border-2 bg-stone-100 dark:bg-stone-900 ${
                  img.is_primary ? "border-[#B8794A] ring-2 ring-[#B8794A]/30" : "border-stone-200 dark:border-white/10"
                }`}
              >
                <Image
                  src={img.storage_path}
                  alt={img.alt_text}
                  fill
                  className="object-cover"
                />

                {img.is_primary && (
                  <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded bg-[#B8794A] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    <Star size={10} fill="currentColor" /> Utama
                  </span>
                )}

                {img.status === "uploading" && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}

                {/* Hover overlay controls */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="rounded bg-rose-600 p-1.5 text-white hover:bg-rose-700"
                      title="Hapus foto ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveImage(idx, -1)}
                        className="rounded bg-white/80 p-1 text-black hover:bg-white disabled:opacity-30"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveImage(idx, 1)}
                        className="rounded bg-white/80 p-1 text-black hover:bg-white disabled:opacity-30"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(img.id)}
                        className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-[#4D3040] hover:bg-amber-50"
                      >
                        Jadikan Utama
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Varian Ukuran & Harga */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#DBD0C5] pb-2 dark:border-white/10">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white">
                3. Varian Ukuran & Harga ({variants.length})
              </h2>
              <p className="text-xs text-[#67575B] dark:text-stone-300">
                Pilihan ukuran atau porsi kue yang dapat dipilih pelanggan saat memesan.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="touch-target inline-flex items-center gap-1.5 border border-[#4D3040] px-3.5 py-1.5 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200 dark:hover:bg-white/10"
            >
              <Plus size={14} />
              <span>+ Tambah Ukuran</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="border border-dashed border-[#BFAE9F] p-6 text-center dark:border-white/20">
              <p className="text-sm text-[#67575B] dark:text-stone-300">
                Belum ada varian spesifik. Pelanggan akan memesan berdasarkan harga dasar ({formatIDR(basePrice || 0)}).
              </p>
              <button
                type="button"
                onClick={addVariant}
                className="mt-3 text-xs font-semibold text-[#B8794A] hover:underline"
              >
                + Tambah Pilihan Varian (Contoh: 16cm, 20cm)
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#DBD0C5] border-y border-[#DBD0C5] dark:divide-white/10 dark:border-white/10">
              {variants.map((v, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                        Nama Varian
                      </label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(idx, "name", e.target.value)}
                        placeholder="Contoh: Diameter 16cm (4-6 Porsi)"
                        className="w-full border-b border-[#BFAE9F] bg-transparent py-1 text-sm font-medium text-[#33262A] outline-none dark:border-white/20 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={v.price}
                        onChange={(e) => updateVariant(idx, "price", e.target.value)}
                        className="w-full border-b border-[#BFAE9F] bg-transparent py-1 text-sm font-semibold tabular-nums text-[#33262A] outline-none dark:border-white/20 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#55464B] dark:text-stone-300 cursor-pointer">
                      <input
                        type="radio"
                        name="default_variant"
                        checked={v.is_default}
                        onChange={() => updateVariant(idx, "is_default", true)}
                        className="text-[#B8794A]"
                      />
                      <span>Pilihan Default</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="touch-target p-1.5 text-rose-600 hover:text-rose-800 dark:text-rose-400"
                      title="Hapus varian"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-4 flex items-center justify-between border border-[#DBD0C5] bg-[#FCFAF6] p-4 shadow-xl dark:border-white/10 dark:bg-[#211B19]">
          <Link
            href="/admin/products"
            className="touch-target border border-[#BFAE9F] px-5 py-2.5 text-sm font-medium text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200 dark:hover:bg-white/10"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="touch-target inline-flex items-center gap-2 border border-[#4D3040] bg-[#4D3040] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#392333] disabled:opacity-50 dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19] dark:hover:bg-[#E5BC96] cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
