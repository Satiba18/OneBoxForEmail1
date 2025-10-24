import OpenAI from "openai";
import { getEmail } from "./elasticService";
import { querySimilar } from "./vectorService";

let openai: OpenAI | null = null;
let calLink: string | undefined;

export function initSuggestedReply(opts: { openAiApiKey?: string; calLink?: string }) {
  openai = opts.openAiApiKey ? new OpenAI({ apiKey: opts.openAiApiKey }) : null;
  calLink = opts.calLink;
}

export async function suggestReply(emailId: string, tone: string = "friendly", maxTokens = 200) {
  const email = await getEmail(emailId);
  if (!email) throw new Error("Email not found");
  const contexts = await querySimilar(`${email.subject}\n${email.bodyText || ""}`, 3);

  if (!openai) {
    const base = `Hi,\n\nThanks for your interest! ${calLink ? `You can book time here: ${calLink}.` : "Let's find a time to connect."}\n\nBest,\nTeam`;
    return { reply: base, contexts };
  }

  const prompt = `You are an SDR. Write a concise ${tone} reply to the email below using the provided product context. Offer to continue and include a call to action${calLink ? ` with this booking link: ${calLink}` : ""}. Keep it under 120 words.\n\nProduct Context:\n${contexts.map((c) => `- (${c.source}) ${c.text}`).join("\n")}\n\nEmail:\nSubject: ${email.subject}\nBody: ${email.bodyText || email.bodyHtml || ""}`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You write short, helpful sales replies." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  const reply = res.choices[0]?.message?.content || "";
  return { reply, contexts };
}
