'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SceneMind] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 text-3xl text-rose-400">
        ⚠
      </div>
      <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        {error.message || 'An unexpected error occurred. Your work is auto-saved.'}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-2xl border border-white/10 px-6 py-2.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
