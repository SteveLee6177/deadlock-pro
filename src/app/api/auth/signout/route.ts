import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  await session.destroy();
  return NextResponse.redirect(new URL("/", request.url));
}
