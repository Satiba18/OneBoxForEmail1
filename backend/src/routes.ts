import { Router } from "express";
import { categorizeEmailHandler, getEmailHandler, markEmailHandler, searchEmailsHandler, suggestReplyHandler } from "./controllers/emailController";
import { sendTestWebhook } from "./services/webhookService";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.get("/emails", searchEmailsHandler);
router.get("/emails/:id", getEmailHandler);
router.post("/emails/:id/categorize", categorizeEmailHandler);
router.post("/emails/:id/mark", markEmailHandler);

router.post("/replies/suggest", suggestReplyHandler);
router.post("/test/webhook", async (_req, res) => {
  try {
    const result = await sendTestWebhook();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
