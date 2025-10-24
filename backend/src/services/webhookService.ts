import axios from "axios";
import { ParsedEmail } from "../types";

let slackWebhookUrl: string | undefined;
let webhookSiteUrl: string | undefined;
let frontendBaseUrl = "http://localhost:5173"; // adjust via env if needed later

export function initWebhookService(opts: { slackWebhook?: string; webhookSiteUrl?: string; frontendBaseUrl?: string }) {
  slackWebhookUrl = opts.slackWebhook;
  webhookSiteUrl = opts.webhookSiteUrl;
  if (opts.frontendBaseUrl) frontendBaseUrl = opts.frontendBaseUrl;
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

export async function notifyInterested(email: ParsedEmail) {
  const text = `Interested lead: ${email.subject}\nFrom: ${email.from}\nAccount: ${email.accountId}\nOpen: ${frontendBaseUrl}/email/${encodeURIComponent(email.id)}`;

  if (slackWebhookUrl) {
    await retry(() => axios.post(slackWebhookUrl!, { text }));
  }
  if (webhookSiteUrl) {
    await retry(() => axios.post(webhookSiteUrl!, email, { headers: { "Content-Type": "application/json" } }));
  }
}

export async function sendTestWebhook() {
  if (!webhookSiteUrl && !slackWebhookUrl) {
    throw new Error("No webhook configured");
  }
  const dummy: ParsedEmail = {
    id: "test:1",
    accountId: "test",
    folder: "INBOX",
    subject: "Test Interested Email",
    from: "tester@example.com",
    to: ["you@example.com"],
    date: new Date().toISOString(),
    bodyText: "I am interested in your product.",
  };
  await notifyInterested(dummy);
  return { ok: true };
}
