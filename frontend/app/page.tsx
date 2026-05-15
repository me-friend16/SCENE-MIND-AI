'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import CinematicHero from '@/components/hero/CinematicHero';

const features = [
  'AI screenplay generation & scene rewriting',
  'Continuity engine with character memory',
  'Story analytics & emotional pacing graphs',
  'Production planning, cast & location tracking',
  'Team collaboration, comments, and version control',
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <section className="relative px-6 pb-24 pt-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="max-w-xl space-y-4">
                <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                  The first AI that truly understands your story.
                </p>
                <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  SceneMind AI is the screenplay operating system for filmmakers.
                </h1>
                <p className="max-w-xl text-lg text-slate-300 sm:text-xl">
                  Write, analyze, plan, and collaborate with cinematic intelligence — across story, characters, continuity, and production.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Start your first script</Button>
                <Button variant="ghost">Explore features</Button>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {features.map((feature) => (
                  <GlassCard key={feature} className="rounded-3xl p-6">
                    <p className="text-base text-slate-200">{feature}</p>
                  </GlassCard>
                ))}
              </motion.div>
            </div>
            <CinematicHero />
          </div>
        </div>
      </section>
      <section className="px-6 pb-24 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          <GlassCard className="p-8">
            <h2 className="mb-4 text-xl font-semibold">Screenplay Editor</h2>
            <p className="text-slate-300">Fast, formatted writing with live preview, scene cards, and AI-driven story prompts.</p>
          </GlassCard>
          <GlassCard className="p-8">
            <h2 className="mb-4 text-xl font-semibold">Continuity Center</h2>
            <p className="text-slate-300">Track emotional arcs, props, relationships, injuries, and timeline consistency.</p>
          </GlassCard>
          <GlassCard className="p-8">
            <h2 className="mb-4 text-xl font-semibold">Production Workspace</h2>
            <p className="text-slate-300">Plan cast, locations, shooting days, budgets, and crew in one cinematic dashboard.</p>
          </GlassCard>
        </div>
      </section>
    </main>
  );
}
