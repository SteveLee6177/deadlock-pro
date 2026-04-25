import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const applySchema = z.object({
  message: z.string().max(1000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { message: "Configure Postgres before submitting applications." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
  const payload = applySchema.parse(await request.json());
  const team = await prisma.team.findUnique({ where: { slug } });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const applicant = await prisma.user.upsert({
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

  await prisma.teamApplication.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: applicant.id,
      },
    },
    update: {
      message: payload.message,
      status: "PENDING",
    },
    create: {
      teamId: team.id,
      userId: applicant.id,
      message: payload.message,
    },
  });

  return NextResponse.json({ message: "Application sent to the team captain." });
}
