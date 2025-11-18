// components/sentiment-charts.tsx
"use client";

import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { type AnalyzedReview, generateHistogram } from "@/lib/sentiment-analyzer";
import { PieChartIcon, BarChart3 } from "lucide-react";

type Props = {
  reviews: AnalyzedReview[];
};

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
};

export default function SentimentCharts({ reviews }: Props) {
  // Pie chart data
  const pieData = [
    {
      name: "Positive",
      value: reviews.filter(r => r.sentiment === "positive").length,
      color: SENTIMENT_COLORS.positive,
    },
    {
      name: "Neutral",
      value: reviews.filter(r => r.sentiment === "neutral").length,
      color: SENTIMENT_COLORS.neutral,
    },
    {
      name: "Negative",
      value: reviews.filter(r => r.sentiment === "negative").length,
      color: SENTIMENT_COLORS.negative,
    },
  ].filter(d => d.value > 0);

  // Histogram data
  const histogramData = generateHistogram(reviews);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-violet-600" />
          Sentiment Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Histogram */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={histogramData}>
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontSize: "14px",
              }}
            />
            <Bar 
              dataKey="count" 
              fill="url(#colorGradient)" 
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}