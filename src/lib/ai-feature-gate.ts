export function isGeminiAiEnabled(apiKey: string | undefined, paidTierConfirmed: string | undefined): boolean {
  return Boolean(apiKey?.trim()) && paidTierConfirmed?.trim().toLowerCase() === "true";
}
