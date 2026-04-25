import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
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
  if (!hasDatabase()) {
    return NextResponse.json(
      { message: "Configure Postgres before updating schedules." },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const payload = scheduleSchema.parse(await request.json());

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
