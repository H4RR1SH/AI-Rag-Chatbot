from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.parser import extract_text_from_pdf
from app.chunker import chunk_text
from app.embedder import embed
from app.vectorstore import build_index, search
from app.llm import generate, generate_stream

app = FastAPI(title="RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    text = extract_text_from_pdf(contents)

    chunks = chunk_text(text)
    embeddings = embed(chunks)
    build_index(chunks, embeddings)

    return {"filename": file.filename, "characters": len(text), "chunk_count": len(chunks)}


@app.post("/search")
async def search_chunks(query: str):
    query_embedding = embed([query])
    results = search(query_embedding, top_k=5)
    return {"query": query, "results": results}


@app.post("/chat")
async def chat(query: str):
    query_embedding = embed([query])
    results = search(query_embedding, top_k=5)
    chunks = [r["chunk"] for r in results]
    answer = generate(query, chunks)
    return {"query": query, "answer": answer, "sources": results}


@app.post("/chat/stream")
async def chat_stream(query: str):
    query_embedding = embed([query])
    results = search(query_embedding, top_k=5)
    chunks = [r["chunk"] for r in results]

    def token_generator():
        for token in generate_stream(query, chunks):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(token_generator(), media_type="text/event-stream")
