import { NextResponse } from "next/server";
import { getCurrentUserTeams } from "@/lib/platform-data";

export const runtime = "nodejs";

export async function GET() {
  const teams = await getCurrentUserTeams();

  return NextResponse.json({ teams });
}
