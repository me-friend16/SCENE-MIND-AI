'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Hide navbar inside the full-screen editor
  if (pathname?.includes('/editor')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-accent to-cyan flex-shrink-0 shadow-glow-sm group-hover:shadow-glow transition-shadow" />
          <span className="font-display text-base font-semibold tracking-wide text-white">
            SceneMind
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 md:flex">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '#features', label: 'Features' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'text-sm transition-colors hover:text-white',
                pathname === href ? 'text-white' : 'text-slate-400',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:block">{user.name}</span>
              <Button variant="ghost" onClick={logout} className="text-sm py-2">
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-sm py-2">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" className="text-sm py-2">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
