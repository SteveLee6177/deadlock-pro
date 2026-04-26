import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { canManageTeamScrims } from "@/lib/scrim-permissions";
import { parseAbsoluteDateTime } from "@/lib/time-zone";

const availabilitySchema = z.object({
  teamId: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  region: z.string().min(2),
  notes: z.string().optional(),
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

export async function POST(request: Request) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now, so availability cannot be saved.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const parsed = availabilitySchema.safeParse(await request.json());

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

  if (!(await canManageTeamScrims(membershipData.user.id, parsed.data.teamId))) {
    return jsonError("Only team owners/managers can create official availability.", 403);
  }

  if (await hasConfirmedOverlap(parsed.data.teamId, startTime, endTime)) {
    return jsonError("Your team already has a confirmed scrim during that time.", 409);
  }

  const block = await prisma.scrimAvailabilityBlock.create({
    data: {
      teamId: parsed.data.teamId,
      createdByUserId: membershipData.user.id,
      startTime,
      endTime,
      region: parsed.data.region,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ id: block.id, message: "Availability block created." });
}
