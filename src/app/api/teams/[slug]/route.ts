import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { isScrimManagerRole } from "@/lib/scrim-permissions";
import { prisma } from "@/lib/prisma";

const updateRecruitingSchema = z.object({
  recruiting: z.boolean(),
  openRoles: z.array(z.string().trim().min(1)).max(20),
  focus: z.string().trim().min(2, "Team focus must be at least 2 characters."),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
});

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the team details and try again.";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so teams cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const membership = team.memberships[0];

  if (!membership || !isScrimManagerRole(membership.role)) {
    return NextResponse.json({ message: "Only team owners and managers can update recruiting needs." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedPayload = updateRecruitingSchema.safeParse(body);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: validationMessage(parsedPayload.error) },
      { status: 400 },
    );
  }

  const payload = parsedPayload.data;
  const openRoles = Array.from(new Set(payload.openRoles.map((role) => role.trim()).filter(Boolean)));

  await prisma.team.update({
    where: { id: team.id },
    data: {
      recruiting: payload.recruiting,
      openRoles,
      focus: payload.focus,
      description: payload.description,
    },
  });

  return NextResponse.json({ message: "Recruiting needs saved." });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so teams cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId: user.id },
        select: { role: true },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const membership = team.memberships[0];

  if (team.ownerId !== user.id || membership?.role !== "OWNER") {
    return NextResponse.json({ message: "Only the team owner can disband this team." }, { status: 403 });
  }

  await prisma.team.delete({ where: { id: team.id } });

  return NextResponse.json({ message: "Team disbanded." });
}
