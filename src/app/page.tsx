import Chat from "@/components/chat";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="w-[440px] shadow-lg border rounded-md bg-white">
        <Chat />
      </div>
    </div>
  );
}

