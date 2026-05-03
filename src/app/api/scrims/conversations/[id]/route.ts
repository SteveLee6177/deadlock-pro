import { NextResponse } from "next/server";
import { z } from "zod";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import {
  createScrimMessage,
  getConversationContext,
  listConversationMessages,
} from "@/lib/scrim-chat";

const messageSchema = z.object({
  body: z.string().trim().min(1).max(1000),
  senderTeamId: z.string().optional(),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const { id } = await params;
  const context = await getConversationContext(id, membershipData.user.id);

  if (context === "FORBIDDEN") {
    return jsonError("Only either team's owners/managers can use this scrim chat.", 403);
  }

  if (!context) {
    return jsonError("Scrim chat not found.", 404);
  }

  const { searchParams } = new URL(request.url);
  const afterParam = searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  const messages = await listConversationMessages({
    conversationId: id,
    after: after && !Number.isNaN(after.getTime()) ? after : undefined,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const parsed = messageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonError("Write a message under 1000 characters.", 400);
  }

  const { id } = await params;
  const message = await createScrimMessage({
    conversationId: id,
    userId: membershipData.user.id,
    body: parsed.data.body,
    senderTeamId: parsed.data.senderTeamId,
  });

  if (message === "FORBIDDEN") {
    return jsonError("Only either team's owners/managers can use this scrim chat.", 403);
  }

  if (!message) {
    return jsonError("Scrim chat not found.", 404);
  }

  return NextResponse.json({ message });
}
