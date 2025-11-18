// lib/sentiment-analyzer.ts
import Sentiment from "sentiment";

const analyzer = new Sentiment();

export type SentimentResult = {
  score: number;        // raw score from sentiment lib
  comparative: number;  // comparative score
  label: "positive" | "neutral" | "negative";
};

export type AnalyzedReview = {
  id: string;
  text: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  positive: string[];
  negative: string[];
};

export type SentimentSummary = {
  totalReviews: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  positivePercentage: number;
  positivePercent: number;
  neutralPercentage: number;
  neutralPercent: number;
  negativePercentage: number;
  negativePercent: number;
  averageRating: number;
  averageScore: number;
  topPositiveWords: string[];
  topNegativeWords: string[];
};

export function analyzeText(text: string): SentimentResult {
  const res = analyzer.analyze(text || "");
  const score = res.score ?? 0;
  const comparative = res.comparative ?? 0;

  // heuristics - tuned but simple
  const label =
    score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

  return { score, comparative, label };
}

export function analyzeSentiment(
  reviews: Array<{ text: string; rating: number }>
): { reviews: AnalyzedReview[]; summary: SentimentSummary } {
  const analyzed = reviews.map((review, index) => {
    const result = analyzeText(review.text);
    const sentimentAnalysis = analyzer.analyze(review.text);

    return {
      id: `review-${index}-${Date.now()}`,
      text: review.text,
      rating: review.rating,
      sentiment: result.label,
      score: result.score,
      positive: sentimentAnalysis.positive || [],
      negative: sentimentAnalysis.negative || [],
    };
  });

  const positiveCount = analyzed.filter((r) => r.sentiment === "positive").length;
  const neutralCount = analyzed.filter((r) => r.sentiment === "neutral").length;
  const negativeCount = analyzed.filter((r) => r.sentiment === "negative").length;
  const totalReviews = analyzed.length;

  // Extract top words
  const allPositiveWords = analyzed.flatMap((r) => r.positive);
  const allNegativeWords = analyzed.flatMap((r) => r.negative);

  const topPositiveWords = [...new Set(allPositiveWords)].slice(0, 8);
  const topNegativeWords = [...new Set(allNegativeWords)].slice(0, 8);

  const positivePercent = (positiveCount / totalReviews) * 100;
  const neutralPercent = (neutralCount / totalReviews) * 100;
  const negativePercent = (negativeCount / totalReviews) * 100;

  const summary: SentimentSummary = {
    totalReviews,
    positiveCount,
    neutralCount,
    negativeCount,
    positivePercentage: positivePercent,
    positivePercent: Math.round(positivePercent),
    neutralPercentage: neutralPercent,
    neutralPercent: Math.round(neutralPercent),
    negativePercentage: negativePercent,
    negativePercent: Math.round(negativePercent),
    averageRating: reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews,
    averageScore: analyzed.reduce((sum, r) => sum + r.score, 0) / totalReviews,
    topPositiveWords,
    topNegativeWords,
  };

  return { reviews: analyzed, summary };
}

export function generateHistogram(reviews: AnalyzedReview[]) {
  const ranges = [
    { range: "-10 to -8", min: -10, max: -8 },
    { range: "-7 to -5", min: -7, max: -5 },
    { range: "-4 to -2", min: -4, max: -2 },
    { range: "-1 to 0", min: -1, max: 0 },
    { range: "1 to 3", min: 1, max: 3 },
    { range: "4 to 6", min: 4, max: 6 },
    { range: "7 to 10", min: 7, max: 10 },
  ];

  return ranges.map((r) => ({
    range: r.range,
    count: reviews.filter((review) => review.score >= r.min && review.score <= r.max).length,
  }));
}

// color helpers matching your theme
export const SENT_COLORS: Record<string, string> = {
  positive: "text-emerald-600 bg-emerald-50",
  neutral: "text-violet-600 bg-violet-50",
  negative: "text-rose-600 bg-rose-50",
};
