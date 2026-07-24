// src/lib/detectors.ts

// Simulated current date based on our execution context (June 18, 2026)
// In a real production system, this would just be `new Date()`
const CURRENT_DATE = new Date("2026-06-18T00:00:00Z");

export function getDaysSince(dateString?: string | null): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  return (CURRENT_DATE.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function determineBusinessStatus(business: any): {
  status: "OPEN" | "CLOSED" | "NEW_OPENING" | "ACTIVE";
  daysSinceLastActivity: number;
  reason: string;
} {
  const openState = (business.openState || "").toLowerCase();
  
  // 1. Check if Google explicitly says it is closed
  const isPermanentlyClosed = openState.includes("permanently closed");

  if (isPermanentlyClosed) {
    return {
      status: "CLOSED",
      daysSinceLastActivity: Infinity,
      reason: "Google Maps lists this business as Permanently Closed."
    };
  }

  // 2. Check Menu Photos (if OLDEST postedAt is within 60 days, it's a new opening)
  const photos = business.menu?.overview?.menuPhotos || [];
  const photoDates = photos
    .map((p: any) => new Date(p.postedAt))
    .sort((a: any, b: any) => a.getTime() - b.getTime()); // oldest first

  const oldestPhotoDate = photoDates.length > 0 ? photoDates[0] : null;
  const daysSinceOldestPhoto = oldestPhotoDate ? getDaysSince(oldestPhotoDate.toISOString()) : Infinity;

  if (photos.length > 0 && daysSinceOldestPhoto <= 60) {
    return {
      status: "NEW_OPENING",
      daysSinceLastActivity: daysSinceOldestPhoto,
      reason: `First menu photo was posted very recently (${Math.round(daysSinceOldestPhoto)} days ago).`
    };
  }

  // 3. Fallback proxy: If very few reviews (< 5), probably new
  const reviews = business.reviews || 0;
  if (reviews < 5) {
    return {
      status: "NEW_OPENING",
      daysSinceLastActivity: 0,
      reason: `Very low review count (${reviews}).`
    };
  }

  // 4. Otherwise it's an established active business
  return {
    status: "ACTIVE",
    daysSinceLastActivity: daysSinceOldestPhoto,
    reason: `Established business. First menu photo is ${Math.round(daysSinceOldestPhoto)} days old.`
  };
}
