import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const CHAT_URL = "https://functions.poehali.dev/bc236cc9-38dc-42f3-a615-7a873bebf437"
const AI_AVATAR = "https://cdn.poehali.dev/projects/300e28b1-0d7c-4c8a-b90d-ee6390397519/files/ea1d325d-4b09-43a5-b095-b3f2fda7fbcc.jpg"

type Message = { role: "user" | "assistant"; content: string }

const GREETING: Message = {
  role: "assistant",
  content: "Здарова! По какому вопросу ко мне? Может помочь пофармить или заскрафтить что-нибудь?",
}

export function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((m) => m !== GREETING).map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.reply || "Что-то пошло не так, попробуй ещё раз."
      setMessages([...nextMessages, { role: "assistant", content: reply }])
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Связь с сервером пропала. Попробуй ещё раз." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="chat" className="py-24 px-4 bg-black">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-orbitron">
            Спроси <span className="text-red-500">Rusty AI</span>
          </h2>
          <p className="text-gray-400 text-lg">Задай любой вопрос по игре Rust — отвечу на всё</p>
        </div>

        <div className="bg-zinc-900/60 border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/20 bg-black/40">
            <img src={AI_AVATAR} alt="Rusty AI" className="w-10 h-10 rounded-full object-cover border border-red-500/40" />
            <div>
              <p className="text-white font-semibold font-orbitron">Rusty AI</p>
              <p className="text-green-500 text-xs">в сети</p>
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto px-4 py-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <img src={AI_AVATAR} alt="Rusty AI" className="w-8 h-8 rounded-full object-cover border border-red-500/40 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-red-500 text-white rounded-br-sm"
                      : "bg-zinc-800 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <img src={AI_AVATAR} alt="Rusty AI" className="w-8 h-8 rounded-full object-cover border border-red-500/40 flex-shrink-0" />
                <div className="bg-zinc-800 text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                  Rusty AI печатает...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 px-4 py-4 border-t border-red-500/20 bg-black/40">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Например: как лучше фармить скрап?"
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus-visible:ring-red-500"
            />
            <Button onClick={send} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white border-0 flex-shrink-0">
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
