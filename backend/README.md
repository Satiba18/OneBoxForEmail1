# ReachInbox Backend

Node.js + TypeScript backend implementing real-time IMAP sync, Elasticsearch indexing/search, AI categorization, Slack/webhook notifications, and Weaviate RAG for suggested replies.

## Run
```bash
npm install
cp .env.example .env
# edit .env
npm run dev
```

## Environment (.env.example)
See `.env.example` for all variables and example IMAP accounts.

## Endpoints
- GET `/api/health`
- GET `/api/emails` query params: `query, account, folder, from, category, page, size, since`
- GET `/api/emails/:id`
- POST `/api/emails/:id/categorize`
- POST `/api/emails/:id/mark` body: `{ category }`
- POST `/api/replies/suggest` body: `{ emailId, tone?, maxTokens? }`
- POST `/api/test/webhook`

## Notes
- Real-time IMAP IDLE connections; initial sync fetches last 30 days.
- If `OPENAI_API_KEY` is missing, categorization and replies use deterministic fallbacks.
