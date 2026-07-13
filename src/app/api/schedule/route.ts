import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { publishScheduleEvent } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { parseDateInput, readJsonBody } from "@/lib/request";
import { canManageTeamScrims } from "@/lib/scrim-permissions";

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

  const parsed = scheduleSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Check the schedule details and try again." },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const startsAt = parseDateInput(payload.startsAt);
  const endsAt = parseDateInput(payload.endsAt);

  if (!startsAt || !endsAt || endsAt <= startsAt) {
    return NextResponse.json(
      { message: "Use valid schedule start and end times." },
      { status: 400 },
    );
  }

  if (!(await canManageTeamScrims(membershipData.user.id, payload.teamId))) {
    return NextResponse.json(
      { message: "Only team captains/managers can update team schedules." },
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
      startsAt,
      endsAt,
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
