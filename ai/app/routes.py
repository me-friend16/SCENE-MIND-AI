import json
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    CharacterProfileRequest,
    ContinuityRequest,
    GenerationRequest,
    RewriteRequest,
    StoryAnalysisRequest,
)
from app.services.analysis import analyze_story
from app.services.continuity import continuity_check
from app.services.generation import (
    character_profile,
    generate_dialogue,
    generate_scene,
    rewrite_scene,
    _get_client,
    _system_for_genre,
    GENRE_OVERLAYS,
)
from app.memory.vector_store import build_context

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


@router.post('/character-profile')
def character_profile_endpoint(request: CharacterProfileRequest):
    return character_profile(request.model_dump())


@router.post('/stream-scene')
async def stream_scene_endpoint(request: GenerationRequest):
    """SSE streaming endpoint — yields text chunks as they arrive from Claude."""
    payload = request.model_dump()
    prompt: str = payload.get('prompt', 'Write a scene.')
    genre: str | None = payload.get('genre')
    scene_text: str | None = payload.get('scene_text')
    mode: str = payload.get('mode', 'generate')
    project_id: str = payload.get('project_id', '')

    action_map = {
        'continue': 'Continue the screenplay from where it ends.',
        'rewrite': 'Rewrite the screenplay section with more cinematic power.',
        'generate': 'Write a new scene.',
    }
    action = action_map.get(mode, action_map['generate'])

    context_block = f'\n\nCURRENT SCREENPLAY CONTEXT:\n"""\n{scene_text.strip()}\n"""' if scene_text and scene_text.strip() else ''
    memory_ctx = build_context(project_id, prompt + ' ' + (scene_text or ''))
    memory_block = f'\n\nESTABLISHED STORY FACTS:\n{memory_ctx}' if memory_ctx else ''
    user_message = f'{action}\n\nINSTRUCTIONS:\n{prompt}{context_block}{memory_block}'

    async def event_stream():
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            # Mock streaming for dev without API key
            mock = 'INT. ORBITAL STUDIO — NIGHT\n\nThe set crackles with tension.\n\n\t\t\tDIRECTOR\n\t\tTell me this shot is going to work.'
            for word in mock.split(' '):
                yield f'data: {json.dumps({"text": word + " "})}\n\n'
            yield 'data: [DONE]\n\n'
            return

        import anthropic as _anthropic
        client = _anthropic.Anthropic(api_key=api_key)
        try:
            with client.messages.stream(
                model='claude-sonnet-4-20250514',
                max_tokens=1024,
                system=_system_for_genre(genre),
                messages=[{'role': 'user', 'content': user_message}],
            ) as stream:
                for text in stream.text_stream:
                    yield f'data: {json.dumps({"text": text})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"error": str(e)})}\n\n'
        finally:
            yield 'data: [DONE]\n\n'

    return StreamingResponse(
        event_stream(),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        },
    )
