import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const segments = pathname.split("/");
    
    return NextResponse.json({
      success: true,
      message: "Debug endpoint working",
      pathname,
      segments,
      customerId: segments.at(-4),
      cardId: segments.at(-2),
      fullPath: `/api/customers/${segments.at(-4)}/wallet/card/${segments.at(-2)}`
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Debug error" }, { status: 500 });
  }
} 