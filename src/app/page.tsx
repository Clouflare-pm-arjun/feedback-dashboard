"use client";

import { useState, useEffect } from "react";
import QueryInput from "@/components/QueryInput";
import PromptCards from "@/components/PromptCards";
import FeedbackTable from "@/components/FeedbackTable";
import CategoryPieChart from "@/components/CategoryPieChart";
import DailyBarChart from "@/components/DailyBarChart";
import ChatContainer, { type ChatMessage } from "@/components/ChatContainer";
import type {
  ProcessedFeedback,
  SearchResponse,
  StatsResponse,
  CategoryStats,
  DailyStats,
  FeedbackListResponse,
} from "@/types/feedback";

export default function Dashboard() {
  const [feedbacks, setFeedbacks] = useState<ProcessedFeedback[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Fetch initial data from R2
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch feedback data
        const feedbackResponse = await fetch("/api/r2/feedback");
        if (!feedbackResponse.ok) {
          throw new Error("Failed to fetch feedback data");
        }
        const feedbackData =
          (await feedbackResponse.json()) as FeedbackListResponse;
        if (feedbackData.success) {
          setFeedbacks(feedbackData.data || []);
        } else {
          throw new Error(feedbackData.error || "Failed to fetch feedback");
        }

        // Fetch statistics
        const statsResponse = await fetch("/api/stats");
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch statistics");
        }
        const statsData: StatsResponse = await statsResponse.json();
        if (statsData.success) {
          setCategories(statsData.categories || []);
          setDaily(statsData.daily || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search with streaming
  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setIsStreaming(true);

    // Add user message to chat
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: "user",
      content: query,
      isStreaming: true,
    };
    setChatMessages((prev) => [...prev, userMessage]);

    // Add assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      type: "assistant",
      content: "",
      isStreaming: true,
    };
    setChatMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, stream: true }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      // Check if response is streaming (text/event-stream) or JSON
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        let accumulatedContent = "";
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Stream completed - process any remaining buffered data
              if (buffer.trim()) {
                const lines = buffer.split("\n");
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim();
                    if (data && data !== "[DONE]") {
                      try {
                        const parsed = JSON.parse(data);
                        if (parsed.response) {
                          accumulatedContent += parsed.response;
                        }
                      } catch {
                        // Skip invalid JSON
                      }
                    }
                  }
                }
              }

              // Update with final content and stop streaming
              setChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        isStreaming: false,
                      }
                    : msg.id === userMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              setIsStreaming(false);
              break;
            }

            // Decode chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split("\n");

            // Process complete lines (keep last incomplete line in buffer)
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (!data || data === "[DONE]") {
                  // Stream ended
                  setIsStreaming(false);
                  setChatMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg.id === userMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.response) {
                    accumulatedContent += parsed.response;
                    setChatMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          // Ensure spinner stops even if stream errors
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: accumulatedContent || "Error: Stream interrupted",
                    isStreaming: false,
                  }
                : msg.id === userMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
          setIsStreaming(false);
        }
      } else {
        // Handle non-streaming JSON response (fallback)
        const data: SearchResponse = await response.json();
        if (data.success && data.response) {
          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: data.response || "", isStreaming: false }
                : msg.id === userMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        } else {
          throw new Error(data.error || "Search failed");
        }
      }
    } catch (err) {
      console.error("Error searching:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Error: " +
                  (err instanceof Error ? err.message : "Search failed"),
                isStreaming: false,
              }
            : msg.id === userMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsSearching(false);
      setIsStreaming(false);
    }
  };

  // Handle prompt click
  const handlePromptClick = (prompt: string) => {
    handleSearch(prompt);
  };

  // Reset to all data
  const handleReset = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const feedbackResponse = await fetch("/api/r2/feedback");
      if (!feedbackResponse.ok) {
        throw new Error("Failed to fetch feedback data");
      }
      const feedbackData =
        (await feedbackResponse.json()) as FeedbackListResponse;
      if (feedbackData.success) {
        setFeedbacks(feedbackData.data || []);
      }

      const statsResponse = await fetch("/api/stats");
      if (!statsResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const statsData: StatsResponse = await statsResponse.json();
      if (statsData.success) {
        setCategories(statsData.categories || []);
        setDaily(statsData.daily || []);
      }
    } catch (err) {
      console.error("Error resetting data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">
              Loading dashboard...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-8">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Feedback Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Built by Arjun Acharya·{" "}
              <a
                href="https://linkedin.com/in/arjunacharya10/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                LinkedIn
              </a>
              {" · "}
              <a
                href="https://github.com/arjunacharya10/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GitHub
              </a>
            </p>
          </div>
          {feedbacks.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Reset to All Data
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Main Layout: 60% Chat, 40% Charts/Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8">
          {/* Left Side - Chat Container and Input (60%) */}
          <div className="flex flex-col">
            {/* Chat Container - Fixed height with internal scroll */}
            <ChatContainer messages={chatMessages} isStreaming={isStreaming} />
            {/* Input and Prompts - At bottom */}
            <div className="space-y-4 mt-4 flex-shrink-0">
              <QueryInput onSearch={handleSearch} isLoading={isSearching} />
              <PromptCards onPromptClick={handlePromptClick} />
            </div>
          </div>

          {/* Right Side - Charts and Table (40%) */}
          <div className="space-y-6 flex flex-col max-h-[calc(100vh-8rem)]">
            {/* Category Pie Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Feedback Distribution by Category
              </h2>
              <CategoryPieChart data={categories} />
            </div>

            {/* Daily Bar Chart */}
            <div className="bg-white dark:bg-gray-900 px-6 pt-6 pb-4 rounded-lg border border-gray-200 dark:border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Daily Feedback Distribution
              </h2>
              <DailyBarChart data={daily} />
            </div>

            {/* Data Table Section */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800 flex-1 min-h-0 flex flex-col overflow-hidden">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex-shrink-0">
                Feedback Data ({feedbacks.length} items)
              </h2>
              <div className="flex-1 overflow-auto min-h-0">
                <FeedbackTable data={feedbacks} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
