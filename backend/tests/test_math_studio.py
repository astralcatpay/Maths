"""Backend API tests for Math Studio."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://function-analyzer-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ─── /api/analyze ───
def test_analyze_polynomial(client):
    r = client.post(f"{API}/analyze", json={
        "expression": "x^3 - 3x + 2",
        "derivative_orders": [1, 2],
        "integral_bounds": [0, 1],
        "plot_range": [-5, 5],
        "taylor_order": 5,
        "taylor_around": 0,
        "include_plot": True,
    }, timeout=60)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["roots", "extrema", "derivatives", "antiderivative",
              "definite_integral", "plot", "sign_table", "variation_table",
              "asymptotes", "limits", "taylor", "domain", "parity",
              "inflection_points"]:
        assert k in d, f"missing key {k}"
    assert isinstance(d["derivatives"], list) and len(d["derivatives"]) >= 1
    assert isinstance(d["roots"], list)
    assert "x" in d["plot"] and "f" in d["plot"]
    assert len(d["plot"]["x"]) > 50


def test_analyze_trig(client):
    r = client.post(f"{API}/analyze", json={"expression": "sin(x)*cos(x)"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert d["parity"] in ["paire", "impaire", "ni paire ni impaire"]
    assert len(d["derivatives"]) >= 1


def test_analyze_exp(client):
    r = client.post(f"{API}/analyze", json={"expression": "x*exp(-x^2)"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert "antiderivative" in d


def test_analyze_log(client):
    r = client.post(f"{API}/analyze", json={"expression": "ln(x^2+1)"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    assert d["parity"] == "paire"


def test_analyze_rational_asymptote(client):
    r = client.post(f"{API}/analyze", json={"expression": "(x^2-1)/(x-2)"}, timeout=60)
    assert r.status_code == 200
    d = r.json()
    asy = d["asymptotes"]["vertical"]
    approxes = [a.get("approx") for a in asy]
    assert any(abs((a or 0) - 2.0) < 1e-6 for a in approxes), f"no vertical asymptote at x=2, got {asy}"


def test_analyze_invalid(client):
    r = client.post(f"{API}/analyze", json={"expression": "x +++ )"}, timeout=30)
    assert r.status_code == 400


# ─── /api/history ───
def test_history_flow(client):
    # clear first
    client.delete(f"{API}/history")
    # add
    r = client.post(f"{API}/history", json={"expression": "TEST_x^2"}, timeout=15)
    assert r.status_code == 200, r.text
    item = r.json()
    assert item["expression"] == "TEST_x^2"
    assert "id" in item
    item_id = item["id"]

    # list
    r = client.get(f"{API}/history", timeout=15)
    assert r.status_code == 200
    lst = r.json()
    assert any(it["id"] == item_id for it in lst)

    # delete one
    r = client.delete(f"{API}/history/{item_id}", timeout=15)
    assert r.status_code == 200

    # verify removed
    r = client.get(f"{API}/history", timeout=15)
    assert not any(it["id"] == item_id for it in r.json())


def test_history_clear(client):
    client.post(f"{API}/history", json={"expression": "TEST_clear_a"}, timeout=15)
    client.post(f"{API}/history", json={"expression": "TEST_clear_b"}, timeout=15)
    r = client.delete(f"{API}/history", timeout=15)
    assert r.status_code == 200
    r = client.get(f"{API}/history", timeout=15)
    assert r.json() == []
