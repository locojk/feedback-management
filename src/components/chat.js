import { useEnsureRegeneratorRuntime } from "../app/hook/useEnsureRegeneratorRuntime";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { ScrollArea } from "./scroll-area";
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

  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
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
      const BASE_URL = process.env.REACT_APP_API_BASE_URL;
      console.log("BASE_URL is:", BASE_URL);
      const response = await fetch(`${BASE_URL}/chatbot/`, {
      // const response = await fetch("http://localhost:8000/chatbot/textchatbot/", {
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
    <Card className="w-[440px] mx-auto shadow-lg">
      <CardHeader className="border-b">
        <div className="flex flex-row items-start justify-between max-w-[100%]">
          <CardTitle className="text-xl font-bold">Chatbot</CardTitle>
        </div>
        <CardDescription className="text-base">Patient Feedback</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[450px] w-full pr-4"
        >
          <div className="flex flex-col">
            {messages.map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <SendForm
          input={input}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          handleInputChange={(e) => setInput(e.target.value)}
        />
      </CardFooter>
    </Card>
  );
} 