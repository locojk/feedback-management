import { useEnsureRegeneratorRuntime } from "../app/hook/useEnsureRegeneratorRuntime";
import { useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Bubble from "./chat/message";
import SendForm from "./chat/chat-form";
import LZString from "lz-string";

export default function Chat() {
  const [searchParams] = useSearchParams();
  const share = searchParams.get("share");
  const lzstring = LZString;

  // ✅ State to store messages and input
  const [messages, setMessages] = useState(
    share && lzstring
      ? JSON.parse(lzstring.decompressFromEncodedURIComponent(share))
      : [
          {
            id: "initialai",
            role: "assistant",
            content:
              "Welcome to the Patient Feedback Chat. Your experience matters to us! Please share your feedback about your treatment.",
          },
        ]
  );

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEnsureRegeneratorRuntime();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to send message to FastAPI
  async function handleSubmit(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]); 
    setInput(""); 
    setIsLoading(true);

    try {
      const response = await fetch("https://chatbot-2024-90539106da8b.herokuapp.com/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMessage = { id: Date.now().toString(), role: "assistant", content: data.response };

      setMessages((prev) => [...prev, botMessage]); // Add AI response to chat
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <h1>Chatbot</h1>
        <p>Patient Feedback</p>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <SendForm
          input={input}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          handleInputChange={(e) => setInput(e.target.value)}
        />
      </div>
    </div>
  );
} 