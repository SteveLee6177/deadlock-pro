import { NextResponse } from "next/server";
import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import {
  markConversationChatNotificationsRead,
  resolveRequestConversation,
  resolveScrimConversation,
} from "@/lib/scrim-chat";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request) {
  if (!(await canUseDatabase())) {
    return jsonError("Postgres is unavailable right now, so scrim chat cannot load.", 503);
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return jsonError("Sign in with Steam first.", 401);
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId");
  const scrimId = searchParams.get("scrimId");

  if (requestId && scrimId) {
    return jsonError("Choose either a request or confirmed scrim chat.", 400);
  }

  if (!requestId && !scrimId) {
    return jsonError("Choose a scrim chat to open.", 400);
  }

  const conversation = requestId
    ? await resolveRequestConversation(requestId, membershipData.user.id)
    : await resolveScrimConversation(scrimId!, membershipData.user.id);

  if (conversation === "FORBIDDEN") {
    return jsonError("Only either team's captains/managers can use this scrim chat.", 403);
  }

  if (!conversation) {
    return jsonError("Scrim chat not found.", 404);
  }

  await markConversationChatNotificationsRead(conversation.id, membershipData.user.id);

  return NextResponse.json(conversation);
}
