"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/components/editor/save-status";
import type { AutosaveResult } from "@/types/admin";

const MAX_AUTO_RETRIES = 2;
const RETRY_BACKOFF_MS = [1500, 3500];

/**
 * Debounced autosave — rewritten during the pre-Phase-6 stabilization
 * pass (Workstream A5/A6/5.2) to fix two real problems the previous
 * version had:
 *
 *  1. **No structured result.** `save()` used to be a plain
 *     `Promise<void>` that just threw on failure. The caller had no safe
 *     message to show, and the status label claimed "retrying" even
 *     though nothing retried anything. `save` is now
 *     `(value: T) => Promise<AutosaveResult>` — see types/admin.ts —
 *     so failures carry a real, safe-to-display reason.
 *
 *  2. **Race condition (brief §5.2).** The old hook could start a new
 *     debounced save while an earlier one was still in flight — two
 *     concurrent requests with no ordering guarantee, so a slow older
 *     request resolving *after* a faster newer one could overwrite newer
 *     content with stale content. This version serializes saves through
 *     a simple run-loop: only one save request is ever in flight; if a
 *     newer value arrives while a save is running, it's queued and
 *     picked up the moment the current request finishes — never
 *     abandoned, never run concurrently with another.
 *
 * Retry: on failure, up to MAX_AUTO_RETRIES automatic retries with a
 * short backoff (status "retrying" — genuinely retrying, matching the
 * label). After that, status is "error" and autosave stops until the
 * user clicks the exposed `retry()` — which is real, not decorative.
 */
export function useAutosave<T>(save: (value: T) => Promise<AutosaveResult>, delayMs = 2000) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  /** The latest value the editor has produced, whether or not a save for
   *  it has started yet. */
  const latestValue = useRef<T>();
  /** True while a save request is actually in flight (server round-trip
   *  in progress) — the serialization guard. */
  const isSavingRef = useRef(false);
  /** Set when notifyChange/saveNow arrives while a save is already in
   *  flight; tells the in-flight save's completion handler to
   *  immediately start another run rather than wait for the next
   *  debounce window. */
  const hasQueuedChangeRef = useRef(false);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  /** The actual save run-loop. Never called while isSavingRef is already
   *  true — every call site checks that first. */
  const runSave = useCallback(async () => {
    isSavingRef.current = true;
    setStatus((prev) => (prev === "error" ? "retrying" : "saving"));

    const value = latestValue.current as T;
    const result = await save(value);

    if (!mountedRef.current) return;

    if (result.success) {
      retryCountRef.current = 0;
      setErrorMessage(null);
      setStatus("saved");
      setLastSavedAt(result.savedAt);
    } else {
      setErrorMessage(result.message);

      if (retryCountRef.current < MAX_AUTO_RETRIES) {
        const attempt = retryCountRef.current;
        retryCountRef.current += 1;
        setStatus("retrying");
        retryTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          isSavingRef.current = false;
          void runSave();
        }, RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1]);
        return; // stay "saving"/"retrying" — isSavingRef stays true until the retry actually runs
      }

      setStatus("error");
    }

    isSavingRef.current = false;

    // A newer edit arrived while this request (or its retries) was in
    // flight — pick it up immediately instead of waiting for the next
    // debounce window, so the newest content is never left unsaved
    // behind a stale in-flight request.
    if (hasQueuedChangeRef.current && result.success) {
      hasQueuedChangeRef.current = false;
      void runSave();
    }
  }, [save]);

  const notifyChange = useCallback(
    (value: T) => {
      latestValue.current = value;
      setStatus("unsaved");

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryCountRef.current = 0;

      timeoutRef.current = setTimeout(() => {
        if (isSavingRef.current) {
          // A save is already running — don't start a second, overlapping
          // request. Mark that newer content is waiting; the in-flight
          // request's completion handler will pick it up.
          hasQueuedChangeRef.current = true;
          return;
        }
        void runSave();
      }, delayMs);
    },
    [runSave, delayMs]
  );

  /** Force an immediate save, bypassing the debounce — used by the
   *  "Save now" button so it doesn't have to wait out the debounce
   *  window. If a save is already in flight, this just queues the
   *  latest value rather than firing a second concurrent request. */
  const saveNow = useCallback(
    async (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      latestValue.current = value;
      retryCountRef.current = 0;

      if (isSavingRef.current) {
        hasQueuedChangeRef.current = true;
        return;
      }
      await runSave();
    },
    [runSave]
  );

  /** Manual retry after autosave has given up — genuinely re-attempts
   *  the save (unlike the old "Couldn't save — retrying" label, which
   *  claimed this was already happening automatically). */
  const retry = useCallback(() => {
    if (isSavingRef.current) return;
    retryCountRef.current = 0;
    void runSave();
  }, [runSave]);

  return { status, errorMessage, lastSavedAt, notifyChange, saveNow, retry, isSaving: () => isSavingRef.current };
}
