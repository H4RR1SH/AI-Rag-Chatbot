import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { PromptInputBox } from "@/components/ui/ai-prompt-box"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function App() {
  const [uploaded, setUploaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filename, setFilename] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("http://localhost:8000/upload", { method: "POST", body: formData })
    if (res.ok) {
      setUploaded(true)
      setFilename(file.name)
      setMessages([])
    }
    setUploading(false)
  }

  async function handleSend(message: string) {
    if (!message.trim() || streaming) return
    setMessages((prev) => [...prev, { role: "user", content: message }])
    setStreaming(true)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    const res = await fetch(
      `http://localhost:8000/chat/stream?query=${encodeURIComponent(message)}`,
      { method: "POST" }
    )

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split("\n").filter((l) => l.startsWith("data: "))
      for (const line of lines) {
        const token = line.replace("data: ", "")
        if (token === "[DONE]") break
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + token,
          }
          return updated
        })
      }
    }
    setStreaming(false)
  }

  return (
    <div className="h-screen bg-[#16171d] text-gray-100 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2b33]">
          <h1 className="text-sm font-semibold tracking-tight text-white">RAG Chatbot</h1>
          <div className="flex items-center gap-3">
            {filename && (
              <span className="text-xs text-gray-400 truncate max-w-[180px]">{filename}</span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-full border border-[#444444] text-gray-300 hover:bg-[#2a2b33] transition-colors"
            >
              {uploading ? "Uploading…" : uploaded ? "Replace PDF" : "Upload PDF"}
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} hidden />
          </div>
        </div>

        {/* Messages — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-20">
              {uploaded ? "Ask a question about your document." : "Upload a PDF to get started."}
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white text-[#1F2023]"
                    : "bg-[#1F2023] border border-[#333333] text-gray-100 prose prose-invert prose-sm max-w-none"
                }`}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : msg.content ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  <span className="opacity-40">▌</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input — pinned to bottom */}
        <div className="px-4 py-4">
          <PromptInputBox
            onSend={handleSend}
            isLoading={streaming}
            disabled={!uploaded}
            placeholder={uploaded ? "Ask something about your document…" : "Upload a PDF first…"}
          />
        </div>

      </div>
    </div>
  )
}
