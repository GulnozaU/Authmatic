export function PortalHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-hf-border bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hf-navy text-sm font-bold text-white">
            HF
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-hf-blue">
              HealthFirst
            </p>
            <p className="text-sm text-slate-600">Provider Portal</p>
          </div>
        </div>
        <div className="hidden text-right text-xs text-slate-500 sm:block">
          <p>Provider Services</p>
          <p>1-800-555-HEALTH</p>
        </div>
      </div>
      <div className="border-t border-hf-border bg-hf-sky px-6 py-3">
        <h1 className="mx-auto max-w-4xl text-lg font-semibold text-hf-navy">{title}</h1>
      </div>
    </header>
  );
}
