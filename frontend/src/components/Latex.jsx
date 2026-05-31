import { BlockMath, InlineMath } from "react-katex";

export function L({ tex }) {
  if (!tex) return null;
  try {
    return <BlockMath math={tex} />;
  } catch (e) {
    return <span className="font-mono text-amber-300">{tex}</span>;
  }
}

export function Li({ tex }) {
  if (!tex) return null;
  try {
    return <InlineMath math={tex} />;
  } catch (e) {
    return <span className="font-mono text-amber-300">{tex}</span>;
  }
}
