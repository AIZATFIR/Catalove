import { Product } from "@/types/bakery";
import { cakeService } from "./cake-service";

export interface RecommendationCriteria {
  occasion?: string; // "birthday" | "anniversary" | "snack" | "gift" | string
  flavor?: string; // "cheese" | "chocolate" | "fruit" | "caramel" | string
  size?: string; // "small" | "medium" | "large" | string
  urgency?: string; // "today" | "future" | string
  query?: string; // Free text search query
}

export interface RecommendedItem {
  productId: string;
  product: Product;
  matchScore: number;
  reason: string;
  highlightBadge: string;
}

export class RecommendationEngine {
  async matchCakes(criteria: RecommendationCriteria): Promise<RecommendedItem[]> {
    const products = await cakeService.getProducts();

    const scored = products.map((product) => {
      let score = 0;
      const reasons: string[] = [];
      let badge = "Cocok Buat Acara Ini";

      const fullText = (
        product.name +
        " " +
        product.description +
        " " +
        (product.flavor_notes || []).join(" ")
      ).toLowerCase();

      // 1. Flavor Matching
      if (criteria.flavor) {
        const fl = criteria.flavor.toLowerCase();
        if (fl === "cheese" && fullText.includes("cheese")) {
          score += 4;
          reasons.push("Tekstur keju lembut dan gurih alami");
          badge = "Favorit Keju";
        } else if (fl === "chocolate" && (fullText.includes("choco") || fullText.includes("ganache"))) {
          score += 4;
          reasons.push("Dark chocolate Belgia pekat dan legit");
          badge = "Pecinta Cokelat";
        } else if (fl === "fruit" && (fullText.includes("strawberr") || fullText.includes("fruit"))) {
          score += 4;
          reasons.push("Segar dengan buah asli dan krim ringan");
          badge = "Segar Alami";
        } else if (fl === "caramel" && (fullText.includes("biscoff") || fullText.includes("caramel"))) {
          score += 4;
          reasons.push("Karamel wangi dipadu biskuit renyah");
          badge = "Karamel Rempah";
        }
      }

      // 2. Occasion Matching
      if (criteria.occasion) {
        const occ = criteria.occasion.toLowerCase();
        if ((occ === "birthday" || occ === "ultah") && product.category_id === "cat-whole") {
          score += 3;
          reasons.push("Bentuk utuh bundar cocok ditaruh lilin ucapan");
        } else if ((occ === "personal" || occ === "snack") && (product.category_id === "cat-bento" || product.category_id === "cat-slices")) {
          score += 3;
          reasons.push("Ukuran personal pas untuk dinikmati sendiri atau berdua");
        } else if ((occ === "gift" || occ === "hampers") && (product.category_id === "cat-hampers" || product.is_featured)) {
          score += 3;
          reasons.push("Kemasan eksklusif sangat pantas dijadikan bingkisan");
        }
      }

      // 3. Urgency Matching (Ready stock vs Pre-order)
      if (criteria.urgency === "today") {
        if (product.minimum_lead_time_days === 0) {
          score += 5;
          reasons.push("Ready stock hari ini (tanpa perlu tunggu H-2)");
        } else {
          score -= 2;
        }
      }

      // 4. Free-text query matching
      if (criteria.query) {
        const qWords = criteria.query.toLowerCase().split(/\s+/).filter(Boolean);
        qWords.forEach((word) => {
          if (fullText.includes(word)) {
            score += 2;
          }
        });
      }

      const finalReason =
        reasons.length > 0
          ? reasons.join(", ") + "."
          : `Kue ${product.name} sangat cocok untuk melengkapi kebersamaan Anda.`;

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
