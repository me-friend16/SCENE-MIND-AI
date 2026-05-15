'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditorError({ reset }: { reset: () => void }) {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-void text-center">
      <p className="text-slate-400">The editor encountered an error.</p>
      <p className="mt-1 text-sm text-slate-600">Your auto-saved content is safe.</p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white"
        >
          Reload editor
        </button>
        <Link
          href={`/project/${id ?? ''}`}
          className="rounded-xl border border-white/10 px-5 py-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          Back to project
        </Link>
      </div>
    </div>
  );
}
