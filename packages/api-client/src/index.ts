import axios, { type AxiosInstance } from "axios";
import type { HealthResponse } from "@civwatch/types";

export type { HealthResponse };

export function createClient(baseURL: string = ""): AxiosInstance {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 15_000,
  });
}

const defaultClient = createClient(
  typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
    ? (import.meta as { env: { VITE_API_URL: string } }).env.VITE_API_URL
    : "",
);

export async function fetchJSON<T>(
  path: string,
  init?: { method?: string; body?: unknown; client?: AxiosInstance },
): Promise<T> {
  const client = init?.client ?? defaultClient;
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
