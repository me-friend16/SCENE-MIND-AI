'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { fetchProjects, createProject } from '@/lib/api';

const GENRES = ['Thriller', 'Drama', 'Sci-Fi', 'Horror', 'Comedy', 'Action', 'Mystery', 'Romance'];

const statusColors: Record<string, string> = {
  draft: 'text-slate-500 bg-slate-500/10',
  'in-progress': 'text-amber bg-amber/10',
  review: 'text-cyan bg-cyan/10',
  complete: 'text-emerald-400 bg-emerald-400/10',
};

interface Project {
  id: number;
  title: string;
  genre: string;
  status: string;
  summary?: string;
  created_at: string;
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Thriller');
  const [summary, setSummary] = useState('');
  const qc = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createProject({ title, genre: genre.toLowerCase(), summary }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        className="relative w-full max-w-md"
      >
        <GlassCard className="p-8">
          <h2 className="font-display text-xl font-semibold tracking-wide text-white">
            New screenplay project
          </h2>
          <p className="mt-1 text-sm text-slate-500">Start your next cinematic story</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Untitled screenplay"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Genre</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      genre === g
                        ? 'bg-accent text-white'
                        : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.09]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Logline{' '}
                <span className="text-slate-700">(optional)</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="One sentence that captures the story…"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                Failed to create project. Please try again.
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              fullWidth
              disabled={!title.trim() || isPending}
              onClick={() => mutate()}
            >
              {isPending ? 'Creating…' : 'Create project'}
            </Button>
            <Button variant="ghost" onClick={onClose} className="flex-shrink-0 px-4">
              Cancel
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetchProjects();
      return Array.isArray(res) ? res : res.data ?? [];
    },
  });

  const projects = data ?? [];

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-void px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-accent/60">Dashboard</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Your cinematic universe.</h1>
            </div>
            <Button onClick={() => setShowCreate(true)}>+ New project</Button>
          </div>

          {/* Project grid */}
          {isLoading && (
            <div className="grid gap-6 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.03]"
                />
              ))}
            </div>
          )}

          {error && (
            <GlassCard className="p-8 text-center">
              <p className="text-slate-400">Failed to load projects.</p>
              <p className="mt-1 text-sm text-slate-600">Make sure the backend is running.</p>
            </GlassCard>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <GlassCard className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <span className="text-2xl text-accent">✦</span>
              </div>
              <h2 className="text-xl font-semibold text-white">No screenplays yet</h2>
              <p className="mt-2 text-sm text-slate-500">
                Create your first project and start writing with AI.
              </p>
              <Button className="mt-6" onClick={() => setShowCreate(true)}>
                + New project
              </Button>
            </GlassCard>
          )}

          {!isLoading && projects.length > 0 && (
            <div className="grid gap-6 xl:grid-cols-3">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={`/project/${project.id}`} className="block">
                    <div className="group rounded-3xl border border-white/[0.07] bg-card/60 p-6 shadow-cinematic transition-all hover:border-white/[0.14] hover:shadow-glow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusColors[project.status] ?? statusColors.draft}`}
                          >
                            {project.status}
                          </span>
                          <h2 className="mt-2 truncate text-xl font-semibold text-white">
                            {project.title}
                          </h2>
                          <p className="mt-0.5 text-xs capitalize text-slate-500">{project.genre}</p>
                        </div>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-600 transition-colors group-hover:border-accent/30 group-hover:bg-accent/10 group-hover:text-accent">
                          →
                        </div>
                      </div>

                      {project.summary && (
                        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
                          {project.summary}
                        </p>
                      )}

                      <div className="mt-5 h-px bg-gradient-to-r from-accent/20 via-cyan/10 to-transparent" />

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[11px] text-slate-600">
                          {new Date(project.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <Link
                          href={`/project/${project.id}/editor`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Open editor →
                        </Link>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom cards */}
          <section className="mt-12 grid gap-6 lg:grid-cols-2">
            <GlassCard className="p-8">
              <p className="text-xs uppercase tracking-widest text-accent/60">AI Assistant</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Ready to write</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Open any project and use the AI co-writer to generate scenes, rewrite dialogue, or
                run a continuity check across your entire screenplay.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-slow" />
                <span className="text-xs text-slate-600">claude-sonnet-4 · ready</span>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <p className="text-xs uppercase tracking-widest text-slate-600">Quick tip</p>
              <h2 className="mt-2 text-xl font-semibold text-white">⌘K Command Palette</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Press{' '}
                <kbd className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-xs text-slate-300">
                  Ctrl+K
                </kbd>{' '}
                anywhere to open the command palette — navigate projects, switch block types, or
                trigger AI actions without leaving the keyboard.
              </p>
            </GlassCard>
          </section>
        </div>
      </div>
    </>
  );
}
