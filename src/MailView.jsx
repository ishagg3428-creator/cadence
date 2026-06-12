// Placeholder Mail view — replace with the real MailView.jsx when it's ready.
import { Mail } from "lucide-react";

export default function MailView() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 320, gap: 12, color: "var(--muted)",
      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: 40
    }}>
      <Mail size={40} strokeWidth={1.5} />
      <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>Mail view coming soon</div>
      <div style={{ fontSize: 13 }}>This tab is reserved for the email relay dashboard.</div>
    </div>
  );
}
