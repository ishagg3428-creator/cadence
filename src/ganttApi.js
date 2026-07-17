// Frontend helpers for the shared Gantt store (join-by-code projects).
// Uses the SAME login key as the rest of the app (stored in localStorage after sign-in),
// with build-time VITE_APP_KEY only as a local-dev fallback. Falls back gracefully
// (caller catches) so the Gantt still works offline / local-only.
const APPKEY_LS = "cadence:appkey";
function appKey() {
  try { const k = localStorage.getItem(APPKEY_LS); if (k) return k; } catch (e) {}
  return import.meta.env.VITE_APP_KEY || "";
}
function auth(extra) {
  const k = appKey();
  return { ...(extra || {}), ...(k ? { "x-app-key": k } : {}) };
}

async function fail(r, fallback) {
  let msg = "";
  try { msg = (await r.json()).error || ""; } catch (e) {}
  const err = new Error(msg || fallback);
  err.status = r.status;
  throw err;
}

export async function ganttLoad() {
  const r = await fetch("/api/gantt", { cache: "no-store", headers: auth() });
  if (!r.ok) await fail(r, "gantt load failed");
  return r.json();
}
export async function ganttSave(doc) {
  const r = await fetch("/api/gantt", {
    method: "POST",
    headers: auth({ "Content-Type": "application/json" }),
    body: JSON.stringify(doc),
  });
  if (!r.ok) await fail(r, "gantt save failed");
  return r.json();
}
