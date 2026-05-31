import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STUDIO } from "@/constants/testIds";
import { Sparkles, Zap } from "lucide-react";

const EXAMPLES = [
  { key: "poly", label: "x³ - 3x + 2", expr: "x^3 - 3x + 2" },
  { key: "trig", label: "sin(x)·cos(x)", expr: "sin(x)*cos(x)" },
  { key: "exp", label: "x·e^(-x²)", expr: "x*exp(-x^2)" },
  { key: "log", label: "ln(x²+1)", expr: "ln(x^2+1)" },
  { key: "rat", label: "(x²-1)/(x-2)", expr: "(x^2-1)/(x-2)" },
  { key: "mix", label: "sin(x)/x", expr: "sin(x)/x" },
];

export default function FunctionInput({ value, onChange, onSubmit, loading }) {
  const [local, setLocal] = useState(value || "");

  const submit = (v) => {
    const expr = (v ?? local).trim();
    if (!expr) return;
    onChange?.(expr);
    onSubmit?.(expr);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="chip chip-magenta">
          <Sparkles size={12} /> entrée
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-white/40">
          tapez n'importe quelle fonction
        </div>
      </div>

      <div className="relative group">
        <div
          aria-hidden
          className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-400/40 via-fuchsia-500/40 to-violet-500/40 opacity-60 group-focus-within:opacity-100 blur-md transition-opacity"
        />
        <div className="relative flex items-stretch gap-2 bg-[hsl(240_14%_8%)] rounded-2xl p-2 border border-cyan-400/20">
          <div className="flex items-center pl-3 pr-1 text-cyan-300/80 font-mono">
            f(x) =
          </div>
          <Input
            data-testid={STUDIO.functionInput}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="ex. sin(x)*exp(-x^2/4) + ln(x^2+1)"
            className="flex-1 h-12 bg-transparent border-0 text-base font-mono text-cyan-100 placeholder:text-white/25 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            data-testid={STUDIO.analyzeBtn}
            type="button"
            disabled={loading}
            onClick={() => submit()}
            className="neon-btn h-12 px-6 rounded-xl"
          >
            <Zap size={14} className="mr-1.5" />
            {loading ? "Analyse…" : "Analyser"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-white/35 self-center mr-1">
          Exemples
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.key}
            data-testid={STUDIO.exampleBtn(ex.key)}
            onClick={() => {
              setLocal(ex.expr);
              submit(ex.expr);
            }}
            className="chip hover:border-cyan-300/60 hover:text-cyan-200 transition-colors font-mono normal-case"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
