'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVersions, restoreVersion } from '@/lib/api';
import { useEditorStore } from '@/store/useEditorStore';

interface Version {
  id: number;
  version: number;
  label: string | null;
  created_at: string;
}

interface Props {
  screenplayId: string;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function VersionHistoryPanel({ screenplayId, onClose }: Props) {
  const qc = useQueryClient();
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const setScreenplayId = useEditorStore((s) => s.setScreenplayId);

  const { data, isLoading } = useQuery({
    queryKey: ['versions', screenplayId],
    queryFn: () => fetchVersions(screenplayId),
    staleTime: 10_000,
  });

  const versions: Version[] = data?.versions ?? [];

  const restoreMutation = useMutation({
    mutationFn: (version: number) => restoreVersion(screenplayId, version),
    onSuccess: (data) => {
      const screenplay = data.screenplay;
      setScreenplayId(String(screenplay.id));
      if (Array.isArray(screenplay.blocks)) {
        loadBlocks(screenplay.blocks);
      }
      qc.invalidateQueries({ queryKey: ['versions', screenplayId] });
      onClose();
    },
    onSettled: () => setRestoringVersion(null),
  });

  const handleRestore = (version: number) => {
    if (!confirm(`Restore to version ${version}? Your current state will be auto-saved first.`)) return;
    setRestoringVersion(version);
    restoreMutation.mutate(version);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-abyss shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Version History</h2>
            <p className="mt-0.5 text-[11px] text-slate-600">{versions.length} saved versions</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No saved versions yet.</p>
              <p className="mt-1 text-[11px] text-slate-700">
                Versions are auto-saved on every save.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      Version {v.version}
                      {v.label && (
                        <span className="ml-2 text-[10px] font-normal text-slate-500">
                          {v.label}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{timeAgo(v.created_at)}</p>
                  </div>
                  <button
                    onClick={() => handleRestore(v.version)}
                    disabled={restoringVersion !== null}
                    className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent transition-all hover:bg-accent/20 disabled:opacity-40"
                  >
                    {restoringVersion === v.version ? 'Restoring…' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
