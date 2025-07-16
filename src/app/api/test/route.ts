import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Test API working", timestamp: new Date().toISOString() });
}

export async function POST() {
  return NextResponse.json({ message: "Test POST working", timestamp: new Date().toISOString() });
} 