import { Category, Product, ProductImage, ProductVariant } from "@/types/bakery";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "@/lib/data/seed-cakes";
import { ProductInput } from "@/lib/validators/product";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@supabase/supabase-js";

// In-memory store for local development fallback & automated testing
let categoriesStore: Category[] = [...INITIAL_CATEGORIES];
let productsStore: Product[] = [...INITIAL_PRODUCTS];

function getDirectSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export class CakeService {
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return [...categoriesStore].sort((a, b) => a.display_order - b.display_order);
    }

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return [...categoriesStore];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .neq("slug", "__content_config__")
        .order("display_order", { ascending: true });

      if (error) {
        return [...categoriesStore].sort((a, b) => a.display_order - b.display_order);
      }

      return (data || []) as Category[];
    } catch {
      return [...categoriesStore].sort((a, b) => a.display_order - b.display_order);
    }
  }

  async createCategory(input: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<Category> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat kategori");
      }
      return data.category as Category;
    }

    const slug = (input.slug || input.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

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

  async deleteCategory(id: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus kategori");
      }
      return true;
    }

    if (!isSupabaseConfigured()) {
      categoriesStore = categoriesStore.filter((c) => c.id !== id);
      return true;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return false;

    await supabase.from("products").update({ category_id: null }).eq("category_id", id);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    return !error;
  }

  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    readyOnly?: boolean;
    includeInactive?: boolean;
    sort?: string;
  }): Promise<Product[]> {
    if (typeof window !== "undefined" && filters?.includeInactive) {
      try {
        const res = await fetch("/api/products?includeInactive=true");
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.products)) {
            let list = data.products as Product[];
            if (filters.categoryId && filters.categoryId !== "all") {
              list = list.filter((p) => p.category_id === filters.categoryId);
            }
            if (filters.search) {
              const q = filters.search.toLowerCase();
              list = list.filter(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  p.description.toLowerCase().includes(q)
              );
            }
            return list;
          }
        }
      } catch {
        // fallback
      }
    }
    if (!isSupabaseConfigured()) {
      let result = productsStore.filter((p) => {
        if (!filters?.includeInactive && !p.is_active) return false;
        if (filters?.categoryId && filters.categoryId !== "all" && p.category_id !== filters.categoryId) return false;
        if (filters?.readyOnly && p.minimum_lead_time_days > 0) return false;
        if (filters?.search) {
          const query = filters.search.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(query);
          const matchesDesc = p.description.toLowerCase().includes(query);
          const matchesFlavors = p.flavor_notes.some((f) => f.toLowerCase().includes(query));
          if (!matchesName && !matchesDesc && !matchesFlavors) return false;
        }
        return true;
      });

      result = result.map((p) => ({
        ...p,
        category: categoriesStore.find((c) => c.id === p.category_id),
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

    try {
      const supabase = getDirectSupabaseClient();
      if (!supabase) return [];

      let query = supabase.from("products").select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        images:product_images(*)
      `);

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
      if (error || !data || data.length === 0) {
        // Fallback to local store if db is empty during initial migration
        return this.filterLocalStore(filters);
      }

      return data.map((item: any) => ({
        ...item,
        base_price: Number(item.base_price),
        variants: (item.variants || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((v: any) => ({ ...v, price: Number(v.price) })),
        images: (item.images || []).sort((a: any, b: any) => a.display_order - b.display_order),
      })) as Product[];
    } catch {
      return this.filterLocalStore(filters);
    }
  }

  private filterLocalStore(filters?: {
    categoryId?: string;
    search?: string;
    readyOnly?: boolean;
    includeInactive?: boolean;
    sort?: string;
  }): Product[] {
    let result = productsStore.filter((p) => {
      if (!filters?.includeInactive && !p.is_active) return false;
      if (filters?.categoryId && filters.categoryId !== "all" && p.category_id !== filters.categoryId) return false;
      if (filters?.readyOnly && p.minimum_lead_time_days > 0) return false;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesFlavors = p.flavor_notes.some((f) => f.toLowerCase().includes(query));
        if (!matchesName && !matchesDesc && !matchesFlavors) return false;
      }
      return true;
    });

    result = result.map((p) => ({
      ...p,
      category: categoriesStore.find((c) => c.id === p.category_id),
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

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const prod = productsStore.find((p) => p.slug === slug);
      if (!prod) return null;
      return {
        ...prod,
        category: categoriesStore.find((c) => c.id === prod.category_id),
      };
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
        .single();

      if (error || !data) {
        const local = productsStore.find((p) => p.slug === slug);
        if (!local) return null;
        return {
          ...local,
          category: categoriesStore.find((c) => c.id === local.category_id),
        };
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
      const local = productsStore.find((p) => p.slug === slug);
      if (!local) return null;
      return {
        ...local,
        category: categoriesStore.find((c) => c.id === local.category_id),
      };
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const prod = productsStore.find((p) => p.id === id);
      if (!prod) return null;
      return {
        ...prod,
        category: categoriesStore.find((c) => c.id === prod.category_id),
      };
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
        .single();

      if (error || !data) {
        const local = productsStore.find((p) => p.id === id);
        if (!local) return null;
        return {
          ...local,
          category: categoriesStore.find((c) => c.id === local.category_id),
        };
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
      const local = productsStore.find((p) => p.id === id);
      if (!local) return null;
      return {
        ...local,
        category: categoriesStore.find((c) => c.id === local.category_id),
      };
    }
  }

  async createProduct(input: ProductInput): Promise<Product> {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat produk");
      }
      return data.product as Product;
    }

    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${Date.now().toString().slice(-4)}`;

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
        description: input.description,
        flavor_notes: input.flavor_notes,
        base_price: input.base_price,
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

    // 1. Insert product
    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .insert({
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

    // 2. Insert variants if any
    if (input.variants.length > 0) {
      const variantRows = input.variants.map((v, idx) => ({
        product_id: productId,
        name: v.name,
        price: v.price,
        is_default: v.is_default,
        display_order: idx + 1,
      }));
      await supabase.from("product_variants").insert(variantRows);
    }

    // 3. Insert images if any
    if (input.images.length > 0) {
      const imageRows = input.images.map((img, idx) => ({
        product_id: productId,
        storage_path: img.storage_path,
        alt_text: img.alt_text || `${input.name} foto ${idx + 1}`,
        is_primary: img.is_primary || idx === 0,
        display_order: idx + 1,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    const created = await this.getProductById(productId);
    if (!created) throw new Error("Produk berhasil dibuat namun gagal memuat ulang data.");
    return created;
  }

  async updateProduct(id: string, updates: Partial<ProductInput>): Promise<Product | null> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui produk");
      }
      return data.product as Product;
    }

    if (!isSupabaseConfigured()) {
      const idx = productsStore.findIndex((p) => p.id === id);
      if (idx === -1) return null;

      const current = productsStore[idx];
      const updated: Product = {
        ...current,
        name: updates.name ?? current.name,
        category_id: updates.category_id !== undefined ? updates.category_id : current.category_id,
        description: updates.description ?? current.description,
        flavor_notes: updates.flavor_notes ?? current.flavor_notes,
        base_price: updates.base_price ?? current.base_price,
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
      .eq("id", id);

    if (error) throw new Error(error.message);

    // Update variants if provided
    if (updates.variants) {
      await supabase.from("product_variants").delete().eq("product_id", id);
      if (updates.variants.length > 0) {
        await supabase.from("product_variants").insert(
          updates.variants.map((v, i) => ({
            product_id: id,
            name: v.name,
            price: v.price,
            is_default: v.is_default ?? i === 0,
            display_order: v.display_order ?? i + 1,
          }))
        );
      }
    }

    // Update images if provided
    if (updates.images) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (updates.images.length > 0) {
        await supabase.from("product_images").insert(
          updates.images.map((img, i) => ({
            product_id: id,
            storage_path: img.storage_path,
            alt_text: img.alt_text || updates.name || "Foto kue",
            display_order: img.display_order ?? i + 1,
            is_primary: img.is_primary ?? i === 0,
          }))
        );
      }
    }

    return this.getProductById(id);
  }

  async deleteProduct(id: string): Promise<{ success: boolean; softDeleted?: boolean; message?: string }> {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus produk");
      }
      return data;
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
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        // Code 23503 is foreign_key_violation (e.g. order_items references this product)
        if (error.code === "23503") {
          await supabase.from("products").update({ is_active: false }).eq("id", id);
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

  async reorderProducts(productIds: string[]): Promise<void> {
    if (!isSupabaseConfigured()) {
      productIds.forEach((id, index) => {
        const prod = productsStore.find((p) => p.id === id);
        if (prod) prod.display_order = index + 1;
      });
      return;
    }

    const supabase = getDirectSupabaseClient();
    if (!supabase) return;

    for (let i = 0; i < productIds.length; i++) {
      await supabase
        .from("products")
        .update({ display_order: i + 1 })
        .eq("id", productIds[i]);
    }
  }

  async toggleProductActive(id: string, isActive: boolean): Promise<Product | null> {
    return this.updateProduct(id, { is_active: isActive });
  }
}

export const cakeService = new CakeService();
