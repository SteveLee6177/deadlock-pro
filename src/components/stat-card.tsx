export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="surface rounded-[28px] p-6">
      <p className="text-sm uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-3 max-w-xs text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}
