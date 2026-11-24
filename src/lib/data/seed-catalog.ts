import type { Category, Product, BusinessSettings } from "@/types/catalove";
import { INDUSTRY_PRESETS, INITIAL_SETTINGS as CATALOVE_SETTINGS } from "./universal-presets";

/** Catalove-owned demo data for offline mode; never seed from a seller database. */
export const INITIAL_SETTINGS: BusinessSettings = { ...CATALOVE_SETTINGS };
export const INITIAL_CATEGORIES: Category[] = INDUSTRY_PRESETS.general.categories;
export const INITIAL_PRODUCTS: Product[] = INDUSTRY_PRESETS.general.products;
