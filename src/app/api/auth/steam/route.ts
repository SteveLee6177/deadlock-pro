import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/env";
import { getSession } from "@/lib/session";
import { getSteamLoginUrl } from "@/lib/steam";
import { safeReturnPath } from "@/lib/team-invites";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const returnTo = safeReturnPath(request.nextUrl.searchParams.get("returnTo"));
    const session = await getSession();

    session.authReturnTo = returnTo ?? undefined;
    await session.save();

    const url = await getSteamLoginUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=steam-auth", getBaseUrl()));
  }
}
