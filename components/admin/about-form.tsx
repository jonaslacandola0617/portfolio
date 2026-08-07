"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Save } from "lucide-react";
import { updateAboutAction } from "@/app/admin/(dashboard)/about/actions";
import { FormMessage } from "@/components/admin/form-message";
import { useToast } from "@/components/ui/toast";
import type { AboutPageValues } from "@/lib/validations/about";
import type { ActionResult } from "@/types/admin";

const initialState: ActionResult = { success: false };

const textareaClassName =
  "w-full border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-cobalt";

export function AboutForm({ about }: { about: AboutPageValues }) {
  const [state, action] = useFormState(updateAboutAction, initialState);
  const { success } = useToast();

  useEffect(() => {
    if (state.success && state.message) {
      success(state.message, { id: "about-page-save" });
    }
  }, [state.message, state.success, success]);

  return (
    <form action={action} className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">About</h1>
        <button
          type="submit"
          className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2 text-sm font-medium text-surface"
        >
          <Save size={13} /> Save
        </button>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <label htmlFor="quote" className="label mb-2 block">
            Opening Quote
          </label>
          <textarea
            id="quote"
            name="quote"
            rows={3}
            defaultValue={about.quote}
            required
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="background" className="label mb-2 block">
            Background
          </label>
          <textarea
            id="background"
            name="background"
            rows={5}
            defaultValue={about.background}
            required
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="currentFocus" className="label mb-2 block">
            Current Focus
          </label>
          <textarea
            id="currentFocus"
            name="currentFocus"
            rows={3}
            defaultValue={about.currentFocus}
            required
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="focusTags" className="label mb-2 block">
            Current Focus Tags
          </label>
          <textarea
            id="focusTags"
            name="focusTags"
            rows={4}
            defaultValue={about.focusTags.join("\n")}
            required
            className={textareaClassName}
          />
          <p className="mt-1 text-[11px] text-muted">One tag per line.</p>
        </div>

        <div>
          <label htmlFor="learningPhilosophy" className="label mb-2 block">
            Learning Philosophy
          </label>
          <textarea
            id="learningPhilosophy"
            name="learningPhilosophy"
            rows={3}
            defaultValue={about.learningPhilosophy}
            required
            className={textareaClassName}
          />
        </div>

        <div>
          <label htmlFor="whatsNext" className="label mb-2 block">
            What&apos;s Next
          </label>
          <textarea
            id="whatsNext"
            name="whatsNext"
            rows={3}
            defaultValue={about.whatsNext}
            required
            className={textareaClassName}
          />
        </div>

        {!state.success && state.message && (
          <FormMessage variant="error">{state.message}</FormMessage>
        )}
      </div>
    </form>
  );
}
