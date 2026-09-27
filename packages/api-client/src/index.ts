import axios, { type AxiosInstance } from "axios";
import type { HealthResponse } from "@civwatch/types";

export type { HealthResponse };

/**
 * Build a typed HTTP client. Callers supply baseURL from their own env
 * (Vite: import.meta.env.VITE_API_URL, Expo: process.env.EXPO_PUBLIC_API_URL, etc.).
 * This package stays transport-agnostic — no Vite/Expo coupling.
 */
export function createClient(baseURL: string = ""): AxiosInstance {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 15_000,
  });
}

export async function fetchJSON<T>(
  path: string,
  init?: { method?: string; body?: unknown; client?: AxiosInstance },
): Promise<T> {
  const client = init?.client ?? createClient();
  const res = await client.request<T>({
    url: path,
    method: init?.method ?? "GET",
    data: init?.body,
  });
  return res.data;
}

export async function getHealth(
  client?: AxiosInstance,
): Promise<HealthResponse> {
  return fetchJSON<HealthResponse>("/api/health", { client });
}
