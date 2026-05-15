from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title='SceneMind AI Service',
    description='AI endpoints for screenplay generation, continuity, and story analysis.',
    version='0.1.0',
)

app.include_router(router, prefix='/api')
