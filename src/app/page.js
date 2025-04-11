import Chat from "../components/chat";
import "./page.css";

export default function Home() {
  return (
    <div className="page-container">
      <div className="chat-wrapper">
        <Chat />
      </div>
    </div>
  );
} 