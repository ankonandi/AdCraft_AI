import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SECRET_SLUG = "x9k2p7q4w8m1n6"; // unguessable; share this URL only

interface Summary {
  range_days: number;
  totals: Record<string, number>;
  byEvent: Record<string, number>;
  byPage: Record<string, number>;
  byDay: Record<string, number>;
  avgPageMs: Record<string, number>;
  topClicks: { label: string; count: number }[];
  recent: any[];
}

export default function AnalyticsDashboard() {
  const { slug } = useParams();
  const [data, setData] = useState<Summary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const ok = slug === SECRET_SLUG;

  useEffect(() => {
    if (!ok) return;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-summary?days=${days}&key=${SECRET_SLUG}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string}`,
          },
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
        setData(json);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [days, ok]);

  if (!ok) {
    return <div style={{ padding: 40, fontFamily: "monospace" }}>404</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f17", color: "#e6edf3", fontFamily: "ui-monospace, monospace", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>📊 AdCraft Analytics — internal</h1>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d", padding: "6px 10px", borderRadius: 6 }}>
            {[1, 7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d}d</option>)}
          </select>
        </header>

        {loading && <p>Loading…</p>}
        {err && <p style={{ color: "#f85149" }}>Error: {err}</p>}

        {data && (
          <>
            {/* KPI tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
              {Object.entries(data.totals).map(([k, v]) => (
                <Tile key={k} label={k} value={v} />
              ))}
            </div>

            <Section title="Events per day">
              <BarChart data={data.byDay} />
            </Section>

            <Section title="Top events">
              <Table rows={Object.entries(data.byEvent).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Event", "Count"]} />
            </Section>

            <Section title="Pages by traffic">
              <Table rows={Object.entries(data.byPage).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Page", "Views"]} />
            </Section>

            <Section title="Average time on page (ms)">
              <Table rows={Object.entries(data.avgPageMs).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Page", "Avg ms"]} />
            </Section>

            <Section title="Top clicks (button/link labels)">
              <Table rows={data.topClicks.map((c) => [c.label, c.count])} cols={["Label", "Clicks"]} />
            </Section>

            <Section title="Recent 200 events">
              <div style={{ maxHeight: 480, overflow: "auto", border: "1px solid #30363d", borderRadius: 8 }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#161b22" }}>
                    <tr>
                      {["Time", "Event", "Page", "Session", "User", "Props"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #30363d" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((e) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #21262d" }}>
                        <td style={{ padding: 6 }}>{new Date(e.created_at).toLocaleString()}</td>
                        <td style={{ padding: 6, color: "#7ee787" }}>{e.event_name}</td>
                        <td style={{ padding: 6 }}>{e.page}</td>
                        <td style={{ padding: 6, opacity: 0.6 }}>{(e.session_id || "").slice(0, 8)}</td>
                        <td style={{ padding: 6, opacity: 0.6 }}>{(e.user_id || "—").slice(0, 8)}</td>
                        <td style={{ padding: 6, fontSize: 11, opacity: 0.7 }}>
                          <code>{JSON.stringify(e.properties).slice(0, 120)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 14, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{title}</h2>
      {children}
    </section>
  );
}

function Table({ rows, cols }: { rows: any[][] | [string, number][]; cols: string[] }) {
  return (
    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
      <thead><tr>{cols.map((c) => (
        <th key={c} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #30363d", opacity: 0.7 }}>{c}</th>
      ))}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
            {(r as any[]).map((cell, j) => (
              <td key={j} style={{ padding: 8 }}>{String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: 10, background: "#161b22", border: "1px solid #30363d", borderRadius: 8 }}>
      {entries.map(([day, v]) => (
        <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div title={`${day}: ${v}`} style={{ width: "100%", background: "#3fb950", height: `${(v / max) * 100}%`, minHeight: 2, borderRadius: 3 }} />
          <div style={{ fontSize: 9, opacity: 0.6 }}>{day.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}
