import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { publishScheduleEvent } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const scheduleSchema = z.object({
  teamId: z.string().min(1),
  title: z.string().min(2),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so schedules cannot be updated yet." },
      { status: 503 },
    );
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const payload = scheduleSchema.parse(await request.json());
  const membership = membershipData.memberships.find((item) => item.team.id === payload.teamId);

  if (!membership) {
    return NextResponse.json(
      { message: "You can only manage schedules for teams you belong to." },
      { status: 403 },
    );
  }

  const team = await prisma.team.findUnique({
    where: { id: payload.teamId },
    select: { id: true, name: true },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const scheduleEvent = await prisma.scheduleEvent.create({
    data: {
      teamId: payload.teamId,
      title: payload.title,
      type: "PRACTICE",
      startsAt: new Date(payload.startsAt),
      endsAt: new Date(payload.endsAt),
      location: payload.location,
      notes: payload.notes,
    },
  });

  await publishScheduleEvent({
    id: scheduleEvent.id,
    teamId: team.id,
    teamName: team.name,
    title: scheduleEvent.title,
    type: scheduleEvent.type,
    startsAt: scheduleEvent.startsAt.toISOString(),
    endsAt: scheduleEvent.endsAt.toISOString(),
    location: scheduleEvent.location,
    notes: scheduleEvent.notes,
  });

  return NextResponse.json({ message: "Schedule updated live." });
}
