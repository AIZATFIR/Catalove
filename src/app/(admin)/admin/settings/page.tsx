"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Save,
  Loader2,
  RefreshCw,
  Sparkles,
  Palette,
  Workflow,
  Type,
  Store,
  Layers,
  Megaphone,
} from "lucide-react";
import { INITIAL_SETTINGS } from "@/lib/data/seed-cakes";
import {
  INDUSTRY_PRESETS,
  DEFAULT_THEME_CONFIG,
} from "@/lib/data/universal-presets";
import {
  readBusinessSettings,
  saveBusinessSettings,
  fetchBusinessSettings,
} from "@/lib/business-settings";
import type {
  BusinessSettings,
  IndustryPreset,
  WorkflowMode,
  FontHeadingOption,
  FontBodyOption,
  ColorThemeOption,
  CardStyleOption,
} from "@/types/catalove";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "presets" | "workflow" | "theme" | "marquee" | "identity" | "content"
  >("presets");

  useEffect(() => {
    setSettings(readBusinessSettings());
    fetchBusinessSettings().then((remote) => {
      if (remote) setSettings(remote);
      setIsSyncing(false);
    });
  }, []);

  const update = (key: keyof BusinessSettings, value: any) => {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      [key]:
        key === "default_lead_time_days" ? Math.max(0, Number(value)) : value,
    }));
  };

  const updateTheme = (field: string, value: any) => {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      theme_config: {
        ...(current.theme_config || DEFAULT_THEME_CONFIG),
        [field]: value,
      },
    }));
  };

  const updateMarquee = (field: string, value: any) => {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      marquee_announcement: {
        ...(current.marquee_announcement || { enabled: true, text: "" }),
        [field]: value,
      },
    }));
  };

  const applyIndustryPreset = (presetKey: IndustryPreset) => {
    const preset = INDUSTRY_PRESETS[presetKey];
    if (!preset) return;
    if (
      !confirm(
        `Terapkan preset "${preset.label}"? Tema, font, gaya kartu, dan alur pemesanan akan otomatis disesuaikan.`
      )
    )
      return;

    setSaved(false);
    setSettings((current) => ({
      ...current,
      industry_preset: presetKey,
      ...preset.settings,
      theme_config: {
        ...(current.theme_config || DEFAULT_THEME_CONFIG),
        ...(preset.settings.theme_config || {}),
      },
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      saveBusinessSettings(settings);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch {
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const currentTheme = settings.theme_config || DEFAULT_THEME_CONFIG;
  const currentMarquee = settings.marquee_announcement || {
    enabled: true,
    text: "",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-24">
      {/* Page Header */}
      <header className="border-b border-[#DBD0C5] pb-6 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#8D624C] dark:text-[#C88A42]">
            Catalove Studio Engine
          </p>
          <h1 className="mt-1 font-serif text-3xl font-medium text-[#4D3040] sm:text-4xl dark:text-white">
            Pengaturan & Desain Toko
          </h1>
          <p className="mt-1.5 text-sm text-[#67575B] dark:text-stone-300">
            Kustomisasi jenis usaha, alur workflow, font awwwards, palet warna, dan semua teks web.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--storefront-accent)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}</span>
        </button>
      </header>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-[#DBD0C5] gap-2 pb-px dark:border-white/10 text-xs font-semibold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "presets"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          1-Click Preset Usaha
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("workflow")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "workflow"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Workflow className="h-3.5 w-3.5" />
          Alur Workflow
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "theme"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          Font & Palet Warna
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("marquee")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "marquee"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Megaphone className="h-3.5 w-3.5" />
          Ticker Pengumuman
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "identity"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          Identitas & Kontak
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`pb-3 px-3 transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "content"
              ? "border-[var(--storefront-accent)] text-[var(--storefront-accent)]"
              : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Teks Setiap Section
        </button>
      </div>

      <form onSubmit={submit} className="space-y-10">
        {/* TAB 1: PRESETS */}
        {activeTab === "presets" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white">
                Pilih Preset Jenis Usaha
              </h2>
              <p className="mt-1 text-sm text-[#67575B] dark:text-stone-300">
                Pilih salah satu dari 7 template usaha untuk otomatis mengatur desain dan alur yang paling cocok.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(INDUSTRY_PRESETS) as IndustryPreset[]).map((key) => {
                const item = INDUSTRY_PRESETS[key];
                const isSelected = settings.industry_preset === key;
                return (
                  <div
                    key={key}
                    onClick={() => applyIndustryPreset(key)}
                    className={`cursor-pointer rounded-xl border p-5 transition-all ${
                      isSelected
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                        : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                        {item.label}
                      </h3>
                      {isSelected && (
                        <span className="rounded-full bg-[var(--storefront-accent)] text-white p-1">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-stone-600 dark:text-stone-400">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-[var(--storefront-accent)]">
                      <span>Terapkan Preset →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: WORKFLOW */}
        {activeTab === "workflow" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white">
                Model Alur Pemesanan (Workflow Engine)
              </h2>
              <p className="mt-1 text-sm text-[#67575B] dark:text-stone-300">
                Tentukan bagaimana calon pembeli melakukan transaksi di web Anda.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                onClick={() => update("workflow_mode", "whatsapp_direct")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  settings.workflow_mode === "whatsapp_direct"
                    ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                    : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">
                    1. Direct WhatsApp Checkout
                  </h3>
                  {settings.workflow_mode === "whatsapp_direct" && (
                    <Check className="h-4 w-4 text-[var(--storefront-accent)]" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Pembeli memilih varian dan jumlah, lalu langsung terhubung ke WhatsApp seller dengan pesan pesanan terformat rapi. Konversi paling tinggi tanpa hambatan form.
                </p>
              </div>

              <div
                onClick={() => update("workflow_mode", "preorder_calendar")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  settings.workflow_mode === "preorder_calendar"
                    ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                    : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">
                    2. Pre-Order & Kalender Tanggal (H-N)
                  </h3>
                  {settings.workflow_mode === "preorder_calendar" && (
                    <Check className="h-4 w-4 text-[var(--storefront-accent)]" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Sangat pas untuk Bakery, Florist, atau Catering. Pembeli wajib memilih tanggal pengiriman/pengambilan sesuai waktu persiapan (lead time) sebelum checkout.
                </p>
              </div>

              <div
                onClick={() => update("workflow_mode", "cart_checkout")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  settings.workflow_mode === "cart_checkout"
                    ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                    : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">
                    3. Multi-Item Shopping Bag (Keranjang)
                  </h3>
                  {settings.workflow_mode === "cart_checkout" && (
                    <Check className="h-4 w-4 text-[var(--storefront-accent)]" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Cocok untuk Fashion, Gadget, atau Retail. Pembeli dapat memasukkan banyak item sekaligus ke keranjang belanja lalu checkout total sekaligus.
                </p>
              </div>

              <div
                onClick={() => update("workflow_mode", "inquiry_only")}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  settings.workflow_mode === "inquiry_only"
                    ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                    : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100">
                    4. Portfolio & Inquiry / Quotation
                  </h3>
                  {settings.workflow_mode === "inquiry_only" && (
                    <Check className="h-4 w-4 text-[var(--storefront-accent)]" />
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                  Cocok untuk Studio Desain, Karya Seni Kustom, atau Jasa. Tombol pemesanan berubah menjadi &quot;Konsultasi / Request Quote&quot; langsung ke WhatsApp.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: THEME & TYPOGRAPHY */}
        {activeTab === "theme" && (
          <section className="space-y-8">
            {/* Heading Font */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Font Judul (Heading Typography)
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Pilih karakter tipografi yang memperkuat citra brand Anda.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "playfair", label: "Playfair Display", tag: "Editorial Serif" },
                  { id: "cormorant", label: "Cormorant", tag: "Fine Luxury" },
                  { id: "syne", label: "Syne", tag: "Awwwards Trendy" },
                  { id: "outfit", label: "Outfit", tag: "Neo-Grotesque" },
                  { id: "space_grotesk", label: "Space Grotesk", tag: "Tech Studio" },
                  { id: "jakarta", label: "Plus Jakarta", tag: "Clean Swiss" },
                  { id: "inter", label: "Inter", tag: "Modern Minimal" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateTheme("font_heading", f.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      currentTheme.font_heading === f.id
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 ring-2 ring-[var(--storefront-accent)]/30 font-bold"
                        : "border-[#DBD0C5]/60 bg-white/40 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40"
                    }`}
                  >
                    <span className="block text-sm text-stone-900 dark:text-stone-100">
                      {f.label}
                    </span>
                    <span className="text-[10px] text-stone-500">{f.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Palet Warna Tema
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Warna aksen dan latar belakang akan otomatis beradaptasi baik di mode terang maupun gelap.
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "noir_gold", label: "Noir & Gold", color: "#D97706" },
                  { id: "warm_oat", label: "Warm Oat & Coffee", color: "#C27838" },
                  { id: "matcha_sage", label: "Matcha & Sage", color: "#15803D" },
                  { id: "rose_velvet", label: "Rose & Velvet", color: "#BE185D" },
                  { id: "minimal_slate", label: "Minimalist Slate", color: "#0F172A" },
                  { id: "sunset_terracotta", label: "Sunset Terracotta", color: "#EA580C" },
                  { id: "cyber_neo", label: "Cyber Neo", color: "#0284C7" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateTheme("color_theme", c.id)}
                    className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all ${
                      currentTheme.color_theme === c.id
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 ring-2 ring-[var(--storefront-accent)]/30"
                        : "border-[#DBD0C5]/60 bg-white/40 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid Columns */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Tata Letak Kolom Katalog (Desktop)
              </h2>
              <div className="mt-3 flex gap-3">
                {[
                  { cols: 2, label: "2 Kolom (Luxury & Big Photos)" },
                  { cols: 3, label: "3 Kolom (Balanced Editorial)" },
                  { cols: 4, label: "4 Kolom (Compact High-Density)" },
                ].map((col) => (
                  <button
                    key={col.cols}
                    type="button"
                    onClick={() => updateTheme("catalog_columns_desktop", col.cols)}
                    className={`rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                      currentTheme.catalog_columns_desktop === col.cols
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                        : "border-[#DBD0C5]/60 bg-white/40 text-stone-700 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40 dark:text-stone-300"
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: MARQUEE */}
        {activeTab === "marquee" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white">
                Ticker Teks Berjalan (Announcement Bar)
              </h2>
              <p className="mt-1 text-sm text-[#67575B] dark:text-stone-300">
                Pita pengumuman paling atas di toko untuk info promo, jam operasional, atau kabar terbaru.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentMarquee.enabled}
                  onChange={(e) => updateMarquee("enabled", e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[var(--storefront-accent)] focus:ring-[var(--storefront-accent)]"
                />
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Aktifkan Pita Pengumuman di Atas Toko
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Teks Pengumuman
                </label>
                <textarea
                  rows={2}
                  value={currentMarquee.text || ""}
                  onChange={(e) => updateMarquee("text", e.target.value)}
                  placeholder="Contoh: ✨ SPECIAL DROP AVAILABLE • SAME DAY DELIVERY • ORDER NOW ✨"
                  className="w-full rounded-lg border border-[#BFAE9F] bg-transparent p-3 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Label Badge (Opsional)
                  </label>
                  <input
                    type="text"
                    value={currentMarquee.badge || ""}
                    placeholder="Contoh: EXCLUSIVE / PROMO"
                    onChange={(e) => updateMarquee("badge", e.target.value)}
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                    Link Tautan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={currentMarquee.link || ""}
                    placeholder="Contoh: /catalog"
                    onChange={(e) => updateMarquee("link", e.target.value)}
                    className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: IDENTITY & SOCIALS */}
        {activeTab === "identity" && (
          <section className="space-y-6">
            <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white border-b border-[#DBD0C5] pb-2 dark:border-white/10">
              Identitas Toko & Kontak
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Nama Toko / Brand
                </label>
                <input
                  type="text"
                  value={settings.store_name || ""}
                  onChange={(e) => update("store_name", e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Tagline Brand (Bawah Logo)
                </label>
                <input
                  type="text"
                  value={settings.store_tagline || ""}
                  placeholder="Kosongkan jika tidak ingin ditampilkan"
                  onChange={(e) => update("store_tagline", e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Nomor WhatsApp Seller (Format 628...)
                </label>
                <input
                  type="tel"
                  value={settings.seller_whatsapp || ""}
                  onChange={(e) => update("seller_whatsapp", e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Alamat Studio / Workshop
                </label>
                <input
                  type="text"
                  value={settings.store_address || settings.kitchen_address || ""}
                  onChange={(e) => {
                    update("store_address", e.target.value);
                    update("kitchen_address", e.target.value);
                  }}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={settings.instagram_handle || ""}
                  placeholder="@nama_brand"
                  onChange={(e) => update("instagram_handle", e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8D624C] dark:text-[#D1A686] mb-1">
                  TikTok Handle (Opsional)
                </label>
                <input
                  type="text"
                  value={settings.tiktok_handle || ""}
                  placeholder="@nama_tiktok"
                  onChange={(e) => update("tiktok_handle", e.target.value)}
                  className="w-full border-b border-[#BFAE9F] bg-transparent py-2 text-sm text-[#33262A] outline-none focus:border-[#4D3040] dark:border-white/20 dark:text-white"
                />
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: SECTION TEXT CONTENT */}
        {activeTab === "content" && (
          <section className="space-y-8">
            <h2 className="font-serif text-2xl font-medium text-[#4D3040] dark:text-white border-b border-[#DBD0C5] pb-2 dark:border-white/10">
              Kustomisasi Teks Setiap Section
            </h2>

            {/* Hero Section */}
            <div className="space-y-4 rounded-xl border border-[#DBD0C5]/60 bg-white/40 p-5 dark:border-white/10 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                1. Hero / Banner Utama
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Eyebrow (Teks Kecil Atas)
                  </label>
                  <input
                    type="text"
                    value={settings.hero_eyebrow || ""}
                    onChange={(e) => update("hero_eyebrow", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Judul Utama (H1)
                  </label>
                  <input
                    type="text"
                    value={settings.hero_title || ""}
                    onChange={(e) => update("hero_title", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Sub-Judul / Deskripsi Hero
                </label>
                <textarea
                  rows={2}
                  value={settings.hero_subtitle || ""}
                  onChange={(e) => update("hero_subtitle", e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-sm dark:border-white/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Badge 1
                  </label>
                  <input
                    type="text"
                    value={settings.hero_badge_1 || ""}
                    onChange={(e) => update("hero_badge_1", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Badge 2
                  </label>
                  <input
                    type="text"
                    value={settings.hero_badge_2 || ""}
                    onChange={(e) => update("hero_badge_2", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Badge 3
                  </label>
                  <input
                    type="text"
                    value={settings.hero_badge_3 || ""}
                    onChange={(e) => update("hero_badge_3", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Brand Story Section */}
            <div className="space-y-4 rounded-xl border border-[#DBD0C5]/60 bg-white/40 p-5 dark:border-white/10 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                2. Kisah Brand (Brand Story & 3 Keunggulan)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Judul Cerita
                  </label>
                  <input
                    type="text"
                    value={settings.story_title || ""}
                    onChange={(e) => update("story_title", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Eyebrow Cerita
                  </label>
                  <input
                    type="text"
                    value={settings.story_eyebrow || ""}
                    onChange={(e) => update("story_eyebrow", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Paragraf 1
                  </label>
                  <textarea
                    rows={3}
                    value={settings.story_p1 || ""}
                    onChange={(e) => update("story_p1", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Paragraf 2
                  </label>
                  <textarea
                    rows={3}
                    value={settings.story_p2 || ""}
                    onChange={(e) => update("story_p2", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-sm dark:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-4 rounded-xl border border-[#DBD0C5]/60 bg-white/40 p-5 dark:border-white/10 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                3. Footer Teks
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Deskripsi Singkat Footer
                  </label>
                  <textarea
                    rows={2}
                    value={settings.footer_desc || ""}
                    onChange={(e) => update("footer_desc", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Badge Toko Footer
                  </label>
                  <input
                    type="text"
                    value={settings.footer_badge || ""}
                    placeholder="Contoh: Verified Store / Handcrafted with Love"
                    onChange={(e) => update("footer_badge", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Floating Save Bar */}
        <div className="sticky bottom-4 z-30 flex items-center justify-between rounded-xl border border-[#DBD0C5] bg-[#FAF7F2]/95 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-stone-900/95">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            {saved ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check className="h-4 w-4" /> Perubahan berhasil disimpan
              </span>
            ) : (
              <span>Pengaturan siap disimpan. Klik simpan untuk menerapkan langsung.</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--storefront-accent)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
