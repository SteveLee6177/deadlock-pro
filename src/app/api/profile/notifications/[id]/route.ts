import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json({ message: "Postgres is unavailable right now." }, { status: 503 });
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { id } = await params;
  await prisma.notification.updateMany({
    where: {
      id,
      userId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ message: "Notification marked read." });
}
