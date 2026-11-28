"""Pure input checks (no web framework needed, so they are easy to unit-test)."""
import base64, re

class Invalid(ValueError):
    """Raised for bad user input; the API turns it into a 400 response."""

VEHICLES = ("Bike", "Scooter", "EV Scooter", "EV Van", "Mini Truck")
ID_TYPES = ("Aadhaar", "PAN", "Voter ID", "Driving Licence")

def password_ok(pw):
    if not (8 <= len(pw) <= 72 and re.search(r"[a-z]", pw) and re.search(r"[A-Z]", pw) and re.search(r"\d", pw)):
        raise Invalid("Password must be 8 to 72 characters with an uppercase letter, a lowercase letter and a number")

def norm_phone(p):
    d = re.sub(r"\D", "", p or "")
    if len(d) == 10 and d[0] in "6789": return "+91" + d
    if len(d) == 12 and d.startswith("91") and d[2] in "6789": return "+" + d
    return None

def mask_email(e): a, _, d = e.partition("@"); return a[:1] + "***@" + d
def mask_phone(p): return p[:3] + "******" + p[-4:] if p else p
def mask_id(s): return "X" * max(len(s) - 4, 0) + s[-4:]

_D = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]]
_P = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

def verhoeff_ok(num):
    """Aadhaar numbers end with a Verhoeff check digit, so most typing mistakes are caught."""
    c = 0
    for i, ch in enumerate(reversed(num)): c = _D[c][_P[i % 8][int(ch)]]
    return c == 0

def verhoeff_check_digit(base):
    c = 0
    for i, ch in enumerate(reversed(base)): c = _D[c][_P[(i + 1) % 8][int(ch)]]
    return str(_INV[c])

_LIC = r"[A-Z]{2}\d{2}(19|20)\d{2}\d{7}"
def clean_vehicle_no(s):
    v = re.sub(r"[\s-]", "", (s or "").upper())
    if not (re.fullmatch(r"[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}", v) or re.fullmatch(r"\d{2}BH\d{4}[A-Z]{2}", v)): raise Invalid("Enter a valid vehicle number, for example MH04AB1234")
    return v
def clean_licence(s):
    v = re.sub(r"[\s-]", "", (s or "").upper())
    if not re.fullmatch(_LIC, v): raise Invalid("Enter a valid driving licence number, for example MH0420110012345")
    return v
def clean_id(kind, s):
    v = re.sub(r"[\s-]", "", (s or "").upper())
    ok = {"Aadhaar": lambda x: re.fullmatch(r"[2-9]\d{11}", x) and verhoeff_ok(x), "PAN": lambda x: re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", x),
          "Voter ID": lambda x: re.fullmatch(r"[A-Z]{3}\d{7}", x), "Driving Licence": lambda x: re.fullmatch(_LIC, x)}.get(kind)
    if not ok: raise Invalid("Choose an ID type: " + ", ".join(ID_TYPES))
    if not ok(v): raise Invalid(f"Enter a valid {kind} number")
    return v

def image_bytes(data_url, max_bytes=500_000):
    """Accepts only real PNG / JPEG / WebP photos (checked by file signature, not by name)."""
    m = re.fullmatch(r"data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)", data_url or "")
    if not m: raise Invalid("Upload a PNG, JPEG or WebP photo")
    try: raw = base64.b64decode(m.group(2), validate=True)
    except Exception: raise Invalid("The image could not be read")
    if len(raw) > max_bytes: raise Invalid("The image is too large (500 KB maximum). Take a smaller photo")
    if not raw.startswith({"png": b"\x89PNG", "jpeg": b"\xff\xd8\xff", "webp": b"RIFF"}[m.group(1)]): raise Invalid("This file is not a real image")
    return raw
