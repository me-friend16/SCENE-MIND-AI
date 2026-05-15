import { useState, useCallback, useEffect } from 'react';
import { checkContinuity, storeContinuityAlerts, fetchContinuityAlerts, resolveContinuityAlert } from '@/lib/api';
import { ScreenplayBlock } from '@/store/useEditorStore';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ContinuityAlert {
  id: string;
  dbId?: number;
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

type DbAlert = {
  id: number;
  type: string;
  severity: AlertSeverity;
  description: string;
  suggestion: string | null;
  scene_ref: string | null;
};

export function useContinuity(projectId: string) {
  const [alerts, setAlerts] = useState<ContinuityAlert[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Load persisted alerts from DB on mount
  useEffect(() => {
    if (!projectId) return;
    fetchContinuityAlerts(projectId)
      .then((data) => {
        const dbAlerts: ContinuityAlert[] = (data.alerts ?? []).map((a: DbAlert) => ({
          id: `db-${a.id}`,
          dbId: a.id,
          type: a.type,
          severity: a.severity,
          description: a.description,
          suggestion: a.suggestion ?? '',
          sceneRef: a.scene_ref ?? undefined,
          dismissed: false,
        }));
        setAlerts(dbAlerts);
      })
      .catch(() => {
        // Non-fatal — continue without persisted alerts
      });
  }, [projectId]);

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

        const issues: RawIssue[] = result.issues ?? [];

        // Persist to DB
        let dbAlerts: ContinuityAlert[] = [];
        try {
          const stored = await storeContinuityAlerts(projectId, issues);
          dbAlerts = (stored.alerts ?? []).map((a: DbAlert) => ({
            id: `db-${a.id}`,
            dbId: a.id,
            type: a.type,
            severity: a.severity,
            description: a.description,
            suggestion: a.suggestion ?? '',
            sceneRef: a.scene_ref ?? undefined,
            dismissed: false,
          }));
        } catch {
          // Fall back to in-memory alerts if DB unavailable
          dbAlerts = issues.map((issue, i) => ({
            id: `alert-${Date.now()}-${i}`,
            type: issue.type ?? 'general',
            severity: (issue.severity ?? 'medium') as AlertSeverity,
            description: issue.description ?? 'Continuity issue detected.',
            suggestion: issue.suggestion ?? '',
            sceneRef: issue.scene_ref,
            dismissed: false,
          }));
        }

        setAlerts(dbAlerts);
        setLastChecked(new Date());
      } catch {
        // Keep existing alerts on error
      } finally {
        setIsChecking(false);
      }
    },
    [projectId],
  );

  const resolveAlert = useCallback(
    (id: string) => {
      const alert = alerts.find((a) => a.id === id);
      if (alert?.dbId) {
        resolveContinuityAlert(projectId, alert.dbId).catch(() => {});
      }
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [alerts, projectId],
  );

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
