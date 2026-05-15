from fastapi import APIRouter
from app.models.schemas import (
    ContinuityRequest,
    GenerationRequest,
    RewriteRequest,
    StoryAnalysisRequest,
)
from app.services.analysis import analyze_story
from app.services.continuity import continuity_check
from app.services.generation import generate_dialogue, generate_scene, rewrite_scene

router = APIRouter()


@router.post('/generate-scene')
def generate_scene_endpoint(request: GenerationRequest):
    return generate_scene(request.model_dump())


@router.post('/generate-dialogue')
def generate_dialogue_endpoint(request: GenerationRequest):
    return generate_dialogue(request.model_dump())


@router.post('/rewrite-scene')
def rewrite_scene_endpoint(request: RewriteRequest):
    return rewrite_scene(request.model_dump())


@router.post('/continuity-check')
def continuity_check_endpoint(request: ContinuityRequest):
    return continuity_check(request.model_dump())


@router.post('/story-analysis')
def story_analysis_endpoint(request: StoryAnalysisRequest):
    return analyze_story(request.model_dump())
