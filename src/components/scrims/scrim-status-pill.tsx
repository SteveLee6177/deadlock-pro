import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  OPEN: "border-success/30 bg-success/10 text-success",
  PENDING: "border-accent-strong/30 bg-accent-strong/10 text-accent-strong",
  CONFIRMED: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  ACCEPTED: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  BOOKED: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  DECLINED: "border-line bg-white/5 text-muted",
  CANCELLED: "border-rose-300/30 bg-rose-300/10 text-rose-200",
  COMPLETED: "border-line bg-white/5 text-slate-200",
};

export function ScrimStatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
        STATUS_STYLES[status] ?? "border-line bg-white/5 text-slate-200",
        className,
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
