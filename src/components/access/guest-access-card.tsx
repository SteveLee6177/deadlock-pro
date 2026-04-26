import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

export function GuestAccessCard({
  eyebrow,
  title,
  description,
  ctaLabel = "Sign in with Steam",
  ctaHref = "/sign-in",
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <section className="surface rounded-[28px] p-6">
      <div className="flex items-start gap-4">
        <div className="mt-1 rounded-2xl border border-line bg-white/5 p-3 text-accent-strong">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
