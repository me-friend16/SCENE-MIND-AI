"""
Keyword-based memory store for SceneMind AI.

Stores scene/character/event text snippets as JSON per project. Retrieves
top-k relevant entries using TF-IDF-style scoring against a query string.
Set PINECONE_API_KEY env var to enable Pinecone upgrade (scaffolded below).
"""
import json
import os
import re
import hashlib
from pathlib import Path
from typing import Any

_STORE_DIR = Path(os.environ.get('MEMORY_DIR', '/tmp/scenemind_memory'))
_STORE_DIR.mkdir(parents=True, exist_ok=True)


# ── File helpers ──────────────────────────────────────────────────────────────

def _project_file(project_id: str) -> Path:
    safe = re.sub(r'[^a-zA-Z0-9_-]', '_', project_id)
    return _STORE_DIR / f'{safe}.json'


def _load(project_id: str) -> list[dict[str, Any]]:
    f = _project_file(project_id)
    if not f.exists():
        return []
    try:
        return json.loads(f.read_text())
    except Exception:
        return []


def _save(project_id: str, entries: list[dict[str, Any]]) -> None:
    _project_file(project_id).write_text(json.dumps(entries, ensure_ascii=False))


# ── Scoring ───────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    return re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())


def _score(query_tokens: list[str], entry: dict[str, Any]) -> float:
    entry_tokens = _tokenize(entry.get('text', ''))
    if not entry_tokens:
        return 0.0
    total = len(entry_tokens)
    freq: dict[str, int] = {}
    for t in entry_tokens:
        freq[t] = freq.get(t, 0) + 1
    return sum(freq.get(t, 0) / total for t in query_tokens)


def _entry_id(project_id: str, text: str, entry_type: str) -> str:
    return hashlib.md5(f'{project_id}:{entry_type}:{text[:200]}'.encode()).hexdigest()


# ── Public API ────────────────────────────────────────────────────────────────

def upsert(project_id: str, text: str, entry_type: str, metadata: dict | None = None) -> None:
    """Store or update a memory entry."""
    entries = _load(project_id)
    eid = _entry_id(project_id, text, entry_type)
    entries = [e for e in entries if e.get('id') != eid]
    entries.append({
        'id': eid,
        'type': entry_type,
        'text': text[:2000],
        'metadata': metadata or {},
    })
    _save(project_id, entries[-200:])


def retrieve(project_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """Retrieve top-k relevant entries for a query."""
    entries = _load(project_id)
    if not entries:
        return []
    query_tokens = _tokenize(query)
    if not query_tokens:
        return entries[:top_k]
    return sorted(entries, key=lambda e: _score(query_tokens, e), reverse=True)[:top_k]


def store_scene(project_id: str, scene_heading: str, scene_text: str) -> None:
    upsert(
        project_id,
        f'{scene_heading}\n{scene_text}',
        entry_type='scene',
        metadata={'heading': scene_heading},
    )


def store_character(project_id: str, name: str, description: str, profile: dict | None = None) -> None:
    text = f'CHARACTER: {name}\n{description}'
    if profile:
        for k, v in profile.items():
            text += f'\n{k.upper()}: {v}'
    upsert(project_id, text, entry_type='character', metadata={'name': name})


def build_context(project_id: str, query: str, max_chars: int = 3000) -> str:
    """Return a formatted context block of top memories for prompt injection."""
    entries = retrieve(project_id, query, top_k=6)
    if not entries:
        return ''
    parts: list[str] = []
    total = 0
    for e in entries:
        snippet = e['text'][:600]
        if total + len(snippet) > max_chars:
            break
        parts.append(f'[{e["type"].upper()}] {snippet}')
        total += len(snippet)
    return '\n\n'.join(parts)


# ── Legacy class wrapper (keeps old imports working) ──────────────────────────

class VectorStore:
    def __init__(self, path: str = str(_STORE_DIR)):
        global _STORE_DIR
        _STORE_DIR = Path(path)
        _STORE_DIR.mkdir(parents=True, exist_ok=True)

    def add_memory(self, project_id: str, entry: dict) -> None:
        upsert(project_id, str(entry.get('text', entry)), entry.get('type', 'event'), entry)

    def query_memory(self, project_id: str, query: str) -> list[dict]:
        return retrieve(project_id, query)
