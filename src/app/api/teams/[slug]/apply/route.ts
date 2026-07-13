import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { canUseDatabase } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/request";
import {
  canReapplyToDeclinedTeamApplication,
  canStoreTeamApplicationDeclinedAt,
  teamApplicationPendingData,
} from "@/lib/team-applications";
import { syncDeadlockRankForUser } from "@/lib/team-ranks";

const applySchema = z.object({
  message: z.string().max(1000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so applications cannot be submitted yet." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
  const parsed = applySchema.safeParse((await readJsonBody(request)) ?? {});

  if (!parsed.success) {
    return NextResponse.json({ message: "Check your application and try again." }, { status: 400 });
  }

  const payload = parsed.data;
  const team = await prisma.team.findUnique({ where: { slug } });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  if (!team.recruiting) {
    return NextResponse.json({ message: "This team is not accepting applications right now." }, { status: 400 });
  }

  const applicant = await prisma.user.upsert({
    where: { steamId: user.steamId },
    update: {
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
    },
    create: {
      steamId: user.steamId,
      profileName: user.profileName,
      avatarUrl: user.avatarUrl,
      deadlockRank: user.deadlockRank,
      deadlockRankBadgeLevel: user.deadlockRankBadgeLevel,
    },
  });
  await syncDeadlockRankForUser(applicant);
  const currentMembership = await prisma.teamMembership.findFirst({
    where: { userId: applicant.id, teamId: team.id },
    select: { id: true },
  });

  if (currentMembership) {
    return NextResponse.json(
      { message: `You are already on ${team.name}.` },
      { status: 409 },
    );
  }

  const includeDeclinedAt = await canStoreTeamApplicationDeclinedAt();
  const existingApplication = await prisma.teamApplication.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: applicant.id,
      },
    },
    select: includeDeclinedAt
      ? { status: true, createdAt: true, declinedAt: true }
      : { status: true, createdAt: true },
  });
  const applicationCooldown = existingApplication
    ? {
        createdAt: existingApplication.createdAt,
        declinedAt:
          "declinedAt" in existingApplication
            ? (existingApplication.declinedAt as Date | null)
            : null,
      }
    : null;

  if (
    existingApplication?.status === "DECLINED" &&
    applicationCooldown &&
    !canReapplyToDeclinedTeamApplication(applicationCooldown)
  ) {
    return NextResponse.json(
      { message: "You can re-apply one week after this team declined your application." },
      { status: 409 },
    );
  }

  if (existingApplication?.status === "APPROVED") {
    return NextResponse.json(
      { message: "This team has already approved your application." },
      { status: 409 },
    );
  }

  await prisma.teamApplication.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: applicant.id,
      },
    },
    update: {
      ...(await teamApplicationPendingData(payload.message)),
    },
    create: {
      teamId: team.id,
      userId: applicant.id,
      message: payload.message,
    },
  });

  return NextResponse.json({ message: "Application sent to the team captain and managers." });
}
