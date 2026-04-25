import Redis from "ioredis";
import { env } from "@/lib/env";
import type { ScheduleFeedEvent } from "@/lib/types";

let publisher: Redis | null = null;

function createRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  return new Redis(env.redisUrl, {
    password: env.redisPassword,
    maxRetriesPerRequest: null,
  });
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

  await Promise.all([
    redis.publish("schedule:all", payload),
    redis.publish(`schedule:team:${event.teamId}`, payload),
  ]);

  return true;
}
