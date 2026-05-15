'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const label = decodeURIComponent(id).replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-void px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-slate-600 transition-colors hover:text-slate-400"
            >
              ← Dashboard
            </Link>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-accent/70">
              Project workspace
            </p>
            <h1 className="mt-2 text-4xl font-semibold capitalize text-white">{label}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/project/${id}/editor`}>
              <Button>Open screenplay editor</Button>
            </Link>
            <Button variant="secondary">Run continuity check</Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          {/* Left column */}
          <section className="space-y-6">
            <GlassCard className="p-8">
              <h2 className="text-xl font-semibold text-white">Scene timeline</h2>
              <p className="mt-3 text-slate-400">
                Visualize scenes, characters, and story beats with live AI insights.
              </p>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {['Act I', 'Act II', 'Midpoint', 'Act III'].map((act) => (
                  <div
                    key={act}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent/60">
                      {act}
                    </p>
                    <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06]">
                      <div className="h-full w-0 rounded-full bg-gradient-to-r from-accent to-cyan" />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="overflow-hidden p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Screenplay preview</h2>
                <Link href={`/project/${id}/editor`}>
                  <Button variant="secondary" className="text-xs py-2">
                    Open editor →
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-6 font-mono">
                <p className="text-sm font-bold uppercase tracking-wider text-cyan">
                  INT. ORBITAL STUDIO — NIGHT
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  A crew of creatives prepares for a shoot that might rewrite the rules of
                  storytelling. The AI assistant glows in the corner, watching every beat.
                </p>
                <p className="mt-5 pl-[40%] text-sm font-bold uppercase tracking-wider text-amber">
                  DIRECTOR
                </p>
                <p className="mt-1 px-[20%] text-sm text-white">
                  Tell me this shot is going to work.
                </p>
              </div>
            </GlassCard>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Continuity</p>
                  <h2 className="mt-1.5 text-lg font-semibold text-white">Alerts</h2>
                </div>
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300">
                  2 warnings
                </span>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />
                  "Juno" appears alive after a fatal injury in scene 12.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                  Prop "red rig" changes state without explanation.
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">AI actions</h2>
              <div className="space-y-2.5">
                <Link href={`/project/${id}/editor`} className="block">
                  <Button fullWidth>✦ Generate next scene</Button>
                </Link>
                <Button fullWidth variant="secondary">
                  Analyze emotional pacing
                </Button>
                <Button fullWidth variant="ghost" className="text-sm">
                  Character voice check
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Story score</h2>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-accent via-cyan to-cyan/50" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-600">
                <span>0</span>
                <span className="font-semibold text-white">68 / 100</span>
              </div>
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}
