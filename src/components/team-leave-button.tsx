"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TeamLeaveButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const response = await fetch(`/api/teams/${slug}/membership`, {
              method: "DELETE",
            });
            const payload = (await response.json().catch(() => ({}))) as { message?: string };

            if (response.ok) {
              router.push("/teams");
              router.refresh();
              return;
            }

            setFeedback(payload.message ?? "Unable to leave team.");
          });
        }}
        className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {isPending ? "Leaving..." : "Leave team"}
      </button>
      {feedback ? <p className="mt-3 text-sm text-muted">{feedback}</p> : null}
    </div>
  );
}
