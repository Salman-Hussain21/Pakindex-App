import { NextResponse } from "next/server";
import { generateAILeadQualification } from "@/lib/openrouter";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, name, category, area, city, rating, review_count, price_range, address } = body;

    let businessInfo = {
      name,
      category,
      area,
      city,
      rating,
      review_count,
      price_range,
      address,
    };

    // If businessId was provided, query database for exact entity details
    if (businessId) {
      const res = await query(
        `SELECT b.*, c.name as category_name, a.name as area_name, ci.name as city_name
         FROM businesses b
         LEFT JOIN categories c ON b.category_id = c.id
         LEFT JOIN areas a ON b.area_id = a.id
         LEFT JOIN cities ci ON b.city_id = ci.id
         WHERE b.id = $1`,
        [businessId]
      );

      if (res.rows.length > 0) {
        const b = res.rows[0];
        businessInfo = {
          name: b.name,
          category: b.category_name || b.business_type,
          area: b.area_name,
          city: b.city_name,
          rating: b.rating,
          review_count: b.review_count,
          price_range: b.price_range,
          address: b.address,
        };
      }
    }

    if (!businessInfo.name) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }

    const aiResult = await generateAILeadQualification(businessInfo);

    // If businessId provided, persist AI score to database asynchronously
    if (businessId) {
      try {
        await query(
          `UPDATE businesses SET tier = $1, updated_at = NOW() WHERE id = $2`,
          [aiResult.tier === "High Potential" ? "tier_1" : aiResult.tier === "Warm Prospect" ? "tier_2" : "tier_3", businessId]
        );
      } catch (dbErr) {
        console.warn("Failed to persist AI tier to DB:", dbErr);
      }
    }

    return NextResponse.json({ success: true, result: aiResult });
  } catch (error: any) {
    console.error("AI Qualify Lead Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI qualification." },
      { status: 500 }
    );
  }
}
