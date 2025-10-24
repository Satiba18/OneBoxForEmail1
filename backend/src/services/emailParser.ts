import { ParsedEmail } from "../types";
import { simpleParser } from "mailparser";

export async function parseRawEmail(accountId: string, folder: string, uid: number | undefined, raw: Buffer): Promise<ParsedEmail> {
  const parsed = await simpleParser(raw);
  const idBase = parsed.messageId || `${accountId}:${folder}:${uid ?? Date.now()}`;
  return {
    id: idBase,
    accountId,
    folder,
    uid,
    subject: parsed.subject || "(no subject)",
    from: parsed.from?.text || "",
    to: parsed.to ? parsed.to.value.map(v => v.address || v.name || "") : [],
    cc: parsed.cc ? parsed.cc.value.map(v => v.address || v.name || "") : undefined,
    bcc: parsed.bcc ? parsed.bcc.value.map(v => v.address || v.name || "") : undefined,
    date: (parsed.date || new Date()).toISOString(),
    bodyText: parsed.text || undefined,
    bodyHtml: parsed.html ? (typeof parsed.html === "string" ? parsed.html : undefined) : undefined,
    messageId: parsed.messageId || undefined,
    inReplyTo: parsed.inReplyTo || undefined,
    threadId: parsed.references ? parsed.references[0] : undefined,
    attachments: parsed.attachments?.map(a => ({ filename: a.filename || "attachment", size: a.size || 0, contentType: a.contentType })) || [],
  };
}
