import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    dbUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || null,
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
} 