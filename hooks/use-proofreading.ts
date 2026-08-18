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
  buildProofreadingSource,
  clearProofreadingDecorations,
  mapProofreadingRange,
  setProofreadingDecorations,
  type ProofreadingIssue,
  type ProofreadingTone,
} from "@/lib/editor/proofreading";

export type ProofreadingStatus =
  | "idle"
  | "checking"
  | "ready"
  | "stale"
  | "error";

export interface ProofreadingPopoverPosition {
  left: number;
  top: number;
}

interface ProofreadingApiMatch {
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  replacements: string[];
  ruleId: string;
  issueType: string;
  category: string;
}

interface ProofreadingApiResponse {
  matches?: ProofreadingApiMatch[];
  error?: string;
}

const CUSTOM_DICTIONARY_KEY = "cms:proofreading:custom-dictionary";
const MAX_PROOFREADING_BYTES = 18 * 1024;

function normalizeDictionaryWord(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function isDictionaryWord(value: string) {
  return /^[A-Za-z][A-Za-z'-]*$/.test(value.trim());
}

function issueTone(issueType: string, category: string): ProofreadingTone {
  const haystack = `${issueType} ${category}`.toLowerCase();
  if (haystack.includes("misspell") || haystack.includes("typo")) return "spelling";
  if (haystack.includes("style") || haystack.includes("typograph")) return "style";
  return "grammar";
}

function shiftRemainingIssues(
  issues: ProofreadingIssue[],
  fixedIssue: ProofreadingIssue,
  replacement: string,
) {
  const delta = replacement.length - (fixedIssue.to - fixedIssue.from);

  return issues.flatMap((issue) => {
    if (issue.id === fixedIssue.id) return [];
    if (issue.to <= fixedIssue.from) return [issue];
    if (issue.from >= fixedIssue.to) {
      return [{ ...issue, from: issue.from + delta, to: issue.to + delta }];
    }
    return [];
  });
}

export function useProofreading(editor: Editor | null) {
  const [issues, setIssues] = useState<ProofreadingIssue[]>([]);
  const [status, setStatus] = useState<ProofreadingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] =
    useState<ProofreadingPopoverPosition | null>(null);
  const [customWords, setCustomWords] = useState<Set<string>>(new Set());

  const suppressNextContentUpdate = useRef(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CUSTOM_DICTIONARY_KEY);
      if (!stored) return;
      const values = JSON.parse(stored) as unknown;
      if (!Array.isArray(values)) return;
      setCustomWords(
        new Set(
          values
            .filter((value): value is string => typeof value === "string")
            .map(normalizeDictionaryWord)
            .filter(Boolean),
        ),
      );
    } catch {
      // A malformed local preference should never break the editor.
    }
  }, []);

  const applyIssueSet = useCallback(
    (nextIssues: ProofreadingIssue[]) => {
      setIssues(nextIssues);
      if (editor) setProofreadingDecorations(editor, nextIssues);
      setSelectedIssueId((current) =>
        current && nextIssues.some((issue) => issue.id === current) ? current : null,
      );
      if (!nextIssues.length) setPopoverPosition(null);
    },
    [editor],
  );

  const invalidate = useCallback(() => {
    setIssues([]);
    setSelectedIssueId(null);
    setPopoverPosition(null);
    setErrorMessage(null);
    setStatus(hasChecked.current ? "stale" : "idle");
    if (editor) clearProofreadingDecorations(editor);
  }, [editor]);

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
    };
  }, [editor, invalidate]);

  const runCheck = useCallback(async () => {
    if (!editor || status === "checking") return;

    const source = buildProofreadingSource(editor.state.doc);
    const text = source.text.trim() ? source.text : "";
    if (!text) {
      hasChecked.current = true;
      applyIssueSet([]);
      setStatus("ready");
      setErrorMessage(null);
      setPanelOpen(true);
      return;
    }

    if (new TextEncoder().encode(text).byteLength > MAX_PROOFREADING_BYTES) {
      setStatus("error");
      setErrorMessage("This draft is too large for one writing check. Check a shorter draft.");
      setPanelOpen(true);
      return;
    }

    setStatus("checking");
    setErrorMessage(null);
    setPopoverPosition(null);

    try {
      const response = await fetch("/api/admin/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as ProofreadingApiResponse;

      if (!response.ok) {
        throw new Error(payload.error || "The writing checker could not complete the request.");
      }

      const mappedIssues = (payload.matches ?? []).flatMap((match, index) => {
        const range = mapProofreadingRange(source, match.offset, match.length);
        if (!range) return [];

        const problemText = source.text.slice(match.offset, match.offset + match.length);
        if (
          isDictionaryWord(problemText) &&
          customWords.has(normalizeDictionaryWord(problemText))
        ) {
          return [];
        }

        return [
          {
            id: `${match.ruleId}:${match.offset}:${match.length}:${index}`,
            ...range,
            message: match.message,
            shortMessage: match.shortMessage || "Writing suggestion",
            problemText,
            replacements: match.replacements,
            ruleId: match.ruleId,
            category: match.category,
            tone: issueTone(match.issueType, match.category),
          } satisfies ProofreadingIssue,
        ];
      });

      hasChecked.current = true;
      applyIssueSet(mappedIssues);
      setStatus("ready");
      setPanelOpen(true);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to check this draft.");
      setPanelOpen(true);
    }
  }, [applyIssueSet, customWords, editor, status]);

  const selectIssue = useCallback(
    (issue: ProofreadingIssue) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setTextSelection({ from: issue.from, to: issue.to })
        .scrollIntoView()
        .run();
      setSelectedIssueId(issue.id);
      setPopoverPosition(null);
    },
    [editor],
  );

  const handleEditorClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>("[data-proofreading-id]");
      if (!element) {
        setPopoverPosition(null);
        return;
      }

      const issueId = element.dataset.proofreadingId;
      const issue = issues.find((candidate) => candidate.id === issueId);
      if (!issue) return;

      const rect = element.getBoundingClientRect();
      setSelectedIssueId(issue.id);
      setPopoverPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 344)),
        top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 260)),
      });
    },
    [issues],
  );

  const applySuggestion = useCallback(
    (issue: ProofreadingIssue, replacement: string) => {
      if (!editor) return;

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
      setStatus("ready");
      setPopoverPosition(null);
    },
    [applyIssueSet, editor, issues],
  );

  const ignoreIssue = useCallback(
    (issue: ProofreadingIssue) => {
      applyIssueSet(issues.filter((candidate) => candidate.id !== issue.id));
      setPopoverPosition(null);
    },
    [applyIssueSet, issues],
  );

  const addToDictionary = useCallback(
    (issue: ProofreadingIssue) => {
      if (!isDictionaryWord(issue.problemText)) return;
      const word = normalizeDictionaryWord(issue.problemText);
      const nextWords = new Set(customWords);
      nextWords.add(word);
      setCustomWords(nextWords);
      window.localStorage.setItem(CUSTOM_DICTIONARY_KEY, JSON.stringify([...nextWords].sort()));

      applyIssueSet(
        issues.filter(
          (candidate) => normalizeDictionaryWord(candidate.problemText) !== word,
        ),
      );
      setPopoverPosition(null);
    },
    [applyIssueSet, customWords, issues],
  );

  const selectedIssue =
    issues.find((issue) => issue.id === selectedIssueId) ?? null;

  return {
    issues,
    status,
    errorMessage,
    panelOpen,
    selectedIssue,
    popoverPosition,
    canAddSelectedWord: selectedIssue ? isDictionaryWord(selectedIssue.problemText) : false,
    runCheck,
    selectIssue,
    handleEditorClick,
    applySuggestion,
    ignoreIssue,
    addToDictionary,
    setPanelOpen,
    dismissPopover: () => setPopoverPosition(null),
  };
}
