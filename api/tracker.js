// Vercel serverless function: read/write the whole tracker as one JSON doc in Neon.
import { neon } from "@neondatabase/serverless";

// Lazy init — calling neon() at module scope crashes the whole function
// (FUNCTION_INVOCATION_FAILED) when DATABASE_URL is missing, hiding the real error.
let _sql = null;
function db() { if (!_sql) _sql = neon(process.env.DATABASE_URL); return _sql; }

async function ensureTable() {
  await db()`create table if not exists tracker_doc (
    id int primary key,
    doc jsonb not null,
    v bigint not null default 0
  )`;
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: "DATABASE_URL not configured" });
  // Auth: the website sends header  x-app-key: <APP_KEY>
  const key = process.env.APP_KEY;
  if (!key) return res.status(500).json({ error: "APP_KEY not configured" });
  if (req.headers["x-app-key"] !== key) return res.status(401).json({ error: "unauthorized" });
  try {
    await ensureTable();
    const sql = db();

    if (req.method === "GET") {
      const rows = await sql`select doc, v from tracker_doc where id = 1`;
      if (!rows.length) return res.status(200).json(null);
      return res.status(200).json({ ...rows[0].doc, v: Number(rows[0].v) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || typeof body !== "object") return res.status(400).json({ error: "bad body" });
      const v = Date.now();
      const json = JSON.stringify(body);
      await sql`insert into tracker_doc (id, doc, v)
                values (1, ${json}::jsonb, ${v})
                on conflict (id) do update set doc = excluded.doc, v = excluded.v`;
      return res.status(200).json({ ok: true, v });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
