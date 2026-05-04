import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const discordProfileSchema = z.object({
  discordUsername: z.string().max(64).optional().nullable(),
});

function normalizeDiscordUsername(value: string | null | undefined) {
  const username = value?.trim().replace(/^@+/, "") ?? "";

  return username.length > 0 ? username : null;
}

export async function PATCH(request: Request) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so Discord cannot be saved." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const parsed = discordProfileSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid Discord username." }, { status: 400 });
  }

  const discordUsername = normalizeDiscordUsername(parsed.data.discordUsername);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { discordUsername },
    select: {
      id: true,
      steamId: true,
      discordUsername: true,
      profileName: true,
      avatarUrl: true,
      deadlockRank: true,
      deadlockRankBadgeLevel: true,
    },
  });
  const session = await getSession();

  if (session.user?.id === updatedUser.id) {
    session.user = updatedUser;
    await session.save();
  }

  return NextResponse.json({
    discordUsername,
    message: discordUsername ? "Discord username saved." : "Discord username removed.",
  });
}
