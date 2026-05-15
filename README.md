# SceneMind AI

SceneMind AI is a cinematic, AI-powered screenplay and filmmaking platform built as a modern operating system for writers, directors, producers, and creatives.

## Architecture

- `frontend/` — Next.js 15 app router with TypeScript, Tailwind CSS, Framer Motion, and filmic UI components.
- `backend/` — Laravel 12 API for authentication, project management, collaboration, and role-based access.
- `ai/` — FastAPI service for scene generation, continuity checks, story analysis, and memory retrieval.
- `docker-compose.yml` — Docker orchestration for frontend, backend, AI service, PostgreSQL, and Redis.

## Key Features

- Cinematic landing page and premium UI
- Project dashboard, screenplay editor, character studio, continuity center, and story analytics
- AI-assisted generation, plot validation, emotional tracking, and production planning
- Role-based access, OAuth, team collaboration, comments, and version history

## Getting Started

1. Install dependencies in `frontend/`, `backend/`, and `ai/`.
2. Start services with `docker compose up --build`.
3. Open the frontend app and connect the backend and AI endpoints.
