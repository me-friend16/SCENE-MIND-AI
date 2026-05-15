from pathlib import Path
from typing import List, Dict

class VectorStore:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.mkdir(parents=True, exist_ok=True)

    def add_memory(self, project_id: str, entry: Dict):
        file_path = self.path / f'{project_id}.json'
        memories = self._load(file_path)
        memories.append(entry)
        file_path.write_text(str(memories))

    def query_memory(self, project_id: str, query: str) -> List[Dict]:
        return self._load(self.path / f'{project_id}.json')

    def _load(self, path: Path) -> List[Dict]:
        if not path.exists():
            return []
        return eval(path.read_text())
