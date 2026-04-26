"use client";

import { RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";

export default function ScrimsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader user={null} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="surface-strong rounded-[36px] p-8 md:p-10">
          <p className="eyebrow">Scrims</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Scrim scheduling could not load.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Try again in a moment. If this keeps happening, the database connection or session may need attention.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </section>
      </main>
    </div>
  );
}
