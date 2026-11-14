"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Category } from "@/types/bakery";
import { SmoothInput } from "@/components/ui/skiper-ui/skiper106";
import { MotionIcon } from "@/components/ui/MotionIcon";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

interface CatalogFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availabilityFilter: string; // "all" | "ready" | "preorder"
  onAvailabilityChange: (val: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  availabilityFilter,
  onAvailabilityChange,
  sortBy,
  onSortChange,
  totalResults,
}) => {
  const settings = useBusinessSettings();

  return (
    <div className="space-y-6">
      {/* Search Bar & Sort Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-lg">
          <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#806C71] dark:text-[#C5B5A8]">
            <MotionIcon icon={Search} size={17} />
          </div>
          <SmoothInput
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            aria-label="Cari"
            wrapperClassName="!max-w-none !rounded-none !border-[#BFAF9F] !bg-white !py-2.5 !pl-10 !pr-9 dark:!bg-[#2C2421] dark:!border-white/20 dark:!text-[#FAF4EE]"
            className="!text-sm placeholder:!text-[#806C71] dark:placeholder:!text-stone-400 dark:!text-[#FAF4EE]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#806C71] hover:text-[#4D3040] dark:text-stone-400 dark:hover:text-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort and Availability Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          {/* Availability Pills */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => onAvailabilityChange("all")}
              className={`touch-target border-b px-1 py-2 transition-colors ${
                availabilityFilter === "all"
                  ? "border-[#4D3040] text-[#4D3040] font-semibold dark:border-[#D6A77E] dark:text-[#FAF4EE]"
                  : "border-transparent text-[#55464B] hover:text-[#4D3040] dark:text-[#D8CBC0] dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => onAvailabilityChange("ready")}
              className={`touch-target border-b px-1 py-2 transition-colors ${
                availabilityFilter === "ready"
                  ? "border-[#4D3040] text-[#4D3040] font-semibold dark:border-[#D6A77E] dark:text-[#FAF4EE]"
                  : "border-transparent text-[#55464B] hover:text-[#4D3040] dark:text-[#D8CBC0] dark:hover:text-white"
              }`}
            >
              Ready
            </button>
            <button
              onClick={() => onAvailabilityChange("preorder")}
              className={`touch-target border-b px-1 py-2 transition-colors ${
                availabilityFilter === "preorder"
                  ? "border-[#4D3040] text-[#4D3040] font-semibold dark:border-[#D6A77E] dark:text-[#FAF4EE]"
                  : "border-transparent text-[#55464B] hover:text-[#4D3040] dark:text-[#D8CBC0] dark:hover:text-white"
              }`}
            >
              Pre-order
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none border border-[#BFAF9F] bg-white py-2 pl-3 pr-8 text-xs font-medium text-[#4D3040] focus:outline-none focus:border-[#4D3040] cursor-pointer dark:bg-[#2C2421] dark:text-[#FAF4EE] dark:border-white/20"
            >
              <option value="default">Default</option>
              <option value="price-asc">Termurah</option>
              <option value="price-desc">Termahal</option>
              <option value="lead-time">Tercepat</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#806C71] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-stone-400" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-[#DBD0C5]/40 dark:border-white/10">
        <button
          onClick={() => onSelectCategory("all")}
          className={`touch-target shrink-0 border-b-2 px-1 py-2 text-xs font-semibold transition-colors ${
            selectedCategory === "all"
              ? "border-[#4D3040] text-[#4D3040] dark:border-[#D6A77E] dark:text-[#FAF4EE]"
              : "border-transparent text-[#55464B] hover:text-[#4D3040] dark:text-[#D8CBC0] dark:hover:text-white"
          }`}
        >
          Semua ({totalResults})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`touch-target shrink-0 border-b-2 px-1 py-2 text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? "border-[#4D3040] text-[#4D3040] dark:border-[#D6A77E] dark:text-[#FAF4EE]"
                : "border-transparent text-[#55464B] hover:text-[#4D3040] dark:text-[#D8CBC0] dark:hover:text-white"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CatalogFilters;
