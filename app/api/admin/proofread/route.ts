import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/services/auth-service";

const MAX_TEXT_BYTES = 18 * 1024;

const requestSchema = z.object({
  text: z.string().min(1).max(18_000),
});

interface LanguageToolMatch {
  message?: string;
  shortMessage?: string;
  offset?: number;
  length?: number;
  replacements?: Array<{ value?: string }>;
  rule?: {
    id?: string;
    issueType?: string;
    category?: { id?: string; name?: string };
  };
}

interface LanguageToolResponse {
  matches?: LanguageToolMatch[];
}

function getEndpoint() {
  return (
    process.env.LANGUAGETOOL_API_URL?.trim() ||
    "https://api.languagetool.org/v2/check"
  );
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Send between 1 and 18,000 characters for proofreading." },
        { status: 400 },
      );
    }

    const byteLength = new TextEncoder().encode(parsed.data.text).byteLength;
    if (byteLength > MAX_TEXT_BYTES) {
      return NextResponse.json(
        { error: "This draft is too large for one proofreading pass. Check a shorter draft." },
        { status: 413 },
      );
    }

    const params = new URLSearchParams({
      text: parsed.data.text,
      language: "en-US",
    });

    const username = process.env.LANGUAGETOOL_USERNAME?.trim();
    const apiKey = process.env.LANGUAGETOOL_API_KEY?.trim();
    if (username && apiKey) {
      params.set("username", username);
      params.set("apiKey", apiKey);
    }

    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      console.error("[proofreading] provider request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return NextResponse.json(
        { error: "The writing checker is temporarily unavailable. Try again shortly." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as LanguageToolResponse;
    const matches = (data.matches ?? []).slice(0, 150).flatMap((match) => {
      if (
        typeof match.offset !== "number" ||
        typeof match.length !== "number" ||
        !match.message
      ) {
        return [];
      }

      return [
        {
          message: match.message,
          shortMessage: match.shortMessage || "Writing suggestion",
          offset: match.offset,
          length: match.length,
          replacements: (match.replacements ?? [])
            .map((replacement) => replacement.value)
            .filter((value): value is string => typeof value === "string")
            .slice(0, 5),
          ruleId: match.rule?.id || "UNKNOWN_RULE",
          issueType: match.rule?.issueType || "grammar",
          category:
            match.rule?.category?.name || match.rule?.category?.id || "Writing",
        },
      ];
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[proofreading] request failed", error);
    return NextResponse.json(
      { error: "Unable to check this draft right now." },
      { status: 500 },
    );
  }
}
