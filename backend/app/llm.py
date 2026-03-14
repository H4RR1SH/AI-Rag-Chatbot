import ollama

SYSTEM_PROMPT = (
    "You are a helpful assistant. Answer the user's question using ONLY the information in the provided context. "
    "Extract the answer directly from the context. Be concise. "
    "Only say 'I could not find this information in the provided documents.' if the context truly contains no relevant information."
)


def build_prompt(question: str, chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(chunks)
    return f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"


def generate(question: str, chunks: list[str], model: str = "llama3.2") -> str:
    prompt = build_prompt(question, chunks)
    response = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return response.message.content


def generate_stream(question: str, chunks: list[str], model: str = "llama3.2"):
    prompt = build_prompt(question, chunks)
    stream = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        stream=True,
    )
    for chunk in stream:
        token = chunk.message.content
        if token:
            yield token
