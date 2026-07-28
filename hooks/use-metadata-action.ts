"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/types/admin";

type MetadataAction = (previousState: ActionResult, formData: FormData) => Promise<ActionResult>;

export function useMetadataAction(action: MetadataAction, storageKey?: string) {
  const actionRef = useRef(action);
  const stateRef = useRef<ActionResult>({ success: false });
  const [state, setState] = useState<ActionResult>(stateRef.current);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return;
      const result = JSON.parse(stored) as ActionResult;
      stateRef.current = result;
      setState(result);
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const submit = useCallback(async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await actionRef.current(stateRef.current, formData);
      stateRef.current = result;
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(result));
      setState(result);
    } catch (error) {
      console.error("[admin:metadata-save] Server Action invocation failed", {
        operation: "metadata-save",
        errorType: error instanceof Error ? error.name : typeof error,
      });
      const result: ActionResult = {
        success: false,
        code: "UNKNOWN_ERROR",
        message: "The metadata couldn't be saved. Try again.",
      };
      stateRef.current = result;
      if (storageKey) sessionStorage.setItem(storageKey, JSON.stringify(result));
      setState(result);
    } finally {
      setIsPending(false);
    }
  }, [storageKey]);

  return { state, submit, isPending };
}
