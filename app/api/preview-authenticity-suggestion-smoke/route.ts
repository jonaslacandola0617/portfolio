import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "feature/ai-authenticity-suggestions"
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_AI_CHECK_MODEL?.trim() || DEFAULT_MODEL;
  if (!apiKey) return NextResponse.json({ configured: false, model }, { status: 503 });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Rewrite this more directly while preserving meaning: The implementation of comprehensive security frameworks facilitates effective risk mitigation.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 400,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              suggestion: { type: "string" },
              explanation: { type: "string" },
              changes: { type: "array", items: { type: "string" }, maxItems: 4 },
            },
            required: ["suggestion", "explanation", "changes"],
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    return NextResponse.json(
      { configured: true, model, providerOk: false, status: response.status, detail },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim() ?? "";

  let structured = false;
  try {
    const parsed = JSON.parse(text) as {
      suggestion?: unknown;
      explanation?: unknown;
      changes?: unknown;
    };
    structured =
      typeof parsed.suggestion === "string" &&
      typeof parsed.explanation === "string" &&
      Array.isArray(parsed.changes);
  } catch {
    structured = false;
  }

  return NextResponse.json({ configured: true, model, providerOk: structured, structured });
}
