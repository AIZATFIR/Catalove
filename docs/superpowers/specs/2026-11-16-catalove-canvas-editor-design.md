# Catalove Canvas Editor Reliability and Content Blocks

## Goal

Make the catalog canvas predictable to edit, easy to add useful content to, and safe to publish without accidental duplicated or lost sections.

## Current findings

- Both the page canvas and Canvas Studio show controls to add sections; section ordering is also available in both places.
- Reordering can be attempted with drag, inline arrows, and Canvas Studio arrows, which makes the controls hard to understand.
- Section order and content editing logic are split between the home page and the dock.
- Existing section components expose different editable fields; there is no general custom content block for text, image, or button content.
- The color editor already supports accent, background, card, and text colors. It should expose those four roles clearly and allow direct hex entry.

## Design

### One section control surface

Canvas Studio becomes the single place to add, remove, and reorder sections. Use a numbered list with clear up/down controls; do not require drag-and-drop. The live page stays as a preview and retains direct editing of the section's content. Section changes update the draft order immediately and publish only when the owner chooses “Terapkan”.

### Custom content blocks

Add one “Konten Kustom” section that can contain multiple owner-created blocks. The first block types are text, image, and button/link. Each block has a stable ID, can be edited, moved up/down, or deleted, and is stored in the existing theme settings JSON. This avoids introducing a new table or billing dependency. Image blocks use a URL in this first slice; upload integration can reuse the existing catalog upload flow in a separate implementation if the current upload service supports it safely.

### Color controls

Keep the existing balanced preset palettes. Make the four custom roles obvious: accent, background, card, and text. Add a text field beside each native picker so users can paste a hex value and see the exact color being used.

### Reliability

- Use shared pure functions for section add/remove/reorder so the page and dock cannot drift.
- Normalize IDs and ensure every built-in section appears at most once.
- Keep draft and published orders distinct.
- Save a local draft synchronously for responsive editing and debounce remote settings writes so rapid typing does not queue a request per character.
- Preserve existing saved settings and custom text when applying palette changes.

## Scope and boundaries

This slice covers Canvas Studio section controls, the custom content section, direct hex color entry, and settings persistence behavior needed for editing. It does not implement user accounts or multiple catalogs, ad serving, subscription billing, arbitrary CSS/HTML, or domain provisioning.

## Acceptance criteria

1. Only Canvas Studio presents controls for adding, removing, and reordering sections.
2. Adding a section once creates one section; removing and restoring it does not duplicate it.
3. Draft reorder changes are visible immediately and do not change the public order until “Terapkan”.
4. Owners can create, edit, reorder, and delete multiple text, image URL, and button/link blocks.
5. The four color roles each show a picker and editable hex field; valid changes apply to the live preview and persist.
6. Typing updates the preview immediately while remote writes are debounced and preserve the final value.
7. Existing products, saved themes, and storefront ordering remain intact.

## Validation

Add unit coverage for section order normalization and custom block editing/persistence helpers. Run the project test suite and production build. Verify the canvas interactions at desktop and mobile widths, including keyboard use for section movement and the live preview before and after applying the draft.
