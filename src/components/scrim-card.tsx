import { CalendarRange, MapPinned, Shield } from "lucide-react";
import { LocalScheduleRange } from "@/components/local-schedule-range";
import type { OpenScrim } from "@/lib/types";

export function ScrimCard({ scrim }: { scrim: OpenScrim }) {
  const end = new Date(new Date(scrim.startsAt).getTime() + 3 * 60 * 60 * 1000);

  return (
    <article className="surface rounded-[28px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent-strong">{scrim.requesterTag}</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">
            {scrim.requesterTeamName}
          </h3>
        </div>
        <span className="rounded-full border border-line bg-white/6 px-3 py-1 text-xs text-slate-100">
          {scrim.format}
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-muted">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-accent-strong" />
          <LocalScheduleRange start={scrim.startsAt} end={end} />
        </div>
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-accent-strong" />
          {scrim.region}
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-strong" />
          Targeting {scrim.wantedRank}
        </div>
      </div>

      {scrim.notes ? <p className="mt-5 text-sm leading-7 text-slate-200">{scrim.notes}</p> : null}
    </article>
  );
}
