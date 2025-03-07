"use client";

import { useState, useRef, useEffect } from "react";
import { NarrativeEvent } from "@/types/narrative/article";
import { useCenterControl } from "@/contexts/center-control-context";
import { Send, User, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  events: NarrativeEvent[];
  className?: string;
}

const MAX_MESSAGES = 20;

export function ChatInterface({ events, className = "" }: ChatInterfaceProps) {
  const { selectedEventId, getSelectedEvent } = useCenterControl();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. Ask me anything about this narrative. You have 20 messages remaining.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [previousSelectedEventId, setPreviousSelectedEventId] = useState<
    number | null
  >(null);

  // Calculate remaining messages
  const userMessageCount = messages.filter((msg) => msg.role === "user").length;
  const remainingMessages = MAX_MESSAGES - userMessageCount;
  const hasReachedLimit = remainingMessages <= 0;

  // Effect to handle selected event changes
  useEffect(() => {
    // Only proceed if the selectedEventId has changed and is not null
    if (
      selectedEventId !== previousSelectedEventId &&
      selectedEventId !== null
    ) {
      const selectedEvent = getSelectedEvent();

      if (selectedEvent) {
        // Create a suggestion message about the selected event
        const newMessage: Message = {
          role: "assistant",
          content: `I notice you've selected event #${selectedEventId}: "${selectedEvent.text.substring(
            0,
            100
          )}${
            selectedEvent.text.length > 100 ? "..." : ""
          }" Would you like to know more about this event?`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Pre-fill the input with a question about the event
        setInput(`Tell me more about event #${selectedEventId}`);
      }
    }

    // Update the previous selected event ID
    setPreviousSelectedEventId(selectedEventId);
  }, [selectedEventId, getSelectedEvent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle when a new event is selected
  useEffect(() => {
    if (selectedEventId !== null && selectedEventId !== undefined) {
      const selectedEvent = events.find(
        (event) => event.index === selectedEventId
      );
      if (selectedEvent) {
        // Add a system message about the selected event
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Event selected: "${selectedEvent.text}"`,
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [selectedEventId, events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || hasReachedLimit) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // TODO: Implement API call to OpenAI
      // This is a placeholder for the actual API implementation
      setTimeout(() => {
        const placeholderResponse: Message = {
          role: "assistant",
          content: hasReachedLimit
            ? "You have reached the maximum number of messages. The chat is now closed."
            : "This is a placeholder response. The actual OpenAI API integration will be implemented later.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, placeholderResponse]);
        setIsLoading(false);
      }, 1000);

      // Actual implementation would look something like:
      /*
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          events,
          selectedEventId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      */
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      // Focus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = "auto";

    // Set the height to scrollHeight + 2px for border
    const newHeight = Math.min(e.target.scrollHeight, 100);
    e.target.style.height = `${newHeight}px`;
  };

  // Handle Enter key to submit (with Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex flex-col h-full bg-white overflow-hidden ${className}`}
    >
      {/* Compact Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-100 flex items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2">
            <Bot className="w-3 h-3 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              AI Assistant
            </h2>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-auto p-2 space-y-2 bg-white text-xs">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } ${
              index > 0 && messages[index - 1].role === message.role
                ? "mt-1"
                : "mt-2"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 mt-1 flex-shrink-0">
                <Bot className="w-3 h-3 text-gray-600" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-lg px-2 py-1.5 ${
                message.role === "user"
                  ? "bg-gray-800 text-white rounded-tr-none"
                  : message.role === "system"
                  ? "bg-gray-100 text-gray-600 italic text-xs"
                  : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap text-xs">
                {message.content}
              </div>
              <div
                className={`text-[9px] mt-0.5 text-right ${
                  message.role === "user" ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center ml-1 mt-1 flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-1 flex-shrink-0">
              <Bot className="w-3 h-3 text-gray-600" />
            </div>
            <div className="bg-gray-100 text-gray-500 rounded-lg px-2 py-1.5 rounded-tl-none">
              <div className="flex space-x-1">
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-gray-100 bg-white flex flex-col gap-1"
      >
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="text-xs text-gray-500">
            {remainingMessages} messages remaining
          </div>
          <div className="text-[9px] text-gray-400">
            {input.length > 0 && "Press Enter to send"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                hasReachedLimit
                  ? "Message limit reached"
                  : "Type your message..."
              }
              className={`w-full border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none min-h-[40px] max-h-[100px] text-xs ${
                hasReachedLimit ? "bg-gray-50 cursor-not-allowed" : ""
              }`}
              disabled={isLoading || hasReachedLimit}
              rows={3}
            />
          </div>
          <button
            type="submit"
            className={`p-1.5 rounded-lg ${
              isLoading || !input.trim() || hasReachedLimit
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
            disabled={isLoading || !input.trim() || hasReachedLimit}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
