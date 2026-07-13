import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  await session.destroy();
  return NextResponse.redirect(getAppUrl("/"));
}
