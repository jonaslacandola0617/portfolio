/**
 * Email sent to the site owner when someone uses the /contact form.
 *
 * Email clients ignore most modern CSS, so this is table-based with inline
 * styles and system fonts. Colours follow the public site: graphite header,
 * warm paper body, one signal-orange accent.
 */

const colors = {
  page: "#efebe3",
  card: "#ffffff",
  ink: "#141412",
  text: "#2c2a26",
  muted: "#77736a",
  line: "#e4dfd5",
  header: "#0d0e0d",
  headerText: "#efebe3",
  headerMuted: "#8a857c",
  accent: "#d9461a",
  ok: "#1d9150",
};

const fontStack = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const monoStack = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export interface ContactNotification {
  name: string;
  email: string;
  message: string;
  siteUrl: string;
  receivedAt?: Date;
}

function receivedLabel(date: Date) {
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) + " (Manila)";
}

/** The site's three-node mark, drawn with table cells so it renders everywhere. */
function logoMark() {
  const dot = (color: string) =>
    `<td style="width:8px;height:8px;background:${color};border-radius:4px;font-size:0;line-height:0">&nbsp;</td>`;
  const gap = `<td style="width:4px;font-size:0;line-height:0">&nbsp;</td>`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate">
      <tr>${dot(colors.headerText)}${gap}<td style="width:8px;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td colspan="3" style="height:4px;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="width:8px;font-size:0;line-height:0">&nbsp;</td>${gap}${dot(colors.accent)}</tr>
      <tr><td colspan="3" style="height:4px;font-size:0;line-height:0">&nbsp;</td></tr>
      <tr>${dot(colors.headerText)}${gap}<td style="width:8px;font-size:0;line-height:0">&nbsp;</td></tr>
    </table>`;
}

export function buildContactNotification({ name, email, message, siteUrl, receivedAt = new Date() }: ContactNotification) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const firstName = escapeHtml(name.split(" ")[0] || name);
  const host = escapeHtml(new URL(siteUrl).host.replace(/^www\./, ""));
  const received = escapeHtml(receivedLabel(receivedAt));
  // The address is already validated by the form schema; escape it for the HTML attribute only.
  const replyHref = escapeHtml(`mailto:${email}?subject=${encodeURIComponent("Re: your message on " + new URL(siteUrl).host.replace(/^www\./, ""))}`);
  // Inbox preview line: the start of the message, padded so clients don't pull in other text.
  const preview = escapeHtml(message.replace(/\s+/g, " ").slice(0, 110));
  const words = message.trim().split(/\s+/).filter(Boolean).length;

  const subject = `New message from ${name}`;

  const text = [
    `New message via ${host}/contact`,
    "",
    `From:     ${name}`,
    `Email:    ${email}`,
    `Received: ${receivedLabel(receivedAt)}`,
    "",
    "Message",
    "-------",
    message,
    "",
    `Reply to this email to respond directly to ${name}.`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.page};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preview}${"&nbsp;&zwnj;".repeat(40)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.page}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:separate">

          <!-- Header -->
          <tr>
            <td style="background:${colors.header};border-radius:16px 16px 0 0;padding:22px 28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="32" style="vertical-align:middle">${logoMark()}</td>
                  <td style="vertical-align:middle;padding-left:12px;font-family:${fontStack};font-size:15px;font-weight:700;color:${colors.headerText}">
                    Jonas <span style="font-weight:500;color:${colors.headerMuted}">Lacandola</span>
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:${monoStack};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${colors.headerMuted}">
                    ${host}/contact
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:${colors.card};padding:32px 28px 8px;font-family:${fontStack};color:${colors.text}">
              <p style="margin:0 0 10px;font-family:${monoStack};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${colors.accent}">
                <span style="display:inline-block;width:8px;height:8px;border-radius:4px;background:${colors.ok};vertical-align:middle"></span>&nbsp; New message
              </p>
              <h1 style="margin:0 0 24px;font-family:${fontStack};font-size:28px;line-height:1.15;font-weight:700;letter-spacing:-.02em;color:${colors.ink}">
                ${safeName} wants to get in touch.
              </h1>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${colors.line};border-bottom:1px solid ${colors.line};margin:0 0 24px">
                <tr>
                  <td style="padding:12px 0;width:96px;font-size:13px;color:${colors.muted};vertical-align:top">From</td>
                  <td style="padding:12px 0;font-size:15px;font-weight:600;color:${colors.ink}">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-top:1px solid ${colors.line};font-size:13px;color:${colors.muted};vertical-align:top">Email</td>
                  <td style="padding:12px 0;border-top:1px solid ${colors.line};font-size:15px"><a href="mailto:${safeEmail}" style="color:${colors.accent};text-decoration:none;font-weight:600">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-top:1px solid ${colors.line};font-size:13px;color:${colors.muted};vertical-align:top">Received</td>
                  <td style="padding:12px 0;border-top:1px solid ${colors.line};font-size:15px;color:${colors.text}">${received}</td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:13px;color:${colors.muted}">Message <span style="color:${colors.line}">·</span> ${words} word${words === 1 ? "" : "s"}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:${colors.page};border-left:3px solid ${colors.accent};border-radius:0 10px 10px 0;padding:18px 20px;font-size:16px;line-height:1.65;color:${colors.ink};white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
                <tr>
                  <td style="background:${colors.ink};border-radius:999px">
                    <a href="${replyHref}" style="display:inline-block;padding:13px 24px;font-family:${fontStack};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">Reply to ${firstName} &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:${colors.muted}">Or just hit reply. Your answer goes straight to ${safeEmail}.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${colors.card};border-top:1px solid ${colors.line};border-radius:0 0 16px 16px;padding:18px 28px;font-family:${fontStack};font-size:12px;line-height:1.5;color:${colors.muted}">
              Sent from the contact form on <a href="${escapeHtml(siteUrl)}/contact" style="color:${colors.muted}">${host}</a>. Spam is filtered with a hidden field and a minimum fill time.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
