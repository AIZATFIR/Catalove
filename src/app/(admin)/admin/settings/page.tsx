"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  Download,
  Upload,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import {
  INITIAL_SETTINGS,
  INDUSTRY_PRESETS,
  DEFAULT_THEME_CONFIG,
} from "@/lib/data/universal-presets";
import { cakeService } from "@/lib/services/cake-service";
import {
  readBusinessSettings,
  saveBusinessSettings,
  fetchBusinessSettings,
} from "@/lib/business-settings";
import { THEME_COLOR_MAP } from "@/components/theme/ThemeProvider";
import {
  ALL_CANVAS_SECTIONS,
  DEFAULT_SECTION_ORDER,
} from "@/components/storefront/PricingSection";
import type {
  BodyScaleOption,
  BusinessSettings,
  IndustryPreset,
  WorkflowMode,
  FontHeadingOption,
  FontBodyOption,
  HeadingScaleOption,
  ColorThemeOption,
  CardStyleOption,
  HeroStyleOption,
  CatalogLayoutOption,
  CanvasSectionId,
  CustomColorPalette,
} from "@/types/catalove";

const VALID_SECTION_IDS = new Set<CanvasSectionId>(
  ALL_CANVAS_SECTIONS.map((s) => s.id)
);

const SECTION_LABELS: Record<CanvasSectionId, { title: string; desc: string }> =
  ALL_CANVAS_SECTIONS.reduce((acc, item) => {
    acc[item.id] = { title: item.title, desc: item.desc };
    return acc;
  }, {} as Record<CanvasSectionId, { title: string; desc: string }>);

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingPresetKey, setApplyingPresetKey] = useState<IndustryPreset | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(true);
  const importInputRef = useRef<HTMLInputElement>(null);
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

  const persistSettingsImmediately = async (nextSettings: BusinessSettings) => {
    saveBusinessSettings(nextSettings);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
    } catch {
      // localStorage persistence remains intact
    }
  };

  const update = (key: keyof BusinessSettings, value: any) => {
    setSaved(false);
    setStatusMessage("");
    setSettings((current) => ({
      ...current,
      [key]:
        key === "default_lead_time_days" ? Math.max(0, Number(value)) : value,
    }));
  };

  const updateTheme = (field: string, value: any) => {
    setSaved(false);
    setStatusMessage("");
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
    setStatusMessage("");
    setSettings((current) => ({
      ...current,
      marquee_announcement: {
        ...(current.marquee_announcement || { enabled: true, text: "" }),
        [field]: value,
      },
    }));
  };

  const applyIndustryPreset = async (
    presetKey: IndustryPreset,
    withSampleCatalog: boolean
  ) => {
    const preset = INDUSTRY_PRESETS[presetKey];
    if (!preset) return;
    const promptMsg = withSampleCatalog
      ? `Terapkan preset "${preset.label}" BESERTA ${preset.products.length} contoh produknya ke etalase web?`
      : `Terapkan hanya tema, font, dan teks preset "${preset.label}" tanpa mengubah produk katalog Anda?`;

    if (!confirm(promptMsg)) return;

    setApplyingPresetKey(presetKey);
    setSaved(false);

    const nextSettings: BusinessSettings = {
      ...settings,
      industry_preset: presetKey,
      ...preset.settings,
      theme_config: {
        ...(settings.theme_config || DEFAULT_THEME_CONFIG),
        ...(preset.settings.theme_config || {}),
      },
    };

    try {
      setSettings(nextSettings);
      await persistSettingsImmediately(nextSettings);
      if (withSampleCatalog) {
        await cakeService.applyIndustryPresetCatalog(presetKey);
      }
      setSaved(true);
      setStatusMessage(
        withSampleCatalog
          ? `Preset "${preset.label}" + ${preset.products.length} contoh produk berhasil diterapkan langsung ke toko!`
          : `Tema & teks preset "${preset.label}" berhasil diterapkan tanpa mengubah produk.`
      );
    } finally {
      setApplyingPresetKey(null);
    }
  };

  const handleExportJson = () => {
    const slug = (settings.store_name || "catalove")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalove-settings-${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage("File konfigurasi JSON berhasil diunduh.");
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<BusinessSettings>;
      if (!parsed || typeof parsed !== "object" || !parsed.store_name) {
        alert("Format file JSON Catalove tidak valid.");
        return;
      }
      const merged: BusinessSettings = {
        ...INITIAL_SETTINGS,
        ...parsed,
        theme_config: {
          ...DEFAULT_THEME_CONFIG,
          ...(parsed.theme_config || {}),
        },
      };
      setSettings(merged);
      await persistSettingsImmediately(merged);
      setSaved(true);
      setStatusMessage(`Konfigurasi "${merged.store_name}" berhasil diimpor & diterapkan.`);
    } catch {
      alert("Gagal membaca file JSON. Pastikan file konfigurasi valid.");
    } finally {
      e.target.value = "";
    }
  };

  const handleResetDefault = async () => {
    if (
      !confirm(
        "Reset semua desain dan teks ke pengaturan awal Catalove Universal?"
      )
    ) {
      return;
    }
    setSettings(INITIAL_SETTINGS);
    await persistSettingsImmediately(INITIAL_SETTINGS);
    setSaved(true);
    setStatusMessage("Pengaturan desain dikembalikan ke default Catalove.");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setStatusMessage("");

    try {
      await persistSettingsImmediately(settings);
      setSaved(true);
      setStatusMessage("Semua perubahan desain dan identitas toko berhasil disimpan.");
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
      <header className="border-b border-[#DBD0C5] pb-6 dark:border-white/10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#8D624C] dark:text-[#C88A42]">
              Catalove Studio Engine
            </p>
            <h1 className="mt-1 font-serif text-3xl font-medium text-[#4D3040] sm:text-4xl dark:text-white">
              Pengaturan &amp; Desain Toko
            </h1>
            <p className="mt-1.5 text-sm text-[#67575B] dark:text-stone-300">
              Kustomisasi jenis usaha, alur workflow, font awwwards, palet warna, discovery layout, dan semua teks web.
            </p>
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--storefront-accent)] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
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
        </div>

        {/* Backup / Restore Studio Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DBD0C5] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/15 dark:bg-white/5 dark:text-stone-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DBD0C5] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#4D3040] hover:bg-[#F5EBDD] dark:border-white/15 dark:bg-white/5 dark:text-stone-200"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportJson}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </button>

          <Link
            href="/?canvas=1"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--storefront-accent)] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Buka Mode Kanvas Live</span>
            <ExternalLink className="h-3 w-3 opacity-80" />
          </Link>

          {isSyncing && (
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 ml-auto">
              <RefreshCw className="h-3 w-3 animate-spin" /> Menyelaraskan...
            </span>
          )}
        </div>

        {statusMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
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
                const isApplying = applyingPresetKey === key;
                return (
                  <div
                    key={key}
                    className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                      isSelected
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/5 ring-2 ring-[var(--storefront-accent)]/30"
                        : "border-[#DBD0C5]/60 bg-white/50 hover:border-[#8D624C] dark:border-white/10 dark:bg-stone-900/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
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
                      <p className="mt-2 text-[11px] font-medium text-[#8D624C] dark:text-[#D1A686]">
                        Termasuk {item.products.length} produk &amp; {item.categories.length} kategori contoh
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-[#DBD0C5]/40 dark:border-white/10">
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => void applyIndustryPreset(key, true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--storefront-accent)] px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {isApplying ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span>Terapkan Tema + Contoh Produk</span>
                      </button>
                      <button
                        type="button"
                        disabled={isApplying}
                        onClick={() => void applyIndustryPreset(key, false)}
                        className="w-full inline-flex items-center justify-center rounded-lg border border-[#DBD0C5] px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:bg-white/80 dark:border-white/15 dark:text-stone-300 dark:hover:bg-white/10"
                      >
                        Hanya Tema &amp; Teks
                      </button>
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

            {/* Body Font */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Font Teks &amp; Deskripsi (Body Typography)
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Pasangkan dengan font judul untuk kenyamanan baca di ponsel maupun desktop.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "jakarta" as FontBodyOption, label: "Plus Jakarta Sans", tag: "Ramah & Editorial (Default)" },
                  { id: "inter" as FontBodyOption, label: "Inter", tag: "Bersih, Tajam & Netral" },
                  { id: "outfit" as FontBodyOption, label: "Outfit", tag: "Geometris Hangat & Modern" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateTheme("font_body", f.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      currentTheme.font_body === f.id
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

            {/* Scale Typography & Hero Alignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-[#DBD0C5]/60 bg-white/50 p-4 dark:border-white/10 dark:bg-stone-900/50">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                  Ukuran Judul Hero
                </h3>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: "sm", label: "S" },
                      { id: "md", label: "M" },
                      { id: "lg", label: "L" },
                      { id: "xl", label: "XL" },
                    ] as { id: HeadingScaleOption; label: string }[]
                  ).map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => updateTheme("heading_scale", sc.id)}
                      className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                        (currentTheme.heading_scale || "lg") === sc.id
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                          : "border-[#DBD0C5]/70 bg-white dark:border-white/10 dark:bg-stone-900"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                  Ukuran Teks Body
                </h3>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "sm", label: "Kecil" },
                      { id: "md", label: "Sedang" },
                      { id: "lg", label: "Besar" },
                    ] as { id: BodyScaleOption; label: string }[]
                  ).map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => updateTheme("body_scale", sc.id)}
                      className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                        (currentTheme.body_scale || "md") === sc.id
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                          : "border-[#DBD0C5]/70 bg-white dark:border-white/10 dark:bg-stone-900"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200">
                  Perataan Teks Hero
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: "left", label: "Rata Kiri" },
                      { id: "center", label: "Rata Tengah" },
                    ] as const
                  ).map((al) => (
                    <button
                      key={al.id}
                      type="button"
                      onClick={() => updateTheme("hero_align", al.id)}
                      className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                        (currentTheme.hero_align || "left") === al.id
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-white"
                          : "border-[#DBD0C5]/70 bg-white dark:border-white/10 dark:bg-stone-900"
                      }`}
                    >
                      {al.label}
                    </button>
                  ))}
                </div>
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
                    onClick={() => updateTheme("color_theme", c.id as ColorThemeOption)}
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

              {/* Kustom Warna Hex Brand */}
              {(() => {
                const presetBase =
                  THEME_COLOR_MAP[currentTheme.color_theme || "warm_oat"]?.light ||
                  THEME_COLOR_MAP.warm_oat.light;
                const customColors: CustomColorPalette = {
                  enabled: currentTheme.custom_colors?.enabled ?? false,
                  accent: currentTheme.custom_colors?.accent || presetBase.accent,
                  bg: currentTheme.custom_colors?.bg || presetBase.bg,
                  surface: currentTheme.custom_colors?.surface || presetBase.surface,
                  ink: currentTheme.custom_colors?.ink || presetBase.ink,
                };
                const colorFields: {
                  key: Exclude<keyof CustomColorPalette, "enabled">;
                  label: string;
                }[] = [
                  { key: "accent", label: "Aksen & Tombol" },
                  { key: "bg", label: "Latar Halaman" },
                  { key: "surface", label: "Kartu & Permukaan" },
                  { key: "ink", label: "Teks Utama" },
                ];

                return (
                  <div className="mt-4 rounded-xl border border-[#DBD0C5]/60 bg-white/50 p-4 dark:border-white/10 dark:bg-stone-900/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#4D3040] dark:text-white">
                          Kustom Warna Hex Brand
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Sesuaikan persis 4 warna utama brand (sinkron dengan Mode Kanvas).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateTheme("custom_colors", {
                            ...customColors,
                            enabled: !customColors.enabled,
                          })
                        }
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                          customColors.enabled
                            ? "bg-[var(--storefront-accent)] text-white"
                            : "bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-stone-300"
                        }`}
                      >
                        {customColors.enabled ? "Kustom Aktif" : "Pakai Warna Kustom"}
                      </button>
                    </div>

                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 transition-opacity ${
                        customColors.enabled ? "opacity-100" : "opacity-60"
                      }`}
                    >
                      {colorFields.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-center gap-2.5 rounded-lg border border-[#DBD0C5]/70 bg-white dark:border-white/10 dark:bg-stone-950 p-2.5"
                        >
                          <input
                            type="color"
                            value={customColors[field.key]}
                            onChange={(e) =>
                              updateTheme("custom_colors", {
                                ...customColors,
                                enabled: true,
                                [field.key]: e.target.value,
                              })
                            }
                            aria-label={field.label}
                            className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                              {field.label}
                            </span>
                            <input
                              type="text"
                              value={customColors[field.key]}
                              onChange={(e) =>
                                updateTheme("custom_colors", {
                                  ...customColors,
                                  enabled: true,
                                  [field.key]: e.target.value,
                                })
                              }
                              className="mt-0.5 w-full bg-transparent font-mono text-xs font-bold uppercase text-stone-900 dark:text-white focus:outline-none"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Product Card Style */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Gaya Kartu Produk (Card Aesthetic)
              </h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "modern_glass" as CardStyleOption, label: "Modern Glass", desc: "Bayangan lembut & rounded modern" },
                  { id: "clean_flat" as CardStyleOption, label: "Clean Flat", desc: "Minimalis bersih tanpa border berat" },
                  { id: "bordered_clay" as CardStyleOption, label: "Bordered Clay", desc: "Garis editorial hangat" },
                  { id: "minimal_mono" as CardStyleOption, label: "Minimal Mono", desc: "Tegas & presisi ala galeri" },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => updateTheme("card_style", card.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      currentTheme.card_style === card.id
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 ring-2 ring-[var(--storefront-accent)]/30 font-bold"
                        : "border-[#DBD0C5]/60 bg-white/40 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                      {card.label}
                    </span>
                    <span className="text-[10px] text-stone-500">{card.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Layout Style */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Tata Letak Hero Utama
              </h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "split_dynamic" as HeroStyleOption, label: "Split Editorial", desc: "Teks kiri + Showcase kanan" },
                  { id: "split_reverse" as HeroStyleOption, label: "Split Kiri", desc: "Showcase kiri + Teks kanan" },
                  { id: "bento_grid" as HeroStyleOption, label: "Bento Grid", desc: "Mozaik multi-produk visual" },
                  { id: "minimal_center" as HeroStyleOption, label: "Minimal Center", desc: "Fokus tipografi besar di tengah" },
                  { id: "rotating_showcase" as HeroStyleOption, label: "Rotating Gallery", desc: "Sorotan foto berputar" },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => updateTheme("hero_style", h.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      currentTheme.hero_style === h.id
                        ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 ring-2 ring-[var(--storefront-accent)]/30 font-bold"
                        : "border-[#DBD0C5]/60 bg-white/40 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40"
                    }`}
                  >
                    <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                      {h.label}
                    </span>
                    <span className="text-[10px] text-stone-500">{h.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discovery Feed Layout */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Mode Scroll Discovery Bawaan (Attention Flow)
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                Pengunjung tetap bisa berganti tampilan di halaman toko, namun mode ini menjadi tampilan pertama saat halaman dibuka.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { id: "pinterest_masonry" as CatalogLayoutOption, label: "Pinterest Waterfall", desc: "Masonry variatif" },
                  { id: "tiktok_feed" as CatalogLayoutOption, label: "TikTok Snap Feed", desc: "Scroll vertikal fokus" },
                  { id: "grid_2" as CatalogLayoutOption, label: "Grid 2 Kolom", desc: "Foto besar mewah" },
                  { id: "grid_3" as CatalogLayoutOption, label: "Grid 3 Kolom", desc: "Seimbang & klasik" },
                  { id: "grid_4" as CatalogLayoutOption, label: "Grid 4 Kolom", desc: "Padat & cepat" },
                ].map((layoutOption) => {
                  const activeLayout =
                    settings.catalog_layout ||
                    currentTheme.catalog_layout ||
                    "pinterest_masonry";
                  return (
                    <button
                      key={layoutOption.id}
                      type="button"
                      onClick={() => {
                        setSaved(false);
                        setSettings((current) => ({
                          ...current,
                          catalog_layout: layoutOption.id,
                          theme_config: {
                            ...(current.theme_config || DEFAULT_THEME_CONFIG),
                            catalog_layout: layoutOption.id,
                          },
                        }));
                      }}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        activeLayout === layoutOption.id
                          ? "border-[var(--storefront-accent)] bg-[var(--storefront-accent)]/10 ring-2 ring-[var(--storefront-accent)]/30 font-bold"
                          : "border-[#DBD0C5]/60 bg-white/40 hover:border-stone-400 dark:border-white/10 dark:bg-stone-900/40"
                      }`}
                    >
                      <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                        {layoutOption.label}
                      </span>
                      <span className="text-[10px] text-stone-500">{layoutOption.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog Grid Columns */}
            <div>
              <h2 className="font-serif text-xl font-medium text-[#4D3040] dark:text-white">
                Kepadatan Kolom Grid (Desktop)
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
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

            {/* Manajemen Section Kanvas (Model Aditif: Mulai dari Hero) */}
            {(() => {
              const saved = currentTheme.section_order;
              const hidden = new Set(currentTheme.hidden_sections || []);
              const base =
                saved && saved.length > 0 ? saved : DEFAULT_SECTION_ORDER;
              const activeOrder: CanvasSectionId[] = [];
              for (const id of base) {
                if (
                  VALID_SECTION_IDS.has(id) &&
                  !activeOrder.includes(id) &&
                  !hidden.has(id)
                ) {
                  activeOrder.push(id);
                }
              }
              if (activeOrder.length === 0) {
                activeOrder.push("hero");
              }

              const availableToAdd = ALL_CANVAS_SECTIONS.filter(
                (s) => !activeOrder.includes(s.id)
              );

              const moveSection = (idx: number, delta: -1 | 1) => {
                const target = idx + delta;
                if (target < 0 || target >= activeOrder.length) return;
                const next = [...activeOrder];
                [next[idx], next[target]] = [next[target], next[idx]];
                updateTheme("section_order", next);
              };

              const addSection = (id: CanvasSectionId) => {
                setSaved(false);
                setStatusMessage("");
                setSettings((current) => {
                  const tc = current.theme_config || DEFAULT_THEME_CONFIG;
                  const nextHidden = (tc.hidden_sections || []).filter(
                    (h) => h !== id
                  );
                  const nextOrder = activeOrder.includes(id)
                    ? activeOrder
                    : [...activeOrder, id];
                  return {
                    ...current,
                    theme_config: {
                      ...tc,
                      section_order: nextOrder,
                      hidden_sections: nextHidden,
                    },
                  };
                });
              };

              const removeSection = (id: CanvasSectionId) => {
                if (activeOrder.length <= 1) return;
                const nextOrder = activeOrder.filter((s) => s !== id);
                updateTheme(
                  "section_order",
                  nextOrder.length > 0 ? nextOrder : ["hero"]
                );
              };

              const loadFullPreset = () => {
                setSaved(false);
                setStatusMessage("");
                setSettings((current) => ({
                  ...current,
                  theme_config: {
                    ...(current.theme_config || DEFAULT_THEME_CONFIG),
                    section_order: [
                      "hero",
                      "feed",
                      "featured_split",
                      "collection_index",
                      "statement_banner",
                      "faq_minimal",
                      "pricing",
                      "cta",
                    ],
                    hidden_sections: [],
                  },
                }));
              };

              const resetHeroOnly = () => {
                setSaved(false);
                setStatusMessage("");
                setSettings((current) => ({
                  ...current,
                  theme_config: {
                    ...(current.theme_config || DEFAULT_THEME_CONFIG),
                    section_order: ["hero"],
                    hidden_sections: [],
                  },
                }));
              };

              return (
                <div className="rounded-xl border border-[#DBD0C5]/60 bg-white/50 p-4 dark:border-white/10 dark:bg-stone-900/50 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#4D3040] dark:text-white">
                        Susunan Section Halaman ({activeOrder.length} Aktif)
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Mulai eksklusif dari Hero saja, lalu tambahkan section lain sesuai kebutuhan.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={loadFullPreset}
                        className="rounded-lg border border-stone-200 dark:border-white/15 px-3 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-200 hover:border-[var(--storefront-accent)]"
                      >
                        Muat Preset 8 Section
                      </button>
                      <button
                        type="button"
                        onClick={resetHeroOnly}
                        className="rounded-lg border border-stone-200 dark:border-white/15 px-3 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        Reset ke Hero Saja
                      </button>
                    </div>
                  </div>

                  {/* Active Sections List */}
                  <div className="space-y-2">
                    {activeOrder.map((secId, idx) => {
                      const info = SECTION_LABELS[secId];
                      return (
                        <div
                          key={secId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#DBD0C5]/70 bg-white dark:border-white/10 dark:bg-stone-950 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-800 dark:text-stone-100">
                              {idx + 1}. {info.title}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {info.desc}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, -1)}
                              aria-label={`Naikkan ${info.title}`}
                              className="rounded-md border border-stone-200 dark:border-white/15 p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === activeOrder.length - 1}
                              onClick={() => moveSection(idx, 1)}
                              aria-label={`Turunkan ${info.title}`}
                              className="rounded-md border border-stone-200 dark:border-white/15 p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={activeOrder.length <= 1}
                              onClick={() => removeSection(secId)}
                              aria-label={`Hapus ${info.title}`}
                              className="ml-1 inline-flex items-center gap-1 rounded-md border border-stone-200 dark:border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Available Sections to Add */}
                  {availableToAdd.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/70 dark:border-white/10 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        + Tambah Section Baru
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableToAdd.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => addSection(sec.id)}
                            className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--storefront-accent)] bg-white/80 dark:bg-stone-950 px-3 py-2 text-left hover:bg-[var(--color-surface-tint)] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">
                                {sec.title}
                              </p>
                              <p className="text-[10px] text-stone-500 truncate">
                                {sec.desc}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 shrink-0 text-[var(--storefront-accent)]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Preloader Toggle */}
            <div className="rounded-xl border border-[#DBD0C5]/60 bg-white/50 p-4 dark:border-white/10 dark:bg-stone-900/50 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#4D3040] dark:text-white">
                  Animasi Pembuka (Opening Preloader)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Nonaktifkan agar pengunjung langsung melihat Hero &amp; Pinterest/TikTok feed dalam &lt; 0.3 detik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update("enable_preloader", !settings.enable_preloader)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  settings.enable_preloader
                    ? "bg-[var(--storefront-accent)] text-white"
                    : "bg-stone-200 text-stone-700 dark:bg-white/10 dark:text-stone-300"
                }`}
              >
                {settings.enable_preloader ? "Aktif" : "Nonaktif (Instan)"}
              </button>
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

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  URL Foto Brand Story (Banner Cerita Usaha)
                </label>
                <input
                  type="url"
                  value={settings.story_image_url || ""}
                  placeholder="https://images.unsplash.com/..."
                  onChange={(e) => update("story_image_url", e.target.value)}
                  className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                />
              </div>

              {/* 3 Feature Pillars */}
              <div className="grid gap-4 sm:grid-cols-3 pt-3 border-t border-[#DBD0C5]/40 dark:border-white/10">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Keunggulan 1
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Keunggulan 1"
                    value={settings.feature_1_title || ""}
                    onChange={(e) => update("feature_1_title", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat..."
                    value={settings.feature_1_desc || ""}
                    onChange={(e) => update("feature_1_desc", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Keunggulan 2
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Keunggulan 2"
                    value={settings.feature_2_title || ""}
                    onChange={(e) => update("feature_2_title", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat..."
                    value={settings.feature_2_desc || ""}
                    onChange={(e) => update("feature_2_desc", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Keunggulan 3
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Keunggulan 3"
                    value={settings.feature_3_title || ""}
                    onChange={(e) => update("feature_3_title", e.target.value)}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Deskripsi singkat..."
                    value={settings.feature_3_desc || ""}
                    onChange={(e) => update("feature_3_desc", e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Order Steps Section */}
            <div className="space-y-4 rounded-xl border border-[#DBD0C5]/60 bg-white/40 p-5 dark:border-white/10 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                3. Cara Pemesanan (3 Langkah)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Judul Alur Pemesanan
                  </label>
                  <input
                    type="text"
                    value={settings.steps_title || settings.order_steps_title || ""}
                    placeholder="Contoh: Pesan Dalam 3 Langkah Mudah"
                    onChange={(e) => {
                      update("steps_title", e.target.value);
                      update("order_steps_title", e.target.value);
                    }}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    Eyebrow Alur Pemesanan
                  </label>
                  <input
                    type="text"
                    value={settings.steps_eyebrow || settings.order_steps_eyebrow || ""}
                    placeholder="Contoh: Cara Pemesanan"
                    onChange={(e) => {
                      update("steps_eyebrow", e.target.value);
                      update("order_steps_eyebrow", e.target.value);
                    }}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm dark:border-white/20"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Langkah 1
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Langkah 1"
                    value={settings.step_1_title || settings.order_step_1_title || ""}
                    onChange={(e) => {
                      update("step_1_title", e.target.value);
                      update("order_step_1_title", e.target.value);
                    }}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Penjelasan langkah 1..."
                    value={settings.step_1_desc || settings.order_step_1_desc || ""}
                    onChange={(e) => {
                      update("step_1_desc", e.target.value);
                      update("order_step_1_desc", e.target.value);
                    }}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Langkah 2
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Langkah 2"
                    value={settings.step_2_title || settings.order_step_2_title || ""}
                    onChange={(e) => {
                      update("step_2_title", e.target.value);
                      update("order_step_2_title", e.target.value);
                    }}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Penjelasan langkah 2..."
                    value={settings.step_2_desc || settings.order_step_2_desc || ""}
                    onChange={(e) => {
                      update("step_2_desc", e.target.value);
                      update("order_step_2_desc", e.target.value);
                    }}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Langkah 3
                  </label>
                  <input
                    type="text"
                    placeholder="Judul Langkah 3"
                    value={settings.step_3_title || settings.order_step_3_title || ""}
                    onChange={(e) => {
                      update("step_3_title", e.target.value);
                      update("order_step_3_title", e.target.value);
                    }}
                    className="w-full border-b border-stone-300 bg-transparent py-1 text-sm font-semibold dark:border-white/20"
                  />
                  <textarea
                    rows={2}
                    placeholder="Penjelasan langkah 3..."
                    value={settings.step_3_desc || settings.order_step_3_desc || ""}
                    onChange={(e) => {
                      update("step_3_desc", e.target.value);
                      update("order_step_3_desc", e.target.value);
                    }}
                    className="w-full rounded-md border border-stone-300 bg-transparent p-2 text-xs dark:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="space-y-4 rounded-xl border border-[#DBD0C5]/60 bg-white/40 p-5 dark:border-white/10 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100">
                4. Footer Teks
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
