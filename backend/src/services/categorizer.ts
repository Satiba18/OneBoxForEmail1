import OpenAI from "openai";
import { EmailCategory, ParsedEmail } from "../types";
import { updateEmailCategory } from "./elasticService";
import { notifyInterested } from "./webhookService";

interface CategorizerConfig {
  openAiApiKey?: string;
}

let openai: OpenAI | null = null;

export function initCategorizer(cfg: CategorizerConfig) {
  if (cfg.openAiApiKey) {
    openai = new OpenAI({ apiKey: cfg.openAiApiKey });
  } else {
    openai = null;
  }
}

const LABELS: EmailCategory[] = [
  "Interested",
  "Meeting Booked",
  "Not Interested",
  "Spam",
  "Out of Office",
  "Uncategorized",
];

export async function categorizeEmail(email: ParsedEmail): Promise<EmailCategory> {
  const text = `${email.subject}\n\n${(email.bodyText || email.bodyHtml || "").slice(0, 2000)}`;
  if (openai) {
    try {
      const prompt = `You are a sales inbox triage assistant. Classify the email into exactly one of these labels: Interested, Meeting Booked, Not Interested, Spam, Out of Office.\n\nEmail:\n${text}\n\nRespond with only the label.`;
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise classifier." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 10,
      });
      const label = (res.choices[0]?.message?.content || "Uncategorized").trim();
      const normalized = normalizeLabel(label);
      return normalized;
    } catch (e) {
      console.error("OpenAI categorize failed, falling back:", e);
      return heuristicCategorize(text);
    }
  }
  return heuristicCategorize(text);
}

function normalizeLabel(label: string): EmailCategory {
  const l = label.toLowerCase();
  if (l.includes("interested")) return "Interested";
  if (l.includes("meeting") || l.includes("booked")) return "Meeting Booked";
  if (l.includes("not interested")) return "Not Interested";
  if (l.includes("spam")) return "Spam";
  if (l.includes("out of office") || l.includes("ooo") || l.includes("vacation")) return "Out of Office";
  return "Uncategorized";
}

function heuristicCategorize(text: string): EmailCategory {
  const t = text.toLowerCase();
  if (/(out of office|ooo|on leave|vacation)/i.test(t)) return "Out of Office";
  if (/(meeting booked|calendar invite|see you then)/i.test(t)) return "Meeting Booked";
  if (/(not interested|no thanks|unsubscribe|stop)/i.test(t)) return "Not Interested";
  if (/(interested|count me in|let's talk|keen to try|sounds good)/i.test(t)) return "Interested";
  if (/(viagra|free money|lottery|casino)/i.test(t)) return "Spam";
  return "Uncategorized";
}

export async function categorizeAndPersist(email: ParsedEmail) {
  const category = await categorizeEmail(email);
  try {
    await updateEmailCategory(email.id, category);
  } catch (e) {
    console.error("Failed to update category in ES", e);
  }
  if (category === "Interested") {
    try {
      await notifyInterested(email);
    } catch (e) {
      console.error("Failed to notify webhooks", e);
    }
  }
  return category;
}
