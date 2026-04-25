import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";
import { getSteamLoginUrl } from "@/lib/steam";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url = await getSteamLoginUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=steam-auth", getBaseUrl()));
  }
}
