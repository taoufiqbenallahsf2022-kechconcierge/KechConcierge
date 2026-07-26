import { API_BASE_URL } from "../store/api";

export async function studioRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/studio${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.status === 401)
    window.dispatchEvent(new Event("admin:unauthorized"));
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Studio request failed");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
