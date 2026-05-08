// reactjs/src/Services/tulipApi.ts
import { TULIP_BASE_URL, TULIP_API_KEY } from "./constants";
import type {
  TulipChatRequest,
  TulipChatResponse,
  Session,
  RagDoc,
} from "./interfacesAndTypes";

const headers = (): HeadersInit => ({
  "Content-Type": "application/json",
  "X-API-Key": TULIP_API_KEY,
});

// ── Chat ──────────────────────────────────────────────────────────────────

export async function sendMessage(
  payload: TulipChatRequest,
): Promise<TulipChatResponse> {
  const res = await fetch(`${TULIP_BASE_URL}/v1/chat`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Sessions ──────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${TULIP_BASE_URL}/v1/sessions`, {
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
  return res.json();
}

export async function createSession(
  title?: string,
): Promise<{ session_id: string }> {
  const url = new URL(`${TULIP_BASE_URL}/v1/sessions`);
  if (title) url.searchParams.set("title", title);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  return res.json();
}

export async function fetchSessionMessages(sessionId: string): Promise<
  {
    role: string;
    content: string;
    provider?: string;
    model?: string;
    created_at: string;
  }[]
> {
  const res = await fetch(
    `${TULIP_BASE_URL}/v1/sessions/${sessionId}/messages`,
    { headers: headers() },
  );

  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

// ── RAG ───────────────────────────────────────────────────────────────────

export async function ingestFiles(files: File[]): Promise<{
  ingested: {
    file: string;
    doc_id: string;
    chunks: number;
    replaced: boolean;
  }[];
  errors: { file: string; error: string }[];
  total_ingested: number;
  total_errors: number;
}> {
  // File uploads use multipart/form-data — do NOT set Content-Type manually,
  // the browser sets it with the correct boundary when using FormData
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${TULIP_BASE_URL}/v1/rag/ingest`, {
    method: "POST",
    headers: { "X-API-Key": TULIP_API_KEY }, // no Content-Type here
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchDocs(): Promise<RagDoc[]> {
  const res = await fetch(`${TULIP_BASE_URL}/v1/rag/docs`, {
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Failed to fetch docs: ${res.status}`);
  const data = await res.json();
  return data.docs;
}

export async function deleteDoc(docId: string): Promise<void> {
  const res = await fetch(`${TULIP_BASE_URL}/v1/rag/docs/${docId}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) throw new Error(`Failed to delete doc: ${res.status}`);
}

// ── Health ────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${TULIP_BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
