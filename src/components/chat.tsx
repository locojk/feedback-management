// "use client";
// import { useEnsureRegeneratorRuntime } from "@/app/hook/useEnsureRegeneratorRuntime";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/card";
// import { ScrollArea } from "@/components/scroll-area";
// // import { useToast } from "@/components/ui/use-toast";
// import { useChat } from "ai/react";
// import { useSearchParams } from "next/navigation";
// import { useEffect, useRef } from "react";
// import Bubble from "./chat/message";
// import SendForm from "./chat/chat-form";
// import LZString from "lz-string";

// export default function Chat() {
// //   const { toast } = useToast();
//   const searchParams = useSearchParams();
//   const share = searchParams.get("share");
//   //@ts-ignore
//   const lzstring = LZString;
//   const { messages, input, handleInputChange, handleSubmit, isLoading } =
//     useChat({
//       initialMessages:
//         share && lzstring
//           ? JSON.parse(lzstring.decompressFromEncodedURIComponent(share))
//           : [],
//     });

//   useEnsureRegeneratorRuntime();

//   const scrollAreaRef = useRef<null | HTMLDivElement>(null);

//   useEffect(() => {
//     if (scrollAreaRef.current) {
//       scrollAreaRef.current.scrollTo({
//         top: scrollAreaRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [messages]);

//   return (
//     <Card className="w-[440px]">
//       <CardHeader>
//         <div className="flex flex-row items-start justify-between max-w-[100%]">
//           <CardTitle className="text-lg">Chatbot</CardTitle>
//         </div>
//         <CardDescription className=" leading-3">
//         Patient Feedback
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="">
//         <ScrollArea
//           ref={scrollAreaRef}
//           className="h-[450px] overflow-y-auto w-full spacy-y-4 pr-4"
//         >
//           <Bubble
//             message={{
//               role: "assistant",
//               content: "Welcome to the Patient Feedback Chat. Your experience matters to us! Please share your feedback about your treatment. Your feedback helps us improve our care.",
//               id: "initialai",
//             }}
//           />
//           {messages.map((message) => (
//             <Bubble key={message.id} message={message} />
//           ))}
//         </ScrollArea>
//       </CardContent>
//       <CardFooter>
//         <SendForm
//           input={input}
//           handleSubmit={handleSubmit}
//           isLoading={isLoading}
//           handleInputChange={handleInputChange}
//         />
//       </CardFooter>
//     </Card>
//   );
// }

"use client";

import { useEnsureRegeneratorRuntime } from "@/app/hook/useEnsureRegeneratorRuntime";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { ScrollArea } from "@/components/scroll-area";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Bubble from "./chat/message";
import SendForm from "./chat/chat-form";
import LZString from "lz-string";

export default function Chat() {
  const searchParams = useSearchParams();
  const share = searchParams.get("share");
  const lzstring = LZString;

  // ✅ State to store messages and input
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string }[]
  >(
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

  const scrollAreaRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Function to send message to FastAPI
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]); 
    setInput(""); 
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chatbot/", {
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
    <Card className="w-[440px]">
      <CardHeader>
        <div className="flex flex-row items-start justify-between max-w-[100%]">
          <CardTitle className="text-lg">Chatbot</CardTitle>
        </div>
        <CardDescription className="leading-3">Patient Feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[450px] overflow-y-auto w-full spacy-y-4 pr-4"
        >
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter>
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
