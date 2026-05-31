import { useState, useCallback } from "react";
import { toast } from "sonner";
import FunctionInput from "@/components/FunctionInput";
import OptionsPanel, { DEFAULT_OPTIONS } from "@/components/OptionsPanel";
import ResultsPanel from "@/components/ResultsPanel";
import PlotPanel from "@/components/PlotPanel";
import HistoryPanel from "@/components/HistoryPanel";
import { analyze } from "@/lib/api";
import { STUDIO } from "@/constants/testIds";
import { Sigma, Activity, Compass } from "lucide-react";

const DEFAULT_PARAMS = {
  derivOrder: 2,
  intA: 0,
  intB: 1,
  xMin: -10,
  xMax: 10,
  taylorOrder: 5,
  taylorAround: 0,
};

export default function MathStudio() {
  const [expr, setExpr] = useState("");
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);

  const run = useCallback(
    async (expression) => {
      const e = (expression ?? expr).trim();
      if (!e) {
        toast.error("Entre une fonction.");
        return;
      }
      setLoading(true);
      try {
        const derivOrders = [];
        const maxOrder = Math.max(1, Math.min(parseInt(params.derivOrder, 10) || 2, 10));
        for (let i = 1; i <= maxOrder; i++) derivOrders.push(i);

        const payload = {
          expression: e,
          derivative_orders: options.derivatives ? derivOrders : [1, 2],
          integral_bounds:
            options.definiteIntegral
              ? [parseFloat(params.intA), parseFloat(params.intB)]
              : null,
          plot_range: [parseFloat(params.xMin), parseFloat(params.xMax)],
          taylor_order: parseInt(params.taylorOrder, 10) || 5,
          taylor_around: parseFloat(params.taylorAround) || 0,
          include_plot: options.plot,
        };
        const result = await analyze(payload);
        setData(result);
        setLastSubmitted(e);
        toast.success("Analyse terminée");
      } catch (err) {
        const msg = err?.response?.data?.detail || err.message || "Erreur d'analyse";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [expr, options, params]
  );

  return (
    <div data-testid={STUDIO.page} className="relative z-10">
      {/* Header */}
      <header className="max-w-[1400px] mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 border border-cyan-400/30 pulse-glow">
              <Sigma className="text-cyan-300" />
            </div>
            <div>
              <div className="font-display text-3xl md:text-4xl font-extrabold neon-glow-cyan">
                MATH<span className="neon-glow-magenta text-fuchsia-300">/</span>STUDIO
              </div>
              <div className="text-[0.7rem] uppercase tracking-[0.4em] text-white/40 font-mono">
                analyse de fonctions · sympy · live plot
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip"><Activity size={12} /> derivatives</span>
            <span className="chip chip-magenta"><Compass size={12} /> integrals</span>
            <span className="chip chip-lime">tables</span>
            <span className="chip chip-amber">plots</span>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="max-w-[1400px] mx-auto px-6 pb-20 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          {/* Input card */}
          <section className="neon-card scanline rounded-2xl p-6">
            <FunctionInput
              value={expr}
              onChange={setExpr}
              onSubmit={run}
              loading={loading}
            />
          </section>

          {/* Options card */}
          <section className="neon-card rounded-2xl p-6">
            <OptionsPanel
              options={options}
              setOptions={setOptions}
              params={params}
              setParams={setParams}
            />
          </section>

          {/* Plot */}
          {data && options.plot && (
            <section className="neon-card rounded-2xl p-6 fade-up">
              <div className="text-[0.72rem] uppercase tracking-[0.3em] mb-4 pb-2 border-b border-cyan-400/30 text-cyan-300">
                Tracé interactif
              </div>
              <PlotPanel data={data} options={options} />
            </section>
          )}

          {/* Results */}
          {data && <ResultsPanel data={data} options={options} />}

          {!data && !loading && (
            <section className="neon-card rounded-2xl p-10 text-center">
              <div className="font-display text-2xl text-white/70 mb-2">
                Prêt à explorer une fonction ?
              </div>
              <div className="text-white/40 text-sm">
                Tape une fonction ci-dessus ou clique sur un exemple — l'analyse complète arrive en une seconde.
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="neon-card rounded-2xl p-5 h-fit xl:sticky xl:top-6">
          <HistoryPanel
            onPick={(e) => {
              setExpr(e);
              run(e);
            }}
            lastSubmitted={lastSubmitted}
          />
        </aside>
      </main>

      <footer className="text-center text-xs text-white/30 pb-6">
        Math Studio · propulsé par SymPy + React · syntaxe ^ ** sin cos tan ln exp sqrt abs · accepte tout
      </footer>
    </div>
  );
}
