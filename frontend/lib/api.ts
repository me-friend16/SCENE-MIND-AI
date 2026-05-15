import axios from 'axios';
import { ScreenplayBlock } from '@/store/useEditorStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Inject Bearer token from auth store (lazy import avoids circular deps)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('scenemind-auth');
      if (raw) {
        const { state } = JSON.parse(raw) as { state: { token: string | null } };
        if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// Redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('scenemind-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (email: string, password: string) =>
  api.post('/api/login', { email, password }).then((r) => r.data);

export const registerUser = (
  name: string,
  email: string,
  password: string,
  password_confirmation: string,
) => api.post('/api/register', { name, email, password, password_confirmation }).then((r) => r.data);

// ── Projects ─────────────────────────────────────────────────────────────────
export const fetchProjects = () => api.get('/api/projects').then((r) => r.data);

export const fetchProjectDetails = (id: string) =>
  api.get(`/api/projects/${id}`).then((r) => r.data);

export const createProject = (data: { title: string; genre: string; summary?: string }) =>
  api.post('/api/projects', data).then((r) => r.data);

export const updateProject = (
  id: string,
  data: Partial<{ title: string; genre: string; status: string; summary: string }>,
) => api.patch(`/api/projects/${id}`, data).then((r) => r.data);

// ── Screenplays ───────────────────────────────────────────────────────────────
export const fetchScreenplay = (projectId: string) =>
  api.get(`/api/projects/${projectId}/screenplay`).then((r) => r.data);

export const saveScreenplay = (screenplayId: string, blocks: ScreenplayBlock[]) =>
  api.patch(`/api/screenplays/${screenplayId}`, { blocks }).then((r) => r.data);

// ── Characters ────────────────────────────────────────────────────────────────
export const fetchCharacters = (projectId: string) =>
  api.get(`/api/projects/${projectId}/characters`).then((r) => r.data);

export const createCharacter = (
  projectId: string,
  data: { name: string; description?: string },
) => api.post(`/api/projects/${projectId}/characters`, data).then((r) => r.data);

export const updateCharacter = (
  projectId: string,
  characterId: number,
  data: Partial<{ name: string; description: string; ai_memory: object }>,
) => api.patch(`/api/projects/${projectId}/characters/${characterId}`, data).then((r) => r.data);

// ── AI (proxied through Laravel → FastAPI) ────────────────────────────────────
export const generateScene = (payload: {
  project_id: string;
  prompt: string;
  genre?: string;
  scene_text?: string;
  mode?: string;
}) => api.post('/api/ai/generate-scene', payload).then((r) => r.data);

export const generateDialogue = (payload: {
  project_id: string;
  prompt: string;
  scene_text?: string;
  genre?: string;
}) => api.post('/api/ai/generate-dialogue', payload).then((r) => r.data);

export const rewriteScene = (payload: {
  project_id: string;
  prompt: string;
  scene_text: string;
  genre?: string;
}) => api.post('/api/ai/rewrite-scene', payload).then((r) => r.data);

export const checkContinuity = (payload: {
  project_id: string;
  screenplay_text: string;
  characters: string[];
}) => api.post('/api/ai/check-continuity', payload).then((r) => r.data);

export const analyzeStory = (payload: { project_id: string; screenplay_text: string }) =>
  api.post('/api/ai/analyze-story', payload).then((r) => r.data);

// Legacy helper kept for the existing project page
export const runContinuityCheck = (projectId: string) =>
  api.post(`/api/projects/${projectId}/continuity-check`).then((r) => r.data);

export default api;
