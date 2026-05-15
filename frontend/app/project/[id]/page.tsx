'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { fetchProjectDetails, fetchCharacters, fetchScreenplay } from '@/lib/api';

interface Block {
  id: string;
  type: string;
  content: string;
  position: number;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProjectDetails(id),
    staleTime: 30_000,
  });

  const { data: charactersData } = useQuery({
    queryKey: ['characters', id],
    queryFn: () => fetchCharacters(id),
    staleTime: 30_000,
  });

  const { data: screenplayData } = useQuery({
    queryKey: ['screenplay', id],
    queryFn: () => fetchScreenplay(id),
    staleTime: 60_000,
  });

  const project = projectData?.project;
  const characters = charactersData?.characters ?? [];
  const blocks: Block[] = screenplayData?.screenplay?.blocks ?? [];

  // Build a preview from the first few meaningful blocks
  const previewBlocks = blocks.slice(0, 6);

  // Word count from blocks
  const wordCount = blocks
    .map((b) => b.content)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const pageCount = Math.max(
    1,
    Math.ceil(blocks.reduce((acc, b) => acc + Math.max(1, Math.ceil(b.content.length / 60)) + 1, 0) / 55),
  );

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-void px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-4 w-48 animate-pulse rounded bg-white/[0.04]" />
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="h-64 animate-pulse rounded-3xl bg-white/[0.03]" />
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-3xl bg-white/[0.03]" />
              <div className="h-32 animate-pulse rounded-3xl bg-white/[0.03]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const genreColor: Record<string, string> = {
    thriller: 'text-rose-400',
    horror: 'text-red-500',
    'sci-fi': 'text-cyan',
    drama: 'text-amber',
    comedy: 'text-emerald-400',
    action: 'text-orange-400',
    mystery: 'text-purple-400',
    romance: 'text-pink-400',
  };

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
            <h1 className="mt-2 text-4xl font-semibold text-white">
              {project?.title ?? 'Untitled Project'}
            </h1>
            {project?.genre && (
              <span
                className={`mt-2 block text-sm font-medium capitalize ${genreColor[project.genre] ?? 'text-slate-400'}`}
              >
                {project.genre}
              </span>
            )}
            {project?.summary && (
              <p className="mt-2 max-w-2xl text-sm text-slate-500">{project.summary}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/project/${id}/editor`}>
              <Button>Open screenplay editor</Button>
            </Link>
            <Link href={`/project/${id}/characters`}>
              <Button variant="secondary">Characters ({characters.length})</Button>
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-3">
          {[
            { label: 'Words', value: wordCount.toLocaleString() },
            { label: 'Pages', value: pageCount },
            { label: 'Characters', value: characters.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-center"
            >
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="mt-0.5 text-xs uppercase tracking-widest text-slate-600">{label}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          {/* Left column */}
          <section className="space-y-6">
            {/* Screenplay preview */}
            <GlassCard className="overflow-hidden p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Screenplay preview</h2>
                <Link href={`/project/${id}/editor`}>
                  <Button variant="secondary" className="py-2 text-xs">
                    Open editor →
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-6 font-mono">
                {previewBlocks.length > 0 ? (
                  <div className="space-y-2">
                    {previewBlocks.map((block) => (
                      <p
                        key={block.id}
                        className={`text-sm leading-relaxed ${
                          block.type === 'scene-heading'
                            ? 'font-bold uppercase tracking-wider text-cyan'
                            : block.type === 'character'
                              ? 'pl-[40%] font-bold uppercase tracking-wider text-amber'
                              : block.type === 'dialogue'
                                ? 'px-[15%] text-white'
                                : block.type === 'parenthetical'
                                  ? 'px-[25%] text-slate-400'
                                  : block.type === 'transition'
                                    ? 'text-right font-semibold uppercase text-slate-400'
                                    : 'text-slate-300'
                        }`}
                      >
                        {block.content || <span className="text-slate-700">—</span>}
                      </p>
                    ))}
                    {blocks.length > 6 && (
                      <p className="pt-2 text-xs text-slate-700">
                        +{blocks.length - 6} more blocks…
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-slate-600">No content yet.</p>
                    <Link href={`/project/${id}/editor`} className="mt-3 block">
                      <span className="text-sm text-accent hover:underline">
                        Open editor to start writing →
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Characters preview */}
            <GlassCard className="p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Characters</h2>
                <Link href={`/project/${id}/characters`}>
                  <Button variant="secondary" className="py-2 text-xs">
                    Manage →
                  </Button>
                </Link>
              </div>
              {characters.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {characters.map((c: { id: number; name: string }) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent/30 to-cyan/20 text-xs font-bold text-accent">
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">{c.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  No characters added yet.{' '}
                  <Link href={`/project/${id}/characters`} className="text-accent hover:underline">
                    Add characters →
                  </Link>
                </p>
              )}
            </GlassCard>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">AI actions</h2>
              <div className="space-y-2.5">
                <Link href={`/project/${id}/editor`} className="block">
                  <Button fullWidth>✦ Generate next scene</Button>
                </Link>
                <Link href={`/project/${id}/editor`} className="block">
                  <Button fullWidth variant="secondary">
                    Analyze emotional pacing
                  </Button>
                </Link>
                <Link href={`/project/${id}/characters`} className="block">
                  <Button fullWidth variant="ghost" className="text-sm">
                    Character voice check
                  </Button>
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Story stats</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Status</span>
                  <span className="capitalize text-white">{project?.status ?? 'Draft'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Genre</span>
                  <span className="capitalize text-white">{project?.genre ?? '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Version</span>
                  <span className="text-white">
                    v{screenplayData?.screenplay?.version ?? 1}
                  </span>
                </div>
              </div>
            </GlassCard>
          </section>
        </div>
      </div>
    </div>
  );
}
