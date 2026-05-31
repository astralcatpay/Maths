import { useEffect, useState, useCallback } from "react";
import { listHistory, clearHistory as apiClear, addHistory, deleteHistory } from "@/lib/api";
import { STUDIO } from "@/constants/testIds";
import { History, Trash2, X } from "lucide-react";

const LOCAL_KEY = "mathstudio_history_v1";

export default function HistoryPanel({ onPick, lastSubmitted }) {
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    // try server, fallback to local
    try {
      const remote = await listHistory();
      setItems(remote);
      return;
    } catch (e) {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      setItems(local);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!lastSubmitted) return;
    const push = async () => {
      try {
        await addHistory(lastSubmitted);
      } catch (e) {
        // local fallback
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        const next = [
          { id: String(Date.now()), expression: lastSubmitted, created_at: new Date().toISOString() },
          ...local.filter((x) => x.expression !== lastSubmitted),
        ].slice(0, 30);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }
      load();
    };
    push();
  }, [lastSubmitted, load]);

  const onClear = async () => {
    try {
      await apiClear();
    } catch (e) {
      localStorage.removeItem(LOCAL_KEY);
    }
    load();
  };

  const onRemove = async (id) => {
    try {
      await deleteHistory(id);
    } catch (e) {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      localStorage.setItem(LOCAL_KEY, JSON.stringify(local.filter((x) => x.id !== id)));
    }
    load();
  };

  return (
    <div data-testid={STUDIO.historyList} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={14} className="text-cyan-300" />
          <span className="text-[0.7rem] uppercase tracking-[0.25em] text-white/45">
            historique
          </span>
        </div>
        {items.length > 0 && (
          <button
            data-testid={STUDIO.clearHistory}
            onClick={onClear}
            className="text-xs text-white/40 hover:text-fuchsia-300 transition flex items-center gap-1"
          >
            <Trash2 size={12} /> vider
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-white/35 italic">Aucune entrée encore.</div>
      ) : (
        <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((it, i) => (
            <li
              key={it.id || i}
              data-testid={STUDIO.historyItem(i)}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/5 hover:border-cyan-400/30 transition cursor-pointer"
              onClick={() => onPick?.(it.expression)}
            >
              <span className="font-mono text-sm text-cyan-100 truncate flex-1">
                {it.expression}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(it.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-fuchsia-300 transition"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
