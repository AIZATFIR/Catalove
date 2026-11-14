"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2, UploadCloud, X, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { cakeService } from "@/lib/services/cake-service";
import type { Category } from "@/types/bakery";
import { ProductImage } from "@/components/storefront/ProductImage";
import { MotionIcon } from "@/components/ui/MotionIcon";

type PhotoItem = {
  id: string;
  file?: File;
  previewUrl: string;
  uploadedUrl?: string;
  storagePath?: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
};

type BulkRow = {
  key: string;
  name: string;
  price: string;
  categoryId: string;
  leadTime: string;
  description: string;
  flavorNotes: string[];
  photos: PhotoItem[];
};

const makeRow = (): BulkRow => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "",
  price: "",
  categoryId: "",
  leadTime: "2",
  description: "",
  flavorNotes: [],
  photos: [],
});

export default function BulkProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>(() => Array.from({ length: 4 }, makeRow));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [aiLoadingKey, setAiLoadingKey] = useState<string | null>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    cakeService.getCategories().then((cats) => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => [...prev, data.category]);
        setNewCatName("");
        setIsAddingNewCategory(false);
        setFeedback(`Kategori "${data.category.name}" berhasil dibuat.`);
      } else {
        setFeedback(data.error || "Gagal membuat kategori baru");
      }
    } catch {
      setFeedback("Gagal membuat kategori baru");
    } finally {
      setCreatingCategory(false);
    }
  };

  const updateRow = (key: string, changes: Partial<BulkRow>) => {
    setRows((current) => current.map((row) => row.key === key ? { ...row, ...changes } : row));
  };

  const uploadSinglePhoto = async (rowKey: string, photoId: string, file: File) => {
    // Set status uploading
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              photos: row.photos.map((p) =>
                p.id === photoId ? { ...p, status: "uploading", errorMsg: undefined } : p
              ),
            }
          : row
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah foto");
      }

      setRows((current) =>
        current.map((row) =>
          row.key === rowKey
            ? {
                ...row,
                photos: row.photos.map((p) =>
                  p.id === photoId
                    ? {
                        ...p,
                        status: "success",
                        uploadedUrl: data.url,
                        storagePath: data.storage_path,
                      }
                    : p
                ),
              }
            : row
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal upload";
      setRows((current) =>
        current.map((row) =>
          row.key === rowKey
            ? {
                ...row,
                photos: row.photos.map((p) =>
                  p.id === photoId ? { ...p, status: "error", errorMsg: msg } : p
                ),
              }
            : row
        )
      );
    }
  };

  const addPhotos = (key: string, files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const row = rows.find((item) => item.key === key);
    const remaining = Math.max(0, 10 - (row?.photos.length ?? 0));

    const newPhotoItems: PhotoItem[] = selectedFiles.slice(0, remaining).map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      const photoId = `photo-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        id: photoId,
        file,
        previewUrl,
        status: "pending",
      };
    });

    setRows((current) =>
      current.map((r) =>
        r.key === key ? { ...r, photos: [...r.photos, ...newPhotoItems].slice(0, 10) } : r
      )
    );

    // Auto trigger upload in background
    newPhotoItems.forEach((item) => {
      if (item.file) {
        uploadSinglePhoto(key, item.id, item.file);
      }
    });

    if (selectedFiles.length > remaining) {
      setFeedback("Maksimal 10 foto per kue. Foto sisanya tidak ditambahkan.");
    }
  };

  const removePhoto = (rowKey: string, photoId: string) => {
    const row = rows.find((item) => item.key === rowKey);
    const photo = row?.photos.find((p) => p.id === photoId);
    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl);
      objectUrls.current.delete(photo.previewUrl);
    }
    setRows((current) =>
      current.map((r) =>
        r.key === rowKey ? { ...r, photos: r.photos.filter((p) => p.id !== photoId) } : r
      )
    );
  };

  const setCoverPhoto = (rowKey: string, photoId: string) => {
    setRows((current) =>
      current.map((r) => {
        if (r.key !== rowKey) return r;
        const target = r.photos.find((p) => p.id === photoId);
        if (!target) return r;
        return {
          ...r,
          photos: [target, ...r.photos.filter((p) => p.id !== photoId)],
        };
      })
    );
  };

  const removeRow = (key: string) => {
    const row = rows.find((item) => item.key === key);
    row?.photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
      objectUrls.current.delete(photo.previewUrl);
    });
    setRows((current) => current.filter((item) => item.key !== key));
  };

  const requestAiSuggestions = async (rowKey: string) => {
    const row = rows.find((r) => r.key === rowKey);
    const firstUploaded = row?.photos.find((p) => p.status === "success" && p.uploadedUrl);

    if (!firstUploaded?.uploadedUrl) {
      setFeedback("Tunggu minimal satu foto selesai diunggah sebelum meminta saran AI.");
      return;
    }

    setAiLoadingKey(rowKey);
    setFeedback("");

    try {
      const res = await fetch("/api/ai/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: firstUploaded.uploadedUrl }),
      });

      const data = await res.json();

      if (!data.available) {
        setFeedback(data.message || "Saran AI belum tersedia.");
        return;
      }

      if (data.suggestions) {
        updateRow(rowKey, {
          description: data.suggestions.draft_description || row?.description,
          flavorNotes: data.suggestions.flavor_notes || row?.flavorNotes,
        });
        setFeedback(`Saran rasa dan deskripsi diterapkan untuk kue ${rows.findIndex(r => r.key === rowKey) + 1}. Mama tetap bisa mengubahnya.`);
      }
    } catch {
      setFeedback("Kendala saat menghubungi layanan AI. Mama dapat mengisi deskripsi secara manual.");
    } finally {
      setAiLoadingKey(null);
    }
  };

  const saveRows = async () => {
    const filled = rows.filter((row) => row.name.trim() || row.price.trim());
    if (!filled.length) {
      setFeedback("Isi nama dan harga untuk minimal satu produk.");
      return;
    }
    if (filled.some((row) => !row.name.trim() || Number(row.price) < 1000)) {
      setFeedback("Setiap baris perlu nama dan harga minimal Rp1.000.");
      return;
    }
    if (filled.some((row) => row.photos.length === 0)) {
      setFeedback("Pilih minimal satu foto untuk setiap kue yang akan ditambahkan.");
      return;
    }

    // Check if any photo is still uploading or has error
    const anyUploading = filled.some((row) => row.photos.some((p) => p.status === "uploading"));
    if (anyUploading) {
      setFeedback("Harap tunggu beberapa saat hingga seluruh foto selesai diunggah.");
      return;
    }

    const anyError = filled.some((row) => row.photos.some((p) => p.status === "error"));
    if (anyError) {
      setFeedback("Ada foto yang gagal diunggah. Ketuk 'Coba lagi' pada foto bermasalah.");
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      for (const row of filled) {
        const primaryImage = row.photos[0];
        await cakeService.createProduct({
          name: row.name.trim(),
          category_id: row.categoryId,
          description: row.description.trim() || `${row.name.trim()} produk pilihan dengan kualitas terjaga.`,
          flavor_notes: row.flavorNotes.length > 0 ? row.flavorNotes : ["Best Seller", "Kualitas Premium"],
          specs: [],
          base_price: Number(row.price),
          minimum_lead_time_days: Number(row.leadTime),
          is_active: true,
          is_featured: false,
          variants: [],
          images: row.photos.map((p, index) => ({
            storage_path: p.uploadedUrl || p.storagePath || p.previewUrl,
            alt_text: `${row.name.trim()} foto ${index + 1}`,
            is_primary: index === 0,
            display_order: index + 1,
          })),
        });
      }

      setFeedback(`${filled.length} produk berhasil disimpan secara permanen di database SofizCake.`);
      window.setTimeout(() => router.push("/admin/products"), 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Produk belum tersimpan. Periksa data lalu coba lagi.";
      setFeedback(msg);
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <header className="flex items-start gap-4 border-b border-caramel-200 pb-6 dark:border-white/10">
        <Link href="/admin/products" aria-label="Kembali ke katalog" className="touch-target inline-flex items-center justify-center border border-caramel-300 text-cocoa-800 hover:bg-vanilla-100 dark:border-white/20 dark:text-stone-200 dark:hover:bg-stone-900">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-medium text-cocoa-950 sm:text-3xl dark:text-white">Tambah banyak kue</h1>
          <p className="mt-2 max-w-xl text-sm text-cocoa-600 dark:text-stone-300">
            Satu baris untuk satu jenis kue. Isi nama, harga, dan kategori, lalu pilih foto kue langsung dari galeri HP Mama.
          </p>
        </div>
      </header>

      <aside className="border-l-2 border-caramel-500 bg-vanilla-100 px-4 py-3 text-sm leading-6 text-cocoa-700 dark:bg-stone-900 dark:border-[#C88A42] dark:text-stone-300">
        <strong className="font-semibold text-cocoa-900 dark:text-white">Cara cepat:</strong> pilih “Pilih foto untuk kue ini” dan tandai foto kue dari HP. Foto otomatis diunggah aman ke penyimpanan cloud SofizCake. Foto pertama jadi foto sampul. Mama tetap bebas menentukan nama dan harga sendiri.
      </aside>

      {feedback && (
        <div role="alert" className="border-l-2 border-caramel-600 bg-white p-4 text-sm text-cocoa-900 shadow-sm dark:bg-stone-900 dark:text-stone-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-cocoa-400 hover:text-cocoa-600"><X size={16} /></button>
        </div>
      )}

      {/* Quick Category Creator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-vanilla-100 dark:bg-stone-900 border border-caramel-300 dark:border-white/10 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cocoa-800 dark:text-stone-200">Kategori:</span>
          <span className="text-xs text-cocoa-600 dark:text-stone-400 font-medium">
            {categories.length > 0 ? categories.map((c) => c.name).join(", ") : "Belum ada kategori"}
          </span>
        </div>
        {isAddingNewCategory ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ketik nama kategori baru..."
              className="px-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-caramel-300 dark:border-white/20 rounded-xl text-cocoa-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleQuickAddCategory}
              disabled={creatingCategory || !newCatName.trim()}
              className="px-3 py-1.5 bg-caramel-600 hover:bg-caramel-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              {creatingCategory ? "..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNewCategory(false)}
              className="text-xs text-cocoa-600 hover:text-cocoa-900 dark:text-stone-400"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingNewCategory(true)}
            className="text-xs font-semibold text-caramel-700 hover:text-caramel-900 dark:text-amber-400"
          >
            + Buat Kategori Baru
          </button>
        )}
      </div>

      <div className="divide-y divide-caramel-200 border-y border-caramel-200 dark:divide-white/10 dark:border-white/10">
        {rows.map((row, index) => (
          <section key={row.key} className="grid gap-4 border-b border-caramel-100 py-6 xl:grid-cols-[3rem_minmax(14rem,1.5fr)_minmax(10rem,.9fr)_minmax(19rem,1.7fr)_12rem_auto] xl:items-end dark:border-white/5">
            <span className="text-xs font-semibold text-cocoa-500 dark:text-stone-400">Kue {index + 1}</span>

            <label className="block text-xs font-semibold text-cocoa-700 dark:text-stone-200">
              Nama kue
              <input
                value={row.name}
                onChange={(event) => updateRow(row.key, { name: event.target.value })}
                placeholder="Contoh: Tart Stroberi Chantilly"
                className="mt-1 w-full border-b border-caramel-300 bg-transparent px-0 py-2 text-sm text-cocoa-950 placeholder:text-cocoa-400 focus:border-caramel-700 focus:outline-none dark:border-white/20 dark:text-white dark:focus:border-[#C88A42]"
              />
            </label>

            <label className="block text-xs font-semibold text-cocoa-700 dark:text-stone-200">
              Harga (Rp)
              <input
                inputMode="numeric"
                value={row.price}
                onChange={(event) => updateRow(row.key, { price: event.target.value.replace(/\D/g, "") })}
                placeholder="250000"
                className="mt-1 w-full border-b border-caramel-300 bg-transparent px-0 py-2 text-sm tabular-nums text-cocoa-950 placeholder:text-cocoa-400 focus:border-caramel-700 focus:outline-none dark:border-white/20 dark:text-white dark:focus:border-[#C88A42]"
              />
            </label>

            <div className="grid grid-cols-[1.5fr_1fr] gap-3">
              <label className="block text-xs font-semibold text-cocoa-700 dark:text-stone-200">
                Kategori
                <select
                  value={row.categoryId}
                  onChange={(event) => updateRow(row.key, { categoryId: event.target.value })}
                  className="mt-1 w-full border-b border-caramel-300 bg-transparent py-2 text-sm text-cocoa-950 focus:border-caramel-700 focus:outline-none dark:border-white/20 dark:text-white dark:bg-stone-900"
                >
                    <option value="" className="dark:bg-stone-900 dark:text-white">
                      (Tanpa Kategori)
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="dark:bg-stone-900 dark:text-white">
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-cocoa-700 dark:text-stone-200">
                Persiapan (hari)
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={row.leadTime}
                  onChange={(event) => updateRow(row.key, { leadTime: event.target.value })}
                  className="mt-1 w-full border-b border-caramel-300 bg-transparent py-2 text-sm text-cocoa-950 focus:border-caramel-700 focus:outline-none dark:border-white/20 dark:text-white"
                />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="touch-target flex-1 inline-flex cursor-pointer items-center justify-center gap-2 border border-caramel-300 px-3 text-xs font-semibold text-cocoa-800 hover:bg-vanilla-100 dark:border-white/20 dark:text-stone-200 dark:hover:bg-stone-900">
                <MotionIcon icon={UploadCloud} size={16} />
                <span>{row.photos.length ? `${row.photos.length}/10 foto` : "Pilih foto kue"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    addPhotos(row.key, event.target.files);
                    event.currentTarget.value = "";
                  }}
                  className="sr-only"
                  aria-label={`Pilih beberapa foto untuk ${row.name || `kue ${index + 1}`}`}
                />
              </label>

              {row.photos.some((p) => p.status === "success") && (
                <button
                  type="button"
                  onClick={() => requestAiSuggestions(row.key)}
                  disabled={aiLoadingKey === row.key}
                  title="Saran AI untuk deskripsi & rasa"
                  aria-label="Minta saran AI untuk rasa dan deskripsi"
                  className="touch-target inline-flex items-center justify-center border border-caramel-300 px-2 text-caramel-800 hover:bg-caramel-100 dark:border-white/20 dark:text-caramel-400"
                >
                  {aiLoadingKey === row.key ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label={`Hapus baris ${index + 1}`}
              className="touch-target inline-flex items-center justify-center text-cocoa-500 hover:text-rose-700 dark:text-stone-400 dark:hover:text-rose-400"
            >
              <Trash2 size={16} />
            </button>

            {/* Photo Preview Strip */}
            {row.photos.length > 0 && (
              <div className="col-span-full flex gap-3 overflow-x-auto pb-2 pt-1">
                {row.photos.map((photo, photoIndex) => (
                  <div key={photo.id} className="relative h-20 w-20 shrink-0 border border-caramel-300 bg-stone-100 dark:border-white/20">
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(row.key, photo.id)}
                      title="Ketuk untuk jadikan foto sampul"
                      aria-label={`Jadikan foto ${photoIndex + 1} sebagai sampul`}
                      className="absolute inset-0"
                    >
                      <ProductImage
                        src={photo.uploadedUrl || photo.previewUrl}
                        alt={`${row.name || "Kue"}, foto ${photoIndex + 1}`}
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>

                    {/* Upload Status Overlay */}
                    {photo.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[9px] gap-1 z-10">
                        <Loader2 size={14} className="animate-spin text-amber-300" />
                        <span>Unggah...</span>
                      </div>
                    )}

                    {photo.status === "error" && (
                      <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-white text-[9px] gap-1 p-1 z-10 text-center">
                        <AlertCircle size={14} className="text-rose-300" />
                        <button
                          type="button"
                          onClick={() => photo.file && uploadSinglePhoto(row.key, photo.id, photo.file)}
                          className="underline font-bold"
                        >
                          Coba lagi
                        </button>
                      </div>
                    )}

                    {/* Cover Badge */}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[#4D3040]/85 py-1 text-[9px] font-medium text-white z-10">
                      {photoIndex === 0 ? (
                        <>
                          <Check size={11} /> Sampul
                        </>
                      ) : (
                        `Foto ${photoIndex + 1}`
                      )}
                    </span>

                    {/* Remove Photo */}
                    <button
                      type="button"
                      onClick={() => removePhoto(row.key, photo.id)}
                      title="Hapus foto"
                      aria-label={`Hapus foto ${photoIndex + 1}`}
                      className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center bg-white/90 text-cocoa-900 shadow-sm z-20 hover:bg-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setRows((current) => [...current, makeRow()])}
          className="touch-target inline-flex items-center gap-2 border-b border-caramel-500 text-sm font-semibold text-cocoa-800 dark:text-stone-200"
        >
          <Plus size={16} /> Tambah baris kue
        </button>

        <button
          type="button"
          onClick={() => void saveRows()}
          disabled={saving}
          className="touch-target inline-flex items-center justify-center bg-caramel-700 px-6 text-sm font-semibold text-white hover:bg-caramel-800 disabled:opacity-50 dark:bg-[#C88A42] dark:hover:bg-[#A46726]"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan ke katalog online...</span>
            </span>
          ) : (
            `Simpan ${rows.filter((row) => row.name.trim() || row.price.trim()).length} produk ke katalog`
          )}
        </button>
      </div>
    </div>
  );
}
