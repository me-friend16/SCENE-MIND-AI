import { useState, useCallback } from 'react';
import { checkContinuity } from '@/lib/api';
import { ScreenplayBlock } from '@/store/useEditorStore';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ContinuityAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  description: string;
  suggestion: string;
  sceneRef?: string;
  dismissed: boolean;
}

type RawIssue = {
  type?: string;
  severity?: string;
  description?: string;
  suggestion?: string;
  scene_ref?: string;
};

export function useContinuity(projectId: string) {
  const [alerts, setAlerts] = useState<ContinuityAlert[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runCheck = useCallback(
    async (blocks: ScreenplayBlock[], characters: string[]) => {
      setIsChecking(true);
      try {
        const text = blocks.map((b) => b.content).join('\n');
        const result = await checkContinuity({
          project_id: projectId,
          screenplay_text: text,
          characters,
        });

        const newAlerts: ContinuityAlert[] = (result.issues ?? []).map(
          (issue: RawIssue, i: number) => ({
            id: `alert-${Date.now()}-${i}`,
            type: issue.type ?? 'general',
            severity: (issue.severity ?? 'medium') as AlertSeverity,
            description: issue.description ?? 'Continuity issue detected.',
            suggestion: issue.suggestion ?? '',
            sceneRef: issue.scene_ref,
            dismissed: false,
          }),
        );

        setAlerts(newAlerts);
        setLastChecked(new Date());
      } catch {
        // Keep existing alerts on error
      } finally {
        setIsChecking(false);
      }
    },
    [projectId],
  );

  const resolveAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const criticalCount = activeAlerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high',
  ).length;

  return {
    alerts: activeAlerts,
    allAlerts: alerts,
    isChecking,
    lastChecked,
    criticalCount,
    runCheck,
    resolveAlert,
    dismissAlert,
  };
}
