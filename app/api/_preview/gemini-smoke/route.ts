import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/ai-authenticity-checker"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_AI_CHECK_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    return NextResponse.json({ configured: false, model }, { status: 503 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: GEMINI_SMOKE_OK" }] }],
          generationConfig: { maxOutputTokens: 16 },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { configured: true, model, providerOk: false, status: response.status },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return NextResponse.json({
      configured: true,
      model,
      providerOk: text.includes("GEMINI_SMOKE_OK"),
    });
  } catch {
    return NextResponse.json(
      { configured: true, model, providerOk: false, status: "request_failed" },
      { status: 502 },
    );
  }
}
