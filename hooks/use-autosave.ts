"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "@/components/editor/save-status";

/**
 * Debounced autosave: calls `save(value)` a fixed delay after the last
 * change, not on every keystroke. `notifyChange` is called on every edit
 * to flip status to "unsaved" immediately (so the indicator feels
 * responsive) while the actual save call is debounced separately.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>, delayMs = 2000) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const latestValue = useRef<T>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const notifyChange = useCallback(
    (value: T) => {
      latestValue.current = value;
      setStatus("unsaved");

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setStatus("saving");
        try {
          await save(latestValue.current as T);
          setStatus("saved");
        } catch (error) {
          console.error("[useAutosave] save failed:", error);
          setStatus("error");
        }
      }, delayMs);
    },
    [save, delayMs]
  );

  /** Force an immediate save, bypassing the debounce — used by the
   *  "Save now" / publish actions so they don't have to wait out the
   *  debounce window or race it. */
  const saveNow = useCallback(
    async (value: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      latestValue.current = value;
      setStatus("saving");
      try {
        await save(value);
        setStatus("saved");
      } catch (error) {
        console.error("[useAutosave] saveNow failed:", error);
        setStatus("error");
        throw error;
      }
    },
    [save]
  );

  return { status, notifyChange, saveNow };
}
