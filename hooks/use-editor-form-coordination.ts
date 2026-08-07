"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { EditorSaveController } from "@/components/editor/editor-shell";

/**
 * Makes an edit form's explicit metadata submission wait until the
 * editor has confirmed its newest revision. The native form action is
 * submitted only after that flush succeeds.
 */
export function useEditorFormCoordination(
  enabled: boolean,
  submitMetadata: (formData: FormData) => Promise<void>
) {
  const controllerRef = useRef<EditorSaveController | null>(null);
  const submitMetadataRef = useRef(submitMetadata);
  const [isCoordinating, setIsCoordinating] = useState(false);
  const [coordinationError, setCoordinationError] = useState<string | null>(null);

  useEffect(() => {
    submitMetadataRef.current = submitMetadata;
  }, [submitMetadata]);

  const registerEditor = useCallback((controller: EditorSaveController | null) => {
    controllerRef.current = controller;
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      setCoordinationError(null);
      setIsCoordinating(true);
      if (enabled) {
        const controller = controllerRef.current;
        if (!controller) {
          setCoordinationError("The editor is still loading. Wait a moment, then save again.");
          return;
        }

        const result = await controller.flush();

        if (!result.success) {
          setIsCoordinating(false);
          setCoordinationError(
            `Metadata was not submitted because editor content is still unsaved. ${result.message}`
          );
          return;
        }
      }

      const formData = new FormData(form);
      await submitMetadataRef.current(formData);
      setIsCoordinating(false);
    },
    [enabled]
  );

  return {
    registerEditor,
    onSubmit,
    isCoordinating,
    coordinationError,
  };
}
