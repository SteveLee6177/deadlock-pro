import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { canManageTeamScrims } from "@/lib/scrim-permissions";

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
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
      type: "SCRIM_REQUEST",
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
    return jsonError("Choose a valid request action.", 400);
  }

  const { id } = await params;
  const scrimRequest = await prisma.scrimBookingRequest.findUnique({
    where: { id },
    include: {
      availabilityBlock: true,
      requestingTeam: { select: { id: true, name: true } },
      receivingTeam: { select: { id: true, name: true } },
    },
  });

  if (!scrimRequest) {
    return jsonError("Scrim request not found.", 404);
  }

  if (scrimRequest.status !== "PENDING") {
    return jsonError("This request has already been handled.", 409);
  }

  const canManageReceiving = await canManageTeamScrims(
    membershipData.user.id,
    scrimRequest.receivingTeamId,
  );
  const canManageRequesting = await canManageTeamScrims(
    membershipData.user.id,
    scrimRequest.requestingTeamId,
  );

  if (parsed.data.action === "cancel" && !canManageRequesting) {
    return jsonError("Only the requesting team's owners/managers can cancel this request.", 403);
  }

  if (parsed.data.action !== "cancel" && !canManageReceiving) {
    return jsonError("Only the receiving team's owners/managers can manage this request.", 403);
  }

  if (parsed.data.action === "decline" || parsed.data.action === "cancel") {
    const nextStatus = parsed.data.action === "decline" ? "DECLINED" : "CANCELLED";

    await prisma.$transaction([
      prisma.scrimBookingRequest.update({
        where: { id },
        data: { status: nextStatus },
      }),
      prisma.scrimAvailabilityBlock.update({
        where: { id: scrimRequest.availabilityBlockId },
        data: { status: "OPEN" },
      }),
    ]);

    const notifiedTeamId =
      parsed.data.action === "decline"
        ? scrimRequest.requestingTeamId
        : scrimRequest.receivingTeamId;

    await notifyManagers(
      notifiedTeamId,
      parsed.data.action === "decline" ? "Scrim request declined" : "Scrim request cancelled",
      `${scrimRequest.receivingTeam.name} vs ${scrimRequest.requestingTeam.name} was ${nextStatus.toLowerCase()}.`,
      id,
    );

    return NextResponse.json({
      message: parsed.data.action === "decline" ? "Scrim request declined." : "Scrim request cancelled.",
    });
  }

  let confirmedScrim: { id: string } | null = null;

  try {
    confirmedScrim = await prisma.$transaction(async (tx) => {
      const freshRequest = await tx.scrimBookingRequest.findUnique({
        where: { id },
        include: {
          availabilityBlock: true,
        },
      });

      if (!freshRequest || freshRequest.status !== "PENDING") {
        throw new Error("REQUEST_NOT_PENDING");
      }

      if (freshRequest.availabilityBlock.status === "BOOKED") {
        throw new Error("BLOCK_BOOKED");
      }

      const overlap = await tx.scrim.findFirst({
        where: {
          status: "CONFIRMED",
          OR: [
            { teamAId: freshRequest.receivingTeamId },
            { teamBId: freshRequest.receivingTeamId },
            { teamAId: freshRequest.requestingTeamId },
            { teamBId: freshRequest.requestingTeamId },
          ],
          startTime: { lt: freshRequest.availabilityBlock.endTime },
          endTime: { gt: freshRequest.availabilityBlock.startTime },
        },
        select: { id: true },
      });

      if (overlap) {
        throw new Error("SCRIM_OVERLAP");
      }

      const scrim = await tx.scrim.create({
        data: {
          teamAId: freshRequest.receivingTeamId,
          teamBId: freshRequest.requestingTeamId,
          availabilityBlockId: freshRequest.availabilityBlockId,
          startTime: freshRequest.availabilityBlock.startTime,
          endTime: freshRequest.availabilityBlock.endTime,
          notes: freshRequest.message,
        },
      });

      await tx.scrimBookingRequest.update({
        where: { id },
        data: { status: "ACCEPTED" },
      });

      await tx.scrimBookingRequest.updateMany({
        where: {
          availabilityBlockId: freshRequest.availabilityBlockId,
          id: { not: id },
          status: "PENDING",
        },
        data: { status: "DECLINED" },
      });

      await tx.scrimAvailabilityBlock.update({
        where: { id: freshRequest.availabilityBlockId },
        data: { status: "BOOKED" },
      });

      await tx.scheduleEvent.createMany({
        data: [
          {
            teamId: freshRequest.receivingTeamId,
            title: `Scrim vs ${scrimRequest.requestingTeam.name}`,
            type: "SCRIM",
            startsAt: freshRequest.availabilityBlock.startTime,
            endsAt: freshRequest.availabilityBlock.endTime,
            location: freshRequest.availabilityBlock.region,
            notes: freshRequest.message,
          },
          {
            teamId: freshRequest.requestingTeamId,
            title: `Scrim vs ${scrimRequest.receivingTeam.name}`,
            type: "SCRIM",
            startsAt: freshRequest.availabilityBlock.startTime,
            endsAt: freshRequest.availabilityBlock.endTime,
            location: freshRequest.availabilityBlock.region,
            notes: freshRequest.message,
          },
        ],
      });

      return scrim;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_NOT_PENDING") {
      return jsonError("This request has already been handled.", 409);
    }

    if (error instanceof Error && error.message === "BLOCK_BOOKED") {
      return jsonError("That availability block is already booked.", 409);
    }

    if (error instanceof Error && error.message === "SCRIM_OVERLAP") {
      return jsonError("One of these teams already has a confirmed scrim then.", 409);
    }

    throw error;
  }

  if (!confirmedScrim) {
    return jsonError("This request has already been handled.", 409);
  }

  await Promise.all([
    notifyManagers(
      scrimRequest.receivingTeamId,
      "Scrim confirmed",
      `${scrimRequest.receivingTeam.name} accepted ${scrimRequest.requestingTeam.name}'s request.`,
      confirmedScrim.id,
    ),
    notifyManagers(
      scrimRequest.requestingTeamId,
      "Scrim confirmed",
      `${scrimRequest.receivingTeam.name} accepted your scrim request.`,
      confirmedScrim.id,
    ),
  ]);

  return NextResponse.json({ id: confirmedScrim.id, message: "Scrim confirmed." });
}
