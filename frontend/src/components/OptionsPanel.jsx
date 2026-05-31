import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STUDIO } from "@/constants/testIds";

export const DEFAULT_OPTIONS = {
  domain: true,
  parity: true,
  derivatives: true,
  antiderivative: true,
  definiteIntegral: true,
  roots: true,
  extrema: true,
  inflection: true,
  asymptotes: true,
  limits: true,
  taylor: true,
  signTable: true,
  variationTable: true,
  plot: true,
};

const SECTIONS = [
  { group: "Analyse", items: [
    { key: "domain", label: "Domaine de définition" },
    { key: "parity", label: "Parité" },
    { key: "limits", label: "Limites" },
    { key: "asymptotes", label: "Asymptotes" },
  ]},
  { group: "Calcul", items: [
    { key: "derivatives", label: "Dérivées (n-ième)" },
    { key: "antiderivative", label: "Primitive" },
    { key: "definiteIntegral", label: "Intégrale définie" },
    { key: "taylor", label: "Développement de Taylor" },
  ]},
  { group: "Points clés", items: [
    { key: "roots", label: "Racines" },
    { key: "extrema", label: "Extremums (min/max)" },
    { key: "inflection", label: "Points d'inflexion" },
  ]},
  { group: "Tableaux & courbe", items: [
    { key: "signTable", label: "Tableau de signe" },
    { key: "variationTable", label: "Tableau de variation" },
    { key: "plot", label: "Tracé de la courbe" },
  ]},
];

export default function OptionsPanel({ options, setOptions, params, setParams }) {
  const toggle = (k) => setOptions({ ...options, [k]: !options[k] });
  const upd = (patch) => setParams({ ...params, ...patch });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="chip chip-lime">paramètres</div>
        <div className="text-xs uppercase tracking-[0.25em] text-white/40">
          ce que tu veux calculer
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {SECTIONS.map((sec) => (
          <div key={sec.group} className="space-y-2.5">
            <div className="text-[0.7rem] uppercase tracking-[0.25em] text-cyan-300/80 font-display">
              {sec.group}
            </div>
            <div className="space-y-2">
              {sec.items.map((it) => (
                <label
                  key={it.key}
                  className="flex items-center justify-between gap-3 py-1.5 px-3 rounded-xl border border-transparent hover:border-cyan-400/15 hover:bg-cyan-400/5 transition cursor-pointer"
                >
                  <span className="text-sm text-white/85">{it.label}</span>
                  <Switch
                    data-testid={STUDIO.optionToggle(it.key)}
                    checked={!!options[it.key]}
                    onCheckedChange={() => toggle(it.key)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <NumberField
          testId={STUDIO.derivativeOrder}
          label="Ordre dérivée max"
          value={params.derivOrder}
          onChange={(v) => upd({ derivOrder: v })}
          min={1}
          max={10}
        />
        <NumberField
          testId={STUDIO.integralA}
          label="Intégrale a"
          value={params.intA}
          onChange={(v) => upd({ intA: v })}
          step="any"
        />
        <NumberField
          testId={STUDIO.integralB}
          label="Intégrale b"
          value={params.intB}
          onChange={(v) => upd({ intB: v })}
          step="any"
        />
        <NumberField
          testId={STUDIO.plotMin}
          label="Tracé x min"
          value={params.xMin}
          onChange={(v) => upd({ xMin: v })}
          step="any"
        />
        <NumberField
          testId={STUDIO.plotMax}
          label="Tracé x max"
          value={params.xMax}
          onChange={(v) => upd({ xMax: v })}
          step="any"
        />
        <NumberField
          testId={STUDIO.taylorOrder}
          label="Taylor ordre"
          value={params.taylorOrder}
          onChange={(v) => upd({ taylorOrder: v })}
          min={1}
          max={15}
        />
        <NumberField
          testId={STUDIO.taylorAround}
          label="Taylor autour de"
          value={params.taylorAround}
          onChange={(v) => upd({ taylorAround: v })}
          step="any"
        />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, testId, min, max, step }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45">
        {label}
      </Label>
      <Input
        data-testid={testId}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 bg-[hsl(240_14%_10%)] border-white/10 text-cyan-100 font-mono"
      />
    </div>
  );
}
