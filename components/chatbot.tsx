// components/chatbot.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionState } from "@/hooks/use-session-state";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type ChatbotProps = {
  data?: Record<string, any>[];
  storageKey?: string;
  section?: "amazon" | "asin";
};

function cleanNum(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v).replace(/[₹$€£,]/g, "").trim();
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function analyzeData(rows: Record<string, any>[], section: string) {
  if (!rows || rows.length === 0) return "No data available yet.";

  const columns = Object.keys(rows[0] || {});
  const metrics = {
    impressions: columns.find(c => /impression/i.test(c)),
    clicks: columns.find(c => /click/i.test(c)),
    spend: columns.find(c => /spend/i.test(c)),
    sales: columns.find(c => /sales/i.test(c)),
    orders: columns.find(c => /order/i.test(c)),
  };

  const totals: any = {};
  Object.entries(metrics).forEach(([key, col]) => {
    if (col) totals[key] = rows.reduce((sum, r) => sum + cleanNum(r[col]), 0);
  });

  const ctr = totals.clicks && totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "N/A";
  const roas = totals.sales && totals.spend ? (totals.sales / totals.spend).toFixed(2) : "N/A";
  const cpc = totals.spend && totals.clicks ? (totals.spend / totals.clicks).toFixed(2) : "N/A";

  const hasCategory = "Category" in (rows[0] || {});
  const categories = hasCategory ? [...new Set(rows.map(r => r.Category).filter(Boolean))].slice(0, 5) : [];
  const sample = rows.slice(0, 2);

  return `You have ${rows.length} rows of ${section === "amazon" ? "Amazon campaign" : "ASIN-level"} data.

**Columns:** ${columns.join(", ")}

**Metrics:**
- Impressions: ${totals.impressions?.toLocaleString('en-IN') || "N/A"}
- Clicks: ${totals.clicks?.toLocaleString('en-IN') || "N/A"}
- Spend: ₹${totals.spend?.toLocaleString('en-IN', {maximumFractionDigits: 0}) || "N/A"}
- Sales: ₹${totals.sales?.toLocaleString('en-IN', {maximumFractionDigits: 0}) || "N/A"}
- Orders: ${totals.orders?.toLocaleString('en-IN') || "N/A"}
- CTR: ${ctr}% | ROAS: ${roas} | CPC: ₹${cpc}

${hasCategory ? `**Categories:** ${categories.join(", ")}` : ""}

**Sample:** ${JSON.stringify(sample, null, 2)}`;
}

export default function Chatbot({ 
  data = [], 
  storageKey = "chatbot.history.v1",
  section = "amazon" 
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messagesRaw, setMessagesRaw] = useSessionState<Message[]>(storageKey, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // FIX: Ensure messages is always an array
  const messages = Array.isArray(messagesRaw) ? messagesRaw : [];
  const setMessages = (value: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof value === 'function') {
      setMessagesRaw((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return value(prevArray);
      });
    } else {
      setMessagesRaw(value);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearHistory = () => setMessages([]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const hasData = data && data.length > 0;
      const dataContext = hasData ? analyzeData(data, section) : "";
      
      const systemPrompt = hasData
        ? `You are an expert Amazon Ads analyst for "Excelerate".

**Section:** ${section === "amazon" ? "Campaign Collator" : "ASIN Collator"}

**Data:**
${dataContext}

**Instructions:**
- Analyze data and provide actionable insights
- Answer questions about ROAS, CPC, CTR, ACoS
- Identify top/bottom performers
- Format numbers in Indian style
- Keep responses under 120 words
- Be conversational and helpful`
        : `You are a helpful Amazon Ads assistant for "Excelerate".

**Help users:**
- Understand the tool
- Explain metrics (CPC, ROAS, CTR, ACoS)
- Guide on using features
- Keep responses concise`;

      const conversationHistory = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: input.trim() }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const assistantText = result.choices?.[0]?.message?.content || "I couldn't process that. Try again.";
      
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: assistantText,
        timestamp: Date.now(),
      }]);

    } catch (err: any) {
      console.error("Chatbot error:", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `Error: ${err.message}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = data.length > 0 
    ? ["Top performers?", "Worst ROAS?", "Total spend?"]
    : ["How to use?", "What is ROAS?", "Explain metrics"];

  return (
    <>
      {/* Modern Floating Button with Gradient Glow */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed right-6 bottom-6 z-50"
          aria-label="Open AI Assistant"
        >
          <div className="relative">
            {/* Animated gradient glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-emerald-500 opacity-75 blur-xl group-hover:opacity-100 transition-opacity animate-pulse" />
            
            {/* Button */}
            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-emerald-600 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            
            {/* Status indicator */}
            {data.length > 0 && (
              <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white animate-bounce" />
            )}
          </div>
        </button>
      )}

      {/* Premium Glass-morphism Chat Panel */}
      {isOpen && (
        <div className="fixed right-6 bottom-6 z-50 w-[340px] h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)",
          }}
        >
          {/* Premium Header with Gradient */}
          <div className="relative px-4 py-3.5 border-b border-gray-200/50"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(16,185,129,0.08) 100%)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated Avatar */}
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                
                <div>
                  <h3 className="text-sm font-bold bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent">
                    Excelerate AI
                  </h3>
                  <p className="text-xs text-gray-500">
                    {data.length > 0 ? `${data.length} rows loaded` : "Ready to help"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                title="Close"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area with Custom Scrollbar */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 chatbot-scroll"
          >
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-emerald-100 items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {data.length > 0 ? "Ready to analyze!" : "Hi there! 👋"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.length > 0 ? "Ask me about your campaign data" : "Upload data to get started"}
                  </p>
                </div>
                
                {/* Quick Action Chips */}
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(action)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-violet-50 to-emerald-50 text-violet-700 hover:from-violet-100 hover:to-emerald-100 transition-all border border-violet-200/50 hover:border-violet-300/50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-violet-200"
                      : "bg-white text-gray-800 border border-gray-200"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium Input Area */}
          <div className="p-4 border-t border-gray-200/50 bg-white/50 backdrop-blur">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-violet-400 focus:outline-none bg-white text-gray-900 placeholder-gray-400 transition-all"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white shadow-lg disabled:shadow-none transition-all disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2.5 px-1">
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-violet-600 font-medium transition-colors"
              >
                Clear chat
              </button>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-gray-400">
                  {data.length > 0 ? `${data.length} rows` : "No data"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .chatbot-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chatbot-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b5cf6 0%, #10b981 100%);
          border-radius: 10px;
        }
        .chatbot-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7c3aed 0%, #059669 100%);
        }
      `}</style>
    </>
  );
}