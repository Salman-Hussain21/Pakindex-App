import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Wipe out the cookie session properties safely
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0), 
    });

    return response;
  } catch (error) {
    console.error("Logout runtime exception:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}