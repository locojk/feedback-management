import { useEnsureRegeneratorRuntime } from "@/app/hook/useEnsureRegeneratorRuntime";
import { Textarea } from "@/components/textarea";
import { useEffect, useRef, useState, useMemo } from "react";
import { Ring } from "@uiball/loaders";
// @ts-expect-error: Typings are missing or incorrect in react-speech-recognition library
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { MicIcon } from "../icons/mic-icon";
import { Button } from "../button";

interface SendFormProps {
  input: string;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function SendForm({
  input,
  handleSubmit,
  isLoading,
  handleInputChange,
}: SendFormProps) {
  useEnsureRegeneratorRuntime();

  const [textareaHeight, setTextareaHeight] = useState("h-10");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    listening,
    resetTranscript,
    transcript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Explicitly using browserSupportsSpeechRecognition
  useMemo(() => {
    if (!browserSupportsSpeechRecognition) {
      console.warn("Browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    const textarea = document.querySelector(".mendable-textarea") as HTMLTextAreaElement;
    if (textarea) {
      if (input === "") {
        resetTranscript();
        setTextareaHeight("h-10");
      } else {
        const shouldExpand =
          textarea.scrollHeight > textarea.clientHeight &&
          textareaHeight !== "h-20";
        if (shouldExpand) {
          setTextareaHeight("h-20");
        }
      }

      if (listening) {
        textarea.scrollTop = textarea.scrollHeight;
      }
    }
  }, [listening, input, textareaHeight, resetTranscript]); // ✅ added resetTranscript

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && listening) {
        SpeechRecognition.stopListening();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [listening]);

  useEffect(() => {
    if (transcript) {
      updateInputWithTranscript(transcript);
    }
  }, [transcript]); // transcript only dependency; already correct

  const updateInputWithTranscript = (transcriptValue: string) => {
    const fakeEvent = {
      target: { value: transcriptValue },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(fakeEvent);
  };

  const toggleSpeech = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Fixed handleKeyDown type
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim() !== "") {
        handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center justify-center w-full space-x-2"
    >
      <div className="relative w-full max-w-xs">
        <MicIcon
          onClick={toggleSpeech}
          className={`absolute right-2 h-4 w-4 top-1/2 transition-all transform -translate-y-2 ${
            listening ? "text-red-500 scale-125 animate-pulse" : "text-gray-500"
          } dark:text-gray-400 hover:scale-125 cursor-pointer`}
        />

        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`pr-8 resize-none mendable-textarea min-h-[20px] ${textareaHeight}`}
          placeholder="Type a message..."
          ref={textareaRef}
        />
      </div>

      <Button className="h-10" type="submit" disabled={isLoading}>
        {isLoading ? (
          <div className="flex gap-2 items-center">
            <Ring size={12} color="#1a1a1a" />
            Loading...
          </div>
        ) : (
          <div className="flex flex-col w-16">Send</div>
        )}
      </Button>
    </form>
  );
}
