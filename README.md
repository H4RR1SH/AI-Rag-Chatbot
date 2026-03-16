# RAG Document Chatbot

Upload a PDF and ask questions about it. The chatbot retrieves relevant sections from your document and generates grounded answers using a local LLM — no hallucinations, no guessing.

## How it works

```
PDF Upload → Text Extraction → Chunking → Embedding → FAISS Index
                                                           ↓
                               Question → Embedding → Retrieval → LLM → Streamed Answer
```

1. **Upload** — PDF is parsed and split into overlapping chunks (800 chars, 100 overlap)
2. **Embed** — Each chunk is embedded using `all-MiniLM-L6-v2`
3. **Index** — Embeddings are stored in a FAISS flat L2 index (in memory)
4. **Retrieve** — At query time, the question is embedded and the top-5 closest chunks are retrieved
5. **Generate** — Chunks are passed as context to a local Ollama model, answer is streamed token by token

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| Vector Search | FAISS |
| LLM | Ollama (`llama3.2`) |
| PDF Parsing | pypdf |
| Streaming | Server-Sent Events (SSE) |

## Project Structure

```
rag-chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── parser.py        # PDF text extraction
│   │   ├── chunker.py       # Text chunking
│   │   ├── embedder.py      # Sentence-transformers embeddings
│   │   ├── vectorstore.py   # FAISS index build + search
│   │   └── llm.py           # Ollama prompt + streaming
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main chat UI
│   │   └── components/ui/   # Prompt input component
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Python 3.11+
- Node.js 22.12+
- [Ollama](https://ollama.com) installed and running

Pull the model before starting:

```bash
ollama pull llama3.2
```

### Backend

```bash
cd backend
uv venv
uv sync
uv run uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload a PDF, builds the index |
| `POST` | `/search?query=...` | Returns top-5 relevant chunks |
| `POST` | `/chat?query=...` | Returns full answer with sources |
| `POST` | `/chat/stream?query=...` | Streams answer token by token (SSE) |

## Usage

1. Open `http://localhost:5173`
2. Click **Upload PDF** and select a document
3. Ask any question about the document
4. The answer streams in token by token, grounded in what the document actually says

## Limitations

- Index is in-memory — restarting the server requires re-uploading the PDF
- Single document at a time
- PDF only (no images, scanned docs, or OCR)

## Future Improvements

- Persistent vector store
- Multi-document support
- Hybrid search (keyword + semantic)
- Reranking
- OCR support
- Auth system
