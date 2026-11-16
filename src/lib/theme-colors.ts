export function normalizeHexColor(value: string): string | null {
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized)
    ? normalized.toUpperCase()
    : null;
}
