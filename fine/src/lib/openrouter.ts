/**
 * OpenRouter AI Integration for PakIndex B2B HORECA Platform
 * Model: openai/gpt-oss-20b (configured via OPENROUTER_API env)
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIQualificationResult {
  score: number;
  tier: "High Potential" | "Warm Prospect" | "Standard Lead";
  estimatedMonthlyCapacityPKR: string;
  recommendedCatalogCategories: string[];
  keyPitchPoints: string[];
  romanUrduPitch: string;
  supplierSummary: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  temperature = 0.4
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API;
  if (!apiKey) {
    throw new Error("OPENROUTER_API key is not configured in environment variables.");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://pakindex.app",
      "X-Title": "PakIndex HORECA Platform",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response received from OpenRouter API.");
  }

  return content;
}

export async function generateAILeadQualification(businessData: {
  name: string;
  category?: string;
  area?: string;
  city?: string;
  rating?: number | null;
  review_count?: number | null;
  price_range?: string | null;
  phone?: string | null;
  address?: string | null;
}): Promise<AIQualificationResult> {
  const systemPrompt = `You are PakIndex AI, Pakistan's leading B2B HORECA sales intelligence agent.
Your task is to analyze a food business in Karachi/Pakistan and generate actionable sales intelligence for FMCG, packaging, beverage, and kitchen equipment suppliers.

IMPORTANT: Respond strictly in JSON format matching this exact schema:
{
  "score": 85,
  "tier": "High Potential",
  "estimatedMonthlyCapacityPKR": "PKR 500,000 - 1,200,000",
  "recommendedCatalogCategories": ["Bulk Frying Oil", "Takeaway Containers", "Soft Drinks"],
  "keyPitchPoints": ["High daily customer volume requires steady inventory", "Prime Karachi location", "Immediate potential for monthly packaging supply"],
  "romanUrduPitch": "Salam! PakIndex se baat kar rahe hain. Aap ke restaurant ke liye premium wholesale rate par high-quality stock available hai.",
  "supplierSummary": "Popular outlet with active customer traffic and high repeat purchase potential."
}`;

  const userPrompt = `Analyze this HORECA Outlet in Karachi:
- Business Name: ${businessData.name}
- Category: ${businessData.category || "Restaurant"}
- Location: ${businessData.area || "Karachi"}, ${businessData.city || "Karachi"}
- Rating: ${businessData.rating || "N/A"} (${businessData.review_count || 0} reviews)
- Price Range: ${businessData.price_range || "N/A"}
- Address: ${businessData.address || "Karachi"}`;

  try {
    const rawContent = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    
    // Extract JSON block if surrounded by markdown codeblock
    const jsonString = rawContent.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonString);
    
    return {
      score: typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 65,
      tier: parsed.tier || "Warm Prospect",
      estimatedMonthlyCapacityPKR: parsed.estimatedMonthlyCapacityPKR || "PKR 300,000 - 800,000",
      recommendedCatalogCategories: parsed.recommendedCatalogCategories || ["Packaging", "Beverages"],
      keyPitchPoints: parsed.keyPitchPoints || ["High customer demand", "Immediate inventory need"],
      romanUrduPitch: parsed.romanUrduPitch || "Salam, PakIndex se baat kar rahe hain. Aap ke restaurant ke liye bulk packaging aur supply deals layen hain.",
      supplierSummary: parsed.supplierSummary || "Popular outlet with active customer traffic.",
    };
  } catch (err: any) {
    console.error("OpenRouter Lead Qualification Error:", err.message);
    // Return structured fallback
    return {
      score: 65,
      tier: "Warm Prospect",
      estimatedMonthlyCapacityPKR: "PKR 250,000 - 600,000",
      recommendedCatalogCategories: ["General FMCG", "Packaging Supplies"],
      keyPitchPoints: ["Established venue in Karachi", "Regular monthly order candidate"],
      romanUrduPitch: `Assalam-o-Alaikum, hum PakIndex se hain. Aap ke restaurant ${businessData.name} ke liye wholesale rate par stock available hai.`,
      supplierSummary: `${businessData.name} is an active food business in ${businessData.area || "Karachi"}.`,
    };
  }
}
