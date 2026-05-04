import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await canUseDatabase())) {
    return NextResponse.json({ invites: [] });
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ invites: [] }, { status: 401 });
  }

  const [memberships, applications] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    }),
    prisma.teamApplication.findMany({
      where: {
        userId: user.id,
        status: "APPROVED",
      },
      include: {
        team: {
          select: {
            id: true,
            slug: true,
            name: true,
            tag: true,
            region: true,
            primaryRank: true,
            primaryRankBadgeLevel: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentTeamIds = new Set(memberships.map((membership) => membership.teamId));
  const invites = applications
    .filter((application) => !currentTeamIds.has(application.teamId))
    .map((application) => ({
      id: application.id,
      createdAt: application.createdAt.toISOString(),
      team: application.team,
      canAccept: memberships.length === 0,
    }));

  return NextResponse.json({ invites });
}
