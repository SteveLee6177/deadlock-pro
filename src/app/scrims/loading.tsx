export default function ScrimsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap gap-2">
        {[
          "Calendar",
          "Find Scrims",
          "Current Scrims",
          "Incoming Scrims",
          "Sent Scrims",
        ].map((label) => (
          <div
            key={label}
            className="h-10 w-32 rounded-full border border-line bg-white/5"
          />
        ))}
      </div>

      <section className="surface-strong rounded-lg p-8 md:p-10">
        <div className="h-4 w-24 rounded-full bg-white/10" />
        <div className="mt-5 h-12 max-w-3xl rounded-full bg-white/10" />
        <div className="mt-4 h-7 max-w-2xl rounded-full bg-white/10" />
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="h-11 w-44 rounded-full bg-white/10" />
          <div className="h-11 w-36 rounded-full bg-white/10" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="surface rounded-lg p-6">
            <div className="h-4 w-28 rounded-full bg-white/10" />
            <div className="mt-4 h-8 w-64 rounded-full bg-white/10" />
            <div className="mt-6 space-y-3">
              <div className="h-16 rounded-[18px] bg-white/5" />
              <div className="h-16 rounded-[18px] bg-white/5" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
