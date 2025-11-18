// components/sentiment-review-list.tsx
"use client";

import React, { useState } from "react";
import { Trash2, ThumbsUp, ThumbsDown, Minus, Star } from "lucide-react";
import { type AnalyzedReview } from "@/lib/sentiment-analyzer";

type Props = {
  reviews: AnalyzedReview[];
  onDelete: (id: string) => void;
};

export default function SentimentReviewList({ reviews, onDelete }: Props) {
  const [filter, setFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");

  const filteredReviews = reviews.filter(r => {
    if (filter === "all") return true;
    return r.sentiment === filter;
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4 text-emerald-600" />;
      case "negative":
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "negative":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          Reviews ({filteredReviews.length})
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {["all", "positive", "neutral", "negative"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No {filter !== "all" && filter} reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getSentimentColor(
                review.sentiment
              )}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {getSentimentIcon(review.sentiment)}
                  <span className="text-xs font-semibold uppercase">
                    {review.sentiment}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      {review.rating}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(review.id)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                {review.text}
              </p>

              {/* Sentiment Details */}
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="bg-white px-2 py-1 rounded-md border border-gray-200">
                  <span className="text-gray-500">Score:</span>{" "}
                  <span className="font-semibold text-gray-700">{review.score}</span>
                </div>

                {review.positive.length > 0 && (
                  <div className="bg-white px-2 py-1 rounded-md border border-emerald-200 text-emerald-700">
                    <span className="font-medium">+</span> {review.positive.slice(0, 3).join(", ")}
                  </div>
                )}

                {review.negative.length > 0 && (
                  <div className="bg-white px-2 py-1 rounded-md border border-red-200 text-red-700">
                    <span className="font-medium">-</span> {review.negative.slice(0, 3).join(", ")}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}