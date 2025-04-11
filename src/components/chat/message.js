import React from "react";
import ReactMarkdown from "react-markdown";
import { Avatar } from "../avatar";
import { Ring } from "@uiball/loaders";
import "./message.css";

export default function Bubble({ message, loading = false }) {
  // Helper to handle tool-based markdown replacement
  const formatMessage = (content) => {
    if (!content) return ''; // Return empty string if content is undefined
    
    return content
      .replaceAll(`<|loading_tools|>`, `\n\n**Loading tools...**`)
      .replaceAll(`<|tool_error|>`, `\n\n⚠️ **Tool Error**`)
      .replaceAll(/\<\|tool_called[\s\S]*\$\$/g, (match) => {
        const parts = match.split("$$");
        return `\n\n**${parts[1]}** ${
          parts[2] === "false" ? "🛠️" : "⚡"
        }`;
      })
      .replace(/\n/g, "  \n"); 
  };

  // Early return if message is undefined
  if (!message) {
    return null;
  }

  return (
    <div key={message.id} className="message-container">
      {/* User Avatar */}
      <div className="avatar-container">
        {message.role === "user" && (
          <div className="avatar">
            <div className="avatar-inner">
              <svg
                stroke="none"
                fill="black"
                strokeWidth="0"
                viewBox="0 0 16 16"
                className="avatar-icon"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"></path>
              </svg>
            </div>
          </div>
        )}

        {/* Assistant Avatar */}
        {message.role === "assistant" && (
          <div className="avatar">
            <div className="avatar-inner">
              <svg
                stroke="none"
                fill="black"
                strokeWidth="0"
                viewBox="0 0 16 16"
                className="avatar-icon"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.48 1.48 0 0 0-1.065 1.065c-.413 1.566-.944 4.799-1.065 5.717a1.48 1.48 0 0 0 1.065 1.065c1.879.5 4.333.75 6.5.75s4.621-.25 6.5-.75a1.48 1.48 0 0 0 1.065-1.065c-.122-.918-.652-4.151-1.065-5.717a1.48 1.48 0 0 0-1.065-1.065c-.658-.215-1.777-.57-2.887-.87C9.843.266 8.69 0 8 0zm2.98 1.803c.877.25 1.499.558 1.98.99.48.43.777.96.777 1.407 0 .447-.297.977-.777 1.407-.481.432-1.103.74-1.98.99-.877.25-1.92.375-2.98.375s-2.103-.125-2.98-.375c-.877-.25-1.499-.558-1.98-.99-.48-.43-.777-.96-.777-1.407 0-.447.297-.977.777-1.407.481-.432 1.103-.74 1.98-.99.877-.25 1.92-.375 2.98-.375s2.103.125 2.98.375z"/>
                <path d="M8 6.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM12.75 5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM3.25 5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="message-content">
        {loading ? (
          <div className="loading-container">
            <Ring size={20} lineWeight={5} speed={1} color="black" />
            <span className="loading-text">Thinking...</span>
          </div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>
              {formatMessage(message.content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
} 