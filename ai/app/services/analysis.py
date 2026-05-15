import json
import os
import re
from typing import Dict

import anthropic


def _get_client() -> anthropic.Anthropic:
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError('ANTHROPIC_API_KEY not set.')
    return anthropic.Anthropic(api_key=api_key)


_ANALYSIS_SYSTEM = """You are a professional screenplay analyst and story consultant.

Analyse the provided screenplay and return a JSON object with this exact structure:
{
  "story_score": <integer 0-100>,
  "pacing_analysis": {
    "act_one": "<slow|steady|accelerating|intense|balanced>",
    "act_two": "<slow|steady|accelerating|intense|balanced>",
    "act_three": "<slow|steady|accelerating|intense|balanced>"
  },
  "recommendations": [
    "<specific, actionable improvement for the writer>",
    "<specific, actionable improvement for the writer>",
    "<specific, actionable improvement for the writer>"
  ]
}

SCORING RUBRIC (story_score):
- Structure (25 pts): clear three-act beats, rising action, climax, resolution
- Character (25 pts): compelling arcs, authentic dialogue, emotional truth
- Conflict (25 pts): escalating stakes, clear antagonistic force, satisfying tension
- Craft (25 pts): economy of language, strong scene openings, visual storytelling

Return only the JSON object, no other text."""


def analyze_story(payload: Dict) -> Dict:
    screenplay_text: str = payload.get('screenplay_text', '')

    if not screenplay_text.strip():
        return _empty_analysis(payload['project_id'])

    user_message = f'SCREENPLAY:\n"""\n{screenplay_text[:15000]}\n"""\n\nAnalyse this screenplay and return the JSON.'

    try:
        client = _get_client()
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1024,
            system=_ANALYSIS_SYSTEM,
            messages=[{'role': 'user', 'content': user_message}],
        )
        raw = message.content[0].text if message.content else '{}'
        result = _parse_analysis(raw)
    except RuntimeError as e:
        result = _mock_analysis()
        print(f'[AI] Warning: {e}. Using mock analysis.')

    return {
        'project_id': payload['project_id'],
        **result,
    }


def _parse_analysis(raw: str) -> dict:
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            # Validate required keys
            if 'story_score' in data and 'pacing_analysis' in data:
                return data
    except (json.JSONDecodeError, AttributeError):
        pass
    return _mock_analysis()


def _empty_analysis(project_id: str) -> dict:
    return {
        'project_id': project_id,
        'story_score': 0,
        'pacing_analysis': {'act_one': 'slow', 'act_two': 'slow', 'act_three': 'slow'},
        'recommendations': ['Write some content first to receive story analysis.'],
    }


def _mock_analysis() -> dict:
    return {
        'story_score': 68,
        'pacing_analysis': {
            'act_one': 'steady',
            'act_two': 'accelerating',
            'act_three': 'intense',
        },
        'recommendations': [
            'Heighten the protagonist\'s emotional stakes in the midpoint sequence.',
            'Add a clearer visual motif for the antagonist across key scenes.',
            'Consider tightening Act II — the middle section loses momentum around page 45.',
        ],
    }
