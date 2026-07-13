import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { REGION_OPTIONS } from "@/lib/regions";
import { readJsonBody } from "@/lib/request";
import { canManageTeamScrims } from "@/lib/scrim-permissions";
import { parseAbsoluteDateTime } from "@/lib/time-zone";

const updateSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  region: z.enum(REGION_OPTIONS),
  notes: z.string().optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

async function hasConfirmedOverlap(
  teamId: string,
  startTime: Date,
  endTime: Date,
  availabilityBlockId: string,
) {
  const overlap = await prisma.scrim.findFirst({
    where: {
      status: "CONFIRMED",
      availabilityBlockId: { not: availabilityBlockId },
      OR: [{ teamAId: teamId }, { teamBId: teamId }],
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true },
  });

  return Boolean(overlap);
}

async function getEditableBlock(id: string, userId: string) {
  const block = await prisma.scrimAvailabilityBlock.findUnique({
    where: { id },
    select: {
      id: true,
      teamId: true,
      status: true,
    },
  });

  if (!block) {
    return { error: jsonError("Availability block not found.", 404), block: null };
  }

  if (!(await canManageTeamScrims(userId, block.teamId))) {
    return {
      error: jsonError("Only team captains/managers can manage this availability block.", 403),
      block: null,
    };
  }

  if (block.status === "BOOKED") {
    return { error: jsonError("Booked availability cannot be edited.", 409), block: null };
  }

  return { error: null, block };
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

  const { id } = await params;
  const { error, block } = await getEditableBlock(id, membershipData.user.id);

  if (error) {
    return error;
  }

  const parsed = updateSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return jsonError("Check the availability details and try again.", 400);
  }

  const startTime = parseAbsoluteDateTime(parsed.data.startTime);
  const endTime = parseAbsoluteDateTime(parsed.data.endTime);

  if (!startTime || !endTime) {
    return jsonError("Use valid timezone-aware start and end times.", 400);
  }

  if (endTime <= startTime) {
    return jsonError("End time must be after start time.", 400);
  }

  if (block && (await hasConfirmedOverlap(block.teamId, startTime, endTime, id))) {
    return jsonError("Your team already has a confirmed scrim during that time.", 409);
  }

  await prisma.scrimAvailabilityBlock.update({
    where: { id },
    data: {
      startTime,
      endTime,
      region: parsed.data.region,
      notes: parsed.data.notes,
      status: "OPEN",
    },
  });

  return NextResponse.json({ message: "Availability block updated." });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const { id } = await params;
  const { error } = await getEditableBlock(id, membershipData.user.id);

  if (error) {
    return error;
  }

  await prisma.$transaction([
    prisma.scrimAvailabilityBlock.update({
      where: { id },
      data: { status: "CANCELLED" },
    }),
    prisma.scrimBookingRequest.updateMany({
      where: {
        availabilityBlockId: id,
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    }),
  ]);

  return NextResponse.json({ message: "Availability block cancelled." });
}
