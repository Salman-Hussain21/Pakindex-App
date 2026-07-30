export interface LeadScoreFactors {
  rating?: number | null;
  review_count?: number | null;
  price_range?: string | null;
  phone?: string | null;
  website?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  foodpanda_url?: string | null;
  careem_food_url?: string | null;
  cheetay_url?: string | null;
}

export interface LeadScoreResult {
  score: number; // 0 - 100
  tier: "High Potential" | "Warm Prospect" | "Standard Lead";
  color: string;
  badgeBg: string;
  reasons: string[];
}

/**
 * Calculates a B2B Lead Quality & Commercial Potential Score (0-100)
 * similar to GastroIndex.eu intelligence profiling.
 */
export function calculateB2BLeadScore(business: LeadScoreFactors): LeadScoreResult {
  let score = 30; // base score for approved listing
  const reasons: string[] = [];

  // Rating & Review Volume (Popularity & Customer Traffic)
  const reviews = Number(business.review_count || 0);
  if (reviews >= 200) {
    score += 25;
    reasons.push("High Customer Footfall (200+ Reviews)");
  } else if (reviews >= 50) {
    score += 15;
    reasons.push("Established Footfall (50+ Reviews)");
  } else if (reviews >= 10) {
    score += 8;
  }

  const rating = Number(business.rating || 0);
  if (rating >= 4.2) {
    score += 15;
    reasons.push("Top Rated Venue (4.2+ Rating)");
  } else if (rating >= 3.8) {
    score += 8;
  }

  // Digital & Social Media Presence
  let digitalPoints = 0;
  if (business.instagram_url) digitalPoints += 6;
  if (business.facebook_url) digitalPoints += 5;
  if (business.website) digitalPoints += 5;
  if (digitalPoints > 0) {
    score += digitalPoints;
    reasons.push("Active Digital & Social Media");
  }

  // Delivery Platform Presence (High Order Volume)
  if (business.foodpanda_url || business.careem_food_url || business.cheetay_url) {
    score += 10;
    reasons.push("Multi-Channel Delivery Presence");
  }

  // Contact Readiness
  if (business.phone) {
    score += 9;
    reasons.push("Direct Phone Contact Verified");
  }

  // Price Tier Commercial Value
  if (business.price_range === "$$$" || business.price_range === "$$$$") {
    score += 10;
    reasons.push("Premium Price Point (High Margin)");
  }

  // Cap score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  if (finalScore >= 75) {
    return {
      score: finalScore,
      tier: "High Potential",
      color: "text-emerald-700 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
      reasons,
    };
  } else if (finalScore >= 50) {
    return {
      score: finalScore,
      tier: "Warm Prospect",
      color: "text-amber-700 dark:text-amber-400",
      badgeBg: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 text-amber-700 dark:text-amber-300",
      reasons,
    };
  } else {
    return {
      score: finalScore,
      tier: "Standard Lead",
      color: "text-slate-600 dark:text-gray-400",
      badgeBg: "bg-slate-50 border-slate-200 dark:bg-gray-800 dark:border-white/10 text-slate-600 dark:text-gray-400",
      reasons: reasons.length > 0 ? reasons : ["Standard Territory Prospect"],
    };
  }
}
