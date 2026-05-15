'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  fetchCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  generateCharacterProfile,
  fetchScreenplay,
} from '@/lib/api';

interface Character {
  id: number;
  name: string;
  description: string | null;
  ai_memory: Record<string, unknown> | null;
}

interface CharacterProfile {
  backstory?: string;
  motivation?: string;
  personality?: string;
  arc?: string;
  voice?: string;
}

function ProfileSection({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-sm leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}

function CharacterCard({
  character,
  onEdit,
  onDelete,
  onGenerateProfile,
  isGenerating,
}: {
  character: Character;
  onEdit: (c: Character) => void;
  onDelete: (id: number) => void;
  onGenerateProfile: (c: Character) => void;
  isGenerating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const profile = character.ai_memory as CharacterProfile | null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:border-white/[0.1]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/30 to-cyan/20 text-sm font-bold text-accent">
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{character.name}</h3>
            {character.description && (
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{character.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => onEdit(character)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-white/10 hover:text-white"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(character.id)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-rose-500/70 transition-colors hover:border-rose-500/30 hover:text-rose-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* AI Profile */}
      {profile && (
        <div className="mt-4 space-y-3 border-t border-white/[0.04] pt-4">
          <ProfileSection label="Backstory" value={profile.backstory} />
          <ProfileSection label="Motivation" value={profile.motivation} />
          <ProfileSection label="Personality" value={profile.personality} />
          <ProfileSection label="Arc" value={profile.arc} />
          <ProfileSection label="Voice" value={profile.voice} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onGenerateProfile(character)}
          disabled={isGenerating}
          className={clsx(
            'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
            isGenerating
              ? 'cursor-not-allowed border-white/[0.04] text-slate-600'
              : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20',
          )}
        >
          {isGenerating ? (
            <span className="animate-pulse">✦ Generating…</span>
          ) : (
            <>✦ {profile ? 'Refresh AI profile' : 'Generate AI profile'}</>
          )}
        </button>
        {profile && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-slate-600 transition-colors hover:text-slate-400"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
    </div>
  );
}

function CharacterModal({
  initial,
  onSave,
  onClose,
  isSaving,
}: {
  initial?: Character | null;
  onSave: (data: { name: string; description: string }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-abyss p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">
          {initial ? 'Edit character' : 'New character'}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CHARACTER NAME"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-mono uppercase tracking-wider text-white placeholder-slate-700 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Brief character description — the AI will use this to generate a full profile."
              className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 placeholder-slate-700 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim() || isSaving}
            onClick={() => onSave({ name: name.trim().toUpperCase(), description })}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : initial ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CharactersPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Character | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => fetchCharacters(projectId),
    staleTime: 30_000,
  });

  const characters: Character[] = data?.characters ?? [];

  const createMutation = useMutation({
    mutationFn: (d: { name: string; description: string }) =>
      createCharacter(projectId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }: { id: number; name: string; description: string }) =>
      updateCharacter(projectId, id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['characters', projectId] });
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCharacter(projectId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['characters', projectId] }),
  });

  const handleGenerateProfile = useCallback(
    async (character: Character) => {
      setGeneratingId(character.id);
      try {
        // Fetch screenplay text to give the AI context
        let screenplayText = '';
        try {
          const sp = await fetchScreenplay(projectId);
          if (Array.isArray(sp.screenplay?.blocks)) {
            screenplayText = sp.screenplay.blocks
              .map((b: { content: string }) => b.content)
              .join('\n')
              .slice(0, 8000);
          }
        } catch {
          // Continue without screenplay context
        }

        const result = await generateCharacterProfile({
          project_id: projectId,
          name: character.name,
          description: character.description ?? undefined,
          screenplay_text: screenplayText || undefined,
        });

        await updateCharacter(projectId, character.id, {
          ai_memory: result.profile ?? result,
        });
        qc.invalidateQueries({ queryKey: ['characters', projectId] });
      } catch (err) {
        console.error('[Characters] Profile generation failed:', err);
      } finally {
        setGeneratingId(null);
      }
    },
    [projectId, qc],
  );

  const handleSave = (d: { name: string; description: string }) => {
    if (modal === 'create') {
      createMutation.mutate(d);
    } else if (modal && typeof modal === 'object') {
      updateMutation.mutate({ id: modal.id, ...d });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this character? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-void px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/project/${projectId}`}
              className="text-xs text-slate-600 transition-colors hover:text-slate-400"
            >
              ← Project
            </Link>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-accent/70">
              Character system
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Characters</h1>
            <p className="mt-2 text-sm text-slate-500">
              {characters.length} character{characters.length !== 1 ? 's' : ''} · AI profiles keep
              continuity consistent
            </p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 self-start rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all hover:shadow-glow sm:self-auto"
          >
            + Add character
          </button>
        </div>

        {/* Character grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.06] py-20 text-center">
            <div className="mb-4 text-4xl opacity-30">◎</div>
            <p className="text-slate-400">No characters yet.</p>
            <p className="mt-1 text-sm text-slate-600">
              Add characters and let AI generate rich profiles from your screenplay.
            </p>
            <button
              onClick={() => setModal('create')}
              className="mt-6 rounded-xl border border-accent/30 px-5 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
            >
              + Add first character
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {characters.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                onEdit={(ch) => setModal(ch)}
                onDelete={handleDelete}
                onGenerateProfile={handleGenerateProfile}
                isGenerating={generatingId === c.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <CharacterModal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
