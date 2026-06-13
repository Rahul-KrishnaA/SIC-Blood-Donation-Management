import pytest
import file_io.csv_handler as csv_handler
from models.donor import Donor


@pytest.fixture(autouse=True)
def patch_donors_file(tmp_path, monkeypatch):
    monkeypatch.setattr(csv_handler, "DONORS_FILE", str(tmp_path / "donors.csv"))


def test_save_and_load_donors():
    donors = [Donor("Alice", 25, "A+", "Chennai"), Donor("Bob", 30, "O-", "Mumbai")]
    csv_handler.save_donors(donors)
    loaded = csv_handler.load_donors()
    assert len(loaded) == 2
    names = {d.name for d in loaded}
    assert "Alice" in names
    assert "Bob" in names


def test_load_donors_returns_empty_when_file_missing():
    result = csv_handler.load_donors()
    assert result == []


def test_save_donor_preserves_all_fields():
    donor = Donor("Carol", 28, "B-", "Delhi", "2026-01-15")
    csv_handler.save_donors([donor])
    loaded = csv_handler.load_donors()
    d = loaded[0]
    assert d.donor_id == donor.donor_id
    assert d.name == "Carol"
    assert d.age == 28
    assert d.blood_group == "B-"
    assert d.city == "delhi"
    assert d.last_donation_date == "2026-01-15"
