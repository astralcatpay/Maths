# Math Studio — PRD

## Original Problem Statement
Site de maths où l'utilisateur entre n'importe quelle fonction (sin, cos, polynômes, ln, exp, etc.) et peut sélectionner : dérivée n-ième, primitive, tableau de signe, tableau de variation, bornes d'intégrale, tracé de courbe (f, f', F), racines, points d'inflexion, asymptotes, limites, Taylor, parité, domaine, etc. Style sombre néon moderne, historique.

## Architecture
- **Backend**: FastAPI + SymPy + Motor (Mongo) — endpoint `/api/analyze` qui retourne toute l'analyse symbolique + points de courbe ; endpoints `/api/history` (CRUD).
- **Frontend**: React 19 + Tailwind + shadcn/ui + recharts + KaTeX. Page `MathStudio`. Composants : `FunctionInput`, `OptionsPanel`, `ResultsPanel`, `PlotPanel`, `HistoryPanel`.
- **Calcul**: 100% côté serveur via SymPy (le plus puissant).

## Implementé (2026-02)
- Parser tolérant (`^`, multiplication implicite, ln/exp/sin/...).
- Domaine, parité, simplification, dérivées 1→n, primitive, intégrale définie, racines, extrema classifiés, points d'inflexion, asymptotes (verticales/horizontales/obliques), limites en ±∞ et 0, Taylor, tableau de signe, tableau de variation.
- Tracé interactif recharts (f, f', F togglables) + points remarquables (racines / extrema / inflexions).
- Historique serveur (Mongo) + fallback localStorage, suppression et clear.
- UI dark neon (cyan/magenta/violet), KaTeX pour le rendu LaTeX.

## Backlog (P1/P2)
- P1 : résolution d'équations f(x)=g(x) au lieu de seulement zéros.
- P1 : export PDF de l'analyse.
- P2 : multi-fonctions sur le même graphe.
- P2 : mode "pas à pas" pour les dérivées/intégrales.
- P2 : reconnaissance d'expressions par photo (OCR).

## Next Actions
- Polish UX et erreurs de parsing plus pédagogiques.
- Ajouter le partage d'un lien d'analyse.
