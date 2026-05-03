import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { RECRUITING_ROLE_OPTIONS } from "@/lib/recruiting-roles";
import { REGION_OPTIONS } from "@/lib/regions";

const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters."),
  region: z.enum(REGION_OPTIONS, "Choose a valid region."),
  rank: z.string().trim().min(2, "Primary rank must be at least 2 characters."),
  recruiting: z.boolean().default(false),
  openRoles: z.array(z.enum(RECRUITING_ROLE_OPTIONS)).default([]),
  description: z.string().trim().optional().default(""),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createInternalTeamTag(slugBase: string) {
  const prefix = slugBase.replace(/-/g, "").slice(0, 12).toUpperCase() || "TEAM";

  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function validationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the team details and try again.";
}

export async function POST(request: Request) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so teams cannot be created yet." },
      { status: 503 },
    );
  }

  const owner = await getOrCreateCurrentDbUser();

  if (!owner) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedPayload = createTeamSchema.safeParse(body);

  if (!parsedPayload.success) {
    return NextResponse.json(
      { message: validationMessage(parsedPayload.error) },
      { status: 400 },
    );
  }

  const payload = parsedPayload.data;

  const slugBase = slugify(payload.name);

  const team = await prisma.team.create({
    data: {
      slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      tag: createInternalTeamTag(slugBase),
      region: payload.region,
      primaryRank: payload.rank,
      focus: payload.recruiting
        ? "Recruiting high-level players for structured scrims and tournament preparation."
        : "Established high-level roster focused on scrims and tournament preparation.",
      description: payload.description,
      recruiting: payload.recruiting,
      openRoles: payload.recruiting ? Array.from(new Set(payload.openRoles)) : [],
      ownerId: owner.id,
      memberships: {
        create: {
          userId: owner.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json({
    message: "Team created successfully.",
    team: {
      slug: team.slug,
    },
  });
}
