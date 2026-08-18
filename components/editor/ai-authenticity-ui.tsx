"use client";

import {
  Check,
  ChevronRight,
  Fingerprint,
  Loader2,
  RefreshCw,
  ShieldQuestion,
  Sparkles,
  X,
} from "lucide-react";
import type { AIAuthenticityIssue, AuthenticityLevel } from "@/lib/editor/ai-authenticity";
import type {
  AIAuthenticityMode,
  AIAuthenticityOverall,
  AIAuthenticityStatus,
  AIAuthenticitySuggestion,
  AIAuthenticitySuggestionStatus,
} from "@/hooks/use-ai-authenticity";

interface ToolbarButtonProps {
  status: AIAuthenticityStatus;
  issueCount: number;
  panelOpen: boolean;
  onCheck: () => void;
  onTogglePanel: () => void;
}

export function AIAuthenticityToolbarButton({
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
      className={`ml-1 inline-flex h-9 shrink-0 items-center gap-2 border px-3 font-mono text-xs transition-colors ${
        panelOpen
          ? "border-cobalt bg-cobalt text-white"
          : "border-border bg-surface-2 text-text hover:border-border-strong"
      }`}
      title={checked ? "Open AI and voice analysis" : "Check AI-like writing patterns and voice consistency"}
      aria-pressed={panelOpen}
    >
      {checking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      <span>{checking ? "Analyzing" : "AI Check"}</span>
      {checked && issueCount > 0 && (
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

function levelLabel(level: AuthenticityLevel) {
  if (level === "high") return "High";
  if (level === "moderate") return "Moderate";
  return "Low";
}

function levelClass(level: AuthenticityLevel) {
  if (level === "high") return "text-vermilion";
  if (level === "moderate") return "text-signal-yellow";
  return "text-teal";
}

function scoreLabel(value: number) {
  if (value >= 70) return "High";
  if (value >= 40) return "Moderate";
  return "Low";
}

function ScoreCard({
  label,
  value,
  inverse = false,
}: {
  label: string;
  value: number;
  inverse?: boolean;
}) {
  const effective = inverse ? 100 - value : value;
  const tone = effective >= 70 ? "text-vermilion" : effective >= 40 ? "text-signal-yellow" : "text-teal";

  return (
    <div className="border border-border bg-surface px-3 py-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className={`mt-1 font-display text-lg font-semibold ${tone}`}>{value}%</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        {inverse ? `${value >= 70 ? "High" : value >= 40 ? "Moderate" : "Low"} match` : scoreLabel(value)}
      </div>
    </div>
  );
}

function VoiceSuggestionPanel({
  issue,
  suggestion,
  status,
  error,
  onRequest,
  onReplace,
}: {
  issue: AIAuthenticityIssue;
  suggestion: AIAuthenticitySuggestion | undefined;
  status: AIAuthenticitySuggestionStatus;
  error: string | null;
  onRequest: (issue: AIAuthenticityIssue) => void;
  onReplace: (issue: AIAuthenticityIssue, replacement: string) => void;
}) {
  const loading = status === "loading";
  const ready = Boolean(suggestion && status === "ready");

  return (
    <div className="border-t border-border bg-surface px-4 py-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cobalt" />
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-text">
          Voice-aligned suggestion
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted">
        Uses your previous journal writing as a reference. It keeps the same idea, avoids invented experiences, and does not guarantee any AI-detector result.
      </p>

      {suggestion && status === "ready" && (
        <div className="mt-3 space-y-3">
          <div className="border border-cobalt/40 bg-cobalt-dim px-3 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-cobalt">
              Suggested wording
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-text">
              {suggestion.text}
            </p>
          </div>

          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              Why this fits better
            </div>
            <p className="mt-1 text-[11px] leading-5 text-text-dim">
              {suggestion.explanation}
            </p>
          </div>

          {suggestion.changes.length > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                What changed
              </div>
              <div className="mt-1.5 space-y-1.5">
                {suggestion.changes.map((change, index) => (
                  <div key={`${issue.id}:change:${index}`} className="flex gap-2 text-[11px] leading-5 text-text-dim">
                    <span className="font-mono text-cobalt">{index + 1}.</span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === "error" && error && (
        <p className="mt-3 text-[11px] leading-5 text-vermilion">{error}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {ready && suggestion && (
          <button
            type="button"
            onClick={() => onReplace(issue, suggestion.text)}
            className="inline-flex items-center gap-2 border border-cobalt bg-cobalt px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-white hover:bg-cobalt/90"
            title="Replace the highlighted passage with this suggestion"
          >
            <Check className="h-3.5 w-3.5" />
            Replace highlighted
          </button>
        )}

        <button
          type="button"
          onClick={() => onRequest(issue)}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-border-strong bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-text hover:border-cobalt hover:text-cobalt disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading
            ? "Writing suggestion"
            : status === "ready"
              ? "Try another version"
              : status === "error"
                ? "Try again"
                : "Suggest closer-to-my-voice wording"}
        </button>
      </div>
    </div>
  );
}

interface OverlaysProps {
  issues: AIAuthenticityIssue[];
  status: AIAuthenticityStatus;
  panelOpen: boolean;
  selectedIssue: AIAuthenticityIssue | null;
  overall: AIAuthenticityOverall | null;
  mode: AIAuthenticityMode;
  referenceSamples: number;
  providerWarning: string | null;
  notice: string | null;
  errorMessage: string | null;
  suggestions: Record<string, AIAuthenticitySuggestion>;
  suggestionStatuses: Record<string, AIAuthenticitySuggestionStatus>;
  suggestionErrors: Record<string, string | null>;
  onCheck: () => void;
  onClosePanel: () => void;
  onSelectIssue: (issue: AIAuthenticityIssue) => void;
  onRequestSuggestion: (issue: AIAuthenticityIssue) => void;
  onReplaceSuggestion: (issue: AIAuthenticityIssue, replacement: string) => void;
}

export function AIAuthenticityOverlays({
  issues,
  status,
  panelOpen,
  selectedIssue,
  overall,
  mode,
  referenceSamples,
  providerWarning,
  notice,
  errorMessage,
  suggestions,
  suggestionStatuses,
  suggestionErrors,
  onCheck,
  onClosePanel,
  onSelectIssue,
  onRequestSuggestion,
  onReplaceSuggestion,
}: OverlaysProps) {
  if (!panelOpen) return null;

  return (
    <aside className="absolute right-4 top-14 z-40 flex max-h-[calc(100%-5rem)] w-[min(24rem,calc(100%-2rem))] flex-col border border-border-strong bg-surface-2 shadow-xl">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-cobalt" />
            <h2 className="font-display text-sm font-semibold text-text">AI & voice check</h2>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {mode === "hybrid" ? "Hybrid AI + stylometry" : "Stylometry / voice comparison"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCheck}
            disabled={status === "checking"}
            className="grid h-8 w-8 place-items-center border border-border text-text-dim hover:border-border-strong hover:text-text disabled:opacity-50"
            title="Analyze again"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onClosePanel}
            className="grid h-8 w-8 place-items-center border border-border text-text-dim hover:border-border-strong hover:text-text"
            aria-label="Close AI and voice checker"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border bg-surface px-4 py-3">
          <div className="flex gap-2 text-xs leading-5 text-text-dim">
            <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
            <p>This is a writing-pattern signal, not proof that a person or AI wrote the text.</p>
          </div>
        </div>

        {status === "checking" && (
          <div className="flex items-center gap-3 px-4 py-7 text-sm text-text-dim">
            <Loader2 className="h-4 w-4 animate-spin text-cobalt" />
            Comparing this draft with your writing…
          </div>
        )}

        {status === "error" && (
          <div className="p-4">
            <p className="text-sm text-vermilion">{errorMessage || "AI/voice check failed."}</p>
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
              The draft changed after this analysis. Run a fresh check before relying on the results.
            </p>
            <button
              type="button"
              onClick={onCheck}
              className="mt-3 inline-flex items-center gap-2 border border-cobalt bg-cobalt px-3 py-2 font-mono text-xs text-white"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              Analyze draft
            </button>
          </div>
        )}

        {status === "ready" && overall && (
          <>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                <ScoreCard label="Voice match" value={overall.voiceConsistency} inverse />
                <ScoreCard label="AI-like" value={overall.aiPatternScore} />
                <ScoreCard label="Over-edit" value={overall.overEditingScore} />
              </div>

              <div className="mt-3 border border-border bg-surface px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                    Overall signal
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.08em] ${levelClass(overall.level)}`}>
                    {levelLabel(overall.level)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-text-dim">{overall.summary}</p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
                  Compared with {referenceSamples} previous published journal{referenceSamples === 1 ? "" : "s"}
                </p>
              </div>

              {providerWarning && (
                <div className="mt-3 border border-signal-yellow/50 bg-signal-yellow/5 px-3 py-2.5 text-xs leading-5 text-text-dim">
                  {providerWarning}
                </div>
              )}

              {notice && <p className="mt-3 text-[11px] leading-5 text-muted">{notice}</p>}
            </div>

            <div className="border-t border-border px-4 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                Passages to review · {issues.length}
              </div>
            </div>

            {issues.length === 0 ? (
              <div className="px-4 pb-5 text-xs leading-5 text-text-dim">
                No passage crossed the review threshold in this pass.
              </div>
            ) : (
              issues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onSelectIssue(issue)}
                  className={`block w-full border-t border-border px-4 py-3 text-left hover:bg-surface-3 ${
                    selectedIssue?.id === issue.id ? "bg-cobalt-dim" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                          Paragraph {issue.paragraphIndex + 1}
                        </span>
                        <span className={`font-mono text-[9px] uppercase tracking-[0.08em] ${levelClass(issue.level)}`}>
                          {levelLabel(issue.level)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-text">
                        {issue.excerpt}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-text-dim">{issue.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.05em] text-muted">
                        <span>Voice {issue.voiceConsistency}%</span>
                        <span>AI-like {issue.aiPatternScore}%</span>
                        <span>Over-edit {issue.overEditingScore}%</span>
                      </div>
                      {issue.reasons.length > 0 && (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted">
                          {issue.reasons.join(" · ")}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </div>
                </button>
              ))
            )}

            {selectedIssue && (
              <VoiceSuggestionPanel
                issue={selectedIssue}
                suggestion={suggestions[selectedIssue.id]}
                status={suggestionStatuses[selectedIssue.id] ?? "idle"}
                error={suggestionErrors[selectedIssue.id] ?? null}
                onRequest={onRequestSuggestion}
                onReplace={onReplaceSuggestion}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
}
