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
  ExternalLink,
  Search,
  Lightbulb,
} from "lucide-react";

interface SubredditInput {
  name: string;
  numPosts: number | "";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  promptData?: {
    optimizedPrompt: string;
    searchStrategy: string;
    expectedResults: string[];
    jinaSearchUrl: string;
    reasoning: string;
  };
}

interface SuggestedPrompt {
  title: string;
  prompt: string;
  icon: React.ReactNode;
  description: string;
}

const suggestedPrompts: SuggestedPrompt[] = [
  {
    title: "Find Youth Communities",
    prompt:
      "Find online communities where Singapore youths discuss mental health and seek peer support",
    icon: <Users className="w-4 h-4" />,
    description:
      "Discover online spaces where Singapore teens connect and share experiences",
  },
  {
    title: "Discord Servers",
    prompt:
      "Locate Discord servers for Singapore teens with anxiety and depression",
    icon: <MessageSquare className="w-4 h-4" />,
    description:
      "Find Discord communities where teens express emotions and seek support",
  },
  {
    title: "Gaming Communities",
    prompt:
      "Find gaming Discord servers and communities popular among Singapore teens with mental health discussions",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Find gaming and Discord spaces with supportive communities",
  },
  {
    title: "Reddit Subreddits",
    prompt:
      "Find Singapore-specific subreddits where young people share personal struggles and seek advice",
    icon: <RefreshCw className="w-4 h-4" />,
    description:
      "Locate Singapore-focused forums and subreddits for youth support",
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
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prompt generation context
  const [promptContext, setPromptContext] = useState({
    targetAudience: "Singapore youths aged 12-19",
    platform: "Any",
    outreachGoal: "Mental health support",
    location: "Singapore",
  });

  // Copy feedback state
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

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
        `local-chat-${currentSessionId}`,
        JSON.stringify(sessionData)
      );

      // Also maintain a list of all sessions
      const existingSessions = JSON.parse(
        localStorage.getItem("local-chat-sessions") || "[]"
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
        "local-chat-sessions",
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
          `local-chat-${sessionIdToLoad}`
        );
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          const messages = parsed.messages || [];
          // Convert timestamp strings back to Date objects
          return messages.map((msg: ChatMessage & { timestamp: string }) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
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
      localStorage.getItem("local-chat-sessions") || "[]"
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

    try {
      // Call the Jina prompt generator API
      const response = await fetch("/api/v1/jina-prompt-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userQuery: content,
          context: promptContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      const promptData = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `## 🎯 Optimized Jina AI Search Prompt

**Your Query:** "${content}"

**Generated Prompt:**
${promptData.optimizedPrompt}

**Search Strategy:** ${promptData.searchStrategy}

**Expected Results:**
${promptData.expectedResults.map((result: string) => `• ${result}`).join("\n")}

**Reasoning:** ${promptData.reasoning}

---
*Click "Open Jina AI Search" to open Jina AI, then copy and paste the optimized prompt above into the search box.*`,
        timestamp: new Date(),
        promptData, // Store the prompt data for the button
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatError("Failed to generate search prompt. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, itemId?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (itemId) {
        // Add to copied items set
        setCopiedItems((prev) => new Set(prev).add(itemId));
        // Remove after 2 seconds
        setTimeout(() => {
          setCopiedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 2000);
      }
      console.log("Copied to clipboard");
    });
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatError(null);

    // Clear from localStorage and start new session
    if (sessionId) {
      localStorage.removeItem(`local-chat-${sessionId}`);

      // Remove from sessions list
      const sessions = JSON.parse(
        localStorage.getItem("local-chat-sessions") || "[]"
      );
      const filteredSessions = sessions.filter(
        (s: { id: string }) => s.id !== sessionId
      );
      localStorage.setItem(
        "local-chat-sessions",
        JSON.stringify(filteredSessions)
      );
    }

    // Generate new session
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
  };

  const openJinaSearch = (query?: string) => {
    const baseUrl = "https://search.jina.ai/";
    const url = query ? `${baseUrl}?q=${encodeURIComponent(query)}` : baseUrl;
    window.open(url, "_blank", "noopener,noreferrer");
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
                    DeepSearch Prompt Generator
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

            {/* Jina AI Integration Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    AI-Powered Prompt Generator
                  </h3>
                  <p className="text-blue-800 text-sm mb-3">
                    Our AI assistant uses Gemini 2.5 Flash to generate optimized
                    prompts for Jina AI Deep Search, helping you find the most
                    relevant online communities and digital spaces for outreach.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openJinaSearch()}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Open Jina AI Search
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>
                        Set reasoning effort to &quot;High&quot; for best
                        results
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Context Configuration */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Search Context</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={promptContext.targetAudience}
                    onChange={(e) =>
                      setPromptContext((prev) => ({
                        ...prev,
                        targetAudience: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Singapore youths aged 12-19">
                      Singapore youths aged 12-19
                    </option>
                    <option value="Singapore teens with anxiety">
                      Singapore teens with anxiety
                    </option>
                    <option value="Singapore students with depression">
                      Singapore students with depression
                    </option>
                    <option value="Singapore gaming communities">
                      Singapore gaming communities
                    </option>
                    <option value="Singapore international students">
                      Singapore international students
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Platform Preference
                  </label>
                  <select
                    value={promptContext.platform}
                    onChange={(e) =>
                      setPromptContext((prev) => ({
                        ...prev,
                        platform: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Any">Any Platform</option>
                    <option value="Reddit">Reddit</option>
                    <option value="Discord">Discord</option>
                    <option value="Forums">Online Forums</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Gaming Platforms">Gaming Platforms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Outreach Goal
                  </label>
                  <select
                    value={promptContext.outreachGoal}
                    onChange={(e) =>
                      setPromptContext((prev) => ({
                        ...prev,
                        outreachGoal: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mental health support">
                      Mental health support
                    </option>
                    <option value="Peer support groups">
                      Peer support groups
                    </option>
                    <option value="Crisis intervention">
                      Crisis intervention
                    </option>
                    <option value="Community building">
                      Community building
                    </option>
                    <option value="Research and data collection">
                      Research and data collection
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Location Focus
                  </label>
                  <select
                    value={promptContext.location}
                    onChange={(e) =>
                      setPromptContext((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Singapore">Singapore</option>
                    <option value="Singapore + Regional">
                      Singapore + Regional
                    </option>
                    <option value="Global">Global</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Suggested Prompts - Always visible */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Suggested Research Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {prompt.icon}
                      <span className="font-medium text-gray-800">
                        {prompt.title}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {prompt.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSendMessage(prompt.prompt)}
                        disabled={chatLoading}
                        className="flex-1 text-left p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        Generate Prompt
                      </button>
                      <button
                        onClick={() => openJinaSearch(prompt.prompt)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        Direct Search
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                      {/* Main content */}
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* Loading indicator */}
                      {message.role === "assistant" && chatLoading && (
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
                          <span>Thinking...</span>
                        </div>
                      )}

                      {message.role === "assistant" &&
                        message.content &&
                        !chatLoading && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {/* Jina AI Action Buttons */}
                            {message.promptData && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                <button
                                  onClick={() => openJinaSearch()}
                                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                  <Search className="w-4 h-4" />
                                  Open Jina AI Search
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Standard message actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    message.content,
                                    `response-${message.id}`
                                  )
                                }
                                className={`text-xs flex items-center gap-1 transition-colors ${
                                  copiedItems.has(`response-${message.id}`)
                                    ? "text-green-600"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                {copiedItems.has(`response-${message.id}`)
                                  ? "Copied!"
                                  : "Copy Prompt"}
                              </button>
                              <span className="text-xs text-gray-400">
                                {message.timestamp instanceof Date
                                  ? message.timestamp.toLocaleTimeString()
                                  : new Date(
                                      message.timestamp
                                    ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}

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
                    placeholder="Ask about finding online communities, Discord servers, subreddits, or outreach opportunities..."
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
