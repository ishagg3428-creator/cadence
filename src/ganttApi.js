// Frontend helpers for the shared Gantt store (join-by-code projects).
// Falls back gracefully (caller catches) so the Gantt still works offline/local-only.
const KEY = import.meta.env.VITE_APP_KEY || "";
const AUTH = KEY ? { "x-app-key": KEY } : {};

export async function ganttLoad() {
  const r = await fetch("/api/gantt", { cache: "no-store", headers: AUTH });
  if (!r.ok) throw new Error("gantt load failed");
  return r.json();
}
export async function ganttSave(doc) {
  const r = await fetch("/api/gantt", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...AUTH },
    body: JSON.stringify(doc),
  });
  if (!r.ok) throw new Error("gantt save failed");
  return r.json();
}
