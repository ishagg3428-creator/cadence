// Frontend helpers to read/write the shared tracker doc via the Vercel API.
// Falls back gracefully (caller catches) so local dev without the API still works.
// The API requires an app key (set APP_KEY + VITE_APP_KEY to the same value in Vercel).
const KEY = import.meta.env.VITE_APP_KEY || "";
const AUTH = KEY ? { "x-app-key": KEY } : {};

export async function apiLoad() {
  const r = await fetch("/api/tracker", { cache: "no-store", headers: AUTH });
  if (!r.ok) throw new Error("api load failed");
  return r.json();
}
export async function apiSave(doc, baseV) {
  const headers = { "Content-Type": "application/json", ...AUTH };
  if (baseV != null) headers["x-base-v"] = String(baseV);
  const r = await fetch("/api/tracker", {
    method: "POST",
    headers,
    body: JSON.stringify(doc),
  });
  // 409 = someone else saved a newer version; return their copy so the caller can merge + retry.
  if (r.status === 409) { const j = await r.json(); return { conflict: true, doc: j.doc, v: j.v }; }
  if (!r.ok) throw new Error("api save failed");
  return r.json();
}

// Shared calendar events live in a separate document (id=2) so they never collide with the tracker.
export async function calLoad() {
  const r = await fetch("/api/tracker?id=2", { cache: "no-store", headers: AUTH });
  if (!r.ok) throw new Error("cal load failed");
  return r.json();
}
export async function calSave(doc, baseV) {
  const headers = { "Content-Type": "application/json", ...AUTH };
  if (baseV != null) headers["x-base-v"] = String(baseV);
  const r = await fetch("/api/tracker?id=2", { method: "POST", headers, body: JSON.stringify(doc) });
  if (r.status === 409) { const j = await r.json(); return { conflict: true, doc: j.doc, v: j.v }; }
  if (!r.ok) throw new Error("cal save failed");
  return r.json();
}
