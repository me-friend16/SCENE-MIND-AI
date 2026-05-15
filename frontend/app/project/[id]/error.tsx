'use client';

import Link from 'next/link';

export default function ProjectError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <p className="text-slate-400">Failed to load project.</p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
