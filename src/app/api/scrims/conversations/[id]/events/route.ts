import { canUseDatabase } from "@/lib/database";
import { getCurrentUserMemberships } from "@/lib/db-user";
import {
  getConversationContext,
  listConversationMessages,
} from "@/lib/scrim-chat";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function send(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: unknown,
  isClosed: () => boolean,
) {
  if (isClosed()) {
    return;
  }

  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  } catch {
    // The browser can disconnect between the closed check and enqueue.
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await canUseDatabase())) {
    return new Response(null, { status: 503 });
  }

  const membershipData = await getCurrentUserMemberships();

  if (!membershipData) {
    return new Response(null, { status: 401 });
  }

  const { id } = await params;
  const context = await getConversationContext(id, membershipData.user.id);

  if (context === "FORBIDDEN") {
    return new Response(null, { status: 403 });
  }

  if (!context) {
    return new Response(null, { status: 404 });
  }

  let isClosed = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");
  const afterDate = after ? new Date(after) : null;
  let lastSeen =
    afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate : new Date(0);

  const closeStream = (closeController: boolean, controller?: ReadableStreamDefaultController<Uint8Array>) => {
    if (isClosed) {
      return;
    }

    isClosed = true;
    clearInterval(interval);
    clearInterval(heartbeat);

    if (!closeController || !controller) {
      return;
    }

    try {
      controller.close();
    } catch {
      // The stream may already be closed by Next.js/request abort handling.
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      send(controller, { kind: "status", title: "connected" }, () => isClosed);

      interval = setInterval(async () => {
        try {
          const messages = await listConversationMessages({
            conversationId: id,
            after: lastSeen,
          });

          if (messages.length === 0) {
            return;
          }

          lastSeen = new Date(messages[messages.length - 1].createdAt);
          send(controller, { kind: "messages", messages }, () => isClosed);
        } catch {
          send(controller, { kind: "status", title: "error" }, () => isClosed);
        }
      }, 1000);

      heartbeat = setInterval(() => {
        send(controller, { kind: "status", title: "heartbeat" }, () => isClosed);
      }, 15000);

      request.signal.addEventListener("abort", () => closeStream(true, controller), {
        once: true,
      });
    },
    cancel() {
      closeStream(false);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
