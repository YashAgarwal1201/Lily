// reactjs/src/Services/constants.ts

export const TULIP_BASE_URL =
  import.meta.env.VITE_TULIP_BASE_URL ?? "http://localhost:8000";
export const TULIP_API_KEY = import.meta.env.VITE_TULIP_API_KEY ?? "";

export const AVAILABLE_MODELS = [
  { label: "Mistral 7B", provider: "local", model: "mistral" },
  { label: "Llama 3.2", provider: "local", model: "llama3.2" },
  { label: "Gemini 2.0 Flash", provider: "gemini", model: "gemini-2.0-flash" },
  { label: "Groq Llama 3", provider: "groq", model: "llama-3.3-70b-versatile" },
] as const;

export type ModelOption = (typeof AVAILABLE_MODELS)[number];
