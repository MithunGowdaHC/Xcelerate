"use client";

import React, { useState } from "react";
import { Search, Loader2, TrendingUp, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { analyzeSentiment, type AnalyzedReview, type SentimentSummary } from "@/lib/sentiment-analyzer";
import SentimentSummaryCard from "@/components/sentiment-summary";
import SentimentCharts from "@/components/sentiment-charts";
import SentimentReviewList from "@/components/sentiment-review-list";

const SAMPLE_REVIEWS = [
  { text: "Amazing product! Works perfectly and exceeded my expectations. Highly recommend!", rating: 5 },
  { text: "Good quality but delivery was delayed. Product itself is fine.", rating: 4 },
  { text: "Average product, nothing special. Does what it claims but overpriced.", rating: 3 },
  { text: "Disappointed with the quality. Not worth the money at all.", rating: 2 },
  { text: "Terrible! Broke after 2 days. Complete waste of money. Do not buy!", rating: 1 },
  { text: "Best purchase I've made this year! Customer service was excellent too.", rating: 5 },
  { text: "Pretty good overall. Minor issues but nothing major.", rating: 4 },
  { text: "It's okay. Does the job but could be better.", rating: 3 },
];

export default function SentimentPage() {
  const [asin, setAsin] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<AnalyzedReview[]>([]);
  const [summary, setSummary] = useState<SentimentSummary | null>(null);

  const fetchReviews = async () => {
    if (!asin.trim()) {
      setError("Please enter an ASIN");
      return;
    }

    setLoading(true);
    setError("");
    setLoadingMessage("Starting Apify scraper...");

    try {
      const APIFY_TOKEN = process.env.NEXT_PUBLIC_APIFY_TOKEN;

      if (!APIFY_TOKEN || APIFY_TOKEN === "apify_api_YOUR_TOKEN") {
        throw new Error("Please add NEXT_PUBLIC_APIFY_TOKEN to your .env.local file");
      }

      // Step 1: Start the actor run
      setLoadingMessage("Fetching reviews from Amazon...");
      const payload = {
        asin: asin.trim(),
        domain: "amazon.in",
        maxReviews: 50,
        proxy: { useApifyProxy: true },
        proxyConfiguration: { useApifyProxy: true },
      };

      const runResponse = await fetch(
        `https://api.apify.com/v2/acts/epctex~amazon-reviews-scraper/runs?token=${APIFY_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!runResponse.ok) {
        const runErrText = await runResponse.text();
        let runErrMsg = runErrText;
        try {
          const parsed = JSON.parse(runErrText);
          runErrMsg = parsed.error?.message || JSON.stringify(parsed);
        } catch (e) {
          // keep raw text
        }
        throw new Error(`Apify API error (${runResponse.status}): ${runErrMsg}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;
      const defaultDatasetId = runData.data.defaultDatasetId;

      // Step 2: Wait for run to complete (poll status)
      setLoadingMessage("Scraping in progress... (this may take 1-2 minutes)");
      let runStatus = "RUNNING";
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max

      while ((runStatus === "RUNNING" || runStatus === "READY") && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        setLoadingMessage(`Scraping reviews... (${attempts * 5}s elapsed)`);

        const statusResponse = await fetch(
          `https://api.apify.com/v2/acts/epctex~amazon-reviews-scraper/runs/${runId}?token=${APIFY_TOKEN}`
        );

        if (!statusResponse.ok) {
          const statusErr = await statusResponse.text();
          throw new Error(`Failed to get run status: ${statusResponse.status} - ${statusErr}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        attempts++;
      }

      if (runStatus !== "SUCCEEDED") {
        throw new Error(`Apify run ${runStatus}. This can take 1-2 minutes. Try again or use Sample data.`);
      }

      // Step 3: Fetch results from dataset
      setLoadingMessage("Processing reviews...");
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${APIFY_TOKEN}`
      );

      if (!datasetResponse.ok) {
        const dsErr = await datasetResponse.text();
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status} - ${dsErr}`);
      }

      const rawReviews = await datasetResponse.json();

      if (!Array.isArray(rawReviews) || rawReviews.length === 0) {
        throw new Error("No reviews found for this ASIN");
      }

      // Map reviews according to Apify output format
      const mappedReviews = rawReviews
        .map((r: any) => ({
          text: r.reviewText || r.reviewHeader || "",
          rating: r.rating || 3,
        }))
        .filter(r => r.text.length > 10); // Filter out empty reviews

      if (mappedReviews.length === 0) {
        throw new Error("No valid reviews found");
      }

      // Analyze sentiment
      setLoadingMessage("Analyzing sentiment...");
      const analyzed = analyzeSentiment(mappedReviews);
      setReviews(analyzed.reviews);
      setSummary(analyzed.summary);

    } catch (err: any) {
      if (err.message.includes("403")) {
        setError("Invalid API token. Click 'Sample' button to try demo data, or add a valid NEXT_PUBLIC_APIFY_TOKEN to .env.local");
      } else {
        setError(err.message || "Failed to fetch reviews");
      }
      setReviews([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const analyzed = analyzeSentiment(SAMPLE_REVIEWS);
    setReviews(analyzed.reviews);
    setSummary(analyzed.summary);
    setError("");
  };

  const handleDeleteReview = (id: string) => {
    const filtered = reviews.filter(r => r.id !== id);
    setReviews(filtered);

    // Recalculate summary
    if (filtered.length > 0) {
      const reanalyzed = analyzeSentiment(filtered.map(r => ({ text: r.text, rating: r.rating })));
      setSummary(reanalyzed.summary);
    } else {
      setSummary(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                Sentiment Analysis
              </h1>
              <p className="text-sm text-gray-500">AI-powered review insights for Amazon products</p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={asin}
                onChange={(e) => setAsin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchReviews()}
                placeholder="Enter Amazon ASIN (e.g., B08N5WRWNW)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-400 focus:outline-none text-gray-900 placeholder-gray-400 transition-all"
                disabled={loading}
              />
            </div>
            <button
              onClick={fetchReviews}
              disabled={loading || !asin.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium shadow-lg disabled:shadow-none transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Analyze
                </>
              )}
            </button>
            <button
              onClick={loadSampleData}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Sample
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {summary && reviews.length > 0 && (
          <div className="space-y-6">
            {/* Summary Card */}
            <SentimentSummaryCard summary={summary} />

            {/* Charts */}
            <SentimentCharts reviews={reviews} />

            {/* Review List */}
            <SentimentReviewList 
              reviews={reviews} 
              onDelete={handleDeleteReview}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !summary && !error && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 items-center justify-center mb-4">
              <TrendingUp className="h-10 w-10 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Analyze Reviews
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Enter an Amazon ASIN to fetch and analyze customer reviews, or load sample data to see how it works.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-violet-50 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-violet-600" />
                <span>Sentiment Detection</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <span>Rating Analysis</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Visual Insights</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}