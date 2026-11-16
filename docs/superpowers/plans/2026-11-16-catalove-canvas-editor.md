# Catalove Canvas Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make canvas editing predictable and let owners add custom text, image, and button content with reliable draft saving.

**Architecture:** Put section list operations in tested pure functions used by HomePage and Canvas Studio. Keep section IDs and custom blocks in the existing theme JSON. Canvas Studio owns section structure controls; the page remains the live content preview. Debounce remote settings writes centrally while keeping local settings updates immediate.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing localStorage and Supabase settings API, `tsx` tests.

## Global Constraints

- Keep the draft section order separate from the published `section_order` until the owner applies it.
- Only Canvas Studio offers add, remove, and reorder controls for sections.
- Keep existing built-in section IDs unique and preserve all current saved settings.
- Store custom content in the existing `theme_config` JSON; do not add a database table.
- Support custom text, image URL, and button/link blocks with stable IDs.
- Keep preset palettes and the existing accent, background, card, and text color roles.
- Make local previews immediate and debounce remote writes.

## File Map

- `src/lib/canvas-sections.ts`: pure section order normalization and mutation functions.
- `src/types/catalove.ts`: custom content block types and custom section ID/config.
- `src/components/storefront/CustomCanvasSections.tsx`: render and edit custom content blocks.
- `src/components/storefront/LiveCustomizerDock.tsx`: the single section structure panel and hex controls.
- `src/app/(storefront)/page.tsx`: keep draft preview/apply behavior and remove duplicate structure controls.
- `src/app/(admin)/admin/settings/page.tsx`: link owners to Canvas Studio instead of duplicating section management.
- `src/lib/business-settings.ts`: immediate local save and debounced serialized remote save.
- `src/app/api/settings/route.ts`: keep existing settings payload format.
- `tests/canvas-sections.test.ts`, `tests/business-settings-sync.test.ts`: targeted helper and sync coverage.

### Task 1: Centralize and test section ordering

**Files:**
- Create: `src/lib/canvas-sections.ts`
- Create: `tests/canvas-sections.test.ts`
- Modify: `src/app/(storefront)/page.tsx`
- Modify: `src/components/storefront/LiveCustomizerDock.tsx`

- [ ] Implement pure helpers to normalize section IDs (remove unknowns and duplicates), add a section once, remove a section while preserving at least `hero`, and move a section up/down without mutating the input.
- [ ] Test duplicate IDs, unknown IDs, hidden/restored sections, first/last boundaries, and stable order.
- [ ] Run `npx tsx tests/canvas-sections.test.ts` and confirm the tests fail before implementation and pass after.
- [ ] Use the helpers in both HomePage and Canvas Studio.
- [ ] Remove page-level drag, add, remove, and reorder controls. Keep the page as a preview with its content edit affordances; keep structure controls only in Canvas Studio.
- [ ] Verify draft order remains separate from published order until the existing apply action.

### Task 2: Add reusable custom content blocks

**Files:**
- Modify: `src/types/catalove.ts`
- Modify: `src/components/storefront/PricingSection.tsx` (`ALL_CANVAS_SECTIONS` metadata)
- Modify: `src/components/storefront/CustomCanvasSections.tsx`
- Modify: `src/app/(storefront)/page.tsx`
- Modify: `src/components/storefront/LiveCustomizerDock.tsx`

- [ ] Add a `custom_content` built-in section and a typed block union for text, image URL, and button/link blocks, each with a stable string ID.
- [ ] Render saved blocks in order; when canvas mode is active, let the owner add a block type, edit its fields, move it up/down, and delete it.
- [ ] Ensure empty or invalid blocks are not published and external links use safe URL protocols.
- [ ] Test add, edit, reorder, delete, stable IDs, and preservation through settings serialization.

### Task 3: Expose complete color values

**Files:**
- Modify: `src/components/storefront/LiveCustomizerDock.tsx`
- Create or extend: `src/lib/theme-colors.ts`
- Modify: relevant tests.

- [ ] Keep the four existing palette roles and add an accessible hex text input next to each native color picker.
- [ ] Validate values as six-digit hex colors before saving; keep incomplete typing local until blur, then restore the last valid value if invalid.
- [ ] Test valid/invalid values and verify current preset colors still populate the custom controls.

### Task 4: Make settings writes resilient to rapid editing

**Files:**
- Modify: `src/lib/business-settings.ts`
- Create: `tests/business-settings-sync.test.ts`

- [ ] Keep localStorage writes synchronous and schedule one remote write after a short idle interval.
- [ ] Serialize remote writes so a slower older request cannot overwrite a newer settings snapshot.
- [ ] Use a keepalive request for the latest pending snapshot during page navigation where supported.
- [ ] Test debounce collapse, ordering of in-flight requests, and fallback when remote sync fails.

### Task 5: Verify existing and new storefront behavior

- [ ] Run new focused tests, then `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify source behavior for section uniqueness, custom blocks, color roles, and draft/apply separation.
- [ ] Report any visual browser check unavailable under the active local browser policy.
- [ ] Check `git diff --check` and confirm no existing product data or unrelated user changes were removed.
