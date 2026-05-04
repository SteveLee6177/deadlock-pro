"use client";

import { useState } from "react";
import { DiscordIcon } from "@/components/icons/discord-icon";

export function DiscordCopyButton({
  profileName,
  username,
  size = "md",
}: {
  profileName: string;
  username: string;
  size?: "sm" | "md" | "lg";
}) {
  const [copied, setCopied] = useState(false);
  const buttonSize = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4.5 w-4.5";

  async function copyDiscordUsername() {
    await navigator.clipboard.writeText(username);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={copyDiscordUsername}
        aria-label={`Copy ${profileName}'s Discord username`}
        title={copied ? "Copied to Keyboard" : "Copy Discord username"}
        className={`inline-flex ${buttonSize} items-center justify-center rounded-full border border-line text-slate-100 transition hover:bg-white/6`}
      >
        <DiscordIcon className={iconSize} />
      </button>
      <span
        aria-live="polite"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-success/30 bg-[#0a1724] px-3 py-1.5 text-xs font-semibold text-success shadow-xl shadow-black/30 transition ${
          copied ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"
        }`}
      >
        Copied to Keyboard
      </span>
    </span>
  );
}
