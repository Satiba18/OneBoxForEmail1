import { Client } from "@elastic/elasticsearch";
import { ParsedEmail, SearchFilters, SearchResult } from "../types";

const INDEX_NAME = "emails";

let client: Client | null = null;

export function initElastic(elasticUrl: string) {
  client = new Client({ node: elasticUrl });
}

export async function ensureIndex() {
  if (!client) throw new Error("Elasticsearch client not initialized");
  const exists = await client.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await client.indices.create({
      index: INDEX_NAME,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
      },
      mappings: {
        properties: {
          subject: { type: "text" },
          body: { type: "text" },
          from: { type: "keyword" },
          to: { type: "keyword" },
          date: { type: "date" },
          accountId: { type: "keyword" },
          folder: { type: "keyword" },
          category: { type: "keyword" },
          messageId: { type: "keyword" },
          inReplyTo: { type: "keyword" },
          threadId: { type: "keyword" },
        },
      },
    });
  }
}

export async function indexEmail(email: ParsedEmail) {
  if (!client) throw new Error("Elasticsearch client not initialized");
  const id = email.id;
  const body = {
    subject: email.subject,
    body: email.bodyText || email.bodyHtml || "",
    from: email.from,
    to: email.to,
    date: email.date,
    accountId: email.accountId,
    folder: email.folder,
    category: email.category || "Uncategorized",
    messageId: email.messageId,
    inReplyTo: email.inReplyTo,
    threadId: email.threadId,
  };
  await client.index({ index: INDEX_NAME, id, document: body });
}

export async function updateEmailCategory(id: string, category: string) {
  if (!client) throw new Error("Elasticsearch client not initialized");
  await client.update({
    index: INDEX_NAME,
    id,
    doc: { category },
  } as any);
}

export async function getEmail(id: string): Promise<ParsedEmail | null> {
  if (!client) throw new Error("Elasticsearch client not initialized");
  try {
    const res = await client.get({ index: INDEX_NAME, id });
    const src = (res as any)._source;
    return src ? ({
      id,
      accountId: src.accountId,
      folder: src.folder,
      subject: src.subject,
      from: src.from,
      to: src.to,
      date: src.date,
      bodyText: src.body,
      category: src.category,
      messageId: src.messageId,
      inReplyTo: src.inReplyTo,
      threadId: src.threadId,
    } as ParsedEmail) : null;
  } catch (e: any) {
    if (e?.meta?.statusCode === 404) return null;
    throw e;
  }
}

export async function searchEmails(query: string, filters: SearchFilters, page = 1, size = 20): Promise<SearchResult<ParsedEmail>> {
  if (!client) throw new Error("Elasticsearch client not initialized");
  const must: any[] = [];
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["subject^2", "body"],
      },
    });
  }
  if (filters.account) must.push({ term: { accountId: filters.account } });
  if (filters.folder) must.push({ term: { folder: filters.folder } });
  if (filters.from) must.push({ term: { from: filters.from } });
  if (filters.category) must.push({ term: { category: filters.category } });
  if (filters.since) must.push({ range: { date: { gte: filters.since } } });

  const from = (page - 1) * size;
  const res = await client.search({
    index: INDEX_NAME,
    from,
    size,
    query: { bool: { must } },
    sort: [{ date: { order: "desc" } }],
  });

  const hits = (res as any).hits.hits || [];
  const items: ParsedEmail[] = hits.map((h: any) => ({
    id: h._id,
    accountId: h._source.accountId,
    folder: h._source.folder,
    subject: h._source.subject,
    from: h._source.from,
    to: h._source.to,
    date: h._source.date,
    bodyText: h._source.body,
    category: h._source.category,
    messageId: h._source.messageId,
    inReplyTo: h._source.inReplyTo,
    threadId: h._source.threadId,
  }));

  return {
    total: (res as any).hits.total.value || items.length,
    items,
    page,
    size,
  };
}
