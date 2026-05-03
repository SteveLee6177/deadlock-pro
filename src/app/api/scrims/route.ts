import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";
import { REGION_OPTIONS } from "@/lib/regions";
import { canManageTeamScrims } from "@/lib/scrim-permissions";

const scrimSchema = z.object({
  requesterTeamId: z.string().min(1),
  startsAt: z.string().min(1),
  region: z.enum(REGION_OPTIONS),
  format: z.string().min(2),
  wantedRank: z.string().min(2),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so scrims cannot be posted yet." },
      { status: 503 },
    );
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const payload = scrimSchema.parse(await request.json());
  if (!(await canManageTeamScrims(membershipData.user.id, payload.requesterTeamId))) {
    return NextResponse.json(
      { message: "Only team owners/managers can post official scrims." },
      { status: 403 },
    );
  }

  await prisma.scrimRequest.create({
    data: {
      requesterTeamId: payload.requesterTeamId,
      createdById: membershipData.user.id,
      startsAt: new Date(payload.startsAt),
      region: payload.region,
      format: payload.format,
      wantedRank: payload.wantedRank,
      notes: payload.notes,
    },
  });

  return NextResponse.json({ message: "Scrim request posted." });
}
