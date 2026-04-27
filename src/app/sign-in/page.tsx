import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <section className="surface-strong rounded-lg p-8 md:p-10">
          <p className="eyebrow">Steam Login</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Verify Steam, then attach your Deadlock rank.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Scrimlock uses Steam OpenID for sign-in. Once the Steam identity is verified,
            captains can evaluate trial requests with a rank signal tied to a real Steam profile.
          </p>

          <a
            href="/api/auth/steam"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            Verify with Steam
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        <section className="grid gap-6">
          {[
            {
              icon: Lock,
              title: "Steam handles credentials",
              detail:
                "Users log in on Steam's side. Your app receives the verified Steam ID back through OpenID.",
            },
            {
              icon: ShieldCheck,
              title: "Rank signal is decoupled",
              detail:
                "The Deadlock profile fetch sits behind its own adapter so you can swap endpoints or response mappings without rewriting auth.",
            },
          ].map((item) => (
            <div key={item.title} className="surface rounded-lg p-6">
              <item.icon className="h-6 w-6 text-accent-strong" />
              <h2 className="mt-5 font-display text-2xl font-bold text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{item.detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
