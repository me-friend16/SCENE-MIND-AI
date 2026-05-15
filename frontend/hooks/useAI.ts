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
}

interface AIState {
  isLoading: boolean;
  genre: Genre;
  mode: AIMode;
  messages: AIMessage[];
  lastResult: string | null;
  error: string | null;
}

type ApiError = { response?: { data?: { message?: string } }; message?: string; name?: string };

export function useAI(projectId: string) {
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<AIState>({
    isLoading: false,
    genre: 'thriller',
    mode: 'generate',
    messages: [],
    lastResult: null,
    error: null,
  });

  const setGenre = useCallback((genre: Genre) => setState((s) => ({ ...s, genre })), []);
  const setMode = useCallback((mode: AIMode) => setState((s) => ({ ...s, mode })), []);

  const generate = useCallback(
    async (prompt: string, context?: string): Promise<string | null> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        messages: [...s.messages, { role: 'user', content: prompt }],
      }));

      try {
        let result: string;

        if (state.mode === 'generate' || state.mode === 'continue') {
          const res = await generateScene({
            project_id: projectId,
            prompt,
            genre: state.genre,
            scene_text: context,
            mode: state.mode,
          });
          result = res.scene?.content ?? JSON.stringify(res, null, 2);
        } else if (state.mode === 'dialogue') {
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
    [projectId, state.genre, state.mode],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const clearHistory = useCallback(
    () => setState((s) => ({ ...s, messages: [], lastResult: null, error: null })),
    [],
  );

  return { ...state, setGenre, setMode, generate, abort, clearHistory };
}
