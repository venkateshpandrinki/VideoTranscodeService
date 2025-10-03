export const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// export async function apiFetch(path: string, options?: RequestInit) {
//   const res = await fetch(`${API_URL}${path}`, options);
//   if (!res.ok) throw new Error("API error");
//   return res.json();
// }

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    console.error('API fetch failed:', res.status, text);
    throw new Error(`API error: ${res.status} ${text}`);
  }
  return res.json();
}
