import { hasDatabase } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const DATABASE_HEALTH_TTL_MS = 15_000;

declare global {
  var databaseHealth:
    | {
        available: boolean;
        checkedAt: number;
      }
    | undefined;
}

export async function canUseDatabase() {
  if (!hasDatabase()) {
    return false;
  }

  const cachedHealth = global.databaseHealth;
  const now = Date.now();

  if (cachedHealth && now - cachedHealth.checkedAt < DATABASE_HEALTH_TTL_MS) {
    return cachedHealth.available;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    global.databaseHealth = { available: true, checkedAt: now };
    return true;
  } catch {
    global.databaseHealth = { available: false, checkedAt: now };
    return false;
  }
}
