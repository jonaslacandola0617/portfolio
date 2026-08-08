"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/components/editor/save-status";
import type { SaveResult } from "@/types/admin";

const MAX_AUTO_RETRIES = 2;
const RETRY_BACKOFF_MS = [1500, 3500];

const unknownFailure = (revision?: number): SaveResult => ({
  success: false,
  code: "UNKNOWN_ERROR",
  message: "The content couldn't be saved. Try again.",
  revision,
});

export function useAutosave<T>(
  save: (value: T, clientRevision: number) => Promise<SaveResult>,
  delayMs = 2000,
  storageKey?: string
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveRef = useRef(save);
  const latestValueRef = useRef<T | undefined>(undefined);
  const latestRevisionRef = useRef(0);
  const confirmedRevisionRef = useRef(0);
  const inFlightRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);
  const waitersRef = useRef<Array<(result: SaveResult) => void>>([]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return;
      const value = JSON.parse(stored) as { status?: SaveStatus; savedAt?: string; error?: string };
      if (value.status === "saved") {
        setStatus("saved");
        setLastSavedAt(value.savedAt ?? null);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const settleWaiters = useCallback((result: SaveResult) => {
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve(result);
  }, []);

  const runSaveLoop = useCallback(async () => {
    if (inFlightRef.current || latestValueRef.current === undefined) return;

    inFlightRef.current = true;
    if (mountedRef.current) setIsSaving(true);
    let finalResult: SaveResult = unknownFailure(latestRevisionRef.current);

    while (mountedRef.current && confirmedRevisionRef.current < latestRevisionRef.current) {
      const value = latestValueRef.current as T;
      const revision = latestRevisionRef.current;
      let attempt = 0;

      while (mountedRef.current) {
        if (latestRevisionRef.current > revision) break;
        setStatus(attempt === 0 ? "saving" : "retrying");
        setErrorMessage(null);

        try {
          finalResult = await saveRef.current(value, revision);
        } catch (error) {
          console.error("[editor:autosave:invoke] Server Action invocation failed", {
            operation: "autosave",
            revision,
            errorType: error instanceof Error ? error.name : typeof error,
          });
          finalResult = unknownFailure(revision);
        }

        if (finalResult.success && finalResult.revision === revision) {
          confirmedRevisionRef.current = revision;
          setLastSavedAt(finalResult.savedAt);
          break;
        }

        if (finalResult.success) {
          finalResult = {
            success: false,
            code: "CONFLICT",
            message: "The server confirmed a different editor revision. Retry the save.",
            revision,
          };
        }

        // Never retry an older snapshot after a newer edit exists. The
        // outer loop immediately picks up the newest revision instead.
        if (latestRevisionRef.current > revision) break;

        if (attempt >= MAX_AUTO_RETRIES) {
          setStatus("error");
          setErrorMessage(finalResult.message);
          if (storageKey) {
            sessionStorage.setItem(
              storageKey,
              JSON.stringify({ status: "error", error: finalResult.message })
            );
          }
          inFlightRef.current = false;
          setIsSaving(false);
          settleWaiters(finalResult);
          return;
        }

        setStatus("retrying");
        attempt += 1;
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BACKOFF_MS[attempt - 1] ?? RETRY_BACKOFF_MS.at(-1))
        );
      }
    }

    inFlightRef.current = false;
    if (mountedRef.current) {
      setIsSaving(false);
      if (confirmedRevisionRef.current === latestRevisionRef.current && finalResult.success) {
        setStatus("saved");
        setErrorMessage(null);
        if (storageKey) {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({ status: "saved", savedAt: finalResult.savedAt })
          );
        }
        settleWaiters(finalResult);
      } else if (confirmedRevisionRef.current < latestRevisionRef.current) {
        setStatus("unsaved");
      }
    }
  }, [settleWaiters, storageKey]);

  const queueValue = useCallback(
    (value: T, immediate: boolean) => {
      latestValueRef.current = value;
      latestRevisionRef.current += 1;
      setStatus("unsaved");
      setErrorMessage(null);
      if (storageKey) sessionStorage.removeItem(storageKey);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (immediate) {
        void runSaveLoop();
      } else {
        timeoutRef.current = setTimeout(() => void runSaveLoop(), delayMs);
      }
      return latestRevisionRef.current;
    },
    [delayMs, runSaveLoop, storageKey]
  );

  const notifyChange = useCallback((value: T) => queueValue(value, false), [queueValue]);

  const flush = useCallback(
    (value: T): Promise<SaveResult> => {
      queueValue(value, true);
      return new Promise((resolve) => {
        waitersRef.current.push(resolve);
        // queueValue may have observed an in-flight request. Calling the
        // loop again is harmless and guarantees a just-added waiter is
        // attached to the active/new run.
        void runSaveLoop();
      });
    },
    [queueValue, runSaveLoop]
  );

  const retry = useCallback(() => {
    if (inFlightRef.current || latestValueRef.current === undefined) return;
    void runSaveLoop();
  }, [runSaveLoop]);

  const hasUnsavedChanges = useCallback(
    () => confirmedRevisionRef.current < latestRevisionRef.current,
    []
  );

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (confirmedRevisionRef.current < latestRevisionRef.current) {
        event.preventDefault();
      }
    };
    const warnBeforeClientNavigation = (event: MouseEvent) => {
      if (confirmedRevisionRef.current >= latestRevisionRef.current) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.getAttribute("target") === "_blank") return;
      const destination = new URL(anchor.getAttribute("href") ?? "", window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }
      if (!window.confirm("Editor changes are still unsaved. Leave this page anyway?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnBeforeClientNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnBeforeClientNavigation, true);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      settleWaiters({
        success: false,
        code: "UNKNOWN_ERROR",
        message: "The editor closed before the pending save was confirmed.",
        revision: latestRevisionRef.current,
      });
    };
  }, [settleWaiters]);

  return {
    status,
    errorMessage,
    lastSavedAt,
    notifyChange,
    flush,
    retry,
    isSaving,
    hasUnsavedChanges,
  };
}
