import { ArrowRight, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCurrentUser } from "@/lib/auth";
import { LOCAL_TEST_AUTH_ENABLED, localTestAccounts } from "@/lib/local-test-data";
import { safeReturnPath } from "@/lib/team-invites";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const returnToParam = Array.isArray(resolvedSearchParams.returnTo)
    ? resolvedSearchParams.returnTo[0]
    : resolvedSearchParams.returnTo;
  const returnTo = safeReturnPath(returnToParam);
  const steamHref = returnTo
    ? `/api/auth/steam?returnTo=${encodeURIComponent(returnTo)}`
    : "/api/auth/steam";

  return (
    <div className="min-h-screen">
      <SiteHeader user={user} />

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <section className="surface-strong rounded-lg p-8 md:p-10">
          <p className="eyebrow">Steam Login</p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-white">
            Login with Steam, then attach your Deadlock rank.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Scrimlock uses Steam OpenID for sign-in. Once the Steam identity is verified,
            team captains and managers can evaluate applications with a rank signal tied to a real
            Steam profile.
          </p>

          <a
            href={steamHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
          >
            Login with Steam
            <ArrowRight className="h-4 w-4" />
          </a>

          {LOCAL_TEST_AUTH_ENABLED ? (
            <div className="mt-8 rounded-lg border border-line bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-accent-strong" />
                <div>
                  <p className="eyebrow">Local Test Access</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    Use a seeded captain account
                  </h2>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {localTestAccounts.map((account) => {
                  const href = new URLSearchParams({
                    steamId: account.steamId,
                  });

                  if (returnTo) {
                    href.set("returnTo", returnTo);
                  }

                  return (
                    <a
                      key={account.steamId}
                      href={`/api/auth/test?${href.toString()}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/6"
                    >
                      {account.profileName}
                      <span className="text-muted">({account.teamName})</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
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
