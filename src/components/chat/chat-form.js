import { useEnsureRegeneratorRuntime } from "../../app/hook/useEnsureRegeneratorRuntime";
import { useEffect, useRef, useState } from "react";
import { Ring } from "@uiball/loaders";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { MicIcon } from "../icons/mic-icon";
import "./chat-form.css";

export default function SendForm({
  input,
  handleSubmit,
  isLoading,
  handleInputChange,
}) {
  useEnsureRegeneratorRuntime();

  const {
    listening,
    resetTranscript,
    transcript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

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
      handleInputChange({ target: { value: transcript } });
    }
  }, [transcript, handleInputChange]);

  const toggleSpeech = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
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
    <form onSubmit={handleSubmit} className="chat-form">
      <div className="input-container">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="chat-input"
        />
        {browserSupportsSpeechRecognition && (
          <button
            type="button"
            className="mic-button"
            onClick={toggleSpeech}
          >
            <MicIcon className={listening ? "text-red-500" : "text-gray-500"} />
          </button>
        )}
      </div>
      <button 
        type="submit" 
        className="send-button"
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Ring size={20} lineWeight={5} speed={1} color="white" />
            <span>Sending...</span>
          </div>
        ) : (
          "Send"
        )}
      </button>
    </form>
  );
} 