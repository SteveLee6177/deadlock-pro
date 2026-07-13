"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

type TeamInviteLinkPanelProps = {
  initialExpiresAt: string | null;
  initialUrl: string | null;
  slug: string;
};

function formatExpiry(value: string | null) {
  if (!value) {
    return "No active link";
  }

  return `Expires ${new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

export function TeamInviteLinkPanel({
  initialExpiresAt,
  initialUrl,
  slug,
}: TeamInviteLinkPanelProps) {
  const [url, setUrl] = useState(initialUrl);
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function copyInviteLink() {
    if (!url) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setFeedback(null);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setFeedback("Unable to copy link. Select the URL and copy it manually.");
    }
  }

  function createInviteLink() {
    startTransition(async () => {
      const response = await fetch(`/api/teams/${slug}/invite`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { invite?: { url: string; expiresAt: string }; message?: string }
        | null;

      if (response.ok && payload?.invite) {
        setUrl(payload.invite.url);
        setExpiresAt(payload.invite.expiresAt);
        setFeedback("Invite link refreshed.");
        return;
      }

      setFeedback(payload?.message ?? "Unable to create invite link.");
    });
  }

  return (
    <div className="rounded-lg border border-line bg-white/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          value={url ?? ""}
          readOnly
          placeholder="Create a 24-hour team invite link"
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-slate-950/60 px-3 text-sm text-slate-200 outline-none"
          aria-label="Team invite link"
        />
        <button
          type="button"
          onClick={copyInviteLink}
          disabled={!url}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={createInviteLink}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          {isPending ? "Refreshing..." : url ? "Refresh link" : "Create link"}
        </button>
      </div>
      {copied ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/15 px-3 py-2 text-sm font-semibold text-success">
          <Check className="h-4 w-4" />
          Copied
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
        <span>{formatExpiry(expiresAt)}</span>
        {feedback ? <span>{feedback}</span> : null}
      </div>
    </div>
  );
}
