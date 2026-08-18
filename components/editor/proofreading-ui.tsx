"use client";

import {
  BookPlus,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
  SpellCheck2,
  X,
} from "lucide-react";
import type { ProofreadingIssue } from "@/lib/editor/proofreading";
import type {
  ProofreadingPopoverPosition,
  ProofreadingStatus,
} from "@/hooks/use-proofreading";

interface ToolbarButtonProps {
  status: ProofreadingStatus;
  issueCount: number;
  panelOpen: boolean;
  onCheck: () => void;
  onTogglePanel: () => void;
}

export function ProofreadingToolbarButton({
  status,
  issueCount,
  panelOpen,
  onCheck,
  onTogglePanel,
}: ToolbarButtonProps) {
  const checking = status === "checking";
  const checked = status === "ready";

  return (
    <button
      type="button"
      onClick={() => {
        if (checking) return;
        if (checked) onTogglePanel();
        else onCheck();
      }}
      className={`ml-2 inline-flex h-9 shrink-0 items-center gap-2 border px-3 font-mono text-xs transition-colors ${
        panelOpen
          ? "border-cobalt bg-cobalt text-white"
          : "border-border bg-surface-2 text-text hover:border-border-strong"
      }`}
      title={checked ? "Open writing suggestions" : "Check spelling and grammar"}
      aria-pressed={panelOpen}
    >
      {checking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <SpellCheck2 className="h-4 w-4" />
      )}
      <span>{checking ? "Checking" : "Writing"}</span>
      {checked && (
        <span
          className={`min-w-5 border px-1 text-center ${
            panelOpen ? "border-white/40" : "border-border bg-surface"
          }`}
        >
          {issueCount}
        </span>
      )}
    </button>
  );
}

interface OverlaysProps {
  issues: ProofreadingIssue[];
  status: ProofreadingStatus;
  errorMessage: string | null;
  panelOpen: boolean;
  selectedIssue: ProofreadingIssue | null;
  popoverPosition: ProofreadingPopoverPosition | null;
  canAddSelectedWord: boolean;
  onCheck: () => void;
  onClosePanel: () => void;
  onSelectIssue: (issue: ProofreadingIssue) => void;
  onApplySuggestion: (issue: ProofreadingIssue, replacement: string) => void;
  onIgnoreIssue: (issue: ProofreadingIssue) => void;
  onAddToDictionary: (issue: ProofreadingIssue) => void;
  onDismissPopover: () => void;
}

function ToneBadge({ issue }: { issue: ProofreadingIssue }) {
  const label =
    issue.tone === "spelling"
      ? "Spelling"
      : issue.tone === "style"
        ? "Style"
        : "Grammar";

  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
      {label}
    </span>
  );
}

function SuggestionButtons({
  issue,
  onApply,
}: {
  issue: ProofreadingIssue;
  onApply: (replacement: string) => void;
}) {
  if (!issue.replacements.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {issue.replacements.slice(0, 3).map((replacement, index) => (
        <button
          key={`${replacement}-${index}`}
          type="button"
          onClick={() => onApply(replacement)}
          className="border border-cobalt bg-cobalt-dim px-2.5 py-1.5 text-left text-xs font-medium text-cobalt hover:bg-cobalt hover:text-white"
        >
          {replacement || "Remove"}
        </button>
      ))}
    </div>
  );
}

export function ProofreadingOverlays({
  issues,
  status,
  errorMessage,
  panelOpen,
  selectedIssue,
  popoverPosition,
  canAddSelectedWord,
  onCheck,
  onClosePanel,
  onSelectIssue,
  onApplySuggestion,
  onIgnoreIssue,
  onAddToDictionary,
  onDismissPopover,
}: OverlaysProps) {
  return (
    <>
      {panelOpen && (
        <aside className="absolute right-4 top-14 z-40 flex max-h-[calc(100%-5rem)] w-[min(22rem,calc(100%-2rem))] flex-col border border-border-strong bg-surface-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <SpellCheck2 className="h-4 w-4 text-cobalt" />
                <h2 className="font-display text-sm font-semibold text-text">Writing assistant</h2>
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                {status === "checking"
                  ? "Checking draft"
                  : status === "ready"
                    ? `${issues.length} suggestion${issues.length === 1 ? "" : "s"}`
                    : "Run a fresh check"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCheck}
                disabled={status === "checking"}
                className="grid h-8 w-8 place-items-center border border-border text-text-dim hover:border-border-strong hover:text-text disabled:opacity-50"
                title="Check again"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClosePanel}
                className="grid h-8 w-8 place-items-center border border-border text-text-dim hover:border-border-strong hover:text-text"
                aria-label="Close writing assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
            {status === "checking" && (
              <div className="flex items-center gap-3 px-4 py-6 text-sm text-text-dim">
                <Loader2 className="h-4 w-4 animate-spin text-cobalt" />
                Checking spelling, grammar, and style…
              </div>
            )}

            {status === "error" && (
              <div className="p-4">
                <p className="text-sm text-vermilion">{errorMessage || "Writing check failed."}</p>
                <button
                  type="button"
                  onClick={onCheck}
                  className="mt-3 border border-border-strong px-3 py-2 font-mono text-xs text-text hover:bg-surface-3"
                >
                  Try again
                </button>
              </div>
            )}

            {status === "stale" && (
              <div className="p-4">
                <p className="text-sm leading-6 text-text-dim">
                  The draft changed after the last check. Run it again to refresh the suggestions.
                </p>
                <button
                  type="button"
                  onClick={onCheck}
                  className="mt-3 inline-flex items-center gap-2 border border-cobalt bg-cobalt px-3 py-2 font-mono text-xs text-white"
                >
                  <SpellCheck2 className="h-3.5 w-3.5" />
                  Check writing
                </button>
              </div>
            )}

            {status === "ready" && issues.length === 0 && (
              <div className="p-6 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center border border-signal-teal text-signal-teal">
                  <Check className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-text">No issues found</p>
                <p className="mt-1 text-xs leading-5 text-text-dim">
                  The current writing pass did not find spelling or grammar suggestions.
                </p>
              </div>
            )}

            {status === "ready" &&
              issues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onSelectIssue(issue)}
                  className={`block w-full border-b border-border px-4 py-3 text-left hover:bg-surface-3 ${
                    selectedIssue?.id === issue.id ? "bg-cobalt-dim" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <ToneBadge issue={issue} />
                      <div className="mt-1 truncate text-sm font-medium text-text">
                        {issue.problemText || issue.shortMessage}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-dim">
                        {issue.message}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </div>
                </button>
              ))}
          </div>
        </aside>
      )}

      {selectedIssue && popoverPosition && (
        <div
          className="fixed z-50 w-[min(21rem,calc(100vw-1rem))] border border-border-strong bg-surface-2 p-4 shadow-2xl"
          style={{ left: popoverPosition.left, top: popoverPosition.top }}
          role="dialog"
          aria-label="Writing suggestion"
        >
          <button
            type="button"
            onClick={onDismissPopover}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center text-muted hover:text-text"
            aria-label="Close suggestion"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <ToneBadge issue={selectedIssue} />
          <div className="mt-1 pr-7 font-display text-sm font-semibold text-text">
            {selectedIssue.problemText || selectedIssue.shortMessage}
          </div>
          <p className="mt-2 text-xs leading-5 text-text-dim">{selectedIssue.message}</p>

          <SuggestionButtons
            issue={selectedIssue}
            onApply={(replacement) => onApplySuggestion(selectedIssue, replacement)}
          />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => onIgnoreIssue(selectedIssue)}
              className="border border-border px-2.5 py-1.5 font-mono text-[11px] text-text-dim hover:border-border-strong hover:text-text"
            >
              Ignore
            </button>
            {canAddSelectedWord && (
              <button
                type="button"
                onClick={() => onAddToDictionary(selectedIssue)}
                className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[11px] text-text-dim hover:border-border-strong hover:text-text"
              >
                <BookPlus className="h-3.5 w-3.5" />
                Add to dictionary
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
