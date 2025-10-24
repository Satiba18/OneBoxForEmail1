## ReachInbox - Onebox Email Aggregator (Starter)

This repository contains a runnable starter implementation of the ReachInbox Onebox backend and a minimal React frontend.

What's included:
- Backend (Node.js + TypeScript + Express)
- Real-time IMAP sync (IDLE) for multiple accounts
- Elasticsearch for email storage and search (Docker)
- AI categorization (OpenAI or heuristic fallback)
- Slack + webhook.site notifications for Interested emails
- Weaviate vector DB for RAG and suggested replies (Docker)
- Minimal React (Vite + TS) frontend for listing/searching emails and suggesting replies
- Postman collection/cURL examples

### Quick Start

1) Start infrastructure (Elasticsearch + Weaviate):
```bash
docker-compose up -d
```

2) Backend:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env to add IMAP accounts (2+), Slack/Webhook URLs, OpenAI key (optional)
npm run dev
```

3) Frontend:
```bash
cd ../frontend
npm install
npm run dev
```

Backend default port: `http://localhost:4000`
Frontend default port: `http://localhost:5173`

### Environment Variables (root-level summary)
Set these in `backend/.env`:
- `IMAP_ACCOUNTS`: JSON array of account configs (or path to a JSON file). See `backend/.env.example`.
- `ELASTIC_URL` (default `http://localhost:9200`)
- `WEAVIATE_URL` (default `http://localhost:8080`)
- `OPENAI_API_KEY` (optional; enables best AI)
- `SLACK_WEBHOOK` (optional; Slack notifications)
- `WEBHOOK_SITE_URL` (optional; webhook.site URL)
- `CAL_LINK` (optional; for reply templates)
- `SERVER_PORT` (default `4000`)

Security:
- Do not commit secrets. Use `.env` and `.env.example`.
- For submission, keep repo private and add required collaborators.

### Features Checklist (where implemented)
- Real-time IMAP sync: `backend/src/services/imapService.ts`
- Email parsing: `backend/src/services/emailParser.ts`
- Elasticsearch indexing/search: `backend/src/services/elasticService.ts`
- Categorization: `backend/src/services/categorizer.ts`
- Slack + webhook: `backend/src/services/webhookService.ts`
- Vector DB + RAG: `backend/src/services/vectorService.ts`, `backend/src/services/suggestedReply.ts`
- API routes: `backend/src/controllers/*`, `backend/src/routes.ts`, `backend/src/index.ts`
- Frontend UI: `frontend/src/pages/*`, `frontend/src/components/*`

### Demo Video Checklist (5–8 minutes)
1. Start Docker services.
2. Run backend and frontend.
3. Show `.env` with two IMAP accounts (Gmail/Outlook); note Gmail app passwords or OAuth.
4. Show initial 30-day sync visible via Postman `/api/emails?since=...` and frontend list.
5. Send a test email with "interested" content; show automatic category, Slack, and webhook.site receipt.
6. Search emails via frontend.
7. Open an email and click "Suggest Reply"; show RAG-based suggestion.
8. Briefly show code layout and highlight where each feature is.

### Swapping AI Providers
- Default uses OpenAI (`OPENAI_API_KEY`).
- To use a local model, adjust `categorizer.ts` and `suggestedReply.ts` to call a local endpoint (e.g., Ollama or LM Studio). Add URL and model name to `.env` and follow comments in code.

### Bonus Ideas
- OAuth2 for Gmail/Outlook
- Persist attachments to S3
- Threading and deduplication
- Multi-tenant auth and RBAC
- Rate limiting and quotas
- Jest tests expanded with mocks

### Recruiter Submission Checklist
- [ ] Demo video link (paste here)
- [ ] Repo link (private)
- [ ] Run instructions verified (Docker, backend, frontend)
- [ ] Postman collection present
- [ ] Two IMAP accounts configured and demoed
- [ ] Slack + webhook.site demoed
- [ ] RAG replies demoed (or template fallback if no API key)
