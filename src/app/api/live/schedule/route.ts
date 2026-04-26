import { createRedisSubscriber } from "@/lib/redis";

export const runtime = "nodejs";

function send(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: unknown,
  isClosed: () => boolean,
) {
  if (isClosed()) {
    return;
  }

  const encoder = new TextEncoder();

  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  } catch {
    // The browser can disconnect between the closed check and enqueue.
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId") ?? "all";
  const subscriber = createRedisSubscriber();

  if (!subscriber) {
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const channels =
    teamId === "all" ? ["schedule:all"] : ["schedule:all", `schedule:team:${teamId}`];

  let isClosed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
  let handleMessage: ((channel: string, message: string) => void) | undefined;

  const closeStream = async (closeController: boolean) => {
    if (isClosed) {
      return;
    }

    isClosed = true;
    clearInterval(heartbeat);

    if (handleMessage) {
      subscriber.off("message", handleMessage);
    }

    await subscriber.unsubscribe(...channels).catch(() => undefined);
    subscriber.disconnect();

    if (!closeController || !streamController) {
      return;
    }

    try {
      streamController.close();
    } catch {
      // The stream may already be closed by Next.js/request abort handling.
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamController = controller;

      try {
        if (subscriber.status === "wait") {
          await subscriber.connect();
        }

        await subscriber.subscribe(...channels);
      } catch {
        send(controller, { kind: "status", title: "disabled" }, () => isClosed);
        subscriber.disconnect();
        try {
          controller.close();
        } catch {
          // The stream may already be closed by Next.js/request abort handling.
        }
        return;
      }

      heartbeat = setInterval(() => {
        send(controller, { kind: "status", title: "heartbeat" }, () => isClosed);
      }, 15000);

      handleMessage = (_channel, message) => {
        try {
          send(controller, JSON.parse(message), () => isClosed);
        } catch {
          send(controller, { kind: "status", title: "invalid-message" }, () => isClosed);
        }
      };

      subscriber.on("message", handleMessage);

      request.signal.addEventListener("abort", () => closeStream(true), { once: true });
    },
    async cancel() {
      await closeStream(false);
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
