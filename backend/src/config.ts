import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AppConfig, ImapAccountConfig } from "./types";

dotenv.config();

function parseImapAccounts(): ImapAccountConfig[] {
  const raw = process.env.IMAP_ACCOUNTS || "";
  if (!raw) {
    throw new Error("IMAP_ACCOUNTS is required. Provide a JSON array or path to a JSON file.");
  }
  let jsonStr = raw;
  // If raw looks like a file path, read it
  if (!raw.trim().startsWith("[")) {
    const filePath = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
    if (!fs.existsSync(filePath)) {
      throw new Error(`IMAP_ACCOUNTS file not found at ${filePath}`);
    }
    jsonStr = fs.readFileSync(filePath, "utf-8");
  }
  const parsed = JSON.parse(jsonStr) as ImapAccountConfig[];
  if (!Array.isArray(parsed) || parsed.length < 1) {
    throw new Error("IMAP_ACCOUNTS must contain at least one account config");
  }
  parsed.forEach((acc) => {
    if (!acc.id || !acc.host || !acc.port || !acc.user || !acc.password) {
      throw new Error("Each IMAP account must include id, host, port, user, password");
    }
  });
  return parsed;
}

export function loadConfig(): AppConfig {
  const serverPort = parseInt(process.env.SERVER_PORT || "4000", 10);
  const elasticUrl = process.env.ELASTIC_URL || "http://localhost:9200";
  const weaviateUrl = process.env.WEAVIATE_URL || "http://localhost:8080";
  const openAiApiKey = process.env.OPENAI_API_KEY || undefined;
  const slackWebhook = process.env.SLACK_WEBHOOK || undefined;
  const webhookSiteUrl = process.env.WEBHOOK_SITE_URL || undefined;
  const calLink = process.env.CAL_LINK || undefined;

  const imapAccounts = parseImapAccounts();

  if (!elasticUrl) throw new Error("ELASTIC_URL is required");
  if (!weaviateUrl) throw new Error("WEAVIATE_URL is required");

  return {
    serverPort,
    elasticUrl,
    weaviateUrl,
    openAiApiKey,
    slackWebhook,
    webhookSiteUrl,
    calLink,
    imapAccounts,
  };
}
