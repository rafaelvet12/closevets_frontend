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

let refreshPromise: Promise<string | null> | null = null;

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("closevets_refresh_token") : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; refresh_token?: string };
    if (data.access_token) {
      localStorage.setItem("closevets_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("closevets_refresh_token", data.refresh_token);
      }
      return data.access_token;
    }
  } catch {
    return null;
  }
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

  if (response.status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh") && typeof window !== "undefined") {
    if (!refreshPromise) {
      refreshPromise = doRefreshToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      if (typeof options.body === "string" && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: retryHeaders, credentials: "include" });
      const retryRaw = await retryResponse.text();
      let retryPayload: unknown = null;
      if (retryRaw) {
        try {
          retryPayload = JSON.parse(retryRaw) as unknown;
        } catch {
          throw new ApiError("Resposta inválida do servidor.");
        }
      }
      if (!retryResponse.ok) {
        throw new ApiError(readDetail(retryPayload) || "Erro ao comunicar com o servidor.");
      }
      return retryPayload as T;
    }

    localStorage.removeItem("closevets_token");
    localStorage.removeItem("closevets_refresh_token");
    localStorage.removeItem("closevets_role");
    if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/validar")) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
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
