"use client";

import { useState } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  onSendMessage?: (message: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Привет! Я AI-помощник. Помогу подобрать упражнения и составить тренировку. Что вас интересует?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    onSendMessage?.(input);
    setInput("");

    // Заглушка ответа AI
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Это заглушка ответа AI. В продакшене здесь будет реальный ответ от LLM.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] border border-black/10 rounded-card">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-card text-chat ${
                message.role === "user"
                  ? "bg-accent text-white"
                  : "bg-secondary text-black"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-black/10 p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Напишите сообщение..."
          className="flex-1 p-3 border border-black/10 rounded-card text-chat focus:outline-none focus:border-accent"
        />
        <Button onClick={handleSend} className="px-6">
          Отправить
        </Button>
      </div>
    </div>
  );
}

