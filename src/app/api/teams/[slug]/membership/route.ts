import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

const leaveTeamSchema = z.object({
  transferToUserId: z.string().min(1).optional(),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  if (!(await canUseDatabase())) {
    return NextResponse.json(
      { message: "Postgres is unavailable right now, so membership cannot be changed yet." },
      { status: 503 },
    );
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  const { slug } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = leaveTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Check the team member details and try again." }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: true,
    },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const membership = team.memberships.find((item) => item.userId === user.id);

  if (!membership) {
    return NextResponse.json({ message: "You are not on this team." }, { status: 404 });
  }

  if (membership.role === "OWNER") {
    const nextOwner = team.memberships.find(
      (item) => item.userId === parsed.data.transferToUserId && item.userId !== user.id,
    );

    if (!nextOwner) {
      return NextResponse.json(
        { message: "Choose another team member to receive ownership before leaving." },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.team.update({
        where: { id: team.id },
        data: { ownerId: nextOwner.userId },
      }),
      prisma.teamMembership.update({
        where: { id: nextOwner.id },
        data: { role: "OWNER" },
      }),
      prisma.teamMembership.delete({ where: { id: membership.id } }),
    ]);

    return NextResponse.json({ message: "Ownership transferred and you left the team." });
  }

  await prisma.teamMembership.delete({ where: { id: membership.id } });

  return NextResponse.json({ message: "You left the team." });
}
