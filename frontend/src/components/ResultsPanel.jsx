import { L, Li } from "@/components/Latex";
import { STUDIO } from "@/constants/testIds";

function Section({ title, accent = "cyan", children, testId }) {
  const colorMap = {
    cyan: "border-cyan-400/30 text-cyan-300",
    magenta: "border-fuchsia-400/30 text-fuchsia-300",
    lime: "border-lime-400/30 text-lime-300",
    amber: "border-amber-400/30 text-amber-300",
    violet: "border-violet-400/30 text-violet-300",
  };
  return (
    <section data-testid={testId} className="neon-card scanline rounded-2xl p-6 fade-up">
      <div className={`text-[0.72rem] uppercase tracking-[0.3em] mb-4 pb-2 border-b ${colorMap[accent]}`}>
        {title}
      </div>
      <div className="space-y-3 text-white/85">{children}</div>
    </section>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-xs uppercase tracking-wider text-white/45">{k}</span>
      <span className="font-mono text-cyan-200 text-right">{v}</span>
    </div>
  );
}

export default function ResultsPanel({ data, options }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Function summary */}
      <Section title="Fonction analysée" accent="cyan">
        <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/10">
          <L tex={`f(x) = ${data.latex}`} />
        </div>
        {data.simplified && data.simplified.text !== data.expr && (
          <div className="mt-2">
            <div className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45 mb-1">
              Forme simplifiée
            </div>
            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
              <L tex={data.simplified.latex} />
            </div>
          </div>
        )}
      </Section>

      {/* Domain & parity */}
      {(options.domain || options.parity) && (
        <Section title="Caractéristiques" accent="violet">
          {options.domain && (
            <div data-testid={STUDIO.resultDomain}>
              <div className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45 mb-1">
                Domaine de définition
              </div>
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <Li tex={`D_f = ${data.domain.latex}`} />
              </div>
            </div>
          )}
          {options.parity && (
            <div data-testid={STUDIO.resultParity}>
              <div className="text-[0.7rem] uppercase tracking-[0.2em] text-white/45 mb-1">
                Parité
              </div>
              <div className="font-mono text-fuchsia-200 capitalize">
                {data.parity}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Derivatives */}
      {options.derivatives && data.derivatives?.length > 0 && (
        <Section title="Dérivées" accent="lime" testId={STUDIO.resultDerivatives}>
          {data.derivatives.map((d) => (
            <div key={d.order} className="bg-black/30 rounded-xl p-3 border border-white/5">
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-lime-300/80 mb-1">
                Dérivée d'ordre {d.order}
              </div>
              <L tex={`f^{(${d.order})}(x) = ${d.latex}`} />
            </div>
          ))}
        </Section>
      )}

      {/* Antiderivative & definite integral */}
      {(options.antiderivative || options.definiteIntegral) && (
        <Section title="Intégration" accent="magenta">
          {options.antiderivative && data.antiderivative && (
            <div data-testid={STUDIO.resultAntiderivative} className="bg-black/30 rounded-xl p-3 border border-white/5">
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-fuchsia-300/80 mb-1">
                Primitive
              </div>
              <L tex={`F(x) = ${data.antiderivative.latex} + C`} />
            </div>
          )}
          {options.definiteIntegral && data.definite_integral && (
            <div data-testid={STUDIO.resultDefiniteIntegral} className="bg-black/30 rounded-xl p-3 border border-white/5">
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-fuchsia-300/80 mb-1">
                Intégrale définie
              </div>
              {data.definite_integral.error ? (
                <div className="text-amber-300 font-mono text-sm">
                  {data.definite_integral.error}
                </div>
              ) : (
                <>
                  <L
                    tex={`\\int_{${data.definite_integral.a}}^{${data.definite_integral.b}} f(x)\\,dx = ${data.definite_integral.latex}`}
                  />
                  {data.definite_integral.approx != null && (
                    <div className="text-cyan-300 font-mono text-sm mt-1">
                      ≈ {data.definite_integral.approx.toFixed(6)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Roots */}
      {options.roots && (
        <Section title="Racines (zéros)" accent="amber" testId={STUDIO.resultRoots}>
          {data.roots.length === 0 ? (
            <div className="text-white/50 italic">Aucune racine réelle trouvée.</div>
          ) : (
            <ul className="space-y-1.5">
              {data.roots.map((r, i) => (
                <li key={i} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-1.5 border border-white/5">
                  <span className="chip chip-amber">x{i + 1}</span>
                  <Li tex={r.latex} />
                  {r.approx != null && (
                    <span className="ml-auto font-mono text-amber-200 text-sm">
                      ≈ {r.approx.toFixed(5)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Extrema */}
      {options.extrema && (
        <Section title="Extremums" accent="lime" testId={STUDIO.resultExtrema}>
          {data.extrema.length === 0 ? (
            <div className="text-white/50 italic">Aucun extremum trouvé.</div>
          ) : (
            <ul className="space-y-1.5">
              {data.extrema.map((e, i) => (
                <li key={i} className="bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`chip ${e.type.includes("max") ? "chip-magenta" : "chip-lime"}`}>
                      {e.type}
                    </span>
                  </div>
                  <div className="font-mono text-cyan-200 text-sm">
                    x ≈ {e.x.approx?.toFixed(5) ?? "?"}, f(x) ≈ {e.y.approx?.toFixed(5) ?? "?"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Inflection */}
      {options.inflection && (
        <Section title="Points d'inflexion" accent="violet" testId={STUDIO.resultInflection}>
          {data.inflection_points.length === 0 ? (
            <div className="text-white/50 italic">Aucun point d'inflexion trouvé.</div>
          ) : (
            <ul className="space-y-1.5">
              {data.inflection_points.map((p, i) => (
                <li key={i} className="bg-black/30 rounded-lg px-3 py-1.5 border border-white/5 font-mono text-violet-200 text-sm">
                  x ≈ {p.x.approx?.toFixed(5) ?? "?"}, f(x) ≈ {p.y.approx?.toFixed(5) ?? "?"}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Asymptotes */}
      {options.asymptotes && (
        <Section title="Asymptotes" accent="cyan" testId={STUDIO.resultAsymptotes}>
          {["vertical", "horizontal", "oblique"].every(
            (k) => data.asymptotes[k].length === 0
          ) ? (
            <div className="text-white/50 italic">Aucune asymptote détectée.</div>
          ) : (
            <div className="space-y-2">
              {data.asymptotes.vertical.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                    Verticales
                  </div>
                  {data.asymptotes.vertical.map((v, i) => (
                    <div key={i} className="font-mono text-cyan-100 text-sm">
                      x = <Li tex={v.latex} />
                    </div>
                  ))}
                </div>
              )}
              {data.asymptotes.horizontal.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                    Horizontales
                  </div>
                  {data.asymptotes.horizontal.map((h, i) => (
                    <div key={i} className="font-mono text-cyan-100 text-sm">
                      en {h.at} : y = <Li tex={h.value.latex} />
                    </div>
                  ))}
                </div>
              )}
              {data.asymptotes.oblique.length > 0 && (
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300/80 mb-1">
                    Obliques
                  </div>
                  {data.asymptotes.oblique.map((o, i) => (
                    <div key={i} className="font-mono text-cyan-100 text-sm">
                      en {o.at} : y = <Li tex={o.latex} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* Limits */}
      {options.limits && (
        <Section title="Limites" accent="magenta" testId={STUDIO.resultLimits}>
          {Object.entries(data.limits).map(([k, v]) => (
            <Row key={k} k={k} v={<Li tex={v.latex} />} />
          ))}
        </Section>
      )}

      {/* Taylor */}
      {options.taylor && data.taylor && (
        <Section title={`Taylor (ordre ${data.taylor.order} autour de ${data.taylor.around})`} accent="violet" testId={STUDIO.resultTaylor}>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <L tex={data.taylor.latex} />
          </div>
        </Section>
      )}

      {/* Sign table */}
      {options.signTable && (
        <Section title="Tableau de signe de f" accent="amber" testId={STUDIO.resultSignTable}>
          <TableSign data={data.sign_table} />
        </Section>
      )}

      {/* Variation table */}
      {options.variationTable && (
        <Section title="Tableau de variation" accent="lime" testId={STUDIO.resultVariationTable}>
          <TableVar data={data.variation_table} />
        </Section>
      )}
    </div>
  );
}

function TableSign({ data }) {
  if (!data?.intervals?.length) return <div className="text-white/50 italic">Indisponible.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-white/45 text-xs uppercase tracking-wider">
            <th className="text-left py-2">Intervalle</th>
            <th className="text-right py-2">Signe</th>
          </tr>
        </thead>
        <tbody>
          {data.intervals.map((it, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="py-2 text-cyan-100">]{it.from} ; {it.to}[</td>
              <td className={`py-2 text-right text-lg font-bold ${it.sign === "+" ? "text-lime-300" : it.sign === "-" ? "text-fuchsia-300" : "text-white/50"}`}>
                {it.sign}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableVar({ data }) {
  if (!data?.intervals?.length) return <div className="text-white/50 italic">Indisponible.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-white/45 text-xs uppercase tracking-wider">
            <th className="text-left py-2">Intervalle</th>
            <th className="text-center py-2">f'(x)</th>
            <th className="text-right py-2">Variation</th>
          </tr>
        </thead>
        <tbody>
          {data.intervals.map((it, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="py-2 text-cyan-100">]{it.from} ; {it.to}[</td>
              <td className={`py-2 text-center text-lg font-bold ${it.sign === "+" ? "text-lime-300" : it.sign === "-" ? "text-fuchsia-300" : "text-white/50"}`}>
                {it.sign}
              </td>
              <td className="py-2 text-right text-2xl">{it.variation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.critical_points?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-white/45 mb-1">
            Valeurs aux points critiques
          </div>
          {data.critical_points.map((p, i) => (
            <div key={i} className="text-sm font-mono text-cyan-200">
              f({p.x.approx?.toFixed(4) ?? p.x.exact}) = {p.y.approx?.toFixed(4) ?? p.y.exact}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
