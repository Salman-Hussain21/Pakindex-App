const fs = require('fs');

// Load our data snapshot
const data = JSON.parse(fs.readFileSync('./hasdata_output_test.json', 'utf8'));
const businesses = data.localResults || [];

// Helper: Calculate days since a date
// Using the current system time: 2026-06-18
const CURRENT_DATE = new Date("2026-06-18T00:00:00Z");

function days_since(dateString) {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  return (CURRENT_DATE - date) / (1000 * 60 * 60 * 24);
}

function calculateScore(conditions) {
  const met = conditions.filter(c => c).length;
  return Math.round((met / conditions.length) * 100);
}

// -----------------------------------------------------------------
// 1. Detect New Opening
// -----------------------------------------------------------------
function detectNewOpening(current, previous) {
  // Extract photo dates if available to use as proxies for activity
  const photos = current.menu?.overview?.menuPhotos || [];
  const photoDates = photos.map(p => new Date(p.postedAt)).sort((a, b) => a - b);
  
  const oldestPhotoDate = photoDates.length > 0 ? photoDates[0] : null;
  const latestPhotoDate = photoDates.length > 0 ? photoDates[photoDates.length - 1] : null;

  const oldest_review_days = oldestPhotoDate ? days_since(oldestPhotoDate) : Infinity;
  const latest_photo_days = latestPhotoDate ? days_since(latestPhotoDate) : Infinity;

  // Signal 1: Review count jumped significantly (proxy: low total reviews + recent first activity)
  const reviewJump = current.reviews > 0 && current.reviews < 150 && oldest_review_days < 45;
  
  // Signal 2: Very recent photos
  const recentPhotos = latest_photo_days < 14;
  
  // Signal 3: High engagement on new business
  const highEngagement = current.reviews > 30 && oldest_review_days < 60;
  
  // Signal 4: Opening hours just added
  const hoursJustAdded = !previous.workingHours && current.workingHours;
  
  // Signal 5: Status changed from CLOSED to OPERATIONAL
  // Note: openState in HasData contains strings like "Permanently closed", "Temporarily closed", or "Open..."
  const wasClosed = previous.openState && previous.openState.toLowerCase().includes('closed') && !previous.openState.toLowerCase().includes('closes');
  const isNowOpen = current.openState && current.openState.toLowerCase().includes('open');
  const statusChanged = wasClosed && isNowOpen;

  if (reviewJump || (recentPhotos && highEngagement) || hoursJustAdded || statusChanged) {
    return {
      isNewOpening: true,
      confidence: calculateScore([reviewJump, recentPhotos, highEngagement, hoursJustAdded, statusChanged]),
      estimatedOpeningDate: oldestPhotoDate || new Date(),
      reason: [
        reviewJump ? 'Review Jump' : '',
        recentPhotos ? 'Recent Photos' : '',
        hoursJustAdded ? 'Hours Added' : '',
        statusChanged ? 'Status changed from Closed to Open' : ''
      ].filter(Boolean).join(', ')
    };
  }
  
  return { isNewOpening: false };
}

// -----------------------------------------------------------------
// 2. Detect Closure
// -----------------------------------------------------------------
function detectClosure(current, previous) {
  const photos = current.menu?.overview?.menuPhotos || [];
  const photoDates = photos.map(p => new Date(p.postedAt)).sort((a, b) => a - b);
  const latestPhotoDate = photoDates.length > 0 ? photoDates[photoDates.length - 1] : null;
  
  const latest_photo_days = latestPhotoDate ? days_since(latestPhotoDate) : Infinity;

  // Signal 1: Status explicitly shows PERMANENTLY_CLOSED
  const permanentlyClosed = current.openState && current.openState.toLowerCase().includes('permanently closed');
  
  // Signal 2: No recent photos for 6+ months
  const noRecentPhotos = latest_photo_days > 180;
  
  // Signal 3: Opening hours disappeared
  const hoursRemoved = previous.workingHours && !current.workingHours;
  
  // Signal 4: Rating dropped severely (assuming no recent reviews proxy)
  const poorRating = current.rating < 2.0 && noRecentPhotos;
  
  // Signal 5: Status downgraded
  const wasOpen = previous.openState && previous.openState.toLowerCase().includes('open');
  const isNowClosed = current.openState && current.openState.toLowerCase().includes('closed') && !current.openState.toLowerCase().includes('closes');
  const statusDowngrade = wasOpen && isNowClosed;

  if (permanentlyClosed || noRecentPhotos || hoursRemoved || statusDowngrade) {
    return {
      isClosed: true,
      confidence: calculateScore([permanentlyClosed, noRecentPhotos, hoursRemoved, poorRating, statusDowngrade]),
      estimatedClosureDate: latestPhotoDate || new Date(),
      reason: [
        permanentlyClosed ? 'Permanently Closed status' : '',
        noRecentPhotos ? 'No activity for 6+ months' : '',
        hoursRemoved ? 'Hours Removed' : '',
        statusDowngrade ? 'Status downgraded to closed' : ''
      ].filter(Boolean).join(', ')
    };
  }
  
  return { isClosed: false };
}

console.log("Analyzing", businesses.length, "businesses for New Openings and Closures...\n");

let newOpeningsCount = 0;
let closuresCount = 0;

// Since we only have a current snapshot, we will simulate the 'previous' data by cloning
// the current data, so we can see how the logic performs when state changes.
businesses.forEach((biz, index) => {
  // Create a simulated previous state
  let simulatedPrevious = JSON.parse(JSON.stringify(biz));
  
  // Let's force a few synthetic scenarios to test the logic on our dataset
  if (index === 0) {
    // Simulate: Was Closed, now Open, and hours were added
    simulatedPrevious.openState = 'Permanently closed';
    delete simulatedPrevious.workingHours;
  } else if (index === 1) {
    // Simulate: Was Open, now Permanently closed
    biz.openState = 'Permanently closed';
  } else if (index === 2) {
    // Simulate: Hours were removed
    delete biz.workingHours;
  }

  const openingDetection = detectNewOpening(biz, simulatedPrevious);
  const closureDetection = detectClosure(biz, simulatedPrevious);

  if (openingDetection.isNewOpening) {
    console.log(`[🟢 NEW OPENING] ${biz.title}`);
    console.log(`   Confidence: ${openingDetection.confidence}%`);
    console.log(`   Reason: ${openingDetection.reason}\n`);
    newOpeningsCount++;
  }

  if (closureDetection.isClosed) {
    console.log(`[🔴 CLOSURE] ${biz.title}`);
    console.log(`   Confidence: ${closureDetection.confidence}%`);
    console.log(`   Reason: ${closureDetection.reason}\n`);
    closuresCount++;
  }
});

console.log(`\nSummary: Detected ${newOpeningsCount} potential new openings and ${closuresCount} potential closures out of ${businesses.length} total businesses.`);
