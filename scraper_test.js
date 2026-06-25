// scraper_test.js
// Querying HasData's GET endpoint for PECHS Karachi with a limit of 100.
const fs = require('fs');

const HASDATA_API_KEY = "fac1740d-dfb2-44ed-be95-09fc3d152215";
const TEST_QUERY = "restaurants";
const LL_COORDS = "@24.8682,67.0624,15z"; // PECHS Karachi
const LIMIT = 100; // Request up to 100 listings in a single credit

async function runTestScraper() {
  const url = `https://api.hasdata.com/scrape/google-maps/search?q=${encodeURIComponent(TEST_QUERY)}&ll=${encodeURIComponent(LL_COORDS)}&limit=${LIMIT}`;
  
  console.log(`\x1b[36mQuerying HasData API for PECHS (Limit: ${LIMIT})...\x1b[0m`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": HASDATA_API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Save full JSON payload
    fs.writeFileSync('hasdata_output_test.json', JSON.stringify(data, null, 2));
    console.log(`\x1b[32mSuccess! Saved full raw response to: \x1b[35mhasdata_output_test.json\x1b[0m\n`);

    const results = data.localResults || data.searchResults || data.results || [];
    console.log(`\x1b[32mTotal Listings Retrieved in Single Request: ${results.length}\x1b[0m`);

    if (results.length > 0) {
      console.log("\n\x1b[32mClean Sample of Retrieved Listings (First 10 of " + results.length + "):\x1b[0m");
      const cleanList = results.slice(0, 10).map(biz => ({
        Name: biz.title || biz.name || "N/A",
        Category: biz.type || biz.category || "N/A",
        Phone: biz.phone || "N/A",
        Rating: biz.rating || 0,
        Reviews: biz.reviews || biz.reviewsCount || 0,
        Latitude: biz.gpsCoordinates?.latitude || "N/A",
        Longitude: biz.gpsCoordinates?.longitude || "N/A"
      }));
      console.table(cleanList);
    }

  } catch (error) {
    console.error("\x1b[31mScraper execution failed:\x1b[0m", error.message);
  }
}

runTestScraper();
