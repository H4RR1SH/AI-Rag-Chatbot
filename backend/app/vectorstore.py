import faiss
import numpy as np

_index: faiss.IndexFlatL2 | None = None
_chunks: list[str] = []


def build_index(chunks: list[str], embeddings: np.ndarray) -> None:
    global _index, _chunks
    dimension = embeddings.shape[1]
    _index = faiss.IndexFlatL2(dimension)
    _index.add(embeddings)
    _chunks = chunks


def search(query_embedding: np.ndarray, top_k: int = 5) -> list[dict]:
    if _index is None:
        return []

    distances, indices = _index.search(query_embedding, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx != -1:
            results.append({"chunk": _chunks[idx], "score": float(dist)})

    return results
