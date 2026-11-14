export type IndustryPreset =
  | "general"
  | "fashion"
  | "bakery"
  | "florist"
  | "crafts"
  | "gadgets"
  | "services";

export type WorkflowMode =
  | "whatsapp_direct"
  | "preorder_calendar"
  | "cart_checkout"
  | "inquiry_only";

export type FontHeadingOption =
  | "playfair"
  | "cormorant"
  | "outfit"
  | "syne"
  | "inter"
  | "space_grotesk"
  | "jakarta";

export type FontBodyOption = "jakarta" | "inter" | "outfit";

export type ColorThemeOption =
  | "noir_gold"
  | "warm_oat"
  | "matcha_sage"
  | "rose_velvet"
  | "minimal_slate"
  | "sunset_terracotta"
  | "cyber_neo";

export type CardStyleOption =
  | "modern_glass"
  | "clean_flat"
  | "bordered_clay"
  | "minimal_mono";

export type HeroStyleOption =
  | "split_dynamic"
  | "bento_grid"
  | "minimal_center"
  | "rotating_showcase";

export type CatalogLayoutOption =
  | "pinterest_masonry"
  | "tiktok_feed"
  | "grid_2"
  | "grid_3"
  | "grid_4"
  | "masonry";

export interface ThemeConfig {
  font_heading: FontHeadingOption;
  font_body: FontBodyOption;
  color_theme: ColorThemeOption;
  card_style: CardStyleOption;
  hero_style: HeroStyleOption;
  catalog_layout?: CatalogLayoutOption;
  catalog_columns_desktop: 2 | 3 | 4;
  catalog_columns_mobile: 1 | 2;
}

export interface MarqueeAnnouncement {
  enabled: boolean;
  text: string;
  badge?: string;
  link?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // e.g. "Size XL / 20cm / 500ml"
  price: number;
  sku?: string;
  is_default: boolean;
  display_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  category_id?: string | null;
  category?: Category | null;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  specs?: ProductSpec[];
  flavor_notes: string[]; // Backwards-compatible tag list
  base_price: number;
  compare_at_price?: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  badge?: string; // e.g. "Ready Stock", "Pre-Order H-2", "Best Seller", "New"
  minimum_lead_time_days: number; // 0 for ready stock, 1 for H-1, 2 for H-2
  images: ProductImage[];
  variants: ProductVariant[];
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = "pending" | "contacted" | "confirmed" | "completed" | "cancelled";
export type FulfillmentMethod = "pickup" | "delivery" | "shipping";

export interface OrderRequestItem {
  id: string;
  order_request_id?: string;
  product_id: string;
  product_variant_id?: string | null;
  product_name_snapshot: string;
  variant_name_snapshot?: string | null;
  unit_price_snapshot: number;
  quantity: number;
  subtotal_snapshot: number;
  image_url?: string;
}

export interface OrderRequest {
  id: string;
  reference_code: string; // e.g. #CTL-2610-XXXX
  customer_name: string;
  customer_whatsapp: string;
  requested_date?: string; // YYYY-MM-DD
  fulfillment_method: FulfillmentMethod;
  delivery_address?: string | null;
  customer_notes?: string | null;
  cake_inscription?: string | null;
  candle_count?: number;
  greeting_card_message?: string | null;
  custom_attributes?: Record<string, string>; // Universal inscriptions, greeting cards, size preferences
  status: OrderStatus;
  subtotal: number;
  items: OrderRequestItem[];
  created_at: string;
  updated_at?: string;
}

export interface BusinessSettings {
  store_name: string;
  store_tagline: string;
  seller_whatsapp: string;
  currency_symbol: string;
  store_address: string;
  kitchen_address?: string;
  business_timezone: string;
  instagram_handle: string;
  tiktok_handle?: string;
  default_lead_time_days: number;

  industry_preset: IndustryPreset;
  workflow_mode: WorkflowMode;
  catalog_layout?: CatalogLayoutOption;
  enable_preloader?: boolean;
  story_image_url?: string;
  theme_config: ThemeConfig;
  marquee_announcement: MarqueeAnnouncement;

  // Navigation & Header
  nav_brand_title?: string;
  nav_cta_text?: string;

  // Hero Section
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_primary_cta?: string;
  hero_secondary_cta?: string;
  hero_badge_1?: string;
  hero_badge_2?: string;
  hero_badge_3?: string;

  // Brand Story & Value Proposition
  story_eyebrow?: string;
  story_title?: string;
  story_p1?: string;
  story_p2?: string;
  feature_1_title?: string;
  feature_1_desc?: string;
  feature_2_title?: string;
  feature_2_desc?: string;
  feature_3_title?: string;
  feature_3_desc?: string;

  // Showcase Section
  showcase_eyebrow?: string;
  showcase_title?: string;
  showcase_desc?: string;
  showcase_link_text?: string;
  scroll_showcase_eyebrow?: string;
  scroll_showcase_desc?: string;
  scroll_showcase_button?: string;

  // Story Notes (Backward-compatible)
  story_note_title_1?: string;
  story_note_desc_1?: string;
  story_note_title_2?: string;
  story_note_desc_2?: string;

  // Workflow / Steps
  steps_eyebrow?: string;
  steps_title?: string;
  steps_desc?: string;
  step_1_title?: string;
  step_1_desc?: string;
  step_2_title?: string;
  step_2_desc?: string;
  step_3_title?: string;
  step_3_desc?: string;
  order_steps_eyebrow?: string;
  order_steps_title?: string;
  order_steps_desc?: string;
  order_step_1_title?: string;
  order_step_1_desc?: string;
  order_step_2_title?: string;
  order_step_2_desc?: string;
  order_step_3_title?: string;
  order_step_3_desc?: string;

  // Catalog Section
  catalog_eyebrow?: string;
  catalog_title?: string;
  catalog_desc?: string;

  // Footer
  footer_tagline?: string;
  footer_desc?: string;
  footer_badge?: string;
}
