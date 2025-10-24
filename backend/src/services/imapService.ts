import Imap from "node-imap";
import imaps from "imap-simple";
import { ParsedEmail, ImapAccountConfig } from "../types";
import { parseRawEmail } from "./emailParser";
import { indexEmail } from "./elasticService";
import { categorizeAndPersist } from "./categorizer";

interface ConnectionState {
  config: ImapAccountConfig;
  connection?: imaps.ImapSimple;
  reconnectDelayMs: number;
}

const connections = new Map<string, ConnectionState>();

function sinceDate(days = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function startImapAccounts(accounts: ImapAccountConfig[]) {
  for (const acc of accounts) {
    const state: ConnectionState = { config: acc, reconnectDelayMs: 2000 };
    connections.set(acc.id, state);
    void connectAndStart(state);
  }
}

async function connectAndStart(state: ConnectionState) {
  try {
    const config = state.config;
    const connection = await imaps.connect({
      imap: {
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 20000,
      },
      onmail: (numNewMsgs: number) => {
        // Trigger fetch on new mail
        void handleNewMail(state);
      },
    } as any);
    state.connection = connection;
    state.reconnectDelayMs = 2000;

    const folders = config.folders && config.folders.length > 0 ? config.folders.map(f => f.name) : ["INBOX"];

    for (const folder of folders) {
      await connection.openBox(folder);
      await initialSync(state, folder);
    }

    const rawImap: Imap = (connection as any)._imap;
    rawImap.on("error", (err) => {
      console.error(`IMAP error for ${config.id}:`, err);
    });
    rawImap.on("end", () => {
      console.warn(`IMAP connection ended for ${config.id}, reconnecting...`);
      void scheduleReconnect(state);
    });

    // IDLE is managed by imap-simple; rawImap will stay in IDLE between operations
    console.log(`IMAP connected and IDLE for ${config.id}`);
  } catch (e) {
    console.error(`Failed to connect for ${state.config.id}:`, e);
    await scheduleReconnect(state);
  }
}

async function scheduleReconnect(state: ConnectionState) {
  const delay = Math.min(state.reconnectDelayMs, 60_000);
  await new Promise((r) => setTimeout(r, delay));
  state.reconnectDelayMs = Math.min(delay * 2, 60_000);
  await connectAndStart(state);
}

async function initialSync(state: ConnectionState, folder: string) {
  const connection = state.connection!;
  const since = sinceDate(30);
  const searchCriteria = ["ALL", ["SINCE", since.toUTCString()]];
  const fetchOptions = { bodies: [""], markSeen: false } as any;
  const results = await connection.search(searchCriteria, fetchOptions);
  console.log(`Initial sync ${state.config.id}/${folder}: ${results.length} messages`);
  for (const res of results) {
    const all = res.parts.find((p: any) => p.which === "");
    const raw = all?.body as Buffer;
    const uid: number | undefined = (res.attributes && res.attributes.uid) || undefined;
    if (!raw) continue;
    const email = await parseRawEmail(state.config.id, folder, uid, raw);
    await processEmail(email);
  }
}

async function handleNewMail(state: ConnectionState) {
  // For simplicity, re-run a short SINCE window
  const connection = state.connection!;
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24); // last 24h to catch new arrivals
  const searchCriteria = ["UNSEEN", ["SINCE", since.toUTCString()]];
  const fetchOptions = { bodies: [""], markSeen: false } as any;

  const boxes = state.config.folders && state.config.folders.length > 0 ? state.config.folders.map(f => f.name) : ["INBOX"];
  for (const folder of boxes) {
    await state.connection!.openBox(folder);
    const results = await connection.search(searchCriteria, fetchOptions);
    for (const res of results) {
      const all = res.parts.find((p: any) => p.which === "");
      const raw = all?.body as Buffer;
      const uid: number | undefined = (res.attributes && res.attributes.uid) || undefined;
      if (!raw) continue;
      const email = await parseRawEmail(state.config.id, folder, uid, raw);
      await processEmail(email);
    }
  }
}

async function processEmail(email: ParsedEmail) {
  try {
    await indexEmail(email);
  } catch (e) {
    console.error("Index email failed", e);
  }
  try {
    await categorizeAndPersist(email);
  } catch (e) {
    console.error("Categorize failed", e);
  }
}
