import Redis from "ioredis";
import { env } from "@/lib/env";
import type { ScheduleFeedEvent } from "@/lib/types";

let publisher: Redis | null = null;
const seenRedisErrors = new Set<string>();

function attachRedisErrorHandler(client: Redis) {
  client.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);

    if (seenRedisErrors.has(message)) {
      return;
    }

    seenRedisErrors.add(message);
    console.warn(`[redis] ${message}`);
  });
}

function createRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  const client = new Redis(env.redisUrl, {
    password: env.redisPassword,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  });

  attachRedisErrorHandler(client);

  return client;
}

export function getRedisPublisher() {
  if (!publisher) {
    publisher = createRedisClient();
  }

  return publisher;
}

export function createRedisSubscriber() {
  return createRedisClient();
}

export async function publishScheduleEvent(event: ScheduleFeedEvent) {
  const redis = getRedisPublisher();

  if (!redis) {
    return false;
  }

  const payload = JSON.stringify(event);

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    await Promise.all([
      redis.publish("schedule:all", payload),
      redis.publish(`schedule:team:${event.teamId}`, payload),
    ]);
  } catch {
    return false;
  }

  return true;
}
