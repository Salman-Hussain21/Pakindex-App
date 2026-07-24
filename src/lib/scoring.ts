/**
 * Heuristic potential score calculator.
 *
 * Score = (0.40 × locationMod) + (0.35 × ratingWeight) + (0.25 × interactionWeight)
 * Final value is rounded to 0-100.
 */

const TIER_A_AREAS = [
  "dha", "defence", "clifton", "gulberg", "f-6", "f-7", "zamzama", "bath island",
];
const TIER_B_AREAS = [
  "johar town", "pechs", "gulshan", "smchs", "tariq road", "bahria", "g-11",
];

function locationModifier(address?: string | null, areaName?: string | null): number {
  const haystack = `${address || ""} ${areaName || ""}`.toLowerCase();
  for (const area of TIER_A_AREAS) {
    if (haystack.includes(area)) return 100;
  }
  for (const area of TIER_B_AREAS) {
    if (haystack.includes(area)) return 70;
  }
  return 30;
}

function ratingWeight(rating?: number | null, reviewCount?: number | null): number {
  if (!rating) return 30;
  const reviews = reviewCount ?? 0;
  if (rating >= 4.3 && reviews > 500) return 100;
  if (rating >= 3.8) return 70;
  return 30;
}

function interactionWeight(
  phone?: string | null,
  website?: string | null,
  serviceOptions?: string[] | null
): number {
  let score = 0;
  if (phone) score += 9;
  if (website) score += 8;
  const options = (serviceOptions || []).join(" ").toLowerCase();
  if (options.includes("delivery") || options.includes("dine")) score += 8;
  return Math.min(25, score);
}

export interface BusinessScoreInput {
  address?: string | null;
  areaName?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  phone?: string | null;
  website?: string | null;
  serviceOptions?: string[] | null;
}

/**
 * Returns a potential score from 0 to 100.
 */
export function calculatePotentialScore(biz: BusinessScoreInput): number {
  const loc = locationModifier(biz.address, biz.areaName);
  const rat = ratingWeight(biz.rating, biz.reviewCount);
  const inter = interactionWeight(biz.phone, biz.website, biz.serviceOptions);

  const score = 0.40 * loc + 0.35 * rat + 0.25 * inter;
  return Math.round(Math.min(100, Math.max(0, score)));
}
