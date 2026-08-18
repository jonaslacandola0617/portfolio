"use client";

import type { Editor } from "@tiptap/core";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  clearAuthenticityDecorations,
  setAuthenticityDecorations,
  type AIAuthenticityIssue,
  type AuthenticityLevel,
} from "@/lib/editor/ai-authenticity";
import {
  buildProofreadingSource,
  mapProofreadingRange,
} from "@/lib/editor/proofreading";

export type AIAuthenticityStatus = "idle" | "checking" | "ready" | "stale" | "error";
export type AIAuthenticityMode = "local" | "hybrid";
export type AIAuthenticitySuggestionStatus = "idle" | "loading" | "ready" | "error";

export interface AIAuthenticityOverall {
  voiceConsistency: number;
  aiPatternScore: number;
  overEditingScore: number;
  level: AuthenticityLevel;
  summary: string;
}

export interface AIAuthenticitySuggestion {
  text: string;
  explanation: string;
  changes: string[];
}

interface ApiIssue {
  id: string;
  paragraphIndex: number;
  offset: number;
  length: number;
  excerpt: string;
  voiceConsistency: number;
  aiPatternScore: number;
  overEditingScore: number;
  level: AuthenticityLevel;
  summary: string;
  reasons: string[];
}

interface ApiResponse {
  mode?: AIAuthenticityMode;
  referenceSamples?: number;
  overall?: AIAuthenticityOverall;
  issues?: ApiIssue[];
  providerWarning?: string | null;
  notice?: string;
  error?: string;
}

interface SuggestionResponse {
  suggestion?: string;
  explanation?: string;
  changes?: string[];
  error?: string;
}

const MAX_TEXT_BYTES = 24 * 1024;

function shiftRemainingIssues(
  issues: AIAuthenticityIssue[],
  replacedIssue: AIAuthenticityIssue,
  replacement: string,
) {
  const delta = replacement.length - (replacedIssue.to - replacedIssue.from);

  return issues.flatMap((issue) => {
    if (issue.id === replacedIssue.id) return [];
    if (issue.to <= replacedIssue.from) return [issue];
    if (issue.from >= replacedIssue.to) {
      return [{ ...issue, from: issue.from + delta, to: issue.to + delta }];
    }

    // A flagged range should not normally overlap another flagged range. If it
    // does, drop it rather than keep a position that may now point at the wrong text.
    return [];
  });
}

export function useAIAuthenticity(
  editor: Editor | null,
  options: {
    recordId: string;
    contentType: "project" | "lab" | "article" | "certificate";
  },
) {
  const [issues, setIssues] = useState<AIAuthenticityIssue[]>([]);
  const [status, setStatus] = useState<AIAuthenticityStatus>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [overall, setOverall] = useState<AIAuthenticityOverall | null>(null);
  const [mode, setMode] = useState<AIAuthenticityMode>("local");
  const [referenceSamples, setReferenceSamples] = useState(0);
  const [providerWarning, setProviderWarning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, AIAuthenticitySuggestion>>({});
  const [suggestionStatuses, setSuggestionStatuses] = useState<
    Record<string, AIAuthenticitySuggestionStatus>
  >({});
  const [suggestionErrors, setSuggestionErrors] = useState<Record<string, string | null>>({});
  const hasChecked = useRef(false);
  const requestSequence = useRef(0);
  const suggestionSequence = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const suppressNextContentUpdate = useRef(false);

  const applyIssueSet = useCallback(
    (nextIssues: AIAuthenticityIssue[]) => {
      setIssues(nextIssues);
      if (editor) setAuthenticityDecorations(editor, nextIssues);
      setSelectedIssueId((current) =>
        current && nextIssues.some((issue) => issue.id === current) ? current : null,
      );
    },
    [editor],
  );

  const invalidate = useCallback(() => {
    requestSequence.current += 1;
    suggestionSequence.current += 1;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setIssues([]);
    setSelectedIssueId(null);
    setOverall(null);
    setProviderWarning(null);
    setNotice(null);
    setErrorMessage(null);
    setSuggestions({});
    setSuggestionStatuses({});
    setSuggestionErrors({});
    setStatus(hasChecked.current ? "stale" : "idle");
    if (editor) clearAuthenticityDecorations(editor);
  }, [editor]);

  const runCheck = useCallback(async () => {
    if (!editor) return;

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const requestId = ++requestSequence.current;

    const source = buildProofreadingSource(editor.state.doc);
    const text = source.text.trim() ? source.text : "";
    if (!text) {
      hasChecked.current = true;
      applyIssueSet([]);
      setOverall({
        voiceConsistency: 100,
        aiPatternScore: 0,
        overEditingScore: 0,
        level: "low",
        summary: "There is not enough prose to analyze yet.",
      });
      setStatus("ready");
      setPanelOpen(true);
      activeRequest.current = null;
      return;
    }

    if (new TextEncoder().encode(text).byteLength > MAX_TEXT_BYTES) {
      setStatus("error");
      setErrorMessage("This draft is too large for one AI/voice check. Check a shorter draft.");
      setPanelOpen(true);
      activeRequest.current = null;
      return;
    }

    setStatus("checking");
    setErrorMessage(null);
    setProviderWarning(null);
    setPanelOpen(true);

    try {
      const response = await fetch("/api/admin/ai-authenticity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          recordId: options.recordId,
          contentType: options.contentType,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(payload.error || "The AI/voice checker could not complete the request.");
      }

      if (requestId !== requestSequence.current || controller.signal.aborted) return;

      const mapped = (payload.issues ?? []).flatMap((issue) => {
        const range = mapProofreadingRange(source, issue.offset, issue.length);
        if (!range) return [];
        return [
          {
            id: issue.id,
            paragraphIndex: issue.paragraphIndex,
            ...range,
            excerpt: issue.excerpt,
            aiPatternScore: issue.aiPatternScore,
            voiceConsistency: issue.voiceConsistency,
            overEditingScore: issue.overEditingScore,
            level: issue.level,
            summary: issue.summary,
            reasons: issue.reasons,
          } satisfies AIAuthenticityIssue,
        ];
      });

      hasChecked.current = true;
      applyIssueSet(mapped);
      setOverall(payload.overall ?? null);
      setMode(payload.mode ?? "local");
      setReferenceSamples(payload.referenceSamples ?? 0);
      setProviderWarning(payload.providerWarning ?? null);
      setNotice(payload.notice ?? null);
      setSuggestions({});
      setSuggestionStatuses({});
      setSuggestionErrors({});
      setStatus("ready");
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to analyze this draft.");
    } finally {
      if (requestId === requestSequence.current) activeRequest.current = null;
    }
  }, [applyIssueSet, editor, options.contentType, options.recordId]);

  const requestSuggestion = useCallback(
    async (issue: AIAuthenticityIssue) => {
      if (!editor) return;

      const passage = editor.state.doc.textBetween(issue.from, issue.to, "\n").trim();
      if (!passage) {
        setSuggestionStatuses((current) => ({ ...current, [issue.id]: "error" }));
        setSuggestionErrors((current) => ({
          ...current,
          [issue.id]: "The highlighted passage no longer contains readable text.",
        }));
        return;
      }

      const requestId = ++suggestionSequence.current;
      setSuggestionStatuses((current) => ({ ...current, [issue.id]: "loading" }));
      setSuggestionErrors((current) => ({ ...current, [issue.id]: null }));

      try {
        const response = await fetch("/api/admin/ai-authenticity-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excerpt: passage,
            reasons: issue.reasons,
            recordId: options.recordId,
            paragraphIndex: issue.paragraphIndex,
            contentType: options.contentType,
          }),
        });
        const payload = (await response.json()) as SuggestionResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Unable to create a voice-aligned suggestion.");
        }
        if (requestId !== suggestionSequence.current) return;
        if (!payload.suggestion || !payload.explanation) {
          throw new Error("The voice suggestion was incomplete. Try again.");
        }

        setSuggestions((current) => ({
          ...current,
          [issue.id]: {
            text: payload.suggestion!,
            explanation: payload.explanation!,
            changes: payload.changes ?? [],
          },
        }));
        setSuggestionStatuses((current) => ({ ...current, [issue.id]: "ready" }));
      } catch (error) {
        if (requestId !== suggestionSequence.current) return;
        setSuggestionStatuses((current) => ({ ...current, [issue.id]: "error" }));
        setSuggestionErrors((current) => ({
          ...current,
          [issue.id]: error instanceof Error ? error.message : "Unable to create a suggestion.",
        }));
      }
    },
    [editor, options.contentType, options.recordId],
  );

  const replaceSuggestion = useCallback(
    (issue: AIAuthenticityIssue, replacement: string) => {
      if (!editor || !replacement.trim()) return;

      const currentIndex = issues.findIndex((candidate) => candidate.id === issue.id);
      suppressNextContentUpdate.current = true;
      const applied = editor
        .chain()
        .focus()
        .insertContentAt({ from: issue.from, to: issue.to }, replacement)
        .run();

      if (!applied) {
        suppressNextContentUpdate.current = false;
        return;
      }

      const nextIssues = shiftRemainingIssues(issues, issue, replacement);
      applyIssueSet(nextIssues);

      const nextSelected =
        nextIssues[Math.min(Math.max(currentIndex, 0), Math.max(nextIssues.length - 1, 0))] ?? null;
      setSelectedIssueId(nextSelected?.id ?? null);

      setSuggestions((current) => {
        const next = { ...current };
        delete next[issue.id];
        return next;
      });
      setSuggestionStatuses((current) => {
        const next = { ...current };
        delete next[issue.id];
        return next;
      });
      setSuggestionErrors((current) => {
        const next = { ...current };
        delete next[issue.id];
        return next;
      });

      setStatus("ready");
      setPanelOpen(true);
      setErrorMessage(null);
      setNotice(
        "Replacement applied without running another AI check. Remaining passage scores are retained from the existing scan; use Analyze again only when you want fresh overall scores.",
      );
    },
    [applyIssueSet, editor, issues],
  );

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (suppressNextContentUpdate.current) {
        suppressNextContentUpdate.current = false;
        return;
      }
      invalidate();
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      activeRequest.current?.abort();
      activeRequest.current = null;
      suggestionSequence.current += 1;
    };
  }, [editor, invalidate]);

  const selectIssue = useCallback(
    (issue: AIAuthenticityIssue) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: issue.from, to: issue.to })
        .scrollIntoView()
        .run();
      setSelectedIssueId(issue.id);
      setPanelOpen(true);
    },
    [editor],
  );

  const handleEditorClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>("[data-authenticity-id]");
      const id = element?.dataset.authenticityId;
      if (!id) return;
      const issue = issues.find((candidate) => candidate.id === id);
      if (issue) selectIssue(issue);
    },
    [issues, selectIssue],
  );

  return {
    issues,
    status,
    panelOpen,
    selectedIssue: issues.find((issue) => issue.id === selectedIssueId) ?? null,
    overall,
    mode,
    referenceSamples,
    providerWarning,
    notice,
    errorMessage,
    suggestions,
    suggestionStatuses,
    suggestionErrors,
    runCheck,
    requestSuggestion,
    replaceSuggestion,
    selectIssue,
    handleEditorClick,
    setPanelOpen,
  };
}
