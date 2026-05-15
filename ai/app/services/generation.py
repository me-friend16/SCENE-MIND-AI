import os
from typing import Dict

import anthropic

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if not api_key:
            raise RuntimeError('ANTHROPIC_API_KEY not set.')
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


GENRE_OVERLAYS: dict[str, str] = {
    'thriller': 'Write with tension, dread, and propulsive pacing. Short punchy sentences. High stakes.',
    'horror': 'Lean into atmosphere, dread, and visceral imagery. Build terror slowly. Subtext matters.',
    'sci-fi': 'Ground the fantastical in specific, believable detail. World-building through action.',
    'drama': 'Prioritise subtext, emotional truth, and nuanced character behaviour over plot mechanics.',
    'comedy': 'Sharp timing, subverted expectations, character-driven absurdity. Economy of language.',
    'action': 'Kinetic, visual, immediate. Every sentence earns its place. Clarity over poetry.',
    'mystery': 'Layer information carefully. Plant clues, mislead deliberately. Atmosphere is character.',
    'romance': 'Emotional interiority, longing, obstacles. Show vulnerability through specific gestures.',
}

BASE_SYSTEM_PROMPT = """You are SceneMind AI, an expert screenplay co-writer trained on hundreds of produced scripts.

SCREENPLAY FORMAT RULES:
- Scene headings: INT./EXT. LOCATION - TIME  (uppercase, bold)
- Action lines: present tense, visual, concise — what the camera sees
- Character cues: UPPERCASE, centred
- Dialogue: conversational, subtext-driven, reveals character
- Parentheticals: only when essential, brief
- Transitions: use sparingly (CUT TO:, DISSOLVE TO:)

OUTPUT:
- Return only raw screenplay-formatted text, no commentary
- Match the tone and voice of any context provided
- Honour established character voices and facts exactly"""


def _system_for_genre(genre: str | None) -> str:
    overlay = GENRE_OVERLAYS.get((genre or '').lower(), '')
    return BASE_SYSTEM_PROMPT + (f'\n\nGENRE GUIDANCE ({genre}):\n{overlay}' if overlay else '')


def generate_scene(payload: Dict) -> Dict:
    prompt: str = payload.get('prompt', 'Write a compelling scene with strong conflict.')
    genre: str | None = payload.get('genre')
    scene_text: str | None = payload.get('scene_text')
    mode: str = payload.get('mode', 'generate')

    context_block = ''
    if scene_text and scene_text.strip():
        context_block = f'\n\nCURRENT SCREENPLAY CONTEXT:\n"""\n{scene_text.strip()}\n"""'

    action_map = {
        'continue': 'Continue the screenplay from where it ends. Maintain the established tone and momentum.',
        'rewrite': 'Rewrite the screenplay section with more cinematic power and clarity.',
        'generate': 'Write a new scene.',
    }
    action = action_map.get(mode, action_map['generate'])

    user_message = f'{action}\n\nINSTRUCTIONS:\n{prompt}{context_block}'

    try:
        client = _get_client()
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1024,
            system=_system_for_genre(genre),
            messages=[{'role': 'user', 'content': user_message}],
        )
        content = message.content[0].text if message.content else ''
    except RuntimeError as e:
        # Fallback for missing API key (dev mode)
        content = _mock_scene(prompt, genre)
        print(f'[AI] Warning: {e}. Using mock output.')

    return {
        'project_id': payload['project_id'],
        'scene': {
            'content': content,
            'metadata': {'genre': genre, 'mode': mode},
        },
    }


def generate_dialogue(payload: Dict) -> Dict:
    prompt: str = payload.get('prompt', 'Write a compelling dialogue exchange.')
    genre: str | None = payload.get('genre')
    scene_text: str | None = payload.get('scene_text')

    context_block = ''
    if scene_text and scene_text.strip():
        context_block = f'\n\nSCENE CONTEXT:\n"""\n{scene_text.strip()}\n"""'

    user_message = (
        f'Write a dialogue exchange in proper screenplay format.\n\n'
        f'INSTRUCTIONS:\n{prompt}{context_block}\n\n'
        f'Return only screenplay-formatted dialogue (character cues + lines). No action or scene headings.'
    )

    try:
        client = _get_client()
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=800,
            system=_system_for_genre(genre),
            messages=[{'role': 'user', 'content': user_message}],
        )
        raw = message.content[0].text if message.content else ''
        lines = _parse_dialogue(raw)
    except RuntimeError as e:
        lines = [
            {'character': 'AVA', 'line': "We can't let the signal fall into the wrong hands."},
            {'character': 'KAIRO', 'line': 'Then we burn the plan and trust the only ally we have left.'},
        ]
        print(f'[AI] Warning: {e}. Using mock output.')

    return {
        'project_id': payload['project_id'],
        'dialogue': lines,
        'notes': prompt,
    }


def rewrite_scene(payload: Dict) -> Dict:
    """Rewrite an existing scene with specific instructions."""
    payload['mode'] = 'rewrite'
    return generate_scene(payload)


def _parse_dialogue(raw: str) -> list[dict]:
    """Parse Claude's raw dialogue text into [{character, line}] pairs."""
    lines = raw.strip().split('\n')
    result = []
    current_char = None
    dialogue_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_char and dialogue_lines:
                result.append({'character': current_char, 'line': ' '.join(dialogue_lines)})
                current_char = None
                dialogue_lines = []
            continue

        # Character cue: all uppercase, no lowercase letters
        if stripped.isupper() and len(stripped) < 40 and not stripped.endswith(':'):
            if current_char and dialogue_lines:
                result.append({'character': current_char, 'line': ' '.join(dialogue_lines)})
            current_char = stripped
            dialogue_lines = []
        elif current_char:
            dialogue_lines.append(stripped)

    if current_char and dialogue_lines:
        result.append({'character': current_char, 'line': ' '.join(dialogue_lines)})

    return result if result else [{'character': 'CHARACTER', 'line': raw.strip()}]


def _mock_scene(prompt: str, genre: str | None) -> str:
    return (
        f'INT. ORBITAL STUDIO — NIGHT\n\n'
        f'The set crackles with tension. Console lights strobe in arrhythmic pulses.\n\n'
        f'\t\t\tDIRECTOR\n'
        f'\t\tTell me this shot is going to work.\n\n'
        f'\t\t\tCAMERA OPERATOR\n'
        f'\t\t(beat)\n'
        f'\t\tDepends on what you mean by "work."\n\n'
        f'The Director stares at the monitor. The story demands everything tonight.'
    )
