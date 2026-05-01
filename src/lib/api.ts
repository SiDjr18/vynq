import { useAuthStore } from "@/store/auth";

const API_URL = import.meta.env.VITE_API_URL || "/api";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !options.skipAuth) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }
  if (response.headers.get("Content-Type")?.includes("text/csv")) {
    return response.blob() as Promise<T>;
  }
  return response.json() as Promise<T>;
}

export function queryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export async function downloadCsv(path: string, fileName: string) {
  const blob = await api<Blob>(path);
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}
