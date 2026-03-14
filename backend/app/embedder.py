from sentence_transformers import SentenceTransformer
import numpy as np

_model = SentenceTransformer("all-MiniLM-L6-v2")


def embed(texts: list[str]) -> np.ndarray:
    return _model.encode(texts, convert_to_numpy=True)
