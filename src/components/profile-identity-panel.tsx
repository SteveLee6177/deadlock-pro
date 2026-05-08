"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { DiscordCopyButton } from "@/components/discord-copy-button";
import { DiscordProfileForm } from "@/components/discord-profile-form";
import { SteamIcon } from "@/components/icons/steam-icon";
import { RankBadge } from "@/components/rank-badge";
import { StatlockerProfileLink } from "@/components/statlocker-profile-link";
import { getSteamProfileUrl } from "@/lib/steam-profile";

type ProfileIdentityPanelProps = {
  deadlockRank: string | null;
  deadlockRankBadgeLevel: number | null;
  discordUsername: string | null;
  profileName: string;
  steamId: string;
};

export function ProfileIdentityPanel({
  deadlockRank,
  deadlockRankBadgeLevel,
  discordUsername: initialDiscordUsername,
  profileName,
  steamId,
}: ProfileIdentityPanelProps) {
  const [discordUsername, setDiscordUsername] = useState(initialDiscordUsername);
  return (
    <>
      <section className="surface-strong rounded-lg p-8 md:p-10">
        <p className="eyebrow">Profile</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
          {profileName}
        </h1>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href={getSteamProfileUrl(steamId)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open your Steam profile"
            title="Open Steam profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-slate-100 transition hover:bg-white/8"
          >
            <SteamIcon className="h-5 w-5" />
          </a>
          <StatlockerProfileLink
            steamId={steamId}
            profileName={profileName}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-slate-100 transition hover:bg-white/8"
            iconClassName="h-5 w-5"
          />
          {discordUsername ? (
            <DiscordCopyButton profileName={profileName} username={discordUsername} size="lg" />
          ) : null}
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-success/30 bg-success/10">
            <RankBadge badgeLevel={deadlockRankBadgeLevel} rank={deadlockRank} size="sm" />
          </span>
          <form action="/api/auth/signout" method="post">
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white/5 px-4 text-sm font-medium text-slate-100 transition hover:border-accent/40 hover:bg-white/8">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </section>

      <DiscordProfileForm initialUsername={discordUsername} onSaved={setDiscordUsername} />
    </>
  );
}
