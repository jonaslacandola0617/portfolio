"use server";

import { z } from "zod";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildContactNotification } from "@/lib/email/contact-notification";
import { siteConfig } from "@/lib/site-config";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  message: z
    .string()
    .trim()
    .min(10, "Please write a slightly longer message.")
    .max(5000, "Message must be 5,000 characters or fewer."),
});

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
  submissionId?: string;
};

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validationErrors(error: z.ZodError): ContactFormState["fieldErrors"] {
  const errors: NonNullable<ContactFormState["fieldErrors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      (field === "name" || field === "email" || field === "message") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export async function sendContactMessageAction(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const submissionId = crypto.randomUUID();

  // Honeypot: real visitors never interact with this field. Return a normal
  // success response so automated form fillers do not learn how to bypass it.
  if (stringValue(formData, "companyWebsite").trim()) {
    return {
      status: "success",
      message: "Message sent. I’ll get back to you soon.",
      submissionId,
    };
  }

  const startedAt = Number(stringValue(formData, "startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1200) {
    return {
      status: "error",
      message: "Please wait a moment before sending your message.",
      submissionId,
    };
  }

  const parsed = contactSchema.safeParse({
    name: stringValue(formData, "name"),
    email: stringValue(formData, "email"),
    message: stringValue(formData, "message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors: validationErrors(parsed.error),
      submissionId,
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not configured");
    return {
      status: "error",
      message: "Email is temporarily unavailable. Please use the direct email link instead.",
      submissionId,
    };
  }

  const settings = await getSiteSettings();
  const recipient = z.string().email().safeParse(settings.email);
  if (!recipient.success) {
    console.error("[contact] CMS contact email is invalid");
    return {
      status: "error",
      message: "Email is temporarily unavailable. Please use the direct email link instead.",
      submissionId,
    };
  }

  const name = parsed.data.name.replace(/\s+/g, " ");
  const email = parsed.data.email.toLowerCase();
  const message = parsed.data.message;
  const notification = buildContactNotification({ name, email, message, siteUrl: siteConfig.siteUrl });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `portfolio-contact-${submissionId}`,
    },
    body: JSON.stringify({
      from: "jonasl.online <hello@mail.jonasl.online>",
      to: [recipient.data],
      reply_to: email,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
      tags: [{ name: "source", value: "portfolio_contact" }],
    }),
    cache: "no-store",
  }).catch((error: unknown) => {
    console.error("[contact] Resend request failed", error instanceof Error ? error.message : "unknown error");
    return null;
  });

  if (!response?.ok) {
    let providerMessage = "unknown error";
    if (response) {
      try {
        const body = (await response.json()) as { message?: unknown; name?: unknown };
        providerMessage =
          typeof body.message === "string"
            ? body.message
            : typeof body.name === "string"
              ? body.name
              : `HTTP ${response.status}`;
      } catch {
        providerMessage = `HTTP ${response.status}`;
      }
    }
    console.error("[contact] Resend rejected message", providerMessage);
    return {
      status: "error",
      message: "I couldn’t send that message right now. Please use the direct email link instead.",
      submissionId,
    };
  }

  return {
    status: "success",
    message: "Message sent. I’ll get back to you soon.",
    submissionId,
  };
}
