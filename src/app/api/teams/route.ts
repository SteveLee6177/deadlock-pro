import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const createTeamSchema = z.object({
  name: z.string().min(2),
  tag: z.string().min(2).max(5),
  region: z.string().min(2),
  rank: z.string().min(2),
  focus: z.string().min(2),
  openRoles: z.string().optional(),
  description: z.string().min(10),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { message: "Configure Postgres before creating teams." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const payload = createTeamSchema.parse(await request.json());
  const owner = await prisma.user.upsert({
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

  const slugBase = slugify(payload.name);

  await prisma.team.create({
    data: {
      slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      tag: payload.tag.toUpperCase(),
      region: payload.region,
      primaryRank: payload.rank,
      focus: payload.focus,
      description: payload.description,
      openRoles: payload.openRoles
        ? payload.openRoles
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean)
        : [],
      ownerId: owner.id,
      memberships: {
        create: {
          userId: owner.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({ message: "Team created successfully." });
}
