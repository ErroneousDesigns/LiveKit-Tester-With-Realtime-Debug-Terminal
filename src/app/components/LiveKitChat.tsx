import { useState, useEffect, useRef } from "react";
import { useDataChannel } from "@livekit/components-react";
import {
  Send,
  MessageSquare,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { RoomTheme } from "../utils/livekit";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
}

interface LiveKitChatProps {
  theme: RoomTheme;
  participantName: string;
}

export function LiveKitChat({
  theme,
  participantName,
}: LiveKitChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [chatTheme, setChatTheme] = useState({
    fontSize: 14,
    showTimestamps: true,
    compactMode: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dataChannel = useDataChannel("chat", (data) => {
    try {
      if (data?.payload) {
        const decoded = new TextDecoder().decode(data.payload);
        const msg = JSON.parse(decoded) as ChatMessage;
        console.log("[Chat] Message received:", msg);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err) {
      console.error("[Chat] Failed to decode message:", err);
    }
  });

  const send = dataChannel?.send;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !send) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: participantName,
      message: input,
      timestamp: Date.now(),
    };

    try {
      const encoded = new TextEncoder().encode(
        JSON.stringify(message),
      );
      send(encoded);
      setMessages((prev) => [...prev, message]);
      console.log("[Chat] Message sent:", message);
      setInput("");
    } catch (err) {
      console.error("[Chat] Failed to send message:", err);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 rounded-full shadow-lg p-4 transition-all hover:scale-110"
        style={{ backgroundColor: theme.primaryColor }}
      >
        <MessageSquare
          className="w-6 h-6"
          style={{ color: theme.textColor }}
        />
      </button>
    );
  }

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.primaryColor + "40",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: theme.primaryColor,
          borderColor: theme.primaryColor + "80",
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare
            className="w-5 h-5"
            style={{ color: theme.textColor }}
          />
          <h3
            className="font-semibold"
            style={{ color: theme.textColor }}
          >
            Chat
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: theme.textColor + "20",
              color: theme.textColor,
            }}
          >
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-white/10 transition"
          >
            <SettingsIcon
              className="w-4 h-4"
              style={{ color: theme.textColor }}
            />
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded hover:bg-white/10 transition"
          >
            <X
              className="w-4 h-4"
              style={{ color: theme.textColor }}
            />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="p-3 border-b space-y-2"
          style={{ borderColor: theme.primaryColor + "40" }}
        >
          <div className="flex items-center justify-between">
            <label
              className="text-xs"
              style={{ color: theme.textColor + "cc" }}
            >
              Font Size
            </label>
            <input
              type="range"
              min="12"
              max="18"
              value={chatTheme.fontSize}
              onChange={(e) =>
                setChatTheme({
                  ...chatTheme,
                  fontSize: Number(e.target.value),
                })
              }
              className="w-24"
            />
          </div>
          <div className="flex items-center justify-between">
            <label
              className="text-xs"
              style={{ color: theme.textColor + "cc" }}
            >
              Show Timestamps
            </label>
            <button
              onClick={() =>
                setChatTheme({
                  ...chatTheme,
                  showTimestamps: !chatTheme.showTimestamps,
                })
              }
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors`}
              style={{
                backgroundColor: chatTheme.showTimestamps
                  ? theme.accentColor
                  : theme.textColor + "40",
              }}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  chatTheme.showTimestamps
                    ? "translate-x-5"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label
              className="text-xs"
              style={{ color: theme.textColor + "cc" }}
            >
              Compact Mode
            </label>
            <button
              onClick={() =>
                setChatTheme({
                  ...chatTheme,
                  compactMode: !chatTheme.compactMode,
                })
              }
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors`}
              style={{
                backgroundColor: chatTheme.compactMode
                  ? theme.accentColor
                  : theme.textColor + "40",
              }}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  chatTheme.compactMode
                    ? "translate-x-5"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-sm opacity-50"
              style={{ color: theme.textColor }}
            >
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg ${chatTheme.compactMode ? "p-2" : "p-3"}`}
              style={{
                backgroundColor: theme.primaryColor + "20",
              }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-medium ${chatTheme.compactMode ? "text-xs" : "text-sm"}`}
                  style={{ color: theme.accentColor }}
                >
                  {msg.sender}
                </span>
                {chatTheme.showTimestamps && (
                  <span
                    className="text-xs opacity-60"
                    style={{ color: theme.textColor }}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                )}
              </div>
              <p
                className={`mt-1 ${chatTheme.compactMode ? "text-xs" : "text-sm"}`}
                style={{
                  color: theme.textColor,
                  fontSize: `${chatTheme.fontSize}px`,
                }}
              >
                {msg.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{ borderColor: theme.primaryColor + "40" }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && handleSend()
            }
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg outline-none"
            style={{
              backgroundColor: theme.primaryColor + "20",
              color: theme.textColor,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !send}
            className="px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Send
              className="w-4 h-4"
              style={{ color: theme.textColor }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}