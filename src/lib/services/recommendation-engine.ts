import { Product } from "@/types/bakery";
import { cakeService } from "./cake-service";

export interface RecommendationCriteria {
  occasion?: string;
  flavor?: string;
  size?: string;
  urgency?: string;
  query?: string;
}

export interface RecommendedItem {
  productId: string;
  product: Product;
  matchScore: number;
  reason: string;
  highlightBadge: string;
}

export class RecommendationEngine {
  async matchProducts(criteria: RecommendationCriteria): Promise<RecommendedItem[]> {
    const products = await cakeService.getProducts();

    const scored = products.map((product) => {
      let score = 0;
      const reasons: string[] = [];
      const badge = "Pilihan untukmu";

      const fullText = (
        product.name +
        " " +
        product.description +
        " " +
        (product.tagline || "") +
        " " +
        (product.category?.name || "") +
        " " +
        (product.flavor_notes || []).join(" ") +
        " " +
        (product.specs || []).map((spec) => `${spec.label} ${spec.value}`).join(" ")
      ).toLowerCase();

      const preferenceTerms = [criteria.occasion, criteria.flavor, criteria.size]
        .filter((term): term is string => Boolean(term?.trim()))
        .flatMap((term) => term.toLowerCase().split(/\s+/).filter(Boolean));
      const matchedTerms = preferenceTerms.filter((term) => fullText.includes(term));
      score += matchedTerms.length * 3;
      if (matchedTerms.length) {
        reasons.push(`sesuai dengan ${matchedTerms.slice(0, 3).join(", ")}`);
      }

      if (criteria.urgency === "today") {
        if (product.minimum_lead_time_days === 0) {
          score += 5;
          reasons.push("bisa disiapkan hari ini");
        } else {
          score -= 2;
        }
      }

      if (criteria.query) {
        const qWords = criteria.query.toLowerCase().split(/\s+/).filter(Boolean);
        const matchedQuery = qWords.filter((word) => fullText.includes(word));
        score += matchedQuery.length * 2;
        if (matchedQuery.length) reasons.push(`memuat ${matchedQuery.slice(0, 3).join(", ")}`);
      }

      const finalReason =
        reasons.length > 0
          ? `Produk ini ${reasons.join(" dan ")}.`
          : `Lihat detail ${product.name} untuk mengetahui apakah cocok dengan kebutuhanmu.`;

      return {
        productId: product.id,
        product,
        matchScore: score,
        reason: finalReason,
        highlightBadge: badge,
      };
    });

    // Return top 3 scored products
    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }
}

export const recommendationEngine = new RecommendationEngine();
