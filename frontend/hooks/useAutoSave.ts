import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { saveScreenplay } from '@/lib/api';

export function useAutoSave(delay = 2000) {
  const blocks = useEditorStore((s) => s.blocks);
  const isDirty = useEditorStore((s) => s.isDirty);
  const screenplayId = useEditorStore((s) => s.screenplayId);
  const markClean = useEditorStore((s) => s.markClean);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!screenplayId || isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await saveScreenplay(screenplayId, blocks);
      markClean();
    } catch {
      // Silently retry next cycle
    } finally {
      isSavingRef.current = false;
    }
  }, [screenplayId, blocks, markClean]);

  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, blocks, save, delay]);

  return { save };
}
