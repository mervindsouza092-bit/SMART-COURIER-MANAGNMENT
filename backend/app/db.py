import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, String, Integer, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

URL = os.getenv("DATABASE_URL", "sqlite:///./smartcourier.db")  # e.g. postgresql+psycopg2://user:pw@localhost/smartcourier
engine = create_engine(URL, connect_args={"check_same_thread": False} if URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(engine, autoflush=False)
if URL.startswith("sqlite"):  # WAL lets reads and writes overlap, which removes most "database is locked" stalls
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def _pragmas(conn, _rec):
        cur = conn.cursor(); cur.execute("PRAGMA journal_mode=WAL"); cur.execute("PRAGMA synchronous=NORMAL"); cur.execute("PRAGMA busy_timeout=5000"); cur.close()
now = lambda: datetime.now(timezone.utc)

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(30), default="")
    password_hash: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(10), default="user")  # user | courier | admin
    notify_email: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_sms: Mapped[bool] = mapped_column(Boolean, default=False)

class Courier(Base):
    __tablename__ = "couriers"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(30), default="")
    vehicle: Mapped[str] = mapped_column(String(30), default="Bike")
    location: Mapped[str] = mapped_column(String(60), default="")
    status: Mapped[str] = mapped_column(String(20), default="Available")  # Online|Available|On Delivery|Offline
    performance: Mapped[int] = mapped_column(Integer, default=90)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

class Shipment(Base):
    __tablename__ = "shipments"
    id: Mapped[int] = mapped_column(primary_key=True)
    tracking_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    courier_id: Mapped[int | None] = mapped_column(ForeignKey("couriers.id"), nullable=True)
    pickup: Mapped[str] = mapped_column(String(200))
    destination: Mapped[str] = mapped_column(String(200))
    package: Mapped[str] = mapped_column(String(60), default="Parcel")
    weight: Mapped[float] = mapped_column(Float, default=1)
    price: Mapped[float] = mapped_column(Float, default=0)
    plat: Mapped[float | None] = mapped_column(Float, nullable=True)
    plng: Mapped[float | None] = mapped_column(Float, nullable=True)
    dlat: Mapped[float | None] = mapped_column(Float, nullable=True)
    dlng: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance_km: Mapped[float] = mapped_column(Float, default=0)
    otp: Mapped[str] = mapped_column(String(6), default="")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proof: Mapped[str | None] = mapped_column(Text, nullable=True, deferred=True)  # big photo: only loaded when asked for
    has_proof: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    payment_status: Mapped[str] = mapped_column(String(10), default="Unpaid")  # Unpaid | Paid | COD
    payment_method: Mapped[str] = mapped_column(String(20), default="UPI")
    pay_ref: Mapped[str | None] = mapped_column(String(60), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(10), default="Normal", nullable=True)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    promo_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    discount: Mapped[float | None] = mapped_column(Float, default=0, nullable=True)
    is_return: Mapped[bool | None] = mapped_column(Boolean, default=False, nullable=True)
    return_of: Mapped[int | None] = mapped_column(Integer, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(String(300))
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Setting(Base):
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="{}")

def ensure_columns():
    """Adds columns that were added to the models after a table was first created (so live databases need no reset)."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    with engine.begin() as conn:
        for t in Base.metadata.sorted_tables:
            if not insp.has_table(t.name): continue
            have = {c["name"] for c in insp.get_columns(t.name)}
            for c in t.columns:
                if c.name not in have: conn.execute(text(f'ALTER TABLE {t.name} ADD COLUMN {c.name} {c.type.compile(dialect=engine.dialect)}'))

class SavedAddress(Base):
    __tablename__ = "saved_addresses"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    label: Mapped[str] = mapped_column(String(30))
    address: Mapped[str] = mapped_column(String(300))
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shipment_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    subject: Mapped[str] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(12), default="Open")  # Open | Answered | Closed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class TicketMsg(Base):
    __tablename__ = "ticket_msgs"
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), index=True)
    sender: Mapped[str] = mapped_column(String(60))
    role: Mapped[str] = mapped_column(String(10))
    text: Mapped[str] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Promo(Base):
    __tablename__ = "promos"
    code: Mapped[str] = mapped_column(String(20), primary_key=True)
    kind: Mapped[str] = mapped_column(String(8))  # percent | flat
    value: Mapped[float] = mapped_column(Float)
    min_order: Mapped[float] = mapped_column(Float, default=0)
    max_uses: Mapped[int] = mapped_column(Integer, default=0)  # 0 = unlimited
    used: Mapped[int] = mapped_column(Integer, default=0)
    expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class CourierPing(Base):
    __tablename__ = "courier_pings"
    id: Mapped[int] = mapped_column(primary_key=True)
    courier_id: Mapped[int] = mapped_column(Integer, index=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)
    actor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actor: Mapped[str] = mapped_column(String(80))
    action: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(String(300), default="")
