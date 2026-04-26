import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must be at least 2 characters."),
  tag: z
    .string()
    .trim()
    .min(2, "Team tag must be at least 2 characters.")
    .max(5, "Team tag must be 5 characters or fewer."),
  region: z.string().trim().min(2, "Region must be at least 2 characters."),
  rank: z.string().trim().min(2, "Primary rank must be at least 2 characters."),
  focus: z.string().trim().min(2, "Team focus must be at least 2 characters."),
  openRoles: z.string().trim().optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters."),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
      tag: payload.tag.toUpperCase(),
      region: payload.region,
      primaryRank: payload.rank,
      focus: payload.focus,
      description: payload.description,
      openRoles: payload.openRoles
        ? payload.openRoles
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean)
        : [],
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
