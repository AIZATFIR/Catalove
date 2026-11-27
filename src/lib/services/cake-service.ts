import {
  Category,
  IndustryPreset,
  Product,
  ProductImage,
  ProductVariant,
} from "@/types/bakery";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "@/lib/data/seed-catalog";
import { INDUSTRY_PRESETS } from "@/lib/data/universal-presets";
import { ProductInput } from "@/lib/validators/product";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { shouldInitializeDemoCatalog, shouldUseLocalCatalogOverride } from "@/lib/services/catalog-mode";
import { DEFAULT_STORE_ID, getStoreScopedStorageKey, withStoreSlug } from "@/lib/store-routing";
import { createClient } from "@supabase/supabase-js";

const STORAGE_KEYS = {
  PRODUCTS: "catalove-products-v3",
  CATEGORIES: "catalove-categories-v3",
  LOCAL_MODE: "catalove-local-catalog-mode-v3",
  DEMO_INITIALIZED: "catalove-marketing-demo-initialized-v1",
};
const catalogStorageKey = (key: string) => getStoreScopedStorageKey(key);

// In-memory store for Node/SSR/automated testing fallback
let categoriesStore: Category[] = [...INITIAL_CATEGORIES];
let productsStore: Product[] = [...INITIAL_PRODUCTS];

function getDirectSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (typeof window !== "undefined") return getBrowserSupabase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key);
}

function dispatchCatalogUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("catalove-catalog-updated"));
  }
}

function readBrowserStorage(): { categories: Category[]; products: Product[] } {
  if (typeof window === "undefined") {
    return { categories: categoriesStore, products: productsStore };
  }

  try {
    const rawCats = window.localStorage.getItem(catalogStorageKey(STORAGE_KEYS.CATEGORIES));
    const rawProds = window.localStorage.getItem(catalogStorageKey(STORAGE_KEYS.PRODUCTS));

    if (rawCats && rawProds) {
      const cats = JSON.parse(rawCats) as Category[];
      const prods = JSON.parse(rawProds) as Product[];
      if (Array.isArray(cats) && Array.isArray(prods)) {
        return { categories: cats, products: prods };
      }
    }

    // Initialize browser storage with current preset (defaulting to Universal Lifestyle Store)
    let presetKey: IndustryPreset = "general";
    try {
      const savedSettings = window.localStorage.getItem(getStoreScopedStorageKey("catalove-business-settings-v3"));
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.industry_preset && INDUSTRY_PRESETS[parsed.industry_preset as IndustryPreset]) {
          presetKey = parsed.industry_preset as IndustryPreset;
        }
      }
    } catch {
      // ignore settings read error
    }

    const bundle = INDUSTRY_PRESETS[presetKey] || INDUSTRY_PRESETS.general;
    const hydratedProducts = bundle.products.map((p) => ({
      ...p,
      category: bundle.categories.find((c) => c.id === p.category_id) || null,
    }));

    window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.CATEGORIES), JSON.stringify(bundle.categories));
    window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(hydratedProducts));
    return { categories: bundle.categories, products: hydratedProducts };
  } catch {
    const bundle = INDUSTRY_PRESETS.general;
    return { categories: bundle.categories, products: bundle.products };
  }
}

function writeBrowserStorage(categories: Category[], products: Product[], forceLocalMode = true) {
  if (typeof window === "undefined") return;
  try {
    const hydrated = products.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.category_id) || p.category || null,
    }));
    window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.CATEGORIES), JSON.stringify(categories));
    window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.PRODUCTS), JSON.stringify(hydrated));
    if (forceLocalMode) {
      window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.LOCAL_MODE), "1");
    }
    dispatchCatalogUpdate();
  } catch {
    // ignore storage quota errors
  }
}

function isBrowserLocalOverrideActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return shouldUseLocalCatalogOverride(
      isSupabaseConfigured(),
      window.localStorage.getItem(catalogStorageKey(STORAGE_KEYS.LOCAL_MODE))
    );
  } catch {
    return true;
  }
}

export class CakeService {
  async ensureMarketingDemoCatalog(): Promise<{ categories: Category[]; products: Product[] }> {
    if (typeof window === "undefined") {
      return { categories: [...INITIAL_CATEGORIES], products: [...INITIAL_PRODUCTS] };
    }

    try {
      const initialized = window.localStorage.getItem(catalogStorageKey(STORAGE_KEYS.DEMO_INITIALIZED));
      const state = readBrowserStorage();
      if (shouldInitializeDemoCatalog(initialized, state.products.length)) {
        const catalog = await this.applyIndustryPresetCatalog("general");
        window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.DEMO_INITIALIZED), "1");
        return catalog;
      }

      if (initialized !== "1") {
        window.localStorage.setItem(catalogStorageKey(STORAGE_KEYS.DEMO_INITIALIZED), "1");
      }
      return state;
    } catch {
      return { categories: [...INITIAL_CATEGORIES], products: [...INITIAL_PRODUCTS] };
    }
  }

  async applyIndustryPresetCatalog(
    presetKey: IndustryPreset
  ): Promise<{ categories: Category[]; products: Product[] }> {
    const bundle = INDUSTRY_PRESETS[presetKey] || INDUSTRY_PRESETS.general;
    const hydratedProducts = bundle.products.map((p) => ({
      ...p,
      category: bundle.categories.find((c) => c.id === p.category_id) || null,
    }));

    categoriesStore = [...bundle.categories];
    productsStore = [...hydratedProducts];

    if (typeof window !== "undefined") {
      writeBrowserStorage(bundle.categories, hydratedProducts, true);
    }

    return { categories: bundle.categories, products: hydratedProducts };
  }

  async clearLocalCatalogOverride(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(catalogStorageKey(STORAGE_KEYS.LOCAL_MODE));
    window.localStorage.removeItem(catalogStorageKey(STORAGE_KEYS.PRODUCTS));
    window.localStorage.removeItem(catalogStorageKey(STORAGE_KEYS.CATEGORIES));
    dispatchCatalogUpdate();
  }

  async getCategories(storeId = DEFAULT_STORE_ID): Promise<Category[]> {
    if (typeof window !== "undefined" && isBrowserLocalOverrideActive()) {
      const { categories } = readBrowserStorage();
      return [...categories]
        .filter((c) => c.is_active !== false)
        .sort((a, b) => a.display_order - b.display_order);
    }

    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        const { categories } = readBrowserStorage();
        return [...categories].sort((a, b) => a.display_order - b.display_order);
      }
      return [...categoriesStore].sort((a, b) => a.display_order - b.display_order);
    }

    if (typeof window !== "undefined") {
      const res = await fetch(withStoreSlug("/api/categories"), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.categories)) throw new Error(data.error || "Gagal memuat kategori.");
      return data.categories as Category[];
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("store_id", storeId)
        .neq("slug", "__content_config__")
        .order("display_order", { ascending: true });

      if (error || !data) return [];

      return data as Category[];
    } catch {
      return [];
    }
  }

  async createCategory(input: {
    name: string;
    slug?: string;
    description?: string;
  }, storeId = DEFAULT_STORE_ID): Promise<Category> {
    const slug = (input.slug || input.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (typeof window !== "undefined" && !isBrowserLocalOverrideActive()) {
      const res = await fetch(withStoreSlug("/api/categories"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.category) {
        throw new Error(data.error || "Kategori belum tersimpan.");
      }
      const state = readBrowserStorage();
      writeBrowserStorage([...state.categories, data.category], state.products, false);
      return data.category as Category;
    }

    if (typeof window !== "undefined") {
      const state = readBrowserStorage();
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: input.name.trim(),
        slug: slug || `kat-${Date.now()}`,
        description: input.description?.trim() || "",
        display_order: state.categories.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      writeBrowserStorage([...state.categories, newCat], state.products, true);
      return newCat;
    }

    if (!isSupabaseConfigured()) {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || "",
        display_order: categoriesStore.length + 1,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      categoriesStore.push(newCat);
      return newCat;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) throw new Error("Supabase client unavailable");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        store_id: storeId,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || "",
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Gagal membuat kategori: ${error?.message || "Unknown error"}`);
    }

    return data as Category;
  }

  async deleteCategory(id: string, storeId = DEFAULT_STORE_ID): Promise<boolean> {
    if (typeof window !== "undefined" && !isBrowserLocalOverrideActive()) {
      const res = await fetch(withStoreSlug(`/api/categories?id=${encodeURIComponent(id)}`), { method: "DELETE" });
      if (!res.ok) return false;
      const result = await res.json();
      if (!result.success) return false;
      const state = readBrowserStorage();
      writeBrowserStorage(
        state.categories.filter((category) => category.id !== id),
        state.products.map((product) => product.category_id === id
          ? { ...product, category_id: null, category: null }
          : product),
        false
      );
      return true;
    }

    if (typeof window !== "undefined") {
      const state = readBrowserStorage();
      const nextCats = state.categories.filter((c) => c.id !== id);
      const nextProds = state.products.map((p) =>
        p.category_id === id ? { ...p, category_id: null, category: null } : p
      );
      writeBrowserStorage(nextCats, nextProds, true);
      return true;
    }

    if (!isSupabaseConfigured()) {
      categoriesStore = categoriesStore.filter((c) => c.id !== id);
      return true;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return false;

    await supabase.from("products").update({ category_id: null }).eq("store_id", storeId).eq("category_id", id);
    const { error } = await supabase.from("categories").delete().eq("store_id", storeId).eq("id", id);
    return !error;
  }

  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    readyOnly?: boolean;
    includeInactive?: boolean;
    sort?: string;
  }, storeId = DEFAULT_STORE_ID): Promise<Product[]> {
    if (typeof window !== "undefined" && isBrowserLocalOverrideActive()) {
      const state = readBrowserStorage();
      return this.filterList(state.products, state.categories, filters);
    }

    if (typeof window !== "undefined" && isSupabaseConfigured()) {
      const params = new URLSearchParams();
      if (filters?.includeInactive) params.set("includeInactive", "true");
      if (filters?.categoryId) params.set("categoryId", filters.categoryId);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.readyOnly) params.set("readyOnly", "true");
      if (filters?.sort) params.set("sort", filters.sort);
      const res = await fetch(withStoreSlug(`/api/products?${params.toString()}`), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success || !Array.isArray(data.products)) {
        throw new Error(data?.error || "Gagal memuat produk katalog.");
      }
      const state = readBrowserStorage();
      return this.filterList(data.products as Product[], state.categories, filters);
    }

    if (!isSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        const state = readBrowserStorage();
        return this.filterList(state.products, state.categories, filters);
      }
      return this.filterList(productsStore, categoriesStore, filters);
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return [];

      let query = supabase.from("products").select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `);
      query = query.eq("store_id", storeId);

      if (!filters?.includeInactive) {
        query = query.eq("is_active", true);
      }

      if (filters?.categoryId && filters.categoryId !== "all") {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.readyOnly) {
        query = query.eq("minimum_lead_time_days", 0);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      if (filters?.sort === "price-asc") {
        query = query.order("base_price", { ascending: true });
      } else if (filters?.sort === "price-desc") {
        query = query.order("base_price", { ascending: false });
      } else if (filters?.sort === "lead-time") {
        query = query.order("minimum_lead_time_days", { ascending: true });
      } else {
        query = query.order("display_order", { ascending: true });
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((item: any) => ({
        ...item,
        base_price: Number(item.base_price),
        compare_at_price: item.compare_at_price ? Number(item.compare_at_price) : undefined,
        variants: (item.variants || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((v: any) => ({ ...v, price: Number(v.price) })),
        images: (item.images || []).sort((a: any, b: any) => a.display_order - b.display_order),
      })) as Product[];
    } catch {
      return [];
    }
  }

  private filterList(
    sourceProducts: Product[],
    sourceCategories: Category[],
    filters?: {
      categoryId?: string;
      search?: string;
      readyOnly?: boolean;
      includeInactive?: boolean;
      sort?: string;
    }
  ): Product[] {
    let result = sourceProducts.filter((p) => {
      if (!filters?.includeInactive && !p.is_active) return false;
      if (filters?.categoryId && filters.categoryId !== "all" && p.category_id !== filters.categoryId)
        return false;
      if (filters?.readyOnly && p.minimum_lead_time_days > 0) return false;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesTagline = (p.tagline || "").toLowerCase().includes(query);
        const matchesFlavors = (p.flavor_notes || []).some((f) =>
          f.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDesc && !matchesTagline && !matchesFlavors) return false;
      }
      return true;
    });

    result = result.map((p) => ({
      ...p,
      category: sourceCategories.find((c) => c.id === p.category_id) || p.category || null,
    }));

    if (filters?.sort === "price-asc") {
      result.sort((a, b) => a.base_price - b.base_price);
    } else if (filters?.sort === "price-desc") {
      result.sort((a, b) => b.base_price - a.base_price);
    } else if (filters?.sort === "lead-time") {
      result.sort((a, b) => a.minimum_lead_time_days - b.minimum_lead_time_days);
    } else {
      result.sort((a, b) => a.display_order - b.display_order);
    }

    return result;
  }

  private findInAllPresetsBySlug(slug: string): Product | null {
    for (const bundle of Object.values(INDUSTRY_PRESETS)) {
      const match = bundle.products.find((p) => p.slug === slug);
      if (match) {
        return {
          ...match,
          category: bundle.categories.find((c) => c.id === match.category_id) || null,
        };
      }
    }
    return null;
  }

  async getProductBySlug(slug: string, storeId = DEFAULT_STORE_ID): Promise<Product | null> {
    if (typeof window !== "undefined" && isBrowserLocalOverrideActive()) {
      const state = readBrowserStorage();
      const browserMatch = state.products.find((p) => p.slug === slug);
      if (browserMatch) {
        return {
          ...browserMatch,
          category: state.categories.find((c) => c.id === browserMatch.category_id) || browserMatch.category || null,
        };
      }
    }

    if (!isSupabaseConfigured()) {
      const prod = productsStore.find((p) => p.slug === slug);
      if (prod) {
        return {
          ...prod,
          category: categoriesStore.find((c) => c.id === prod.category_id),
        };
      }
      return this.findInAllPresetsBySlug(slug);
    }

    if (typeof window !== "undefined") {
      const res = await fetch(withStoreSlug(`/api/products?slug=${encodeURIComponent(slug)}`), { cache: "no-store" });
      const data = await res.json();
      return res.ok && data?.success ? (data.product as Product) : null;
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq("slug", slug)
        .eq("store_id", storeId)
        .single();

      if (error || !data) return null;

      return {
        ...data,
        base_price: Number(data.base_price),
        variants: (data.variants || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((v: any) => ({ ...v, price: Number(v.price) })),
        images: (data.images || []).sort((a: any, b: any) => a.display_order - b.display_order),
      } as Product;
    } catch {
      return null;
    }
  }

  async getProductById(id: string, storeId = DEFAULT_STORE_ID): Promise<Product | null> {
    if (typeof window !== "undefined" && isBrowserLocalOverrideActive()) {
      const state = readBrowserStorage();
      const browserMatch = state.products.find((p) => p.id === id);
      if (browserMatch) {
        return {
          ...browserMatch,
          category: state.categories.find((c) => c.id === browserMatch.category_id) || browserMatch.category || null,
        };
      }
    }

    if (!isSupabaseConfigured()) {
      const prod = productsStore.find((p) => p.id === id);
      if (prod) {
        return {
          ...prod,
          category: categoriesStore.find((c) => c.id === prod.category_id),
        };
      }
      for (const bundle of Object.values(INDUSTRY_PRESETS)) {
        const m = bundle.products.find((p) => p.id === id);
        if (m) return m;
      }
      return null;
    }

    if (typeof window !== "undefined") {
      const res = await fetch(withStoreSlug(`/api/products?id=${encodeURIComponent(id)}`), { cache: "no-store" });
      const data = await res.json();
      return res.ok && data?.success ? (data.product as Product) : null;
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq("id", id)
        .eq("store_id", storeId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ...data,
        base_price: Number(data.base_price),
        variants: (data.variants || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((v: any) => ({ ...v, price: Number(v.price) })),
        images: (data.images || []).sort((a: any, b: any) => a.display_order - b.display_order),
      } as Product;
    } catch {
      return null;
    }
  }

  async createProduct(input: ProductInput, storeId = DEFAULT_STORE_ID): Promise<Product> {
    const slug =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`;

    if (typeof window !== "undefined" && !isBrowserLocalOverrideActive()) {
      const res = await fetch(withStoreSlug("/api/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.product) {
        throw new Error(data.error || "Produk belum tersimpan.");
      }
      const state = readBrowserStorage();
      writeBrowserStorage(state.categories, [...state.products, data.product], false);
      return data.product as Product;
    }

    if (typeof window !== "undefined") {
      const state = readBrowserStorage();
      const id = `prod-${Date.now()}`;
      const newVariants: ProductVariant[] = (input.variants || []).map((v, idx) => ({
        id: v.id || `var-${id}-${idx + 1}`,
        product_id: id,
        name: v.name,
        price: v.price,
        is_default: v.is_default,
        display_order: idx + 1,
      }));
      const newImages: ProductImage[] = (input.images || []).map((img, idx) => ({
        id: `img-${id}-${idx + 1}`,
        product_id: id,
        storage_path: img.storage_path,
        alt_text: img.alt_text,
        display_order: idx + 1,
        is_primary: img.is_primary || idx === 0,
      }));

      const newProduct: Product = {
        id,
        category_id: input.category_id || null,
        name: input.name,
        slug,
        tagline: input.tagline || undefined,
        badge: input.badge || undefined,
        description: input.description,
        flavor_notes: input.flavor_notes || [],
        specs: input.specs || [],
        base_price: input.base_price,
        compare_at_price: input.compare_at_price ?? undefined,
        minimum_lead_time_days: input.minimum_lead_time_days,
        is_active: input.is_active,
        is_featured: input.is_featured,
        display_order: state.products.length + 1,
        variants: newVariants,
        images: newImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      writeBrowserStorage(state.categories, [...state.products, newProduct], true);
      return newProduct;
    }

    if (!isSupabaseConfigured()) {
      const id = `prod-${Date.now()}`;
      const newVariants: ProductVariant[] = input.variants.map((v, idx) => ({
        id: v.id || `var-${id}-${idx + 1}`,
        product_id: id,
        name: v.name,
        price: v.price,
        is_default: v.is_default,
        display_order: idx + 1,
      }));

      const newImages: ProductImage[] = input.images.map((img, idx) => ({
        id: `img-${id}-${idx + 1}`,
        product_id: id,
        storage_path: img.storage_path,
        alt_text: img.alt_text,
        display_order: idx + 1,
        is_primary: img.is_primary || idx === 0,
      }));

      const newProduct: Product = {
        id,
        category_id: input.category_id,
        name: input.name,
        slug,
        tagline: input.tagline || undefined,
        badge: input.badge || undefined,
        description: input.description,
        flavor_notes: input.flavor_notes,
        specs: input.specs || [],
        base_price: input.base_price,
        compare_at_price: input.compare_at_price ?? undefined,
        minimum_lead_time_days: input.minimum_lead_time_days,
        is_active: input.is_active,
        is_featured: input.is_featured,
        display_order: productsStore.length + 1,
        variants: newVariants,
        images: newImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      productsStore.push(newProduct);
      return newProduct;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) throw new Error("Supabase client unavailable");

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .insert({
        store_id: storeId,
        category_id: input.category_id || null,
        name: input.name,
        slug,
        description: input.description,
        flavor_notes: input.flavor_notes,
        base_price: input.base_price,
        minimum_lead_time_days: input.minimum_lead_time_days,
        is_active: input.is_active,
        is_featured: input.is_featured,
      })
      .select()
      .single();

    if (prodErr || !prodData) {
      throw new Error(`Gagal menyimpan produk: ${prodErr?.message}`);
    }

    const productId = prodData.id;

    if (input.variants.length > 0) {
      const variantRows = input.variants.map((v, idx) => ({
        store_id: storeId,
        product_id: productId,
        name: v.name,
        price: v.price,
        is_default: v.is_default,
        display_order: idx + 1,
      }));
      await supabase.from("product_variants").insert(variantRows);
    }

    if (input.images.length > 0) {
      const imageRows = input.images.map((img, idx) => ({
        store_id: storeId,
        product_id: productId,
        storage_path: img.storage_path,
        alt_text: img.alt_text || `${input.name} foto ${idx + 1}`,
        is_primary: img.is_primary || idx === 0,
        display_order: idx + 1,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    const created = await this.getProductById(productId, storeId);
    if (!created) throw new Error("Produk berhasil dibuat namun gagal memuat ulang data.");
    return created;
  }

  async updateProduct(id: string, updates: Partial<ProductInput>, storeId = DEFAULT_STORE_ID): Promise<Product | null> {
    if (typeof window !== "undefined" && !isBrowserLocalOverrideActive()) {
      const res = await fetch(withStoreSlug(`/api/products?id=${encodeURIComponent(id)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.product) {
        throw new Error(data.error || "Perubahan produk belum tersimpan.");
      }
      const state = readBrowserStorage();
      const replaced = state.products.map((product) => product.id === id ? data.product : product);
      writeBrowserStorage(state.categories, replaced, false);
      return data.product as Product;
    }

    if (typeof window !== "undefined") {
      const state = readBrowserStorage();
      const idx = state.products.findIndex((p) => p.id === id);
      if (idx === -1) return null;

      const current = state.products[idx];
      const updated: Product = {
        ...current,
        name: updates.name ?? current.name,
        category_id: updates.category_id !== undefined ? updates.category_id : current.category_id,
        tagline: updates.tagline !== undefined ? updates.tagline || undefined : current.tagline,
        badge: updates.badge !== undefined ? updates.badge || undefined : current.badge,
        description: updates.description ?? current.description,
        flavor_notes: updates.flavor_notes ?? current.flavor_notes,
        specs: updates.specs !== undefined ? updates.specs : current.specs,
        base_price: updates.base_price ?? current.base_price,
        compare_at_price:
          updates.compare_at_price !== undefined
            ? updates.compare_at_price ?? undefined
            : current.compare_at_price,
        minimum_lead_time_days: updates.minimum_lead_time_days ?? current.minimum_lead_time_days,
        is_active: updates.is_active ?? current.is_active,
        is_featured: updates.is_featured ?? current.is_featured,
        updated_at: new Date().toISOString(),
      };

      if (updates.variants) {
        updated.variants = updates.variants.map((v, i) => ({
          id: v.id || `var-${id}-${i + 1}`,
          product_id: id,
          name: v.name,
          price: v.price,
          is_default: v.is_default ?? i === 0,
          display_order: v.display_order ?? i + 1,
        }));
      }

      if (updates.images) {
        updated.images = updates.images.map((img, i) => ({
          id: (img as any).id || `img-${id}-${i + 1}`,
          product_id: id,
          storage_path: img.storage_path,
          alt_text: img.alt_text || updated.name,
          display_order: img.display_order ?? i + 1,
          is_primary: img.is_primary ?? i === 0,
        }));
      }

      const nextList = [...state.products];
      nextList[idx] = updated;
      writeBrowserStorage(state.categories, nextList, true);
      return updated;
    }

    if (!isSupabaseConfigured()) {
      const idx = productsStore.findIndex((p) => p.id === id);
      if (idx === -1) return null;

      const current = productsStore[idx];
      const updated: Product = {
        ...current,
        name: updates.name ?? current.name,
        category_id: updates.category_id !== undefined ? updates.category_id : current.category_id,
        tagline: updates.tagline !== undefined ? updates.tagline || undefined : current.tagline,
        badge: updates.badge !== undefined ? updates.badge || undefined : current.badge,
        description: updates.description ?? current.description,
        flavor_notes: updates.flavor_notes ?? current.flavor_notes,
        specs: updates.specs !== undefined ? updates.specs : current.specs,
        base_price: updates.base_price ?? current.base_price,
        compare_at_price:
          updates.compare_at_price !== undefined
            ? updates.compare_at_price ?? undefined
            : current.compare_at_price,
        minimum_lead_time_days: updates.minimum_lead_time_days ?? current.minimum_lead_time_days,
        is_active: updates.is_active ?? current.is_active,
        is_featured: updates.is_featured ?? current.is_featured,
        updated_at: new Date().toISOString(),
      };

      if (updates.variants) {
        updated.variants = updates.variants.map((v, i) => ({
          id: v.id || `var-${id}-${i + 1}`,
          product_id: id,
          name: v.name,
          price: v.price,
          is_default: v.is_default ?? i === 0,
          display_order: v.display_order ?? i + 1,
        }));
      }

      if (updates.images) {
        updated.images = updates.images.map((img, i) => ({
          id: (img as any).id || `img-${id}-${i + 1}`,
          product_id: id,
          storage_path: img.storage_path,
          alt_text: img.alt_text || updated.name,
          display_order: img.display_order ?? i + 1,
          is_primary: img.is_primary ?? i === 0,
        }));
      }

      productsStore[idx] = updated;
      return updated;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return null;

    const { error } = await supabase
      .from("products")
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.category_id !== undefined && { category_id: updates.category_id || null }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.flavor_notes && { flavor_notes: updates.flavor_notes }),
        ...(updates.base_price && { base_price: updates.base_price }),
        ...(updates.minimum_lead_time_days !== undefined && {
          minimum_lead_time_days: updates.minimum_lead_time_days,
        }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.is_featured !== undefined && { is_featured: updates.is_featured }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) throw new Error(error.message);

    if (updates.variants) {
      await supabase.from("product_variants").delete().eq("store_id", storeId).eq("product_id", id);
      if (updates.variants.length > 0) {
        await supabase.from("product_variants").insert(
          updates.variants.map((v, i) => ({
            store_id: storeId,
            product_id: id,
            name: v.name,
            price: v.price,
            is_default: v.is_default ?? i === 0,
            display_order: v.display_order ?? i + 1,
          }))
        );
      }
    }

    if (updates.images) {
      await supabase.from("product_images").delete().eq("store_id", storeId).eq("product_id", id);
      if (updates.images.length > 0) {
        await supabase.from("product_images").insert(
          updates.images.map((img, i) => ({
            store_id: storeId,
            product_id: id,
            storage_path: img.storage_path,
            alt_text: img.alt_text || updates.name || "Foto produk",
            display_order: img.display_order ?? i + 1,
            is_primary: img.is_primary ?? i === 0,
          }))
        );
      }
    }

    return this.getProductById(id, storeId);
  }

  async deleteProduct(
    id: string,
    storeId = DEFAULT_STORE_ID
  ): Promise<{ success: boolean; softDeleted?: boolean; message?: string }> {
    if (typeof window !== "undefined" && !isBrowserLocalOverrideActive()) {
      try {
        const res = await fetch(withStoreSlug(`/api/products?id=${encodeURIComponent(id)}`), { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, message: data.error || "Produk belum terhapus." };
        }
        const state = readBrowserStorage();
        writeBrowserStorage(state.categories, state.products.filter((product) => product.id !== id), false);
        return data;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Produk belum terhapus.";
        return { success: false, message };
      }
    }

    if (typeof window !== "undefined") {
      const state = readBrowserStorage();
      const exists = state.products.some((p) => p.id === id);
      if (!exists) return { success: false, message: "Produk tidak ditemukan." };
      writeBrowserStorage(
        state.categories,
        state.products.filter((p) => p.id !== id),
        true
      );
      return { success: true };
    }

    if (!isSupabaseConfigured()) {
      const idx = productsStore.findIndex((p) => p.id === id);
      if (idx === -1) {
        return { success: false, message: "Produk tidak ditemukan." };
      }
      productsStore.splice(idx, 1);
      return { success: true };
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return { success: false, message: "Koneksi database tidak tersedia." };

    try {
      const { error } = await supabase.from("products").delete().eq("store_id", storeId).eq("id", id);
      if (error) {
        if (error.code === "23503") {
          await supabase.from("products").update({ is_active: false }).eq("store_id", storeId).eq("id", id);
          return {
            success: true,
            softDeleted: true,
            message: "Produk memiliki riwayat pesanan, status dialihkan menjadi Draft/Nonaktif.",
          };
        }
        throw new Error(error.message);
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus produk.";
      return { success: false, message: msg };
    }
  }

  async reorderProducts(productIds: string[], storeId = DEFAULT_STORE_ID): Promise<void> {
    if (typeof window !== "undefined" && isBrowserLocalOverrideActive()) {
      const state = readBrowserStorage();
      const updated = state.products.map((p) => {
        const idx = productIds.indexOf(p.id);
        return idx >= 0 ? { ...p, display_order: idx + 1 } : p;
      });
      writeBrowserStorage(state.categories, updated, true);
      return;
    }

    if (!isSupabaseConfigured()) {
      productIds.forEach((id, index) => {
        const prod = productsStore.find((p) => p.id === id);
        if (prod) prod.display_order = index + 1;
      });
      return;
    }

    if (typeof window !== "undefined") {
      const response = await fetch(withStoreSlug("/api/products"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds }),
      });
      if (!response.ok) throw new Error("Urutan produk belum tersimpan.");
      return;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return;

    for (let i = 0; i < productIds.length; i++) {
      await supabase
        .from("products")
        .update({ display_order: i + 1 })
        .eq("store_id", storeId)
        .eq("id", productIds[i]);
    }
  }

  async toggleProductActive(id: string, isActive: boolean): Promise<Product | null> {
    return this.updateProduct(id, { is_active: isActive });
  }
}

export const cakeService = new CakeService();
