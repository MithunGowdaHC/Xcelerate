// components/sentiment-summary.tsx
"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, Star, MessageSquare } from "lucide-react";
import { type SentimentSummary } from "@/lib/sentiment-analyzer";

type Props = {
  summary: SentimentSummary;
};

export default function SentimentSummaryCard({ summary }: Props) {
  const stats = [
    {
      label: "Total Reviews",
      value: summary.totalReviews,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Avg Rating",
      value: summary.averageRating.toFixed(1),
      icon: Star,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Positive",
      value: `${summary.positivePercent}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Negative",
      value: `${summary.negativePercent}%`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-violet-600" />
        Analysis Summary
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Sentiment Breakdown */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Sentiment Distribution</p>
        
        {/* Progress Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-emerald-700 font-medium">Positive</span>
              <span className="text-gray-600">{summary.positiveCount} reviews</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${summary.positivePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 font-medium">Neutral</span>
              <span className="text-gray-600">{summary.neutralCount} reviews</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full transition-all duration-500"
                style={{ width: `${summary.neutralPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-red-700 font-medium">Negative</span>
              <span className="text-gray-600">{summary.negativeCount} reviews</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                style={{ width: `${summary.negativePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Words */}
      {(summary.topPositiveWords.length > 0 || summary.topNegativeWords.length > 0) && (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
              {summary.topPositiveWords.length > 0 && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-900 mb-3">Top Positive Words</p>
              <div className="flex flex-wrap gap-2">
                {summary.topPositiveWords.slice(0, 8).map((word: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white text-emerald-700 text-xs font-medium rounded-full border border-emerald-200"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}          {summary.topNegativeWords.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-3">Top Negative Words</p>
              <div className="flex flex-wrap gap-2">
                {summary.topNegativeWords.slice(0, 8).map((word: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white text-red-700 text-xs font-medium rounded-full border border-red-200"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}