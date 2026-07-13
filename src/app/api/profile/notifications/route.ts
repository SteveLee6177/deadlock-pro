import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getOrCreateCurrentDbUser } from "@/lib/db-user";
import { prisma } from "@/lib/prisma";

function notificationHref(type: string, title: string) {
  if (
    type === "SCRIM_CHAT" ||
    type === "SCRIM_MATCH" ||
    title.toLowerCase().includes("confirmed")
  ) {
    return "/scrims/current";
  }

  if (type === "SCRIM_REQUEST") {
    return "/scrims/requests#incoming";
  }

  return "/profile";
}

export async function GET() {
  if (!(await canUseDatabase())) {
    return NextResponse.json({ notifications: [] });
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ notifications: [] }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notificationHref(notification.type, notification.title),
      createdAt: notification.createdAt.toISOString(),
    })),
  });
}

export async function PATCH() {
  if (!(await canUseDatabase())) {
    return NextResponse.json({ message: "Postgres is unavailable right now." }, { status: 503 });
  }

  const user = await getOrCreateCurrentDbUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in with Steam first." }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ message: "Notifications marked read." });
}
