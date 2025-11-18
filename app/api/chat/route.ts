// app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = 'edge'; // or 'nodejs' if you prefer

export async function POST(req: Request) {
  try {
    // Log for debugging
    console.log("Chat API called");

    // Parse request body
    const body = await req.json();
    const { messages, model, temperature, max_tokens } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages must be an array" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured. Please add it to .env.local" },
        { status: 500 }
      );
    }

    console.log("Calling Groq API with model:", model);

    // Call Groq API
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "llama-3.1-8b-instant",
        messages,
        temperature: temperature ?? 0.3,
        max_tokens: max_tokens || 500,
        stream: false,
      }),
    });

    const data = await groqResp.json();

    // Handle Groq API errors
    if (!groqResp.ok) {
      console.error("Groq API error:", {
        status: groqResp.status,
        statusText: groqResp.statusText,
        data
      });
      
      return NextResponse.json(
        {
          error: "Groq API error",
          detail: data.error?.message || data.error || "Unknown error",
          status: groqResp.status
        },
        { status: groqResp.status }
      );
    }

    // Validate response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid Groq response:", data);
      return NextResponse.json(
        { error: "Invalid response from Groq API" },
        { status: 500 }
      );
    }

    console.log("Groq API success");
    return NextResponse.json(data);

  } catch (e: any) {
    console.error("Chat API internal error:", {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    
    return NextResponse.json(
      {
        error: e.message || "Internal server error",
        type: e.name || "Error"
      },
      { status: 500 }
    );
  }
}