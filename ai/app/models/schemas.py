from pydantic import BaseModel
from typing import List, Optional


class GenerationRequest(BaseModel):
    project_id: str
    prompt: str
    scene_text: Optional[str] = None
    genre: Optional[str] = None
    tone: Optional[str] = None
    mode: Optional[str] = 'generate'


class RewriteRequest(BaseModel):
    project_id: str
    prompt: str
    scene_text: str
    genre: Optional[str] = None


class ContinuityRequest(BaseModel):
    project_id: str
    screenplay_text: str
    characters: List[str] = []
    timeline_events: Optional[List[str]] = []


class StoryAnalysisRequest(BaseModel):
    project_id: str
    screenplay_text: str
    audience_tone: Optional[str] = 'cinematic'
    evaluate_pacing: bool = True
    evaluate_conflict: bool = True


class CharacterProfileRequest(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    screenplay_text: Optional[str] = None
