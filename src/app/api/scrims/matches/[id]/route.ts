import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { canManageTeamScrims } from "@/lib/scrim-permissions";

const actionSchema = z.object({
  action: z.enum(["cancel"]),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function notifyManagers(teamId: string, title: string, body: string, relatedEntityId: string) {
  const managers = await prisma.teamMembership.findMany({
    where: {
      teamId,
      role: { in: ["OWNER", "MANAGER", "CAPTAIN"] },
    },
    select: { userId: true },
  });

  if (managers.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: managers.map((manager) => ({
      userId: manager.userId,
      type: "SCRIM_MATCH",
      title,
      body,
      relatedEntityId,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const parsed = actionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Choose a valid scrim action.", 400);
  }

  const { id } = await params;
  const scrim = await prisma.scrim.findUnique({
    where: { id },
    include: {
      availabilityBlock: true,
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
    },
  });

  if (!scrim) {
    return jsonError("Scrim not found.", 404);
  }

  const canManageTeamA = await canManageTeamScrims(membershipData.user.id, scrim.teamAId);
  const canManageTeamB = await canManageTeamScrims(membershipData.user.id, scrim.teamBId);

  if (!canManageTeamA && !canManageTeamB) {
    return jsonError("Only either team's owners/managers can cancel this scrim.", 403);
  }

  if (scrim.status !== "CONFIRMED") {
    return jsonError("Only confirmed scrims can be cancelled.", 409);
  }

  await prisma.$transaction([
    prisma.scrim.update({
      where: { id },
      data: { status: "CANCELLED" },
    }),
    prisma.scrimAvailabilityBlock.update({
      where: { id: scrim.availabilityBlockId },
      data: { status: "CANCELLED" },
    }),
    prisma.scheduleEvent.deleteMany({
      where: {
        OR: [
          {
            teamId: scrim.teamAId,
            type: "SCRIM",
            startsAt: scrim.startTime,
            endsAt: scrim.endTime,
            title: `Scrim vs ${scrim.teamB.name}`,
          },
          {
            teamId: scrim.teamBId,
            type: "SCRIM",
            startsAt: scrim.startTime,
            endsAt: scrim.endTime,
            title: `Scrim vs ${scrim.teamA.name}`,
          },
        ],
      },
    }),
  ]);

  await Promise.all([
    notifyManagers(
      scrim.teamAId,
      "Scrim cancelled",
      `${scrim.teamA.name} vs ${scrim.teamB.name} was cancelled.`,
      id,
    ),
    notifyManagers(
      scrim.teamBId,
      "Scrim cancelled",
      `${scrim.teamA.name} vs ${scrim.teamB.name} was cancelled.`,
      id,
    ),
  ]);

  return NextResponse.json({ message: "Scrim cancelled." });
}
