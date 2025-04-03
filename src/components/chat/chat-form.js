import { useEnsureRegeneratorRuntime } from "../../app/hook/useEnsureRegeneratorRuntime";
import { Textarea } from "../textarea";
import { useEffect, useRef, useState, useMemo } from "react";
import { Ring } from "@uiball/loaders";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { MicIcon } from "../icons/mic-icon";
import { Button } from "../button";

export default function SendForm({
  input,
  handleSubmit,
  isLoading,
  handleInputChange,
}) {
  useEnsureRegeneratorRuntime();

  const [textareaHeight, setTextareaHeight] = useState("h-10");
  const textareaRef = useRef(null);

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
    const textarea = document.querySelector(".mendable-textarea");
    if (textarea) {
      if (input === "") {
        resetTranscript();
        setTextareaHeight("h-10");
      } else {
        const shouldExpand =
          textarea.scrollHeight > textarea.clientHeight &&
          textarea.scrollHeight < 200;
        if (shouldExpand) {
          setTextareaHeight("h-auto");
        }
      }
    }
  }, [input, resetTranscript]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && listening) {
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
  }, [transcript]);

  const updateInputWithTranscript = (transcriptValue) => {
    const textarea = document.querySelector(".mendable-textarea");
    if (textarea) {
      const event = {
        target: { value: transcriptValue },
      };
      handleInputChange(event);
    }
  };

  const toggleSpeech = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <div className="relative flex-1 mr-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className={`mendable-textarea resize-none ${textareaHeight} pr-12 w-full min-h-[40px] p-2 rounded-lg border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all`}
        />
        {browserSupportsSpeechRecognition && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1"
            onClick={toggleSpeech}
          >
            <MicIcon className={listening ? "text-red-500" : "text-gray-500"} />
          </Button>
        )}
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !input.trim()}
        className="h-[40px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Ring size={20} lineWeight={5} speed={1} color="white" />
            <span>Sending...</span>
          </div>
        ) : (
          "Send"
        )}
      </Button>
    </form>
  );
} 