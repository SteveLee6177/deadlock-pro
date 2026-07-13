import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { RECRUITING_ROLE_OPTIONS } from "@/lib/recruiting-roles";
import { REGION_OPTIONS } from "@/lib/regions";
import { isScrimManagerRole } from "@/lib/scrim-permissions";
import { prisma } from "@/lib/prisma";

const updateRecruitingSchema = z.object({
  recruiting: z.boolean().optional(),
  openRoles: z.array(z.enum(RECRUITING_ROLE_OPTIONS)).max(RECRUITING_ROLE_OPTIONS.length).optional(),
  focus: z.string().trim().min(2, "Team focus must be at least 2 characters.").optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").optional(),
  region: z.enum(REGION_OPTIONS).optional(),
}).superRefine((payload, context) => {
  const recruitingFields = [payload.recruiting, payload.openRoles, payload.focus, payload.description];
  const isRecruitingUpdate = recruitingFields.some((value) => value !== undefined);

  if (!isRecruitingUpdate) {
    return;
  }

  if (payload.recruiting === undefined) {
    context.addIssue({
      code: "custom",
      message: "Choose whether recruitment is open.",
      path: ["recruiting"],
    });
  }

  if (!payload.openRoles) {
    context.addIssue({
      code: "custom",
      message: "Choose the open roles for recruiting.",
      path: ["openRoles"],
    });
  }

  if (!payload.focus) {
    context.addIssue({
      code: "custom",
      message: "Team focus must be at least 2 characters.",
      path: ["focus"],
    });
  }

  if (!payload.description) {
    context.addIssue({
      code: "custom",
      message: "Description must be at least 10 characters.",
      path: ["description"],
    });
  }
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
    return NextResponse.json({ message: "Only team captains and managers can update recruiting needs." }, { status: 403 });
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
  const isRecruitingUpdate =
    payload.recruiting !== undefined ||
    payload.openRoles !== undefined ||
    payload.focus !== undefined ||
    payload.description !== undefined;

  if (!isRecruitingUpdate && !payload.region) {
    return NextResponse.json(
      { message: "Choose a team setting to update." },
      { status: 400 },
    );
  }

  const openRoles = payload.openRoles
    ? Array.from(new Set(payload.openRoles.map((role) => role.trim()).filter(Boolean)))
    : undefined;

  await prisma.team.update({
    where: { id: team.id },
    data: {
      ...(isRecruitingUpdate
        ? {
            recruiting: payload.recruiting,
            openRoles,
            focus: payload.focus,
            description: payload.description,
          }
        : {}),
      ...(payload.region ? { region: payload.region } : {}),
    },
  });

  return NextResponse.json({
    message: isRecruitingUpdate ? "Recruiting needs saved." : "Team region saved.",
  });
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
    return NextResponse.json({ message: "Only the team captain can disband this team." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.teamApplication.deleteMany({ where: { teamId: team.id } }),
    prisma.team.delete({ where: { id: team.id } }),
  ]);

  return NextResponse.json({ message: "Team disbanded." });
}
