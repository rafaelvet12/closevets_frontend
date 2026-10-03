import { API_BASE_URL, fetchWithAuth } from "@/app/config";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function readDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) return null;
  const detail = (payload as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  return null;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetchWithAuth(`${API_BASE_URL}${path}`, { ...options, headers });
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw) as unknown;
    } catch {
      throw new ApiError("Resposta inválida do servidor.");
    }
  }

  if (response.status === 401 && !path.startsWith("/auth/login") && typeof window !== "undefined") {
    localStorage.removeItem("closevets_token");
    localStorage.removeItem("closevets_role");
    if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/validar")) {
      window.location.assign("/");
    }
  }

  if (!response.ok) {
    throw new ApiError(readDetail(payload) || "Erro ao comunicar com o servidor.");
  }

  return payload as T;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}
