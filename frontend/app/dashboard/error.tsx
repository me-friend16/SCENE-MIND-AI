'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-slate-400">Failed to load dashboard.</p>
      <button
        onClick={reset}
        className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
      >
        Retry
      </button>
    </div>
  );
}
