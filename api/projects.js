// Vercel serverless function: project list + team emails for Power Automate.
// Reads the same tracker doc the website writes, returns a clean array.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const RECOGNIZED = ["Aaron Burch", "Andrew Gustafson", "Byshop Williams", "Claire Palmer",
  "Dan King", "David Piluski", "Gabriel Ferguson", "Habiba Watfa", "Hope Huenecke",
  "James Barnickel", "Jessica Sembdner", "Jimmy Yakubov", "John Wolfe", "Madison Huschak",
  "Matthew DeLeo", "Sophia Crew", "Alex Babusci"];
const EMAIL_DIR = Object.fromEntries(RECOGNIZED.map(n => {
  const p = n.split(" ");
  return [n.toLowerCase(), `${p[0].toLowerCase()}.${p[p.length - 1].toLowerCase()}@rtmec.com`];
}));
function teamEmails(r) {
  const out = [];
  ["pm", "ml", "me", "pe", "ee", "fp"].forEach(k =>
    String(r[k] || "").split(/\n| and /).forEach(part => {
      const e = EMAIL_DIR[part.trim().toLowerCase()];
      if (e && !out.includes(e)) out.push(e);
    }));
  return out;
}

const FIXED_CC = "john.wolfe@rtmec.com,andrew.gustafson@rtmec.com,madison.huschak@rtmec.com";

export default async function handler(req, res) {
  try {
    const rows = await sql`select doc from tracker_doc where id = 1`;
    const doc = rows.length ? rows[0].doc : {};
    let sheets = doc.sheets;
    if (!sheets && doc.rows) sheets = [{ name: "COM-1", rows: doc.rows }];
    sheets = sheets || [];
    const out = [];
    for (const s of sheets) {
      const nm = (s.name || "").toLowerCase();
      if (nm.includes("aldi")) continue; // ALDI excluded from the relay
      (s.rows || []).forEach((r, i) => {
        const name = r.projectName || r.name || "";
        if (!name) return;
        const team = (nm.includes("culver") || nm.includes("costco")) ? FIXED_CC : teamEmails(r).join(",");
        out.push({
          id: (s.name || "S") + "::" + (r._id || i),
          sheet: s.name || "",
          name,
          vantagepoint: r.vantagepoint || "",
          client: r.client || "",
          stage: r.stage || "",
          team_emails: team
        });
      });
    }
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
