import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { loadConfig } from "./config";
import router from "./routes";
import { initElastic, ensureIndex } from "./services/elasticService";
import { initCategorizer } from "./services/categorizer";
import { initWebhookService } from "./services/webhookService";
import { initVectorService, ensureSchema } from "./services/vectorService";
import { initSuggestedReply } from "./services/suggestedReply";
import { startImapAccounts } from "./services/imapService";

async function main() {
  const cfg = loadConfig();

  initElastic(cfg.elasticUrl);
  await ensureIndex();

  initCategorizer({ openAiApiKey: cfg.openAiApiKey });
  initWebhookService({ slackWebhook: cfg.slackWebhook, webhookSiteUrl: cfg.webhookSiteUrl });

  initVectorService(cfg.weaviateUrl, cfg.openAiApiKey);
  await ensureSchema();
  // Seed minimal context docs for RAG
  await seedRagDocs();

  initSuggestedReply({ openAiApiKey: cfg.openAiApiKey, calLink: cfg.calLink });

  // Start IMAP real-time sync
  await startImapAccounts(cfg.imapAccounts);

  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: "2mb" }));
  app.use("/api", router);

  app.listen(cfg.serverPort, () => {
    console.log(`Server listening on :${cfg.serverPort}`);
  });
}

async function seedRagDocs() {
  // In a real app, load from files. Here we add two short docs as examples.
  const { upsertDocument } = await import("./services/vectorService");
  await upsertDocument("doc1", "ReachInbox helps SDRs triage outreach emails, categorize leads, and reply faster.", "product");
  await upsertDocument("doc2", "Book a meeting via our Cal link to see a live demo of ReachInbox.", "cta");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
