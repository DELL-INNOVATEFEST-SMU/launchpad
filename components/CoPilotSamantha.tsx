"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Send,
  Bot,
  Settings,
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

interface CoPilotSamanthaProps {
  isOpen: boolean;
  onToggle: () => void;
  context?: {
    currentSection?: string;
    caseNotes?: string;
  };
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: "available" | "unavailable" | "maintenance";
  responseTime: "fast" | "medium" | "slow";
  privacy: "local" | "cloud";
}

interface ModelConfig {
  selectedModel: string;
  availableModels: ModelInfo[];
  defaultModel: string;
}

interface ChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  context?: {
    currentSection?: string;
    caseNotes?: string;
  };
  systemPrompt?: string;
}

interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
  };
  model: string;
  timestamp: string;
}

/**
 * Co-Pilot Samantha - AI Assistant Sidebar Component
 * Provides AI-powered assistance for mental health case management
 */
export default function CoPilotSamantha({
  isOpen,
  onToggle,
  context,
}: CoPilotSamanthaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSystemPromptEditor, setShowSystemPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Co-Pilot Samantha, an AI assistant specialized in mental health case management. You help therapists and counselors with case analysis, note organization, treatment planning, and clinical documentation. You provide professional, empathetic, and evidence-based guidance while maintaining strict confidentiality and ethical standards."
  );
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const systemPromptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load model configuration and system prompt on mount
  useEffect(() => {
    fetchModelConfig();
    loadSystemPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputValue]);

  // Auto-resize system prompt textarea
  useEffect(() => {
    if (systemPromptTextareaRef.current && isEditingSystemPrompt) {
      systemPromptTextareaRef.current.style.height = "auto";
      systemPromptTextareaRef.current.style.height = `${Math.min(
        systemPromptTextareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [systemPrompt, isEditingSystemPrompt]);

  const loadSystemPrompt = useCallback(() => {
    const saved = localStorage.getItem("copilot-system-prompt");
    if (saved) {
      setSystemPrompt(saved);
    }
  }, []);

  const saveSystemPrompt = useCallback(() => {
    localStorage.setItem("copilot-system-prompt", systemPrompt);
    setIsEditingSystemPrompt(false);
  }, [systemPrompt]);

  const resetSystemPrompt = useCallback(() => {
    const defaultPrompt =
      "You are Co-Pilot Samantha, an AI assistant specialized in mental health case management. You help therapists and counselors with case analysis, note organization, treatment planning, and clinical documentation. You provide professional, empathetic, and evidence-based guidance while maintaining strict confidentiality and ethical standards.";
    setSystemPrompt(defaultPrompt);
    localStorage.setItem("copilot-system-prompt", defaultPrompt);
    setIsEditingSystemPrompt(false);
  }, []);

  const fetchModelConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/models");
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const config = await response.json();
      setModelConfig(config);
    } catch (error) {
      console.error("Failed to fetch model config:", error);
      setError("Failed to load AI models");
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !modelConfig) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Determine endpoint based on selected model
      const endpoint =
        modelConfig.selectedModel === "local-npu"
          ? "/api/v1/chat-local"
          : "/api/v1/chat";

      const requestBody: ChatRequest = {
        messages: [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        context,
        systemPrompt,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(),
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);

      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I apologize, but I'm experiencing technical difficulties: ${errorMessage}. Please try again or switch to a different AI model.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, modelConfig, messages, context, systemPrompt]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const updateModelSelection = useCallback(
    async (modelId: string) => {
      if (!modelConfig) return;

      try {
        const response = await fetch("/api/v1/models", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectedModel: modelId }),
        });

        if (!response.ok) {
          throw new Error("Failed to update model selection");
        }

        setModelConfig((prev) =>
          prev ? { ...prev, selectedModel: modelId } : null
        );
        setShowModelSelector(false);
        setError(null);
      } catch (error) {
        console.error("Failed to update model:", error);
        setError("Failed to update AI model selection");
      }
    },
    [modelConfig]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600";
      case "unavailable":
        return "text-red-600";
      case "maintenance":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getResponseTimeColor = (responseTime: string) => {
    switch (responseTime) {
      case "fast":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "slow":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Don't render anything when sidebar is closed
  // The parent component (case-assistant) handles the toggle button
  if (!isOpen) {
    return null;
  }

  const selectedModelInfo = modelConfig?.availableModels.find(
    (m) => m.id === modelConfig.selectedModel
  );

  return (
    <div className="w-full lg:w-96 xl:w-[28rem] bg-white border-l border-gray-200 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              Co-Pilot Samantha
            </h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={isCollapsed ? "Expand" : "Collapse"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Close"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Error Display */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* System Prompt Editor */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowSystemPromptEditor(!showSystemPromptEditor)}
                  className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                >
                  <Edit3 className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {showSystemPromptEditor ? "Hide" : "Edit"} System Prompt
                  </span>
                  <span className="sm:hidden">
                    {showSystemPromptEditor ? "Hide" : "Edit"} Prompt
                  </span>
                </button>
                {showSystemPromptEditor && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={saveSystemPrompt}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Save system prompt"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={resetSystemPrompt}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      title="Reset to default"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {showSystemPromptEditor && (
                <div className="space-y-2">
                  <textarea
                    ref={systemPromptTextareaRef}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter system prompt..."
                    className="w-full p-2 text-xs border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    This controls how Samantha responds. Changes take effect for new conversations.
                  </p>
                </div>
              )}
            </div>

            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="w-full flex items-center justify-between p-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select AI model"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedModelInfo?.name || "Select Model"}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              </button>

              {showModelSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                  {modelConfig?.availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => updateModelSelection(model.id)}
                      disabled={model.status === "unavailable"}
                      className={`w-full text-left p-2 sm:p-3 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 last:border-b-0 ${
                        modelConfig.selectedModel === model.id
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm truncate">{model.name}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-xs ${getStatusColor(
                              model.status
                            )}`}
                          >
                            {model.status}
                          </span>
                          <span
                            className={`text-xs ${getResponseTimeColor(
                              model.responseTime
                            )}`}
                          >
                            {model.responseTime}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {model.description}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {model.privacy}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {model.capabilities.slice(0, 2).join(", ")}
                          {model.capabilities.length > 2 && "..."}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Messages - Fixed height container */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-4 sm:py-6">
                <Image
                  src="/co_pilot_samantha.png"
                  alt="Co-Pilot Samantha"
                  width={32}
                  height={32}
                  className="mx-auto mb-2 rounded-full sm:w-10 sm:h-10"
                />
                <p className="text-xs font-medium">
                  Hi! I&apos;m Co-Pilot Samantha.
                </p>
                <p className="text-xs mt-1">
                  Your AI assistant for case management.
                </p>
                <div className="mt-3 text-xs text-gray-400">
                  <p className="mb-1">I can help with:</p>
                  <ul className="space-y-0.5 text-xs">
                    <li>• Case analysis and insights</li>
                    <li>• Note organization</li>
                    <li>• Treatment planning</li>
                    <li>• Clinical documentation</li>
                  </ul>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 flex items-center gap-2 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.model && (
                      <span className="px-1 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                        {message.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-2 sm:p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      {selectedModelInfo?.responseTime === "fast"
                        ? "Thinking..."
                        : "Processing..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Samantha about your case..."
                className="flex-1 min-h-[50px] sm:min-h-[60px] max-h-[120px] p-2 sm:p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                disabled={isLoading}
                aria-label="Message input"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Clear conversation"
                    aria-label="Clear conversation"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}