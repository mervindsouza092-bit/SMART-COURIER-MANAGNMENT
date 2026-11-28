import pytest
from app.validators import *

def test_aadhaar_checksum():
    n = "23456789012"; ok = n + verhoeff_check_digit(n)
    assert verhoeff_ok(ok) and not verhoeff_ok(ok[:-1] + str((int(ok[-1]) + 1) % 10))
    assert clean_id("Aadhaar", ok) == ok
    with pytest.raises(Invalid): clean_id("Aadhaar", "123456789012")

@pytest.mark.parametrize("fn,good,bad", [(clean_vehicle_no, "mh 04-ab 1234", "12345"), (clean_licence, "MH04 2011 0012345", "MH04"), ])
def test_formats(fn, good, bad):
    assert fn(good); 
    with pytest.raises(Invalid): fn(bad)

def test_pan_phone_password():
    assert clean_id("PAN", "abcde1234f") == "ABCDE1234F"
    assert norm_phone("98765 43210") == "+919876543210" and norm_phone("12345") is None
    password_ok("Strong1234")
    for bad in ("short1A", "alllowercase1", "NoDigitsHere"):
        with pytest.raises(Invalid): password_ok(bad)

def test_images_must_be_real():
    assert image_bytes("data:image/png;base64,iVBORw0KGgo=")
    for bad in ("data:text/html;base64,PHA+", "data:image/png;base64,AAAA", "nonsense"):
        with pytest.raises(Invalid): image_bytes(bad)
