import os
from typing import Dict

import anthropic


def _get_client() -> anthropic.Anthropic:
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise RuntimeError('ANTHROPIC_API_KEY not set.')
    return anthropic.Anthropic(api_key=api_key)


_CONTINUITY_SYSTEM = """You are a screenplay continuity supervisor with an encyclopedic memory.

Your job: scan the provided screenplay text for logical, factual, or character-state contradictions.

WHAT TO DETECT:
- Resurrection errors (character dead → alive with no explanation)
- Injury continuity (wound appears/disappears without explanation)
- Prop continuity (object in wrong place or state)
- Location logic (character teleports without scene transition)
- Character knowledge (character knows something before being told)
- Timeline inconsistencies (scene order defying established time)

OUTPUT FORMAT — return a JSON array of issues only, no other text:
[
  {
    "type": "resurrection|injury|prop|location|knowledge|timeline|other",
    "severity": "critical|high|medium|low",
    "description": "Clear, specific description of the contradiction.",
    "suggestion": "How to fix it.",
    "scene_ref": "Scene heading or approximate location (optional)"
  }
]

If there are no issues, return an empty array: []"""


def continuity_check(payload: Dict) -> Dict:
    screenplay_text: str = payload.get('screenplay_text', '')
    characters: list[str] = payload.get('characters', [])

    char_list = ', '.join(characters) if characters else 'unknown'
    user_message = (
        f'CHARACTERS IN THIS SCREENPLAY: {char_list}\n\n'
        f'SCREENPLAY:\n"""\n{screenplay_text[:12000]}\n"""\n\n'
        f'Identify all continuity issues. Return only the JSON array.'
    )

    try:
        client = _get_client()
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1024,
            system=_CONTINUITY_SYSTEM,
            messages=[{'role': 'user', 'content': user_message}],
        )
        raw = message.content[0].text if message.content else '[]'
        issues = _parse_issues(raw)
    except RuntimeError as e:
        issues = _heuristic_check(screenplay_text)
        print(f'[AI] Warning: {e}. Using heuristic fallback.')

    return {
        'project_id': payload['project_id'],
        'issues': issues,
        'summary': f'Found {len(issues)} continuity issue(s).',
    }


def _parse_issues(raw: str) -> list:
    import json, re
    try:
        # Extract first JSON array from Claude output
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except (json.JSONDecodeError, AttributeError):
        pass
    return []


def _heuristic_check(text: str) -> list:
    """Cheap fallback when Claude is unavailable."""
    issues = []
    lower = text.lower()
    if 'dead' in lower and 'alive' in lower:
        issues.append({
            'type': 'resurrection',
            'severity': 'high',
            'description': 'Possible life/death contradiction detected.',
            'suggestion': 'Review scenes involving character deaths.',
        })
    return issues
