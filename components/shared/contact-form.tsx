"use client";

import * as React from "react";
import { Check, Loader2, Send } from "lucide-react";
import {
  sendContactMessageAction,
  type ContactFormState,
} from "@/app/contact/actions";

const initialState: ContactFormState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "w-full border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-cobalt disabled:cursor-not-allowed disabled:opacity-60";

export function ContactForm() {
  const [state, formAction, pending] = React.useActionState(
    sendContactMessageAction,
    initialState,
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const [startedAt, setStartedAt] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    setStartedAt(Date.now());
  }, [state.submissionId, state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="startedAt" value={startedAt} readOnly />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="companyWebsite">Company website</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label mb-2 block">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            className={inputClassName}
            placeholder="Jane Recruiter"
          />
          {state.fieldErrors?.name && (
            <p id="name-error" className="mt-1.5 text-xs text-vermilion">
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="label mb-2 block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            disabled={pending}
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={inputClassName}
            placeholder="jane@company.com"
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="mt-1.5 text-xs text-vermilion">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="message" className="label block">
            Message
          </label>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Max 5,000 characters
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          disabled={pending}
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
          className={inputClassName}
          placeholder="Tell me a bit about the role, project, or opportunity…"
        />
        {state.fieldErrors?.message && (
          <p id="message-error" className="mt-1.5 text-xs text-vermilion">
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 border border-border-strong bg-text px-5 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : state.status === "success" ? (
            <Check size={14} />
          ) : (
            <Send size={14} />
          )}
          {pending ? "Sending…" : state.status === "success" ? "Sent" : "Send message"}
        </button>

        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Sent securely through jonasl.online
        </p>
      </div>

      {state.status !== "idle" && (
        <div
          role="status"
          aria-live="polite"
          className={`border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-teal/50 bg-teal/5 text-text"
              : "border-vermilion/50 bg-vermilion/5 text-text"
          }`}
        >
          <span
            className={`mr-2 font-mono text-[10px] uppercase tracking-wider ${
              state.status === "success" ? "text-teal" : "text-vermilion"
            }`}
          >
            {state.status === "success" ? "Delivered" : "Not sent"}
          </span>
          {state.message}
        </div>
      )}
    </form>
  );
}
