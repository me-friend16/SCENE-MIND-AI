'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useAI, Genre, AIMode } from '@/hooks/useAI';

interface Props {
  projectId: string;
  currentSceneText: string;
  onInsert: (text: string) => void;
}

const genres: { value: Genre; label: string }[] = [
  { value: 'thriller', label: 'Thriller' },
  { value: 'horror', label: 'Horror' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'drama', label: 'Drama' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'action', label: 'Action' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
];

const modes: { value: AIMode; label: string; desc: string }[] = [
  { value: 'generate', label: 'Generate', desc: 'New scene' },
  { value: 'continue', label: 'Continue', desc: 'Extend current' },
  { value: 'rewrite', label: 'Rewrite', desc: 'Revise scene' },
  { value: 'dialogue', label: 'Dialogue', desc: 'Character lines' },
];

export default function AIPanel({ projectId, currentSceneText, onInsert }: Props) {
  const [prompt, setPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isLoading,
    genre,
    mode,
    messages,
    error,
    setGenre,
    setMode,
    generate,
    abort,
    clearHistory,
  } = useAI(projectId);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) return;
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await generate(text, currentSceneText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
            ✦ AI Co-Writer
          </p>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[10px] text-slate-600 transition-colors hover:text-slate-400"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Genre selector */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Genre
        </p>
        <div className="flex flex-wrap gap-1.5">
          {genres.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={clsx(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                genre === g.value
                  ? 'bg-accent text-white'
                  : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.09] hover:text-slate-300',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex-shrink-0 border-b border-white/[0.06] px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Mode
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={clsx(
                'rounded-xl border p-2 text-left transition-all',
                mode === m.value
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]',
              )}
            >
              <p
                className={clsx(
                  'text-[11px] font-semibold',
                  mode === m.value ? 'text-accent' : 'text-slate-300',
                )}
              >
                {m.label}
              </p>
              <p className="text-[10px] text-slate-600">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat scroll area */}
      <div ref={scrollRef} className="screenplay-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10">
              <span className="text-lg text-accent">✦</span>
            </div>
            <p className="max-w-[180px] text-[11px] leading-relaxed text-slate-600">
              Describe what to write. The AI uses your current screenplay as context.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              'rounded-2xl px-3 py-2.5',
              msg.role === 'user'
                ? 'ml-4 bg-white/[0.05]'
                : 'border border-accent/20 bg-accent/[0.07]',
            )}
          >
            <p
              className={clsx(
                'mb-1 text-[9px] font-bold uppercase tracking-widest',
                msg.role === 'user' ? 'text-slate-600' : 'text-accent',
              )}
            >
              {msg.role === 'user' ? 'You' : 'SceneMind AI'}
            </p>
            <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">
              {msg.content}
              {msg.streaming && (
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-accent align-middle" />
              )}
            </p>
            {msg.role === 'assistant' && !msg.streaming && msg.content && (
              <button
                onClick={() => onInsert(msg.content)}
                className="mt-2 rounded-lg bg-accent/15 px-2.5 py-1 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/25"
              >
                Insert ↑
              </button>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 px-1 py-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/60"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
            <span className="text-[11px] text-slate-600">Generating…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2">
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Prompt input */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-3">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to write… (Enter to send)"
            className="screenplay-scroll flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-700 outline-none transition-colors focus:border-accent/30"
            rows={2}
            style={{ maxHeight: '120px', overflow: 'auto' }}
          />
          <button
            onClick={isLoading ? abort : handleGenerate}
            disabled={!prompt.trim() && !isLoading}
            className={clsx(
              'self-end rounded-xl px-3 py-2 text-[13px] font-bold transition-all',
              isLoading
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                : 'bg-accent text-white hover:brightness-110 active:scale-95 disabled:opacity-30',
            )}
          >
            {isLoading ? '■' : '▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
