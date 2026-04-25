"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { BroadcastCard } from "@/lib/types";

export function BroadcastEmbed({ broadcast }: { broadcast: BroadcastCard }) {
  const parent = typeof window === "undefined" ? "" : window.location.hostname || "localhost";
  const src = parent
    ? `https://player.twitch.tv/?channel=${broadcast.channel}&parent=${parent}&muted=true`
    : null;

  return (
    <div className="surface rounded-[28px] overflow-hidden">
      <div className="border-b border-line/70 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-strong">
              {broadcast.status}
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-white">{broadcast.title}</h3>
            <p className="mt-2 text-sm text-muted">
              {broadcast.tournamentName ?? "Community broadcast"} · twitch.tv/{broadcast.channel}
            </p>
          </div>
          <Link
            href={`https://www.twitch.tv/${broadcast.channel}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-strong"
          >
            Open
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {src ? (
        <iframe
          src={src}
          height="280"
          allowFullScreen
          className="w-full border-0"
          title={broadcast.title}
        />
      ) : (
        <div className="flex h-[280px] items-center justify-center bg-[#08111a] text-sm text-muted">
          Loading Twitch embed…
        </div>
      )}
    </div>
  );
}
