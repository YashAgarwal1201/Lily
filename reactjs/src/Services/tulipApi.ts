// reactjs/src/Services/tulipApi.ts
import { TULIP_BASE_URL, TULIP_API_KEY } from "./constants";
import type {
  TulipChatRequest,
  TulipChatResponse,
  Session,
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

export async function fetchSessionMessages(
  sessionId: string,
): Promise<
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
    {
      headers: headers(),
    },
  );

  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
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
