from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone

import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
    function_exponentiation,
)
import numpy as np

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

app = FastAPI(title="Math Studio API")
api_router = APIRouter(prefix="/api")

# ─────────────────────────── Sympy helpers ────────────────────────────
X = sp.Symbol("x", real=True)
TRANSFORMS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
    function_exponentiation,
)

LOCAL_NS = {
    "x": X,
    "e": sp.E,
    "E": sp.E,
    "pi": sp.pi,
    "Pi": sp.pi,
    "PI": sp.pi,
    "inf": sp.oo,
    "infty": sp.oo,
    "infinity": sp.oo,
    "ln": sp.log,
    "log": sp.log,
    "log10": lambda a: sp.log(a, 10),
    "log2": lambda a: sp.log(a, 2),
    "exp": sp.exp,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "cot": sp.cot,
    "sec": sp.sec,
    "csc": sp.csc,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "arcsin": sp.asin,
    "arccos": sp.acos,
    "arctan": sp.atan,
    "sinh": sp.sinh,
    "cosh": sp.cosh,
    "tanh": sp.tanh,
    "asinh": sp.asinh,
    "acosh": sp.acosh,
    "atanh": sp.atanh,
    "floor": sp.floor,
    "ceil": sp.ceiling,
    "ceiling": sp.ceiling,
    "sign": sp.sign,
}


def parse_function(text: str) -> sp.Expr:
    text = text.strip()
    if not text:
        raise ValueError("Expression vide")
    # remove leading 'f(x)=' or 'y='
    for prefix in ("f(x)=", "f(x) =", "y=", "y =", "f =", "f="):
        if text.lower().startswith(prefix):
            text = text[len(prefix):]
            break
    try:
        expr = parse_expr(text, local_dict=LOCAL_NS, transformations=TRANSFORMS)
    except Exception as e:
        raise ValueError(f"Impossible d'interpréter l'expression: {e}")
    return sp.sympify(expr)


def safe_latex(expr) -> str:
    try:
        return sp.latex(expr)
    except Exception:
        return str(expr)


def to_float(v):
    try:
        return float(v)
    except Exception:
        return None


def serialize_point(val):
    """Return {'exact': str, 'latex': str, 'approx': float|None}."""
    try:
        approx = to_float(sp.N(val))
    except Exception:
        approx = None
    return {"exact": str(val), "latex": safe_latex(val), "approx": approx}


def compute_domain(expr: sp.Expr) -> Dict[str, Any]:
    try:
        dom = sp.calculus.util.continuous_domain(expr, X, sp.S.Reals)
        return {"latex": safe_latex(dom), "text": str(dom)}
    except Exception:
        return {"latex": "\\mathbb{R}", "text": "R (par défaut)"}


def compute_parity(expr: sp.Expr) -> str:
    try:
        f_neg = sp.simplify(expr.subs(X, -X))
        if sp.simplify(f_neg - expr) == 0:
            return "paire"
        if sp.simplify(f_neg + expr) == 0:
            return "impaire"
    except Exception:
        pass
    return "ni paire ni impaire"


def compute_roots(expr: sp.Expr):
    try:
        sols = sp.solveset(sp.Eq(expr, 0), X, domain=sp.S.Reals)
        out = []
        if isinstance(sols, sp.ConditionSet) or sols == sp.S.EmptySet:
            return out
        if hasattr(sols, "__iter__"):
            for s in list(sols)[:10]:
                out.append(serialize_point(s))
        else:
            out.append(serialize_point(sols))
        return out
    except Exception:
        return []


def compute_critical_points(fprime: sp.Expr):
    try:
        sols = sp.solveset(sp.Eq(fprime, 0), X, domain=sp.S.Reals)
        out = []
        if isinstance(sols, sp.ConditionSet) or sols == sp.S.EmptySet:
            return out
        if hasattr(sols, "__iter__"):
            for s in list(sols)[:20]:
                out.append(serialize_point(s))
        return out
    except Exception:
        return []


def classify_extrema(expr: sp.Expr, fprime: sp.Expr, fsecond: sp.Expr):
    out = []
    crit = compute_critical_points(fprime)
    for c in crit:
        try:
            xv = sp.nsimplify(c["exact"])
            second = sp.N(fsecond.subs(X, xv))
            fval = sp.N(expr.subs(X, xv))
            kind = "indéterminé"
            if second.is_real:
                if float(second) > 0:
                    kind = "minimum local"
                elif float(second) < 0:
                    kind = "maximum local"
            out.append({
                "x": c,
                "y": serialize_point(fval),
                "type": kind,
            })
        except Exception:
            continue
    return out


def compute_inflection(fsecond: sp.Expr, expr: sp.Expr):
    try:
        sols = sp.solveset(sp.Eq(fsecond, 0), X, domain=sp.S.Reals)
        out = []
        if isinstance(sols, sp.ConditionSet) or sols == sp.S.EmptySet:
            return out
        for s in list(sols)[:10]:
            try:
                yval = sp.N(expr.subs(X, s))
                out.append({"x": serialize_point(s), "y": serialize_point(yval)})
            except Exception:
                continue
        return out
    except Exception:
        return []


def compute_asymptotes(expr: sp.Expr):
    result = {"vertical": [], "horizontal": [], "oblique": []}
    # vertical: discontinuities
    try:
        sing = sp.singularities(expr, X)
        for s in list(sing)[:8]:
            if s.is_real:
                result["vertical"].append(serialize_point(s))
    except Exception:
        pass
    # horizontal
    for pt, name in [(sp.oo, "+∞"), (-sp.oo, "-∞")]:
        try:
            lim = sp.limit(expr, X, pt)
            if lim.is_finite:
                result["horizontal"].append({"at": name, "value": serialize_point(lim)})
        except Exception:
            pass
    # oblique y = ax + b
    for pt, name in [(sp.oo, "+∞"), (-sp.oo, "-∞")]:
        try:
            a = sp.limit(expr / X, X, pt)
            if a.is_finite and a != 0:
                b = sp.limit(expr - a * X, X, pt)
                if b.is_finite:
                    line = a * X + b
                    result["oblique"].append({"at": name, "latex": safe_latex(line), "a": serialize_point(a), "b": serialize_point(b)})
        except Exception:
            pass
    return result


def compute_limits(expr: sp.Expr):
    out = {}
    for pt, name in [(-sp.oo, "x → -∞"), (sp.oo, "x → +∞"), (0, "x → 0")]:
        try:
            lim = sp.limit(expr, X, pt)
            out[name] = {"latex": safe_latex(lim), "text": str(lim)}
        except Exception:
            out[name] = {"latex": "?", "text": "indéfini"}
    return out


def compute_sign_table(expr: sp.Expr):
    roots = compute_roots(expr)
    pts = []
    for r in roots:
        if r["approx"] is not None:
            pts.append(r["approx"])
    pts = sorted(set(pts))
    intervals = []
    # build intervals from -∞ to +∞
    extended = [-np.inf] + pts + [np.inf]
    try:
        f_l = sp.lambdify(X, expr, modules=["numpy"])
    except Exception:
        return {"roots": roots, "intervals": []}
    for i in range(len(extended) - 1):
        a, b = extended[i], extended[i + 1]
        if a == -np.inf and b == np.inf:
            test = 0.0
        elif a == -np.inf:
            test = b - 1.0
        elif b == np.inf:
            test = a + 1.0
        else:
            test = (a + b) / 2.0
        try:
            v = float(f_l(test))
            sign = "+" if v > 0 else ("-" if v < 0 else "0")
        except Exception:
            sign = "?"
        intervals.append({
            "from": "-∞" if a == -np.inf else f"{a:.4g}",
            "to": "+∞" if b == np.inf else f"{b:.4g}",
            "sign": sign,
        })
    return {"roots": roots, "intervals": intervals}


def compute_variation_table(expr: sp.Expr, fprime: sp.Expr):
    sign = compute_sign_table(fprime)
    # variation = sign of derivative
    variations = []
    for itv in sign["intervals"]:
        s = itv["sign"]
        arrow = "↗" if s == "+" else ("↘" if s == "-" else "→")
        variations.append({**itv, "variation": arrow})
    # values at critical points
    points = []
    for r in sign["roots"]:
        if r["approx"] is None:
            continue
        try:
            yv = sp.N(expr.subs(X, sp.nsimplify(r["exact"])))
            points.append({"x": r, "y": serialize_point(yv)})
        except Exception:
            continue
    return {"critical_points": points, "intervals": variations}


def make_plot(expr: sp.Expr, fprime: sp.Expr, antider: Optional[sp.Expr], x_min: float, x_max: float, n: int = 400):
    xs = np.linspace(x_min, x_max, n)
    series = {}

    def sample(e):
        try:
            fn = sp.lambdify(X, e, modules=["numpy"])
            ys = fn(xs)
            ys = np.asarray(ys, dtype=float)
            # clamp huge values for cleaner plots
            ys = np.where(np.abs(ys) > 1e6, np.nan, ys)
            return [None if (not np.isfinite(v)) else float(v) for v in ys]
        except Exception:
            return [None] * len(xs)

    series["x"] = [float(v) for v in xs]
    series["f"] = sample(expr)
    series["fprime"] = sample(fprime)
    if antider is not None:
        series["F"] = sample(antider)
    else:
        series["F"] = None
    return series


# ─────────────────────────── Models ────────────────────────────
class AnalyzeRequest(BaseModel):
    expression: str
    derivative_orders: List[int] = Field(default_factory=lambda: [1, 2])
    integral_bounds: Optional[List[float]] = None  # [a, b]
    plot_range: List[float] = Field(default_factory=lambda: [-10.0, 10.0])
    taylor_order: int = 5
    taylor_around: float = 0.0
    include_plot: bool = True


class HistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    expression: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─────────────────────────── Routes ────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "Math Studio API"}


@api_router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        expr = parse_function(req.expression)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    response: Dict[str, Any] = {}
    response["input"] = req.expression
    response["expr"] = str(expr)
    response["latex"] = safe_latex(expr)

    try:
        simplified = sp.simplify(expr)
        response["simplified"] = {"text": str(simplified), "latex": safe_latex(simplified)}
    except Exception:
        response["simplified"] = {"text": str(expr), "latex": safe_latex(expr)}

    response["domain"] = compute_domain(expr)
    response["parity"] = compute_parity(expr)

    # Derivatives
    derivatives = []
    fprime = sp.diff(expr, X)
    fsecond = sp.diff(fprime, X)
    requested = sorted(set(req.derivative_orders or []))
    for order in requested:
        if order < 1 or order > 10:
            continue
        try:
            d = sp.diff(expr, X, order)
            d_simpl = sp.simplify(d)
            derivatives.append({
                "order": order,
                "latex": safe_latex(d_simpl),
                "text": str(d_simpl),
            })
        except Exception:
            continue
    response["derivatives"] = derivatives

    # Antiderivative
    try:
        antider = sp.integrate(expr, X)
        response["antiderivative"] = {"latex": safe_latex(antider), "text": str(antider)}
    except Exception:
        antider = None
        response["antiderivative"] = None

    # Definite integral
    if req.integral_bounds and len(req.integral_bounds) == 2:
        a, b = req.integral_bounds
        try:
            val = sp.integrate(expr, (X, a, b))
            approx = to_float(sp.N(val))
            response["definite_integral"] = {
                "a": a, "b": b,
                "exact": str(val),
                "latex": safe_latex(val),
                "approx": approx,
            }
        except Exception as e:
            response["definite_integral"] = {"a": a, "b": b, "error": str(e)}

    # Roots
    response["roots"] = compute_roots(expr)
    # Extrema (critical + classified)
    response["extrema"] = classify_extrema(expr, fprime, fsecond)
    # Inflection
    response["inflection_points"] = compute_inflection(fsecond, expr)
    # Asymptotes
    response["asymptotes"] = compute_asymptotes(expr)
    # Limits
    response["limits"] = compute_limits(expr)

    # Taylor
    try:
        t = sp.series(expr, X, req.taylor_around, req.taylor_order + 1).removeO()
        response["taylor"] = {
            "around": req.taylor_around,
            "order": req.taylor_order,
            "latex": safe_latex(t),
            "text": str(t),
        }
    except Exception:
        response["taylor"] = None

    # Sign + variation tables
    response["sign_table"] = compute_sign_table(expr)
    response["variation_table"] = compute_variation_table(expr, fprime)

    # Plot
    if req.include_plot:
        x_min, x_max = req.plot_range
        try:
            response["plot"] = make_plot(expr, fprime, antider, float(x_min), float(x_max))
        except Exception as e:
            response["plot"] = {"error": str(e)}

    # Pretty fprime, fsecond
    response["fprime"] = {"latex": safe_latex(sp.simplify(fprime)), "text": str(fprime)}
    response["fsecond"] = {"latex": safe_latex(sp.simplify(fsecond)), "text": str(fsecond)}

    return response


@api_router.post("/history", response_model=HistoryItem)
async def add_history(item: HistoryItem):
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.history.insert_one(doc)
    return item


@api_router.get("/history", response_model=List[HistoryItem])
async def list_history(limit: int = 50):
    cur = db.history.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cur.to_list(limit)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    await db.history.delete_one({"id": item_id})
    return {"ok": True}


@api_router.delete("/history")
async def clear_history():
    await db.history.delete_many({})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
