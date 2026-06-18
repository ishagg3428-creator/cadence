// Server-side login: validates a shared username/password (stored as Vercel env vars)
// and only then hands back the app key the site needs to read/write data. This keeps the
// key OUT of the public bundle, so the data can't be reached without logging in.
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method not allowed" }); }
  const U = process.env.LOGIN_USER, P = process.env.LOGIN_PASS, key = process.env.APP_KEY;
  if (!U || !P) return res.status(500).json({ error: "login not configured" });
  if (!key) return res.status(500).json({ error: "APP_KEY not configured" });
  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch (e) { body = {}; }
  const username = (body.username || "").trim();
  const password = body.password || "";
  if (username === U && password === P) return res.status(200).json({ ok: true, key });
  return res.status(401).json({ error: "invalid credentials" });
}
