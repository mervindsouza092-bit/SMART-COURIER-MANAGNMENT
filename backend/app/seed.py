import math
from sqlalchemy import select
from .db import Courier, Shipment, User

P = {"Virar West": (19.4559, 72.8113), "Vasai Road": (19.3919, 72.8397), "Nalasopara": (19.4170, 72.8200), "Borivali": (19.2307, 72.8567), "Mira Road": (19.2813, 72.8561),
     "Andheri East": (19.1136, 72.8697), "Bandra Kurla": (19.0674, 72.8685), "Thane": (19.2183, 72.9781), "Dadar": (19.0178, 72.8478), "Powai": (19.1176, 72.9060)}

def road_km(a, b):
    p = math.pi / 180; x = math.sin((b[0] - a[0]) * p / 2) ** 2 + math.cos(a[0] * p) * math.cos(b[0] * p) * math.sin((b[1] - a[1]) * p / 2) ** 2
    return round(12742 * math.asin(math.sqrt(x)) * 1.3, 1)

def seed(db, hash_pw):
    if db.scalar(select(User)): return
    mk = lambda n, e, r, p="": User(name=n, email=e, phone=p, role=r, password_hash=hash_pw("admin123" if r == "admin" else "password123"))
    admin = mk("Admin", "admin@smartcourier.com", "admin")
    custs = [mk("Aarav Patil", "aarav@mail.com", "user", "98765 11111"), mk("Priya Shah", "priya@mail.com", "user", "98765 22222"), mk("Rohan Mehta", "rohan@mail.com", "user", "98765 33333")]
    ravi = mk("Ravi Kumar", "ravi@mail.com", "courier", "98200 11111")
    db.add_all([admin, *custs, ravi]); db.flush()
    cs = [Courier(code=f"CR-10{i+1}", name=n, phone=p, vehicle=v, location=l, status=s, performance=pf, lat=ll[0] if ll else None, lng=ll[1] if ll else None) for i, (n, p, v, l, s, pf, ll) in enumerate([
        ("Ravi Kumar", "98200 11111", "EV Van", "Virar", "On Delivery", 96, (19.36, 72.84)), ("Imran Shaikh", "98200 22222", "Bike", "Vasai", "On Delivery", 92, (19.30, 72.86)),
        ("Suresh Patil", "98200 33333", "EV Scooter", "Nalasopara", "Available", 89, (19.417, 72.82)), ("Anil Desai", "98200 44444", "Mini Truck", "Mira Road", "Online", 94, (19.281, 72.856)),
        ("Kiran More", "98200 55555", "Bike", "Borivali", "Offline", 81, None)])]
    cs[0].user_id = ravi.id; db.add_all(cs); db.flush()
    rows = [("Virar West", "Andheri East", "Documents", 1, "In Transit", 0, 0), ("Vasai Road", "Bandra Kurla", "Electronics", 3, "Out for Delivery", 1, 1),
            ("Nalasopara", "Thane", "Clothing", 2, "Picked Up", 0, 0), ("Borivali", "Dadar", "Books", 1, "Delivered", 0, 2), ("Mira Road", "Powai", "Food Box", 2, "Pending", None, 0)]
    for i, (p, d, pk, w, st, c, u) in enumerate(rows):
        km = road_km(P[p], P[d])
        db.add(Shipment(tracking_id=f"SC-2026-9482{i+1}", customer_id=custs[u].id, courier_id=cs[c].id if c is not None else None, pickup=p, destination=d, package=pk, weight=w,
                        price=round(80 + w * 25 + km * 8 + 49 + (80 + w * 25 + km * 8 + 49) * .18), status=st, plat=P[p][0], plng=P[p][1], dlat=P[d][0], dlng=P[d][1], distance_km=km, otp="4821", payment_status="Paid", payment_method="UPI", priority=["Normal", "Highest", "High", "Low", "Normal"][i]))
    import random
    from datetime import datetime, timedelta, timezone
    random.seed(7); names = list(P)  # 80 historical shipments so the charts have real data
    for k in range(200):
        a, b = random.sample(names, 2); km = road_km(P[a], P[b]); w = random.randint(1, 5)
        db.add(Shipment(tracking_id=f"SC-2026-8{k:04d}", customer_id=random.choice(custs).id, courier_id=cs[random.randint(0, 3)].id, pickup=a, destination=b, package="Parcel", weight=w,
                        price=round((80 + w * 25 + km * 8 + 49) * 1.18), status=random.choice(["Delivered"] * 8 + ["Cancelled"]), plat=P[a][0], plng=P[a][1], dlat=P[b][0], dlng=P[b][1],
                        distance_km=km, otp="1234", payment_status="Paid", payment_method="UPI", priority=random.choice(["Normal"] * 5 + ["High", "Highest", "Low", "Lowest"]), rating=random.randint(3, 5), created_at=datetime.now(timezone.utc) - timedelta(days=random.choices(range(30), weights=[1.8 if (datetime.now() - timedelta(days=d)).weekday() >= 5 else 1 for d in range(30)])[0], hours=random.randint(0, 12))))
    db.commit()
