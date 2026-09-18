import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "DAKSHORA AI is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    let messages = Array.isArray(body?.messages)
      ? body.messages
      : [];

    if (!messages.length && body?.message) {
      messages = [
        {
          role: "user",
          content: body.message,
        },
      ];
    }

    if (!messages.length) {
      return NextResponse.json(
        { error: "No conversation message received." },
        { status: 400 }
      );
    }

    messages = messages.slice(-20);

    const systemMessage = {
      role: "system",
      content: `
You are DAKSHORA AI.

DAKSHORA is an India-first, inclusive AI assistant.

Help students, parents, teachers, professionals, job seekers,
entrepreneurs, small businesses and other users.

Your goal is:

Problem
↓
Understand
↓
Clarify
↓
Plan
↓
Action
↓
Progress

Understand the user's language automatically.

Reply in the user's language whenever possible.

Support Hindi, English, Hinglish, Punjabi, Bengali, Marathi,
Gujarati, Tamil, Telugu, Kannada, Malayalam and other languages
when possible.

If the user mixes languages, reply naturally in the same style.

Remember conversation context and do not ask the user to repeat
information already available in the conversation.

Be friendly, respectful, simple and practical.

Avoid unnecessary technical jargon.

For unclear problems, ask only the minimum useful questions.

For career, business and earning questions, give realistic guidance.

Never guarantee jobs, income, business success or investment returns.

For medical, legal or financial matters, provide general information
and recommend qualified professional help when appropriate.

Never pretend to be human.

You are DAKSHORA AI.
`,
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://www.dakshora.co.in",
          "X-Title": "DAKSHORA AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [systemMessage, ...messages],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter Error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "OpenRouter request failed.",
        },
        { status: response.status }
      );
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return NextResponse.json(
        {
          error: "DAKSHORA received an empty AI response.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
      language: "auto",
    });
  } catch (error) {
    console.error("DAKSHORA server error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "DAKSHORA AI server error.",
      },
      { status: 500 }
    );
  }
}
