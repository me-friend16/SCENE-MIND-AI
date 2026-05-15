import { useState, useCallback, useRef } from 'react';
import { generateScene, generateDialogue, rewriteScene } from '@/lib/api';

export type AIMode = 'generate' | 'rewrite' | 'dialogue' | 'continue';
export type Genre =
  | 'thriller'
  | 'horror'
  | 'sci-fi'
  | 'drama'
  | 'comedy'
  | 'action'
  | 'mystery'
  | 'romance';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface AIState {
  isLoading: boolean;
  isStreaming: boolean;
  genre: Genre;
  mode: AIMode;
  messages: AIMessage[];
  lastResult: string | null;
  error: string | null;
}

type ApiError = { response?: { data?: { message?: string } }; message?: string; name?: string };

const AI_BASE = process.env.NEXT_PUBLIC_AI_URL ?? 'http://localhost:8001';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('scenemind-auth');
    if (!raw) return null;
    const { state } = JSON.parse(raw) as { state: { token: string | null } };
    return state?.token ?? null;
  } catch {
    return null;
  }
}

export function useAI(projectId: string) {
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<AIState>({
    isLoading: false,
    isStreaming: false,
    genre: 'thriller',
    mode: 'generate',
    messages: [],
    lastResult: null,
    error: null,
  });

  const setGenre = useCallback((genre: Genre) => setState((s) => ({ ...s, genre })), []);
  const setMode = useCallback((mode: AIMode) => setState((s) => ({ ...s, mode })), []);

  const generateStreaming = useCallback(
    async (prompt: string, context?: string): Promise<string | null> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState((s) => ({
        ...s,
        isLoading: true,
        isStreaming: true,
        error: null,
        messages: [
          ...s.messages,
          { role: 'user', content: prompt },
          { role: 'assistant', content: '', streaming: true },
        ],
      }));

      let accumulated = '';

      try {
        const token = getAuthToken();
        const res = await fetch(`${AI_BASE}/api/stream-scene`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            project_id: projectId,
            prompt,
            genre: state.genre,
            scene_text: context,
            mode: state.mode,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error('Stream failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulated += parsed.text;
                setState((s) => ({
                  ...s,
                  messages: s.messages.map((m, i) =>
                    i === s.messages.length - 1
                      ? { ...m, content: accumulated }
                      : m,
                  ),
                }));
              }
            } catch {
              // Ignore parse errors on individual chunks
            }
          }
        }

        setState((s) => ({
          ...s,
          isLoading: false,
          isStreaming: false,
          lastResult: accumulated,
          messages: s.messages.map((m, i) =>
            i === s.messages.length - 1
              ? { ...m, content: accumulated, streaming: false }
              : m,
          ),
        }));

        return accumulated;
      } catch (err: unknown) {
        const e = err as ApiError;
        if (e?.name === 'AbortError') {
          setState((s) => ({
            ...s,
            isLoading: false,
            isStreaming: false,
            messages: s.messages.map((m, i) =>
              i === s.messages.length - 1 ? { ...m, streaming: false } : m,
            ),
          }));
          return null;
        }
        setState((s) => ({
          ...s,
          isLoading: false,
          isStreaming: false,
          error: e?.message ?? 'Streaming failed.',
          messages: s.messages.filter((_, i) => i !== s.messages.length - 1),
        }));
        return null;
      }
    },
    [projectId, state.genre, state.mode],
  );

  const generate = useCallback(
    async (prompt: string, context?: string): Promise<string | null> => {
      // Use streaming for generate/continue modes
      if (state.mode === 'generate' || state.mode === 'continue') {
        return generateStreaming(prompt, context);
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState((s) => ({
        ...s,
        isLoading: true,
        isStreaming: false,
        error: null,
        messages: [...s.messages, { role: 'user', content: prompt }],
      }));

      try {
        let result: string;

        if (state.mode === 'dialogue') {
          const res = await generateDialogue({
            project_id: projectId,
            prompt,
            scene_text: context,
            genre: state.genre,
          });
          result = Array.isArray(res.dialogue)
            ? res.dialogue
                .map((d: { character: string; line: string }) => `${d.character}\n${d.line}`)
                .join('\n\n')
            : JSON.stringify(res, null, 2);
        } else {
          const res = await rewriteScene({
            project_id: projectId,
            prompt,
            scene_text: context ?? '',
            genre: state.genre,
          });
          result = res.scene?.content ?? JSON.stringify(res, null, 2);
        }

        setState((s) => ({
          ...s,
          isLoading: false,
          lastResult: result,
          messages: [...s.messages, { role: 'assistant', content: result }],
        }));

        return result;
      } catch (err: unknown) {
        const e = err as ApiError;
        if (e?.name === 'AbortError') return null;
        const msg = e?.response?.data?.message ?? e?.message ?? 'AI generation failed.';
        setState((s) => ({ ...s, isLoading: false, error: msg }));
        return null;
      }
    },
    [projectId, state.genre, state.mode, generateStreaming],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isLoading: false, isStreaming: false }));
  }, []);

  const clearHistory = useCallback(
    () => setState((s) => ({ ...s, messages: [], lastResult: null, error: null })),
    [],
  );

  return { ...state, setGenre, setMode, generate, abort, clearHistory };
}
