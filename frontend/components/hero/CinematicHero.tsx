'use client';

import { motion } from 'framer-motion';

export default function CinematicHero() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 p-8 shadow-cinematic"
    >
      <div className="absolute inset-0 bg-hero-gradient opacity-60" />
      <div className="relative grid gap-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Live AI workspace</p>
          <h2 className="mt-4 text-3xl font-semibold">Cinematic screenplay intelligence</h2>
          <p className="mt-3 text-slate-300">Draft scenes, track story continuity, and let AI polish your next act with cinematic precision.</p>
        </div>
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
          {['AI writer', 'Character memory', 'Continuity alerts', 'Production planner'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-3xl bg-white/5 px-4 py-3">
              <span className="inline-flex h-3.5 w-3.5 rounded-full bg-violet-400" />
              <span className="text-sm text-slate-200">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
