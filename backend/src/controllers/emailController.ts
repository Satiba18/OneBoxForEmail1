import { Request, Response } from "express";
import { getEmail, searchEmails, updateEmailCategory } from "../services/elasticService";
import { categorizeAndPersist } from "../services/categorizer";
import { suggestReply } from "../services/suggestedReply";

export async function searchEmailsHandler(req: Request, res: Response) {
  const { query = "", account = "", folder = "", from = "", category = "", page = "1", size = "20", since = "" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10) || 1;
  const sizeNum = Math.min(parseInt(size, 10) || 20, 100);
  try {
    const results = await searchEmails(query, { account, folder, from, category: category as any, since }, pageNum, sizeNum);
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getEmailHandler(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const email = await getEmail(id);
    if (!email) return res.status(404).json({ error: "Not found" });
    res.json(email);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function categorizeEmailHandler(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const email = await getEmail(id);
    if (!email) return res.status(404).json({ error: "Not found" });
    const category = await categorizeAndPersist(email);
    res.json({ id, category });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function markEmailHandler(req: Request, res: Response) {
  const id = req.params.id;
  const { category } = req.body || {};
  if (!category) return res.status(400).json({ error: "category required" });
  try {
    await updateEmailCategory(id, category);
    res.json({ id, category });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function suggestReplyHandler(req: Request, res: Response) {
  const { emailId, tone = "friendly", maxTokens = 200 } = req.body || {};
  if (!emailId) return res.status(400).json({ error: "emailId required" });
  try {
    const resp = await suggestReply(emailId, tone, maxTokens);
    res.json(resp);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
