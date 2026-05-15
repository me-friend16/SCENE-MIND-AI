'use client';

import clsx from 'clsx';
import { ContinuityAlert, AlertSeverity } from '@/hooks/useContinuity';

interface Props {
  alerts: ContinuityAlert[];
  isChecking: boolean;
  lastChecked: Date | null;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
  onRunCheck: () => void;
}

const severityConfig: Record<
  AlertSeverity,
  { badge: string; border: string; dot: string }
> = {
  critical: {
    badge: 'bg-rose-500/20 text-rose-300',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  high: {
    badge: 'bg-orange-500/20 text-orange-300',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
  },
  medium: {
    badge: 'bg-amber/20 text-amber',
    border: 'border-amber/20',
    dot: 'bg-amber',
  },
  low: {
    badge: 'bg-slate-500/20 text-slate-400',
    border: 'border-slate-500/20',
    dot: 'bg-slate-500',
  },
};

export default function ContinuityPanel({
  alerts,
  isChecking,
  lastChecked,
  onResolve,
  onDismiss,
  onRunCheck,
}: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">
              Continuity
            </p>
            {lastChecked && (
              <p className="mt-0.5 text-[10px] text-slate-700">
                {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={onRunCheck}
            disabled={isChecking}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:bg-white/[0.08] disabled:opacity-40"
          >
            {isChecking ? 'Scanning…' : 'Re-check'}
          </button>
        </div>
      </div>

      {/* Alert list */}
      <div className="screenplay-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {isChecking && (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500/30 border-t-rose-400" />
            <span className="text-[11px] text-slate-500">Scanning screenplay…</span>
          </div>
        )}

        {!isChecking && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 text-2xl text-slate-700">✓</div>
            <p className="text-[11px] text-slate-600">
              {lastChecked
                ? 'No continuity issues found.'
                : 'Run a check to scan for contradictions.'}
            </p>
          </div>
        )}

        {alerts.map((alert) => {
          const cfg = severityConfig[alert.severity];
          return (
            <div
              key={alert.id}
              className={clsx('rounded-2xl border p-3 transition-opacity', cfg.border, 'bg-white/[0.02]')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest',
                      cfg.badge,
                    )}
                  >
                    {alert.severity}
                  </span>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-[10px] text-slate-700 transition-colors hover:text-slate-500"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                {alert.description}
              </p>

              {alert.suggestion && (
                <p className="mt-1.5 text-[10px] italic text-slate-600">{alert.suggestion}</p>
              )}

              <button
                onClick={() => onResolve(alert.id)}
                className="mt-2.5 text-[10px] font-semibold text-accent transition-colors hover:text-accent/70"
              >
                Mark resolved →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
