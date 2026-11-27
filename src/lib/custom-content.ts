import type { CustomContentBlock, MarqueeAnnouncement } from "@/types/catalove";

export function appendCustomContentBlock(
  blocks: readonly CustomContentBlock[],
  block: CustomContentBlock
): CustomContentBlock[] {
  return [...blocks, block];
}

export function replaceCustomContentBlock(
  blocks: readonly CustomContentBlock[],
  updated: CustomContentBlock
): CustomContentBlock[] {
  return blocks.map((block) => (block.id === updated.id ? updated : block));
}

export function moveCustomContentBlock(
  blocks: readonly CustomContentBlock[],
  id: string,
  direction: -1 | 1
): CustomContentBlock[] {
  const index = blocks.findIndex((block) => block.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return [...blocks];
  const next = [...blocks];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function removeCustomContentBlock(
  blocks: readonly CustomContentBlock[],
  id: string
): CustomContentBlock[] {
  return blocks.filter((block) => block.id !== id);
}

export function isSafeCustomContentUrl(value: string): boolean {
  const url = value.trim();
  if (!url || url.includes("\\") || url.startsWith("//")) return false;
  if (url.startsWith("/")) return true;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function sanitizeMarqueeAnnouncement(value: unknown): MarqueeAnnouncement {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { enabled: false, text: "", badge: "", link: "" };
  }

  const candidate = value as Record<string, unknown>;
  const rawLink = typeof candidate.link === "string" ? candidate.link.trim() : "";
  return {
    enabled: candidate.enabled === true,
    text: typeof candidate.text === "string" ? candidate.text.trim() : "",
    badge: typeof candidate.badge === "string" ? candidate.badge.trim() : "",
    link: rawLink && isSafeCustomContentUrl(rawLink) ? rawLink : "",
  };
}

export function publishedCustomContentBlocks(
  blocks: readonly CustomContentBlock[]
): CustomContentBlock[] {
  return blocks.filter((block) => {
    switch (block.type) {
      case "text":
        return Boolean(block.title.trim() || block.text.trim());
      case "image":
        return Boolean(block.alt.trim() && isSafeCustomContentUrl(block.image_url));
      case "button":
        return Boolean(block.label.trim() && isSafeCustomContentUrl(block.url));
    }
  });
}
