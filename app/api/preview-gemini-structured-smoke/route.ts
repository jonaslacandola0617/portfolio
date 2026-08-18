import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "fix/gemini-authenticity-schema"
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
        contents: [{ role: "user", parts: [{ text: "Return one paragraph assessment with low AI-like patterns." }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              overallSummary: { type: "string" },
              paragraphs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    paragraphIndex: { type: "integer" },
                    aiPatternScore: { type: "integer", minimum: 0, maximum: 100 },
                    voiceConsistency: { type: "integer", minimum: 0, maximum: 100 },
                    overEditingScore: { type: "integer", minimum: 0, maximum: 100 },
                    summary: { type: "string" },
                    reasons: { type: "array", items: { type: "string" }, maxItems: 4 },
                  },
                  required: ["paragraphIndex", "aiPatternScore", "voiceConsistency", "overEditingScore", "summary", "reasons"],
                },
              },
            },
            required: ["overallSummary", "paragraphs"],
          },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    return NextResponse.json({ configured: true, model, providerOk: false, status: response.status, detail }, { status: 502 });
  }

  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
  let structured = false;
  try {
    const parsed = JSON.parse(text) as { overallSummary?: unknown; paragraphs?: unknown };
    structured = typeof parsed.overallSummary === "string" && Array.isArray(parsed.paragraphs);
  } catch {
    structured = false;
  }

  return NextResponse.json({ configured: true, model, providerOk: structured, structured });
}
