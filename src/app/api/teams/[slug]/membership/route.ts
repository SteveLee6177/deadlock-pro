import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
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
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId: user.id },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  const membership = team.memberships[0];

  if (!membership) {
    return NextResponse.json({ message: "You are not on this team." }, { status: 404 });
  }

  if (membership.role === "OWNER") {
    return NextResponse.json(
      { message: "Transfer ownership before leaving this team." },
      { status: 400 },
    );
  }

  await prisma.teamMembership.delete({ where: { id: membership.id } });

  return NextResponse.json({ message: "You left the team." });
}
