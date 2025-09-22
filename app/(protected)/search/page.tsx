"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Send,
  MessageCircle,
  Users,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Copy,
} from "lucide-react";
import { sendJinaMessage } from "@/app/actions/jina-chat";

interface SubredditInput {
  name: string;
  numPosts: number | "";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  thinkingSteps?: string[];
}

interface StreamingStatus {
  phase:
    | "connecting"
    | "thinking"
    | "searching"
    | "reading"
    | "analyzing"
    | "writing"
    | "complete";
  message: string;
  sources?: string[];
  reasoningSteps?: string[];
  isCollapsed?: boolean;
}

interface SuggestedPrompt {
  title: string;
  prompt: string;
  icon: React.ReactNode;
}

const suggestedPrompts: SuggestedPrompt[] = [
  {
    title: "Find Youth Communities",
    prompt:
      "Help me identify online communities and digital spaces where Singapore youths aged 12-19 gather to discuss mental health, share struggles, or seek peer support.",
    icon: <Users className="w-4 h-4" />,
  },
  {
    title: "Social Media Platforms",
    prompt:
      "What are the most popular social media platforms and online spaces used by Singapore teenagers for emotional expression and venting?",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    title: "Gaming & Discord Communities",
    prompt:
      "Identify gaming communities, Discord servers, and online forums popular among Singapore teens where mental health discussions or emotional support naturally occur.",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    title: "Reddit & Forum Spaces",
    prompt:
      "Find Singapore-specific subreddits and online forums where young people aged 12-19 might share personal struggles, seek advice, or discuss mental health topics.",
    icon: <RefreshCw className="w-4 h-4" />,
  },
];

export default function SubredditScraper() {
  // Subreddit scraper state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<SubredditInput[]>([
    { name: "", numPosts: 10 },
  ]);

  // Chat interface state with persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] =
    useState<StreamingStatus | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleNameChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index].name = value;
    setInputs(newInputs);
  };

  const handleNumPostsChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    // Only allow numbers or empty string to allow clearing field
    newInputs[index].numPosts = value === "" ? "" : Number(value);
    setInputs(newInputs);
  };

  const addInputRow = () => {
    setInputs((prev) => [...prev, { name: "", numPosts: "" }]);
  };

  // Generate unique session ID
  const generateSessionId = () => {
    return `chat-session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  };

  // Save chat session to localStorage
  const saveChatSession = (
    messages: ChatMessage[],
    currentSessionId: string
  ) => {
    try {
      const sessionData = {
        id: currentSessionId,
        messages: messages,
        timestamp: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      localStorage.setItem(
        `jina-chat-${currentSessionId}`,
        JSON.stringify(sessionData)
      );

      // Also maintain a list of all sessions
      const existingSessions = JSON.parse(
        localStorage.getItem("jina-chat-sessions") || "[]"
      );
      const sessionIndex = existingSessions.findIndex(
        (s: { id: string }) => s.id === currentSessionId
      );

      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = {
          id: currentSessionId,
          timestamp: sessionData.timestamp,
          lastActive: sessionData.lastActive,
          messageCount: messages.length,
        };
      } else {
        existingSessions.push({
          id: currentSessionId,
          timestamp: sessionData.timestamp,
          lastActive: sessionData.lastActive,
          messageCount: messages.length,
        });
      }

      localStorage.setItem(
        "jina-chat-sessions",
        JSON.stringify(existingSessions)
      );
    } catch (error) {
      console.warn("Failed to save chat session:", error);
    }
  };

  // Load chat session from localStorage
  const loadChatSession = useCallback(
    (sessionIdToLoad: string): ChatMessage[] => {
      try {
        const sessionData = localStorage.getItem(
          `jina-chat-${sessionIdToLoad}`
        );
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          return parsed.messages || [];
        }
      } catch (error) {
        console.warn("Failed to load chat session:", error);
      }
      return [];
    },
    []
  );

  // Get or create current session
  const getCurrentSession = useCallback((): string => {
    // Try to get the last active session
    const sessions = JSON.parse(
      localStorage.getItem("jina-chat-sessions") || "[]"
    );
    if (sessions.length > 0) {
      // Sort by last active and return the most recent
      sessions.sort(
        (a: { lastActive: string }, b: { lastActive: string }) =>
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );
      return sessions[0].id;
    }

    // Create new session if none exists
    return generateSessionId();
  }, []);

  // Initialize session and load persisted messages
  useEffect(() => {
    const initializeSession = () => {
      const currentSessionId = getCurrentSession();
      setSessionId(currentSessionId);

      // Load existing messages for this session
      const savedMessages = loadChatSession(currentSessionId);
      if (savedMessages.length > 0) {
        setChatMessages(savedMessages);
      }
    };

    initializeSession();
  }, [getCurrentSession, loadChatSession]);

  // Auto-save messages when they change
  useEffect(() => {
    if (sessionId && chatMessages.length > 0) {
      // Debounce saving to avoid too frequent saves during streaming
      const saveTimeout = setTimeout(() => {
        saveChatSession(chatMessages, sessionId);
      }, 1000);

      return () => clearTimeout(saveTimeout);
    }
  }, [chatMessages, sessionId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [chatInput]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Filter out rows with empty name or invalid numPosts
    const validInputs = inputs.filter(
      ({ name, numPosts }) => name.trim() && numPosts && numPosts > 0
    );

    if (validInputs.length === 0) {
      setError(
        "Please enter at least one valid subreddit and number of posts."
      );
      setLoading(false);
      return;
    }
    const payload = {
      subreddits: validInputs.reduce<Record<string, number>>((acc, cur) => {
        acc[cur.name.trim()] = cur.numPosts as number;
        return acc;
      }, {}),
    };

    try {
      console.log("Submitting payload:", payload);
      const response = await fetch(
        "https://reddit-scrapper-smu.apps.innovate.sg-cna.com/scrape",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      setSuccess(true);
      window.location.reload();
    } catch (err: unknown) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || chatInput.trim();
    if (!content || chatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    // Set initial connecting status
    setStreamingStatus({
      phase: "connecting",
      message: "Connecting to Jina AI...",
      isCollapsed: false,
    });

    try {
      // Simulate connection delay with status updates
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStreamingStatus({
        phase: "thinking",
        message: "Thinking...",
        reasoningSteps: [],
        isCollapsed: false,
      });

      // Prepare messages for API
      const apiMessages = [...chatMessages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const stream = await sendJinaMessage(apiMessages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        thinkingSteps: [],
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      // Process streaming response with enhanced status updates
      let accumulatedContent = "";
      const currentThinkingSteps: string[] = [];
      let phaseCounter = 0;

      // Simulate different phases of processing
      const phases = [
        {
          phase: "searching" as const,
          message: "🔍 Searching digital spaces and communities...",
        },
        {
          phase: "reading" as const,
          message: "📚 Reading and analyzing sources...",
          sources: ["sma.org.sg", "healthhub.sg", "mindline.sg"],
        },
        {
          phase: "analyzing" as const,
          message: "🧠 Analyzing community patterns and engagement...",
        },
        {
          phase: "writing" as const,
          message: "✍️ Formulating comprehensive insights...",
        },
      ];

      // Update status every 2 seconds to show progress
      const statusInterval = setInterval(() => {
        if (phaseCounter < phases.length) {
          const currentPhase = phases[phaseCounter];
          setStreamingStatus({
            phase: currentPhase.phase,
            message: currentPhase.message,
            sources: currentPhase.sources,
            reasoningSteps: currentThinkingSteps,
            isCollapsed: false,
          });
          phaseCounter++;
        }
      }, 2000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Handle different types of streaming data
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                accumulatedContent += content;

                // Update content in real-time
                setChatMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg
                  )
                );
              }

              // Handle reasoning steps if provided
              if (parsed.reasoning_step) {
                currentThinkingSteps.push(parsed.reasoning_step);
                setStreamingStatus((prev) =>
                  prev
                    ? {
                        ...prev,
                        reasoningSteps: [...currentThinkingSteps],
                      }
                    : null
                );
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming response:", parseError);
            }
          }
        }
      }

      // Clear status interval and mark as complete
      clearInterval(statusInterval);
      setStreamingStatus({
        phase: "complete",
        message: "Response complete",
        isCollapsed: true,
      });

      // Mark streaming as complete
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
        )
      );

      // Hide status after a brief delay
      setTimeout(() => setStreamingStatus(null), 1000);
    } catch (error) {
      console.error("Chat error:", error);
      setChatError("Failed to get response. Please try again.");
      setStreamingStatus(null);

      // Mark any streaming message as failed and save state
      setChatMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg.isStreaming
            ? {
                ...msg,
                isStreaming: false,
                content: msg.content + "\n\n⚠️ Stream interrupted",
              }
            : msg
        );

        // Save the updated state
        if (sessionId) {
          saveChatSession(updatedMessages, sessionId);
        }

        return updatedMessages;
      });
    } finally {
      setChatLoading(false);
      setStreamingStatus(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard");
    });
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatError(null);

    // Clear from localStorage and start new session
    if (sessionId) {
      localStorage.removeItem(`jina-chat-${sessionId}`);

      // Remove from sessions list
      const sessions = JSON.parse(
        localStorage.getItem("jina-chat-sessions") || "[]"
      );
      const filteredSessions = sessions.filter(
        (s: { id: string }) => s.id !== sessionId
      );
      localStorage.setItem(
        "jina-chat-sessions",
        JSON.stringify(filteredSessions)
      );
    }

    // Generate new session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
  };

  // Enhanced status display component
  const StreamingStatusDisplay = ({ status }: { status: StreamingStatus }) => {
    const [isCollapsed, setIsCollapsed] = useState(status.isCollapsed);

    if (!status) return null;

    return (
      <div className="flex justify-start">
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <span className="text-sm text-gray-600 ml-2">{status.message}</span>
            {(status.reasoningSteps?.length || status.sources?.length) && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                {isCollapsed ? "▼" : "▲"}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="space-y-2">
              {/* Reasoning Steps */}
              {status.reasoningSteps && status.reasoningSteps.length > 0 && (
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Reasoning:</div>
                  {status.reasoningSteps.map((step, index) => (
                    <div key={index} className="ml-2">
                      • {step}
                    </div>
                  ))}
                </div>
              )}

              {/* Sources being read */}
              {status.sources && status.sources.length > 0 && (
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Reading:</div>
                  <div className="flex flex-wrap gap-1">
                    {status.sources.map((source, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded text-xs"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-6 py-8">
        <div className="w-full flex-1 p-8">
          <div className="w-full max-w-2xl mx-auto mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">
                Subreddit Voyager
              </h2>
              <p>
                Enter the subreddit name(s) and the number of posts you need.
                We&apos;ll gather the content for you automatically.
              </p>
            </div>
          </div>

          <div className="w-full max-w-2xl mx-auto bg-gray-100 rounded-lg px-6 py-4">
            <div className="space-y-4">
              {inputs.map((input, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Subreddit name (e.g., depression)"
                    className="flex-1 bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={input.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Posts"
                    min={1}
                    className="w-24 bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={input.numPosts === "" ? "" : input.numPosts}
                    onChange={(e) =>
                      handleNumPostsChange(index, e.target.value)
                    }
                  />
                </div>
              ))}

              <button
                onClick={addInputRow}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another subreddit
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                disabled={loading}
                type="button"
              >
                <Send className="w-4 h-4" />
                {loading ? "Scraping..." : "Start Searching"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">
                  Scraping started successfully!
                </p>
              </div>
            )}
          </div>

          {/* AI Youth Outreach Assistant */}
          <div className="w-full max-w-4xl mx-auto mt-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-black">
                    The AI Voyager
                  </h2>
                </div>

                {/* Session indicator and controls */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Session Active</span>
                  </div>
                  {chatMessages.length > 0 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {chatMessages.length} messages
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600">
                Get AI-powered insights on where to find and connect with
                Singapore youths in digital spaces. Ask about online
                communities, platforms, and outreach strategies.
                <span className="text-xs text-gray-400 ml-2">
                  💾 Your conversation is automatically saved
                </span>
              </p>
            </div>

            {/* Suggested Prompts - Show only when no messages */}
            {chatMessages.length === 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Suggested Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt.prompt)}
                      disabled={chatLoading}
                      className="text-left p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {prompt.icon}
                        <span className="font-medium text-blue-800">
                          {prompt.title}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{prompt.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div
              className="bg-gray-50 rounded-lg p-4 mb-4"
              style={{
                minHeight: "300px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {/* Show thinking steps if available */}
                      {message.role === "assistant" &&
                        message.thinkingSteps &&
                        message.thinkingSteps.length > 0 && (
                          <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-blue-200">
                            <div className="font-medium mb-1">
                              🧠 Reasoning:
                            </div>
                            {message.thinkingSteps.map((step, index) => (
                              <div key={index} className="mb-1">
                                • {step}
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Main content */}
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* Streaming indicator */}
                      {message.isStreaming && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span>Streaming response...</span>
                        </div>
                      )}

                      {message.role === "assistant" &&
                        message.content &&
                        !message.isStreaming && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                            <span className="text-xs text-gray-400">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {(chatLoading || streamingStatus) && streamingStatus && (
                  <StreamingStatusDisplay status={streamingStatus} />
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Error Display */}
            {chatError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{chatError}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about youth communities, digital spaces, or outreach strategies..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={chatLoading}
                  />
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
                {chatMessages.length > 0 && (
                  <button
                    onClick={clearChat}
                    disabled={chatLoading}
                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
