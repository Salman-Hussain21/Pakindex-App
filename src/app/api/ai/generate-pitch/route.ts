import { NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const { name, category, area, supplierType } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Restaurant name is required." }, { status: 400 });
    }

    const systemPrompt = `You are a top B2B sales strategist in Pakistan specializing in the HORECA industry.
Generate an effective sales pitch script for a field representative visiting a restaurant in Karachi.
Return strictly valid JSON with this format:
{
  "openingLineRomanUrdu": "Assalam-o-Alaikum, PakIndex se baat kar raha hoon...",
  "valuePropositionEnglish": "We supply premium bulk ingredients at 15% lower wholesale cost...",
  "objectionHandling": [
    {"objection": "Already have a supplier", "response": "Hum 1 week ka trial batch test kara sakte hain with zero commitment."},
    {"objection": "Price is high", "response": "Hum bulk volume par extra 5% cash discount de rahe hain."}
  ],
  "callToAction": "Book a sample delivery for tomorrow 2 PM."
}`;

    const userPrompt = `Target Business: ${name}
Category: ${category || "Restaurant"}
Location: ${area || "Karachi"}
Supplier Type: ${supplierType || "Food Ingredients & Packaging"}`;

    const rawContent = await callOpenRouter([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const jsonString = rawContent.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(jsonString);

    return NextResponse.json({ success: true, pitch: result });
  } catch (error: any) {
    console.error("AI Pitch Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI pitch script." },
      { status: 500 }
    );
  }
}
