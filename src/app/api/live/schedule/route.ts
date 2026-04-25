import { createRedisSubscriber } from "@/lib/redis";

export const runtime = "nodejs";

function send(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
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

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      await subscriber.subscribe(...channels);

      const heartbeat = setInterval(() => {
        send(controller, { kind: "status", title: "heartbeat" });
      }, 15000);

      subscriber.on("message", (_channel, message) => {
        send(controller, JSON.parse(message));
      });

      request.signal.addEventListener("abort", async () => {
        clearInterval(heartbeat);
        await subscriber.unsubscribe(...channels);
        subscriber.disconnect();
        controller.close();
      });
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
