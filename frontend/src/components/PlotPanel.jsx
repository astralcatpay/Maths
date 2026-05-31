import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
} from "recharts";
import { STUDIO } from "@/constants/testIds";

export default function PlotPanel({ data, options }) {
  const [showF, setShowF] = useState(true);
  const [showFp, setShowFp] = useState(true);
  const [showFF, setShowFF] = useState(false);

  const chartData = useMemo(() => {
    if (!data?.plot || data.plot.error) return [];
    const { x, f, fprime, F } = data.plot;
    return x.map((xv, i) => ({
      x: xv,
      f: f?.[i] ?? null,
      fprime: fprime?.[i] ?? null,
      F: F?.[i] ?? null,
    }));
  }, [data]);

  const yMax = useMemo(() => {
    const vals = chartData
      .flatMap((p) => [showF ? p.f : null, showFp ? p.fprime : null, showFF ? p.F : null])
      .filter((v) => v != null && Number.isFinite(v));
    if (!vals.length) return 10;
    const sorted = [...vals].map(Math.abs).sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 10;
    return Math.max(1, Math.min(p95 * 1.2, 1e4));
  }, [chartData, showF, showFp, showFF]);

  if (!data?.plot || data.plot.error) {
    return (
      <div className="text-white/50 italic">Tracé indisponible.</div>
    );
  }

  return (
    <div data-testid={STUDIO.plotCanvas} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Legend2 label="f(x)" color="#22d3ee" active={showF} onClick={() => setShowF((v) => !v)} />
        <Legend2 label="f'(x)" color="#f472b6" active={showFp} onClick={() => setShowFp((v) => !v)} />
        {data.plot.F && (
          <Legend2 label="F(x)" color="#a78bfa" active={showFF} onClick={() => setShowFF((v) => !v)} />
        )}
        {data.roots?.slice(0, 6).map((r, i) =>
          r.approx != null ? (
            <span key={`r-${i}`} className="chip chip-amber">
              racine ≈ {r.approx.toFixed(3)}
            </span>
          ) : null
        )}
      </div>

      <div className="h-[420px] w-full bg-black/30 rounded-xl border border-cyan-400/15 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="fGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="rgba(255,255,255,0.15)"
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              type="number"
              domain={[-yMax, yMax]}
              tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="rgba(255,255,255,0.15)"
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,12,18,0.95)",
                border: "1px solid rgba(34,211,238,0.35)",
                borderRadius: 10,
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              labelStyle={{ color: "#a5f3fc" }}
              formatter={(v) => (v == null ? "—" : v.toFixed(4))}
              labelFormatter={(v) => `x = ${typeof v === "number" ? v.toFixed(4) : v}`}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" />

            {showF && (
              <Line
                type="monotone"
                dataKey="f"
                stroke="url(#fGrad)"
                strokeWidth={2.2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                name="f(x)"
              />
            )}
            {showFp && (
              <Line
                type="monotone"
                dataKey="fprime"
                stroke="#f472b6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                name="f'(x)"
              />
            )}
            {showFF && (
              <Line
                type="monotone"
                dataKey="F"
                stroke="#a78bfa"
                strokeWidth={1.5}
                strokeDasharray="2 6"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                name="F(x)"
              />
            )}

            {options.roots &&
              data.roots
                ?.filter((r) => r.approx != null)
                .map((r, i) => (
                  <ReferenceDot
                    key={`root-${i}`}
                    x={r.approx}
                    y={0}
                    r={4}
                    fill="#fbbf24"
                    stroke="#fde68a"
                  />
                ))}
            {options.extrema &&
              data.extrema
                ?.filter((e) => e.x.approx != null && e.y.approx != null)
                .map((e, i) => (
                  <ReferenceDot
                    key={`ext-${i}`}
                    x={e.x.approx}
                    y={e.y.approx}
                    r={4}
                    fill={e.type.includes("max") ? "#f472b6" : "#a3e635"}
                    stroke="#fff"
                  />
                ))}
            {options.inflection &&
              data.inflection_points
                ?.filter((p) => p.x.approx != null && p.y.approx != null)
                .map((p, i) => (
                  <ReferenceDot
                    key={`inf-${i}`}
                    x={p.x.approx}
                    y={p.y.approx}
                    r={4}
                    fill="#a78bfa"
                    stroke="#fff"
                  />
                ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend2({ label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`chip transition-all ${active ? "" : "opacity-40"}`}
      style={{
        borderColor: color + "55",
        color: active ? color : "white",
      }}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </button>
  );
}
