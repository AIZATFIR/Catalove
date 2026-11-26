export * from "./catalove";

// Backward-compatibility aliases
export type CakeCategorySlug = string;
export type AvailabilityStatus = "available" | "sold_out" | "closed";

export interface ProductAvailability {
  id: string;
  store_id?: string;
  product_id: string;
  availability_date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
  quota?: number | null;
  updated_at?: string;
}
