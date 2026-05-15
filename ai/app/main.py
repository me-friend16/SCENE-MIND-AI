from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI(
    title='SceneMind AI Service',
    description='AI endpoints for screenplay generation, continuity, and story analysis.',
    version='0.1.0',
)

# Allow the Next.js frontend to stream SSE directly from FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(router, prefix='/api')
