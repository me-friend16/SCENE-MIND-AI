'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import { registerUser } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

type ApiError = { response?: { data?: { message?: string } } };

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await registerUser(name, email, password, confirm);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as ApiError)?.response?.data?.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan shadow-glow-sm">
          <span className="text-sm font-bold text-white">SM</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-wide text-white">
          Start writing
        </h1>
        <p className="mt-2 text-sm text-slate-500">Create your free SceneMind account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40 focus:bg-white/[0.06]"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40 focus:bg-white/[0.06]"
            placeholder="writer@studio.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40 focus:bg-white/[0.06]"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors focus:border-accent/40 focus:bg-white/[0.06]"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
        )}

        <Button fullWidth disabled={loading} className="mt-2">
          {loading ? 'Creating account…' : 'Get started free'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-accent transition-colors hover:text-accent/80">
          Sign in
        </Link>
      </p>
    </GlassCard>
  );
}
