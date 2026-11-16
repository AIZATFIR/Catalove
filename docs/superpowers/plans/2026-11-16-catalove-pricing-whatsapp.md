# Catalove Pricing and WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make Catalove pricing clear and send every package CTA directly to a prefilled WhatsApp draft.

**Architecture:** Add a small pure URL builder for Catalove package inquiries and use the existing business settings store for the destination number. Keep pricing copy and package identifiers in `PricingSection`; generic CTAs open a generic inquiry draft. Remove the storefront order configurator modal from this marketing flow.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing `wa.me` URL conventions, `tsx` tests.

## Global Constraints

- Use the configured `seller_whatsapp` number, falling back to `6285946689168`.
- Show paid prices as starting prices: Business Rp299rb and Enterprise Rp799rb.
- Describe the free entry plan as ad-supported; discuss final package scope, hosting, and domain details over WhatsApp.
- Opening WhatsApp creates a draft; Catalove never sends a message automatically.
- Preserve the user's existing uncommitted change in `src/app/(storefront)/bio/page.tsx`.

## File Map

- `src/lib/utils/catalove-whatsapp.ts`: package inquiry draft and URL construction.
- `tests/whatsapp-url.test.ts`: assertions for generic and plan-specific WhatsApp URLs.
- `src/components/storefront/PricingSection.tsx`: package presentation and plan CTA links.
- `src/app/(storefront)/layout.tsx`: remove the unused modal mount.
- Existing CTA callers in `bio/page.tsx`, `CustomCanvasSections.tsx`, `page.tsx`, `Navbar.tsx`, `Hero.tsx`, `LiveCustomizerDock.tsx`, and `BrandStory.tsx`: send generic inquiries through the shared helper.

### Task 1: Add tested inquiry URL builder

**Files:**
- Create: `src/lib/utils/catalove-whatsapp.ts`
- Modify: `tests/whatsapp-url.test.ts`

- [ ] Build a pure helper that accepts an optional plan (`business` or `enterprise`) and phone number, strips non-digits from the number, and encodes a short Indonesian message naming the plan and starting price. For a generic inquiry, ask for plan and feature details. Always ask to confirm hosting/domain scope rather than implying inclusion.
- [ ] Test generic, Business, and Enterprise drafts, URL encoding, and a formatted phone number.
- [ ] Run `npx tsx tests/whatsapp-url.test.ts`; expect all existing and new assertions to pass.

### Task 2: Replace pricing modal with clear package cards

**Files:**
- Modify: `src/components/storefront/PricingSection.tsx`
- Modify: `src/app/(storefront)/layout.tsx`

- [ ] Present Free (ad-supported), Business (mulai Rp299rb), and Enterprise (mulai Rp799rb, customizable) with concise explanations and direct anchor links to the WhatsApp helper.
- [ ] Include copy that final feature scope, hosting, and domain are confirmed through WhatsApp.
- [ ] Remove `OrderSchemeModal` and the order modal event flow from the storefront layout and pricing component.
- [ ] Confirm keyboard navigation and visible link labels in the rendered pricing section.

### Task 3: Route all generic Catalove CTAs to WhatsApp

**Files:**
- Modify: `src/app/(storefront)/bio/page.tsx`
- Modify: `src/app/(storefront)/page.tsx`
- Modify: `src/components/storefront/CustomCanvasSections.tsx`
- Modify: `src/components/storefront/Navbar.tsx`
- Modify: `src/components/storefront/Hero.tsx`
- Modify: `src/components/storefront/LiveCustomizerDock.tsx`
- Modify: `src/components/storefront/BrandStory.tsx`

- [ ] Replace calls that open the configurator modal with direct WhatsApp links using the shared generic inquiry helper and configured seller number.
- [ ] Preserve button wording, styling, and close the mobile nav before following the link.
- [ ] Confirm no marketing CTA dispatches `catalove-open-order-modal` and no order modal remains mounted.

### Task 4: Verify the flow

- [ ] Run `npx tsx tests/whatsapp-url.test.ts`.
- [ ] Run the repository test script and production build if the existing local edits allow them to compile.
- [ ] Inspect the storefront pricing section and one generic CTA at desktop and mobile widths; verify the configured phone and draft text.
- [ ] Report unrelated pre-existing build failures without rewriting the user's local changes.
