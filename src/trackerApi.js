// Frontend helpers to read/write the shared tracker doc via the Vercel API.
// The app key is obtained at LOGIN (server-validated) and stored locally — it is no longer
// baked into the bundle, so data can't be reached without a successful login.
const APPKEY_LS = "cadence:appkey";

function appKey() {
  try { const k = localStorage.getItem(APPKEY_LS); if (k) return k; } catch (e) {}
  return import.meta.env.VITE_APP_KEY || ""; // local-dev fallback only (not set in production)
}
function authHeaders(extra) {
  const k = appKey();
  return { ...(extra || {}), ...(k ? { "x-app-key": k } : {}) };
}

// Validate shared credentials server-side; on success the server returns the app key, which we store.
export async function apiLogin(username, password) {
  try {
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (!r.ok) return { ok: false };
    const j = await r.json();
    if (j && j.ok && j.key) { try { localStorage.setItem(APPKEY_LS, j.key); } catch (e) {} return { ok: true }; }
    return { ok: false };
  } catch (e) { return { ok: false, error: "network" }; }
}
export function apiLogout() { try { localStorage.removeItem(APPKEY_LS); } catch (e) {} }
export function hasKey() { return !!appKey(); }

export async function apiLoad() {
  const r = await fetch("/api/tracker", { cache: "no-store", headers: authHeaders() });
  if (!r.ok) throw new Error("api load failed");
  return r.json();
}
// Tiny poll: returns only the doc version (a few bytes), so we fetch the full doc only when it changed.
export async function apiVersion(id) {
  const r = await fetch("/api/tracker?meta=1" + (id ? "&id=" + id : ""), { cache: "no-store", headers: authHeaders() });
  if (!r.ok) throw new Error("version check failed");
  const j = await r.json();
  return j && typeof j.v === "number" ? j.v : 0;
}
export async function apiSave(doc, baseV) {
  const headers = authHeaders({ "Content-Type": "application/json" });
  if (baseV != null) headers["x-base-v"] = String(baseV);
  const r = await fetch("/api/tracker", { method: "POST", headers, body: JSON.stringify(doc) });
  // 409 = someone else saved a newer version; return their copy so the caller can merge + retry.
  if (r.status === 409) { const j = await r.json(); return { conflict: true, doc: j.doc, v: j.v }; }
  if (!r.ok) throw new Error("api save failed");
  return r.json();
}

// Shared calendar events live in a separate document (id=2) so they never collide with the tracker.
export async function calLoad() {
  const r = await fetch("/api/tracker?id=2", { cache: "no-store", headers: authHeaders() });
  if (!r.ok) throw new Error("cal load failed");
  return r.json();
}
export async function calSave(doc, baseV) {
  const headers = authHeaders({ "Content-Type": "application/json" });
  if (baseV != null) headers["x-base-v"] = String(baseV);
  const r = await fetch("/api/tracker?id=2", { method: "POST", headers, body: JSON.stringify(doc) });
  if (r.status === 409) { const j = await r.json(); return { conflict: true, doc: j.doc, v: j.v }; }
  if (!r.ok) throw new Error("cal save failed");
  return r.json();
}

// Shared, editable revenue forecast (document id=3) — separate from the tracker + calendar.
export async function forecastLoad() {
  const r = await fetch("/api/tracker?id=3", { cache: "no-store", headers: authHeaders() });
  if (!r.ok) throw new Error("forecast load failed");
  return r.json();
}
export async function forecastSave(doc, baseV) {
  const headers = authHeaders({ "Content-Type": "application/json" });
  if (baseV != null) headers["x-base-v"] = String(baseV);
  const r = await fetch("/api/tracker?id=3", { method: "POST", headers, body: JSON.stringify(doc) });
  if (r.status === 409) { const j = await r.json(); return { conflict: true, doc: j.doc, v: j.v }; }
  if (!r.ok) throw new Error("forecast save failed");
  return r.json();
}
