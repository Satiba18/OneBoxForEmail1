import weaviate, { WeaviateClient } from "weaviate-ts-client";
import OpenAI from "openai";

let client: WeaviateClient | null = null;
let openai: OpenAI | null = null;

const CLASS_NAME = "ProductOutreach";

export function initVectorService(weaviateUrl: string, openAiApiKey?: string) {
  client = weaviate.client({ scheme: "http", host: weaviateUrl.replace(/^https?:\/\//, "") });
  openai = openAiApiKey ? new OpenAI({ apiKey: openAiApiKey }) : null;
}

export async function ensureSchema() {
  if (!client) throw new Error("Weaviate not initialized");
  const schema = await client.schema.getter().do();
  const exists = schema.classes?.some((c) => c.class === CLASS_NAME);
  if (!exists) {
    await client.schema.classCreator().withClass({
      class: CLASS_NAME,
      properties: [
        { name: "text", dataType: ["text"], description: "Chunk text" },
        { name: "source", dataType: ["text"], description: "Source label" },
      ],
      vectorizer: "none",
    }).do();
  }
}

export async function embed(text: string): Promise<number[]> {
  if (!openai) {
    // simple deterministic pseudo-embedding fallback (not semantic, demo only)
    const vec = new Array(128).fill(0).map((_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
    return vec;
  }
  const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  return res.data[0].embedding as unknown as number[];
}

export async function upsertDocument(id: string, text: string, source: string) {
  if (!client) throw new Error("Weaviate not initialized");
  const vector = await embed(text);
  await client.data
    .creator()
    .withClassName(CLASS_NAME)
    .withId(id)
    .withProperties({ text, source })
    .withVector(vector)
    .do();
}

export async function querySimilar(text: string, k = 3): Promise<Array<{ text: string; source: string }>> {
  if (!client) throw new Error("Weaviate not initialized");
  const vector = await embed(text);
  const res = await client.graphql.get()
    .withClassName(CLASS_NAME)
    .withFields("text source")
    .withNearVector({ vector })
    .withLimit(k)
    .do();
  const items = (res.data?.Get as any)?.[CLASS_NAME] || [];
  return items.map((i: any) => ({ text: i.text, source: i.source }));
}
