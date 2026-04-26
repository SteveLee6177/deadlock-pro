import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { canRequestScrim } from "@/lib/scrim-permissions";

const requestSchema = z.object({
  availabilityBlockId: z.string().min(1),
  requestingTeamId: z.string().min(1),
  message: z.string().max(500).optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function hasConfirmedOverlap(teamId: string, startTime: Date, endTime: Date) {
  const overlap = await prisma.scrim.findFirst({
    where: {
      status: "CONFIRMED",
      OR: [{ teamAId: teamId }, { teamBId: teamId }],
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  return Boolean(overlap);
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
      type: "SCRIM_REQUEST",
      title,
      body,
      relatedEntityId,
    })),
  });
}

export async function POST(request: Request) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now, so scrim requests cannot be sent.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Check the request details and try again.", 400);
  }

  const block = await prisma.scrimAvailabilityBlock.findUnique({
    where: { id: parsed.data.availabilityBlockId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!block) {
    return jsonError("Availability block not found.", 404);
  }

  if (block.status !== "OPEN") {
    return jsonError("That availability block is not open right now.", 409);
  }

  if (block.teamId === parsed.data.requestingTeamId) {
    return jsonError("Choose a different team to request this scrim.", 400);
  }

  if (!(await canRequestScrim(membershipData.user.id, parsed.data.requestingTeamId))) {
    return jsonError("Only team owners/managers can request official scrims.", 403);
  }

  if (await hasConfirmedOverlap(parsed.data.requestingTeamId, block.startTime, block.endTime)) {
    return jsonError("Your team already has a confirmed scrim during that time.", 409);
  }

  const requestingTeam = await prisma.team.findUnique({
    where: { id: parsed.data.requestingTeamId },
    select: { name: true },
  });

  if (!requestingTeam) {
    return jsonError("Requesting team not found.", 404);
  }

  let createdRequest: { id: string } | null = null;

  try {
    createdRequest = await prisma.$transaction(async (tx) => {
      const claimedBlock = await tx.scrimAvailabilityBlock.updateMany({
        where: {
          id: block.id,
          status: "OPEN",
        },
        data: { status: "PENDING" },
      });

      if (claimedBlock.count !== 1) {
        throw new Error("BLOCK_NOT_OPEN");
      }

      const scrimRequest = await tx.scrimBookingRequest.create({
        data: {
          availabilityBlockId: block.id,
          requestingTeamId: parsed.data.requestingTeamId,
          receivingTeamId: block.teamId,
          requestedByUserId: membershipData.user.id,
          message: parsed.data.message,
        },
      });

      return scrimRequest;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOCK_NOT_OPEN") {
      return jsonError("That availability block is not open right now.", 409);
    }

    throw error;
  }

  if (!createdRequest) {
    return jsonError("That availability block is not open right now.", 409);
  }

  await notifyManagers(
    block.teamId,
    "New scrim request",
    `${requestingTeam.name} requested ${block.team.name}'s open scrim block.`,
    createdRequest.id,
  );

  return NextResponse.json({ id: createdRequest.id, message: "Scrim request submitted." });
}
