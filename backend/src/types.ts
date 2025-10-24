export type EmailCategory = "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office" | "Uncategorized";

export interface ImapFolderConfig {
  name: string; // e.g., "INBOX" or "Sent"
}

export interface ImapAccountConfig {
  id: string; // unique identifier for the account
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  folders?: ImapFolderConfig[]; // folders to watch (default: INBOX only)
}

export interface AppConfig {
  serverPort: number;
  elasticUrl: string;
  weaviateUrl: string;
  openAiApiKey?: string;
  slackWebhook?: string;
  webhookSiteUrl?: string;
  calLink?: string;
  imapAccounts: ImapAccountConfig[];
}

export interface ParsedEmail {
  id: string; // stable id for ES doc (e.g., accountId:uid or messageId)
  accountId: string;
  folder: string;
  uid?: number;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: string; // ISO string
  bodyText?: string;
  bodyHtml?: string;
  messageId?: string;
  inReplyTo?: string;
  threadId?: string;
  attachments?: Array<{ filename: string; size: number; contentType?: string }>; // metadata only
  category?: EmailCategory;
}

export interface SearchFilters {
  account?: string;
  folder?: string;
  from?: string;
  category?: EmailCategory | "";
  since?: string; // ISO date string
}

export interface SearchResult<T> {
  total: number;
  items: T[];
  page: number;
  size: number;
}
