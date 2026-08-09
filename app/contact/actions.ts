"use server";

import { z } from "zod";
import { getSiteSettings } from "@/lib/db/queries/settings";

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      subject: `New message from ${name}`,
      text: [
        "New message from jonasl.online/contact",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
        "",
        "Reply to this email to respond directly to the sender.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#171717;line-height:1.6">
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">
            <tr>
              <td style="width:44px;vertical-align:middle">
                <div style="width:32px;height:32px;background:#0a0b0d;border:1px solid #e8e6de;box-sizing:border-box;overflow:hidden">
                  <div style="width:11px;height:11px;margin:6px auto 3px;border-radius:50%;background:#5c7cfa"></div>
                  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="width:20px;height:6px;border-collapse:collapse">
                    <tr>
                      <td style="width:6px;height:6px;background:#ef5b41;font-size:0;line-height:0">&nbsp;</td>
                      <td style="width:14px;height:6px;background:#f2f0e8;font-size:0;line-height:0">&nbsp;</td>
                    </tr>
                  </table>
                </div>
              </td>
              <td style="vertical-align:middle;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#666">
                jonasl.online / contact
              </td>
            </tr>
          </table>
          <h1 style="font-size:24px;line-height:1.25;margin:0 0 24px">New Message</h1>
          <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:88px">Name</td><td style="padding:8px 0"><strong>${escapeHtml(name)}</strong></td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          </table>
          <div style="border-left:3px solid #5c7cfa;padding:4px 0 4px 16px;white-space:pre-wrap">${escapeHtml(message)}</div>
          <p style="font-size:12px;color:#777;margin-top:28px">Reply to this email to respond directly to ${escapeHtml(name)}.</p>
        </div>
      `,
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
