"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import type { Category, Product } from "@/types/bakery";
import type { IndustryPreset } from "@/types/catalove";
import { INDUSTRY_PRESETS } from "@/lib/data/universal-presets";
import { formatPrice } from "@/lib/utils/formatters";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { ProductImage as StorefrontProductImage } from "@/components/storefront/ProductImage";
import { prepareCatalogImage } from "@/lib/prepare-catalog-image";

interface EditModalState {
  isOpen: boolean;
  product: Product | null;
  name: string;
  tagline: string;
  badge: string;
  categoryId: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | "";
  leadTime: number;
  flavorNotesStr: string;
  specs: { label: string; value: string }[];
  isActive: boolean;
  isFeatured: boolean;
  images: {
    id: string;
    storage_path: string;
    alt_text: string;
    is_primary: boolean;
    display_order: number;
    status?: "saved" | "uploading" | "error";
  }[];
  variants: {
    id?: string;
    name: string;
    price: number;
    is_default: boolean;
  }[];
}

export default function AdminProductsPage() {
  const settings = useBusinessSettings();
  const currencySymbol = settings.currency_symbol || "Rp";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPreset, setSelectedPreset] = useState<IndustryPreset>(
    settings.industry_preset || "general"
  );
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Category Manager Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Full Edit Product Modal State
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    product: null,
    name: "",
    tagline: "",
    badge: "",
    categoryId: "",
    description: "",
    basePrice: 0,
    compareAtPrice: "",
    leadTime: 2,
    flavorNotesStr: "",
    specs: [],
    isActive: true,
    isFeatured: false,
    images: [],
    variants: [],
  });
  const [modalSaving, setModalSaving] = useState(false);

  const loadCategories = async () => {
    const cats = await cakeService.getCategories();
    setCategories(cats);
  };

  const loadProducts = async () => {
    const list = await cakeService.getProducts({ includeInactive: true });
    setProducts(list);
  };

  useEffect(() => {
    void loadProducts();
    void loadCategories();
  }, []);

  const handleLoadPresetCatalog = async () => {
    const presetInfo = INDUSTRY_PRESETS[selectedPreset];
    if (!presetInfo) return;
    if (
      !confirm(
        `Muat contoh produk & kategori untuk usaha "${presetInfo.label}"? Katalog lokal akan diisi produk contoh siap pakai yang bisa Anda edit.`
      )
    ) {
      return;
    }

    setApplyingPreset(true);
    try {
      const result = await cakeService.applyIndustryPresetCatalog(selectedPreset);
      setCategories(result.categories);
      setProducts(result.products);
      setSelectedCategory("all");
      setFeedback({
        text: `Berhasil memuat ${result.products.length} contoh produk preset "${presetInfo.label}".`,
        type: "success",
      });
    } catch {
      setFeedback({ text: "Gagal memuat contoh produk preset.", type: "error" });
    } finally {
      setApplyingPreset(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const created = await cakeService.createCategory({ name: newCatName.trim() });
      setNewCatName("");
      setFeedback({ text: `Kategori "${created.name}" berhasil dibuat.`, type: "success" });
      await loadCategories();
    } catch (err: unknown) {
      setFeedback({
        text: err instanceof Error ? err.message : "Gagal membuat kategori.",
        type: "error",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Hapus kategori "${catName}"? Produk di dalamnya tidak akan terhapus tapi menjadi tanpa kategori.`)) return;
    try {
      const ok = await cakeService.deleteCategory(catId);
      if (ok) {
        setFeedback({ text: `Kategori "${catName}" berhasil dihapus.`, type: "success" });
        await loadCategories();
        await loadProducts();
      } else {
        setFeedback({ text: "Gagal menghapus kategori.", type: "error" });
      }
    } catch {
      setFeedback({ text: "Gagal menghapus kategori.", type: "error" });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus produk "${product.name}"?\n\nTindakan ini akan menghapus produk dari etalase toko.`
    );
    if (!confirmed) return;

    try {
      const res = await cakeService.deleteProduct(product.id);
      if (res.success) {
        setFeedback({ text: res.message || `Produk "${product.name}" berhasil dihapus.`, type: "success" });
        if (editModal.isOpen && editModal.product?.id === product.id) {
          setEditModal((prev) => ({ ...prev, isOpen: false }));
        }
        await loadProducts();
      } else {
        setFeedback({ text: res.message || "Gagal menghapus produk.", type: "error" });
      }
    } catch (err: unknown) {
      setFeedback({ text: err instanceof Error ? err.message : "Gagal menghapus produk.", type: "error" });
    }
  };

  const handleToggleDisplay = async (product: Product) => {
    const nextState = !product.is_active;
    try {
      await cakeService.toggleProductActive(product.id, nextState);
      setFeedback({
        text: nextState
          ? `Produk "${product.name}" sekarang TAYANG di toko.`
          : `Produk "${product.name}" DISEMBUNYIKAN dari etalase toko.`,
        type: "success",
      });
      await loadProducts();
    } catch {
      setFeedback({ text: "Gagal mengubah status tayang produk.", type: "error" });
    }
  };

  const openEditModal = (product: Product) => {
    setEditModal({
      isOpen: true,
      product,
      name: product.name,
      tagline: product.tagline || "",
      badge: product.badge || "",
      categoryId: product.category_id || "",
      description: product.description,
      basePrice: product.base_price,
      compareAtPrice: product.compare_at_price ?? "",
      leadTime: product.minimum_lead_time_days,
      flavorNotesStr: (product.flavor_notes || []).join(", "),
      specs: (product.specs || []).map((s) => ({ label: s.label, value: s.value })),
      isActive: product.is_active,
      isFeatured: product.is_featured,
      images: (product.images || []).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        storage_path: img.storage_path,
        alt_text: img.alt_text || product.name,
        is_primary: img.is_primary,
        display_order: img.display_order ?? idx + 1,
        status: "saved",
      })),
      variants: (product.variants || []).map((v, idx) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        is_default: v.is_default ?? idx === 0,
      })),
    });
  };

  const handleModalFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const tempId = `new-${Date.now()}-${i}`;

      const newItem = {
        id: tempId,
        storage_path: previewUrl,
        alt_text: `${editModal.name} foto`,
        is_primary: editModal.images.length === 0 && i === 0,
        display_order: editModal.images.length + i + 1,
        status: "uploading" as const,
      };

      setEditModal((prev) => ({
        ...prev,
        images: [...prev.images, newItem],
      }));

      try {
        const formData = new FormData();
        formData.append("file", await prepareCatalogImage(file));
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setEditModal((prev) => ({
            ...prev,
            images: prev.images.map((img) =>
              img.id === tempId ? { ...img, storage_path: data.url, status: "saved" } : img
            ),
          }));
        }
      } catch {
        setEditModal((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.id === tempId ? { ...img, status: "error" } : img
          ),
        }));
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.product) return;
    if (!editModal.name.trim()) {
      alert("Nama produk wajib diisi.");
      return;
    }
    if (!Number.isFinite(editModal.basePrice) || editModal.basePrice < 1000) {
      alert("Harga dasar minimal Rp1.000.");
      return;
    }

    setModalSaving(true);
    try {
      const flavorNotes = editModal.flavorNotesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const cleanSpecs = editModal.specs
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .filter((s) => s.label && s.value);

      const payload = {
        name: editModal.name.trim(),
        tagline: editModal.tagline.trim() || undefined,
        badge: editModal.badge.trim() || undefined,
        category_id: editModal.categoryId || null,
        description:
          editModal.description.trim() ||
          `${editModal.name.trim()} dari koleksi ${settings.store_name || "Catalove"}.`,
        flavor_notes: flavorNotes.length > 0 ? flavorNotes : ["Best Seller"],
        specs: cleanSpecs,
        base_price: Number(editModal.basePrice),
        compare_at_price:
          editModal.compareAtPrice !== "" && Number(editModal.compareAtPrice) > 0
            ? Number(editModal.compareAtPrice)
            : null,
        minimum_lead_time_days: Number(editModal.leadTime),
        is_active: editModal.isActive,
        is_featured: editModal.isFeatured,
        variants: editModal.variants.map((v, idx) => ({
          name: v.name.trim(),
          price: Number(v.price),
          is_default: v.is_default,
          display_order: idx + 1,
        })),
        images: editModal.images.map((img, idx) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || editModal.name,
          is_primary: img.is_primary,
          display_order: idx + 1,
        })),
      };

      const updated = await cakeService.updateProduct(editModal.product.id, payload);
      if (updated) {
        setFeedback({ text: `Perubahan "${editModal.name}" berhasil disimpan!`, type: "success" });
        setEditModal((prev) => ({ ...prev, isOpen: false }));
        await loadProducts();
      } else {
        alert("Gagal memperbarui produk.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setModalSaving(false);
    }
  };

  const moveProductOrder = async (index: number, direction: -1 | 1) => {
    const from = products.findIndex((product) => product.id === visibleProducts[index]?.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= products.length) return;
    const ordered = [...products];
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    setProducts(ordered);
    await cakeService.reorderProducts(ordered.map((product) => product.id));
  };

  const visibleProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category_id === selectedCategory);
    }
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }
    return list;
  }, [products, search, selectedCategory]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 border-b border-[#DBD0C5] pb-6 sm:flex-row sm:items-end dark:border-white/10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#8D624C] dark:text-[#C88A42]">
            Katalog & Manajemen Produk
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium text-[#4D3040] sm:text-4xl dark:text-white">
            Kelola Produk Katalog
          </h1>
          <p className="mt-2 text-sm text-[#67575B] dark:text-stone-300">
            Tambah produk baru, kelola foto, deskripsi, varian ukuran/warna, harga, sembunyikan atau hapus produk.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="touch-target inline-flex items-center gap-2 border border-[#BFAE9F] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-100 dark:hover:bg-white/10"
          >
            <FolderPlus size={16} /> Kelola Kategori ({categories.length})
          </button>
          <Link
            href="/admin/products/bulk"
            className="touch-target inline-flex items-center gap-2 border border-[#BFAE9F] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-100 dark:hover:bg-white/10"
          >
            <span>Upload Banyak</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="touch-target inline-flex items-center gap-2 border border-[#4D3040] bg-[#4D3040] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#392333] dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19] dark:hover:bg-[#E5BC96]"
          >
            <Plus size={16} />
            <span>+ Tambah Produk Baru</span>
          </Link>
        </div>
      </header>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between border-l-2 p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search, Category & Preset Catalog Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#DBD0C5]/70 bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#211B19]">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--storefront-accent)]" />
            <div>
              <p className="text-xs font-bold text-[#4D3040] dark:text-white">
                Muat Contoh Produk Preset Usaha
              </p>
              <p className="text-[11px] text-[#67575B] dark:text-stone-400">
                Isi katalog secara instan sesuai bidang usaha (Fashion, Bakery, Florist, Craft, Gadget, Jasa).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value as IndustryPreset)}
              className="border border-[#BFAE9F] bg-white px-3 py-2 text-xs font-semibold text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:bg-[#1A1412] dark:text-white"
            >
              {(Object.keys(INDUSTRY_PRESETS) as IndustryPreset[]).map((key) => (
                <option key={key} value={key}>
                  {INDUSTRY_PRESETS[key].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleLoadPresetCatalog}
              disabled={applyingPreset}
              className="touch-target inline-flex items-center gap-1.5 border border-[#4D3040] bg-[#4D3040] px-4 py-2 text-xs font-semibold text-white hover:bg-[#392333] disabled:opacity-50 dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19]"
            >
              {applyingPreset ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Muat Preset</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau deskripsi produk..."
                aria-label="Cari produk"
                className="w-full border border-[#BFAE9F] bg-transparent py-2 pl-9 pr-3 text-sm focus:border-[#4D3040] focus:outline-none dark:border-white/20 dark:text-white"
              />
            </label>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-[#BFAE9F] bg-transparent px-3 py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:bg-[#1A1412] dark:text-white"
            >
              <option value="all">Semua Kategori ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#67575B] dark:text-stone-400">
            Total: <span className="font-semibold text-[#4D3040] dark:text-white">{visibleProducts.length}</span> produk
          </p>
        </div>
      </div>

      {/* Product Cards List */}
      <div className="space-y-4">
        {visibleProducts.map((product, index) => {
          const image = product.images.find((item) => item.is_primary) ?? product.images[0];
          const isReady = product.minimum_lead_time_days === 0;

          return (
            <article
              key={product.id}
              className={`grid gap-5 border p-4 sm:p-5 transition-colors sm:grid-cols-[5rem_1fr_auto] sm:items-center ${
                product.is_active
                  ? "border-[#DBD0C5] bg-[#FCFAF6] dark:border-white/10 dark:bg-[#211B19]"
                  : "border-stone-300 bg-stone-100/75 opacity-80 dark:border-white/5 dark:bg-stone-900/50"
              }`}
            >
              {/* Product Thumbnail */}
              <div className="relative h-20 w-20 sm:h-20 sm:w-20 overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0">
                {image ? (
                  <StorefrontProductImage
                    src={image.storage_path}
                    alt={product.name}
                    sizes="80px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                    No image
                  </div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  {isReady ? "Ready" : `H-${product.minimum_lead_time_days}`}
                </span>
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-lg font-semibold text-[#4D3040] dark:text-white">
                    {product.name}
                  </h2>
                  <span className="text-xs text-[#8D624C] dark:text-[#D1A686]">
                    ({product.category?.name || "Tanpa Kategori"})
                  </span>
                  {product.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Tayang di Toko
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                      <EyeOff size={10} /> Disembunyikan
                    </span>
                  )}
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-[#67575B] dark:text-stone-300">
                  {product.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <span className="font-semibold text-[#4D3040] dark:text-white">
                    Mulai {formatPrice(product.base_price, currencySymbol)}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.base_price && (
                    <span className="text-stone-400 line-through">
                      {formatPrice(product.compare_at_price, currencySymbol)}
                    </span>
                  )}
                  <span className="text-[#806C71] dark:text-stone-400">
                    {isReady ? "Siap hari ini (Ready)" : `Pre-Order H-${product.minimum_lead_time_days}`}
                  </span>
                  <span className="text-[#806C71] dark:text-stone-400">
                    {product.variants?.length || 0} varian
                  </span>
                  <span className="text-[#806C71] dark:text-stone-400">
                    {product.images?.length || 0} foto
                  </span>
                </div>
              </div>

              {/* Explicit CRUD Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:justify-center">
                <div className="flex items-center gap-2">
                  {/* FULL EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="touch-target inline-flex items-center gap-1.5 border border-[#4D3040] bg-[#4D3040] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#392333] dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19] cursor-pointer"
                    title="Edit lengkap: deskripsi, foto, varian, harga, spesifikasi"
                  >
                    <Pencil size={13} />
                    <span>Edit Lengkap</span>
                  </button>

                  {/* TOGGLE DISPLAY BUTTON (Sembunyikan / Tayangkan) */}
                  <button
                    type="button"
                    onClick={() => void handleToggleDisplay(product)}
                    className={`touch-target inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      product.is_active
                        ? "border-[#BFAE9F] text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200 dark:hover:bg-white/10"
                        : "border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                    title={product.is_active ? "Sembunyikan produk dari etalase" : "Tayangkan kembali ke etalase"}
                  >
                    {product.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{product.is_active ? "Sembunyikan" : "Tayangkan"}</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => void handleDeleteProduct(product)}
                    className="touch-target inline-flex items-center gap-1 border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 cursor-pointer"
                    title="Hapus produk permanen"
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {/* Reorder Position */}
                  <button
                    type="button"
                    onClick={() => void moveProductOrder(index, -1)}
                    disabled={index === 0}
                    className="p-1 text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white disabled:opacity-30"
                    title="Naikkan urutan"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void moveProductOrder(index, 1)}
                    disabled={index === visibleProducts.length - 1}
                    className="p-1 text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white disabled:opacity-30"
                    title="Turunkan urutan"
                  >
                    <ArrowDown size={14} />
                  </button>

                  {/* View on storefront */}
                  <Link
                    href={`/product/${product.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] text-[#8D624C] hover:underline dark:text-amber-400 ml-2"
                  >
                    <span>Lihat di Toko</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {visibleProducts.length === 0 && (
          <div className="border border-dashed border-[#DBD0C5] py-16 text-center dark:border-white/15">
            <p className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
              Tidak ada produk yang cocok.
            </p>
            <p className="mt-2 text-sm text-[#67575B] dark:text-stone-400">
              Ubah kata kunci pencarian atau buat produk baru.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-5 inline-flex items-center gap-2 border border-[#4D3040] bg-[#4D3040] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#392333] dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19]"
            >
              <Plus size={14} /> Tambah Produk Baru
            </Link>
          </div>
        )}
      </div>

      {/* FULL EDIT PRODUCT MODAL */}
      {editModal.isOpen && editModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl bg-[#FCFAF6] p-6 shadow-2xl dark:bg-[#211B19] dark:border dark:border-white/15 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DBD0C5] pb-4 dark:border-white/10 sticky top-0 bg-[#FCFAF6] dark:bg-[#211B19] z-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#8D624C] dark:text-[#C88A42]">
                  Edit Produk Lengkap
                </p>
                <h2 className="font-serif text-2xl font-bold text-[#4D3040] dark:text-white">
                  {editModal.name || "Edit Produk"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-6 pt-5">
              {/* 1. Nama, Tagline, Badge & Kategori */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.name}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-1.5 text-base font-semibold text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Tagline / Sub-Judul Singkat
                  </label>
                  <input
                    type="text"
                    value={editModal.tagline}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Contoh: 100% katun combed / Batch terbatas"
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-1.5 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Badge Sorotan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editModal.badge}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="Contoh: Best Seller, Baru, Limited"
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-1.5 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Kategori
                  </label>
                  <select
                    value={editModal.categoryId}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:bg-[#1A1412] dark:text-white"
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                      Harga Dasar ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      required
                      value={editModal.basePrice || ""}
                      onChange={(e) =>
                        setEditModal((prev) => ({ ...prev, basePrice: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm font-semibold tabular-nums text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                      Harga Coret (Promo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Opsional"
                      value={editModal.compareAtPrice}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          compareAtPrice: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                        }))
                      }
                      className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm tabular-nums text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Deskripsi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Deskripsi Produk *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editModal.description}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan keunggulan produk, bahan/material, spesifikasi, dan keunikannya..."
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm leading-relaxed text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              {/* 3. Lead Time & Tag Produk */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Minimum Waktu Persiapan (Lead Time)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={editModal.leadTime}
                      onChange={(e) =>
                        setEditModal((prev) => ({ ...prev, leadTime: Math.max(0, Number(e.target.value)) }))
                      }
                      className="w-20 border-b border-[#BFAE9F] bg-transparent py-1.5 text-sm font-semibold text-[#33262A] outline-none dark:border-white/20 dark:text-white"
                    />
                    <span className="text-xs text-[#55464B] dark:text-stone-300">
                      {editModal.leadTime === 0 ? "Ready Stock (Hari ini)" : `Hari (Pesan H-${editModal.leadTime})`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Tag / Keunggulan Utama (Pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={editModal.flavorNotesStr}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, flavorNotesStr: e.target.value }))}
                    placeholder="Contoh: Best Seller, Handmade, Premium Material"
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-1.5 text-sm text-[#33262A] outline-none dark:border-white/20 dark:text-white"
                  />
                </div>
              </div>

              {/* 3b. Spesifikasi Produk (Key-Value) */}
              <div className="space-y-2.5 pt-2 border-t border-[#DBD0C5]/40 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                    Spesifikasi Produk ({editModal.specs.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditModal((prev) => ({
                        ...prev,
                        specs: [...prev.specs, { label: "", value: "" }],
                      }))
                    }
                    className="text-xs font-semibold text-[#B8794A] hover:underline"
                  >
                    + Tambah Spesifikasi
                  </button>
                </div>
                {editModal.specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          specs: prev.specs.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item
                          ),
                        }))
                      }
                      placeholder="Label (cth: Material / Isi / Garansi)"
                      className="w-1/3 border-b border-[#BFAE9F] bg-transparent py-1 text-xs text-[#33262A] dark:text-white"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          specs: prev.specs.map((item, i) =>
                            i === idx ? { ...item, value: e.target.value } : item
                          ),
                        }))
                      }
                      placeholder="Nilai (cth: Linen 100% / 1 Tahun)"
                      className="flex-1 border-b border-[#BFAE9F] bg-transparent py-1 text-xs text-[#33262A] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal((prev) => ({
                          ...prev,
                          specs: prev.specs.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-rose-600 p-1 hover:text-rose-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 4. Toggles: Tayang di Toko / Sembunyikan */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-[#DBD0C5]/40 dark:border-white/10">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.isActive}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-stone-300 text-[#4D3040]"
                  />
                  <span className="text-xs font-semibold text-[#33262A] dark:text-white">
                    Tayangkan di Etalase Toko (Centang agar tampil, uncheck untuk sembunyikan)
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.isFeatured}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 rounded border-stone-300 text-[#4D3040]"
                  />
                  <span className="text-xs font-semibold text-[#33262A] dark:text-white">
                    Tampilkan sebagai Pilihan Utama di Beranda
                  </span>
                </label>
              </div>

              {/* 5. Foto Produk */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                    Foto Produk ({editModal.images.length})
                  </label>
                  <label className="cursor-pointer text-xs font-semibold text-[#B8794A] hover:underline flex items-center gap-1">
                    <UploadCloud size={14} /> + Upload Foto Baru
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleModalFileUpload(e.target.files)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {editModal.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-stone-100 dark:bg-stone-800 ${
                        img.is_primary ? "border-[#B8794A]" : "border-stone-200 dark:border-white/10"
                      }`}
                    >
                      <Image
                        src={img.storage_path}
                        alt="Foto produk"
                        fill
                        className="object-cover"
                      />
                      {img.is_primary && (
                        <span className="absolute top-1 left-1 bg-[#B8794A] px-1 py-0.5 text-[8px] font-bold text-white rounded">
                          Utama
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex flex-col justify-between p-1 transition-opacity">
                        <button
                          type="button"
                          onClick={() =>
                            setEditModal((prev) => ({
                              ...prev,
                              images: prev.images.filter((i) => i.id !== img.id),
                            }))
                          }
                          className="self-end bg-rose-600 text-white p-1 rounded"
                          title="Hapus foto"
                        >
                          <Trash2 size={12} />
                        </button>
                        {!img.is_primary && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditModal((prev) => ({
                                ...prev,
                                images: prev.images.map((i) => ({ ...i, is_primary: i.id === img.id })),
                              }))
                            }
                            className="bg-white text-[9px] font-bold text-[#4D3040] py-0.5 rounded"
                          >
                            Set Utama
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Varian & Harga */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686]">
                    Varian &amp; Harga ({editModal.variants.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditModal((prev) => ({
                        ...prev,
                        variants: [
                          ...prev.variants,
                          {
                            name: `Varian ${prev.variants.length + 1}`,
                            price: prev.basePrice || 0,
                            is_default: prev.variants.length === 0,
                          },
                        ],
                      }))
                    }
                    className="text-xs font-semibold text-[#B8794A] hover:underline"
                  >
                    + Tambah Varian
                  </button>
                </div>

                {editModal.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-1">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item, i) =>
                            i === idx ? { ...item, name: e.target.value } : item
                          ),
                        }))
                      }
                      placeholder="Nama Varian (cth: Standar / M / Biru / Paket A)"
                      className="flex-1 border-b border-[#BFAE9F] bg-transparent py-1 text-xs text-[#33262A] dark:text-white"
                    />
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item, i) =>
                            i === idx ? { ...item, price: Math.max(0, Number(e.target.value)) } : item
                          ),
                        }))
                      }
                      placeholder="Harga (Rp)"
                      className="w-28 border-b border-[#BFAE9F] bg-transparent py-1 text-xs tabular-nums text-[#33262A] dark:text-white"
                    />
                    <label className="inline-flex items-center gap-1 text-[11px] text-stone-500 cursor-pointer">
                      <input
                        type="radio"
                        name="modal_default_variant"
                        checked={v.is_default}
                        onChange={() =>
                          setEditModal((prev) => ({
                            ...prev,
                            variants: prev.variants.map((item, i) => ({ ...item, is_default: i === idx })),
                          }))
                        }
                      />
                      <span>Default</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal((prev) => ({
                          ...prev,
                          variants: prev.variants.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-rose-600 p-1 hover:text-rose-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-[#DBD0C5] pt-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(editModal.product!)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} /> Hapus Produk Ini
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                    className="border border-[#BFAE9F] px-4 py-2 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="inline-flex items-center gap-2 border border-[#4D3040] bg-[#4D3040] px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#392333] disabled:opacity-50 dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19] cursor-pointer"
                  >
                    {modalSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#FCFAF6] p-6 shadow-2xl dark:bg-[#211B19] dark:border dark:border-white/15">
            <div className="flex items-center justify-between border-b border-[#DBD0C5] pb-4 dark:border-white/10">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#4D3040] dark:text-white">
                  Kelola Kategori Produk
                </h2>
                <p className="text-xs text-[#67575B] dark:text-stone-300 mt-1">
                  Buat kategori baru sesuai usaha Anda atau hapus yang tidak dipakai.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="mt-4 flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Contoh: Koleksi Utama, Best Seller, Bundling..."
                className="flex-1 border-b border-[#BFAE9F] bg-transparent px-3 py-2 text-xs text-[#33262A] dark:text-white dark:border-white/20 focus:outline-none focus:border-[#4D3040]"
              />
              <button
                type="submit"
                disabled={isCreatingCategory || !newCatName.trim()}
                className="border border-[#4D3040] bg-[#4D3040] px-4 py-2 text-xs font-semibold text-white hover:bg-[#392333] disabled:opacity-50 dark:border-[#C88A42] dark:bg-[#C88A42] dark:text-[#211B19]"
              >
                {isCreatingCategory ? "..." : "+ Tambah"}
              </button>
            </form>

            <div className="mt-5 max-h-60 overflow-y-auto divide-y divide-[#DBD0C5] dark:divide-white/10 border-y border-[#DBD0C5] dark:border-white/10">
              {categories.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#806C71] dark:text-stone-400">
                  Belum ada kategori. Kategori produk bebas, silakan buat baru di atas!
                </p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#4D3040] dark:text-stone-100">
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-[#806C71] dark:text-stone-400">
                        slug: {cat.slug}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(cat.id, cat.name)}
                      className="touch-target p-2 text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300"
                      title="Hapus kategori ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="border border-[#BFAE9F] px-5 py-2 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/20 dark:text-stone-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
