import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { asin, maxReviews = 20 } = await req.json();
    if (!asin) return NextResponse.json({ error: "ASIN required" }, { status: 400 });

    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    // 1️⃣ Fetch Amazon reviews using Apify
    const scrapeRes = await fetch(
      `https://api.apify.com/v2/acts/apify~amazon-reviews-scraper/run-sync?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asin, maxReviews }),
      }
    );

    const scrapeData = await scrapeRes.json();
    const reviews = scrapeData?.output?.reviews || [];

    // 2️⃣ Run each review through GROQ sentiment model
    const analyzed = [];

    for (const rev of reviews) {
      const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content:
                "You are a sentiment analysis AI. Analyze product reviews and classify them accurately.",
            },
            {
              role: "user",
              content: `Analyze this review and respond ONLY in JSON:\n\n"${rev.text}"\n\nProvide:\n- sentiment: positive / neutral / negative\n- score: 1 to 5\n- summary: 1 sentence\n- category: choose from [quality, delivery, packaging, pricing, seller, size, durability, expectation, other]`,
            },
          ],
          temperature: 0.2,
        }),
      });

      const llmJson = await llmRes.json();

      let output;
      try {
        output = JSON.parse(llmJson.choices[0].message.content);
      } catch (e) {
        output = {
          sentiment: "neutral",
          score: 3,
          summary: "Unable to analyze",
          category: "other",
        };
      }

      analyzed.push({
        review: rev.text,
        ...output,
      });
    }

    // 3️⃣ Calculate aggregated metrics
    const total = analyzed.length;

    const stats = {
      positive: analyzed.filter((r) => r.sentiment === "positive").length,
      neutral: analyzed.filter((r) => r.sentiment === "neutral").length,
      negative: analyzed.filter((r) => r.sentiment === "negative").length,
      avgScore:
        analyzed.reduce((sum, r) => sum + r.score, 0) / (analyzed.length || 1),
    };

    return NextResponse.json({
      reviews: analyzed,
      stats,
    });
  } catch (e) {
    console.error("Sentiment API error:", e);
    return NextResponse.json({ error: "Sentiment failed" }, { status: 500 });
  }
}
