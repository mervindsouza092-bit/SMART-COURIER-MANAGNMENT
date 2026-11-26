"""API tests. Run from the backend folder:  pip install -r requirements-dev.txt  then  python -m pytest -q
Uses a temporary SQLite database, so your real data is never touched."""
import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ.pop("ANTHROPIC_API_KEY", None)
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import app

ADMIN, AARAV, PRIYA, RAVI = ("admin@smartcourier.com", "admin123"), ("aarav@mail.com", "password123"), ("priya@mail.com", "password123"), ("ravi@mail.com", "password123")
BOOK = {"pickup": "Virar West", "destination": "Andheri East", "package": "Documents", "weight": 1, "plat": 19.4559, "plng": 72.8113, "dlat": 19.1136, "dlng": 72.8697,
        "distance_km": 30, "payment_method": "Cash on Delivery", "priority": "High"}

@pytest.fixture(scope="module")
def c():
    with TestClient(app) as client: yield client

def auth(c, who):
    r = c.post("/api/auth/login", json={"email": who[0], "password": who[1]}); assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}

def book(c, who=AARAV, **extra):
    r = c.post("/api/shipments", json={**BOOK, **extra}, headers=auth(c, who)); assert r.status_code == 201, r.text; return r.json()

def courier_id(c, name="Ravi Kumar"):
    return next(x["id"] for x in c.get("/api/couriers", headers=auth(c, ADMIN)).json() if x["name"] == name)

def deliver(c, s):
    admin, ravi = auth(c, ADMIN), auth(c, RAVI)
    assert c.patch(f"/api/shipments/{s['id']}/assign", json={"courier_id": courier_id(c)}, headers=admin).status_code == 200
    assert c.patch(f"/api/shipments/{s['id']}/status", json={"status": "Out for Delivery"}, headers=ravi).status_code == 200
    return ravi

def test_login_roles_and_lockout(c):
    assert c.post("/api/auth/login", json={"email": AARAV[0], "password": "wrong"}).status_code == 401
    assert c.get("/api/users", headers=auth(c, ADMIN)).status_code == 200
    assert c.get("/api/users", headers=auth(c, AARAV)).status_code == 403
    for _ in range(5): c.post("/api/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert c.post("/api/auth/login", json={"email": "nobody@test.com", "password": "x"}).status_code == 429

def test_quote_priorities_are_ordered(c):
    q = {o["priority"]: o["total"] for o in c.post("/api/pricing/quote", json={"weight": 2, "distance_km": 10}, headers=auth(c, AARAV)).json()}
    assert q["Highest"] > q["High"] > q["Normal"] > q["Low"] > q["Lowest"]

def test_tracking_is_private(c):
    s = book(c)
    assert c.get(f"/api/track/{s['tracking_id']}", headers=auth(c, AARAV)).status_code == 200
    assert c.get(f"/api/track/{s['tracking_id']}", headers=auth(c, ADMIN)).status_code == 200
    assert c.get(f"/api/track/{s['tracking_id']}", headers=auth(c, PRIYA)).status_code == 404  # another customer must not see it
    assert c.get(f"/api/track/{s['tracking_id']}").status_code in (401, 403)

def test_delivery_needs_photo_and_otp_then_rating_and_return(c):
    s = book(c); ravi = deliver(c, s); url = f"/api/shipments/{s['id']}"
    assert c.patch(url + "/status", json={"status": "Delivered", "otp": s["otp"]}, headers=ravi).status_code == 400          # no photo yet
    assert c.post(url + "/proof", json={"image": "data:image/png;base64,iVBORw0KGgo="}, headers=ravi).status_code == 200
    assert c.patch(url + "/status", json={"status": "Delivered", "otp": "0000"}, headers=ravi).status_code == 400            # wrong code
    assert c.patch(url + "/status", json={"status": "Delivered", "otp": s["otp"]}, headers=ravi).status_code == 200
    aarav = auth(c, AARAV)
    assert c.post(url + "/rate", json={"rating": 5}, headers=aarav).status_code == 200
    assert c.post(url + "/rate", json={"rating": 4}, headers=aarav).status_code == 409
    r = c.post(url + "/return", json={"payment_method": "Cash on Delivery"}, headers=aarav)
    assert r.status_code == 201 and r.json()["is_return"] is True
    assert c.post(url + "/return", json={}, headers=aarav).status_code == 409

def test_promo_codes(c):
    admin = auth(c, ADMIN)
    assert c.post("/api/admin/promos", json={"code": "TEST10", "kind": "percent", "value": 10}, headers=admin).status_code == 201
    r = c.post("/api/promo/check", json={"code": "test10", "amount": 500}, headers=auth(c, AARAV)); assert r.status_code == 200 and r.json()["discount"] == 50
    assert c.post("/api/promo/check", json={"code": "NOPE", "amount": 500}, headers=auth(c, AARAV)).status_code == 400

def test_scheduled_pickup_validation(c):
    t = datetime.now(timezone.utc)
    assert c.post("/api/shipments", json={**BOOK, "scheduled_for": (t - timedelta(days=1)).isoformat()}, headers=auth(c, AARAV)).status_code == 400
    assert c.post("/api/shipments", json={**BOOK, "scheduled_for": (t + timedelta(days=60)).isoformat()}, headers=auth(c, AARAV)).status_code == 400
    s = book(c, scheduled_for=(t + timedelta(days=2)).isoformat()); assert s["scheduled_for"] and s["courier"] is None  # far-future pickups are not assigned yet

def test_support_tickets_are_private(c):
    aarav, admin = auth(c, AARAV), auth(c, ADMIN)
    t = c.post("/api/tickets", json={"subject": "Late parcel", "message": "Where is it?"}, headers=aarav).json()
    assert c.get(f"/api/tickets/{t['id']}", headers=auth(c, PRIYA)).status_code == 404
    assert c.post(f"/api/tickets/{t['id']}/reply", json={"text": "On its way"}, headers=admin).status_code == 200
    assert c.get(f"/api/tickets/{t['id']}", headers=aarav).json()["status"] == "Answered"

def test_saved_addresses_update_instead_of_duplicate(c):
    h = auth(c, AARAV)
    c.post("/api/addresses", json={"label": "Home", "address": "Virar West"}, headers=h); c.post("/api/addresses", json={"label": "home", "address": "Vasai Road"}, headers=h)
    homes = [a for a in c.get("/api/addresses", headers=h).json() if a["label"].lower() == "home"]
    assert len(homes) == 1 and homes[0]["address"] == "Vasai Road"

def test_admin_pricing_changes_quotes_and_is_logged(c):
    admin = auth(c, ADMIN); cur = c.get("/api/pricing", headers=admin).json()
    body = {k: cur[k] for k in ("base", "per_kg", "per_km", "fee", "min_charge", "tax_pct", "rush_pct", "weather_pct", "demand_pct", "courier_pct", "multipliers")}
    normal = lambda: next(o["total"] for o in c.post("/api/pricing/quote", json={"weight": 1, "distance_km": 5}, headers=admin).json() if o["priority"] == "Normal")
    before = normal(); assert c.put("/api/admin/pricing", json={**body, "base": cur["base"] + 200}, headers=admin).status_code == 200
    assert normal() > before; c.put("/api/admin/pricing", json=body, headers=admin)
    assert any(a["action"] == "Changed pricing" for a in c.get("/api/admin/audit", headers=admin).json())

def test_failed_delivery_can_be_rescheduled(c):
    s = book(c); ravi = deliver(c, s); admin = auth(c, ADMIN)
    assert c.patch(f"/api/shipments/{s['id']}/status", json={"status": "Failed", "reason": "Customer unavailable"}, headers=ravi).status_code == 200
    item = next(x for x in c.get("/api/admin/reattempts", headers=admin).json() if x["id"] == s["id"])
    r = c.post(f"/api/admin/reattempts/{s['id']}/schedule", json={"when": item["slots"][0]["when"]}, headers=admin)
    assert r.status_code == 200 and r.json()["status"] == "Pending"

def test_ask_your_data_works_without_a_key(c):
    r = c.post("/api/admin/ask", json={"question": "Which area had the most cancelled deliveries?"}, headers=auth(c, ADMIN))
    assert r.status_code == 200 and r.json()["engine"] == "rules"
