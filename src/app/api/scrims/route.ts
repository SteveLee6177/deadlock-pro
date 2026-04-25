import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const scrimSchema = z.object({
  requesterTeamId: z.string().min(1),
  startsAt: z.string().min(1),
  region: z.string().min(2),
  format: z.string().min(2),
  wantedRank: z.string().min(2),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { message: "Configure Postgres before posting scrims." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const payload = scrimSchema.parse(await request.json());
  const author = await prisma.user.upsert({
    where: { steamId: user.steamId },
    update: {
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
    },
    create: {
      steamId: user.steamId,
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
    },
  });

  await prisma.scrimRequest.create({
    data: {
      requesterTeamId: payload.requesterTeamId,
      createdById: author.id,
      startsAt: new Date(payload.startsAt),
      region: payload.region,
      format: payload.format,
      wantedRank: payload.wantedRank,
      notes: payload.notes,
    },
  });

  return NextResponse.json({ message: "Scrim request posted." });
}
