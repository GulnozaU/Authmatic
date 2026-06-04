"""EXECUTE verb — Daytona sandbox.

The agent writes Python on the fly to extract structured fields from the
prescription PDF. Running it in a Daytona sandbox means we can call
arbitrary LLM-generated code without it touching our agent host.

When DEMO_FIXTURE_MODE is true we skip the sandbox and use a deterministic
parser locally so the demo never depends on the network.
"""

from __future__ import annotations

import asyncio
import io
import json

from ..settings import get_settings


async def ping() -> dict:
    s = get_settings()
    if s.demo_fixture_mode:
        return {"ok": True, "mode": "fixture"}
    if not s.daytona_api_key:
        return {"ok": False, "error": "DAYTONA_API_KEY not set"}
    # We don't spin up a sandbox just to ping; check SDK import.
    try:
        from daytona_sdk import Daytona  # noqa: F401
        return {"ok": True}
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": str(e)}


async def parse_prescription(pdf_bytes: bytes) -> dict:
    """Returns {drug_name, drug_ndc, dose, icd10, patient_field_hashes}."""
    s = get_settings()

    if s.demo_fixture_mode:
        return _local_parse(pdf_bytes)

    return await _sandbox_parse(pdf_bytes)


async def _sandbox_parse(pdf_bytes: bytes) -> dict:
    """Run pdfplumber inside Daytona on a snapshot pre-baked with deps."""
    s = get_settings()

    def _run() -> dict:
        from daytona_sdk import CreateSandboxParams, Daytona

        client = Daytona(api_key=s.daytona_api_key)
        sandbox = client.create(CreateSandboxParams(snapshot=s.daytona_snapshot_id))
        try:
            sandbox.fs.upload_file("/tmp/rx.pdf", pdf_bytes)
            result = sandbox.process.exec(_PDF_PARSE_SCRIPT)
            return json.loads(result.stdout.strip())
        finally:
            sandbox.delete()

    return await asyncio.to_thread(_run)


_PDF_PARSE_SCRIPT = r"""python -c '
import json, re
import pdfplumber

with pdfplumber.open("/tmp/rx.pdf") as pdf:
    text = "\n".join((p.extract_text() or "") for p in pdf.pages)

out = {}

# Deterministic extractors. The agent could LLM these; for the demo
# we keep them rule-based so a bad LLM run cannot kill the demo.
if "KEY FIELDS SUMMARY" in text:
    # Letterhead Rx with a PA key-fields summary table.
    m = re.search(r"Requested Drug\s+(\S+)", text)
    if m: out["drug_name"] = m.group(1).strip(",.")
    m = re.search(r"Drug NDC(?:\s*\(approx\))?\s+(\d[\d-]+)", text)
    if m: out["drug_ndc"] = m.group(1)
    m = re.search(r"Primary Diagnosis \(ICD-?10\)\s+([A-Z]\d{2}(?:\.\d+)?)", text)
    if m: out["icd10"] = m.group(1)
    sig_m = re.search(r"Sig:\s*([^\n]+(?:\n[^\n]+)*?)(?:\n[A-Z][a-z]|\n\s*$|$)", text)
    if sig_m:
        sig = " ".join(sig_m.group(1).split())
        dose_pat = re.compile(
            r"([\d.]+\s*mg)(?=\b[^.]{0,80}?\b("
            r"once weekly|weekly|daily|BID|TID|QID|every\s+\d+\s+weeks?"
            r"))",
            re.IGNORECASE,
        )
        matches = dose_pat.findall(sig)
        if matches:
            d, f = matches[-1]
            out["dose"] = "%s %s" % (d.strip(), f.lower())
        else:
            out["dose"] = sig[:80]
else:
    # Simple labeled-field Rx (Drug:/NDC:/Dose:/ICD-10:).
    m = re.search(r"(?i)drug[: ]+(\S+(?: \S+)?)", text)
    if m: out["drug_name"] = m.group(1).strip(",.")
    m = re.search(r"NDC[: ]+(\d{4,5}-\d{3,4}-\d{1,2})", text)
    if m: out["drug_ndc"] = m.group(1)
    m = re.search(r"(?i)dose[: ]+([\d.]+\s*\w+)", text)
    if m: out["dose"] = m.group(1)
    m = re.search(r"ICD-?10[: ]+([A-Z]\d{2}(?:\.\d+)?)", text)
    if m: out["icd10"] = m.group(1)

out["raw_text"] = text[:2000]
print(json.dumps(out))
'"""


def _local_parse(pdf_bytes: bytes) -> dict:
    """Best-effort local parse for fixture mode / when Daytona is red.

    Tries two formats:
      1. Letterhead Rx with a "PRIOR AUTHORIZATION — KEY FIELDS SUMMARY"
         table (rx-ozempic-martinez, rx-humira-thompson).
      2. Simple labeled fields Drug:/NDC:/Dose:/ICD-10: (rx-lisinopril,
         rx-metformin from gen_demo_pdfs.py).
    """
    try:
        import pdfplumber  # type: ignore
    except ImportError:
        # If pdfplumber isn't installed locally either, use a stub keyed
        # on PDF size so two different fixture PDFs return different data.
        return _stub_for_size(len(pdf_bytes))

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        text = "\n".join((p.extract_text() or "") for p in pdf.pages)

    fields = _extract_letterhead(text) or _extract_simple(text)
    if not fields:
        return _stub_for_size(len(pdf_bytes))

    fields["raw_text"] = text[:2000]
    return fields


def _extract_letterhead(text: str) -> dict:
    """Pull fields from the 'PRIOR AUTHORIZATION — KEY FIELDS SUMMARY' table.

    Returns {} if the table isn't present.
    """
    import re

    if "KEY FIELDS SUMMARY" not in text:
        return {}

    out: dict = {}
    patterns = [
        ("drug_name", r"Requested Drug\s+(\S+)"),
        ("drug_ndc", r"Drug NDC(?:\s*\(approx\))?\s+(\d[\d-]+)"),
        ("icd10", r"Primary Diagnosis \(ICD-?10\)\s+([A-Z]\d{2}(?:\.\d+)?)"),
        ("member_id", r"Member ID:?\s+(\S+)"),
        ("patient_name", r"Patient Name\s+(.+?)(?:\s{2,}|\n|$)"),
        # SSN is an over-disclosure field: it has no place on a PA submission.
        # If the parser picks it up, Opsera VERIFY will catch it downstream.
        ("patient_ssn", r"SSN:?\s+(\d{3}-\d{2}-\d{4}|\d{9})"),
    ]
    for key, pat in patterns:
        m = re.search(pat, text)
        if m:
            out[key] = m.group(1).strip(",.")

    # Dose: pull the maintenance dose + frequency from the Sig: directive.
    # Sig: lines often describe a titration (e.g. start at 0.25 mg weekly,
    # then 0.5 mg weekly). We want the LAST dose+frequency pairing — that's
    # the maintenance dose that goes on the PA form.
    sig_m = re.search(r"Sig:\s*([^\n]+(?:\n[^\n]+)*?)(?:\n[A-Z][a-z]|\n\s*$|$)", text)
    if sig_m:
        sig = " ".join(sig_m.group(1).split())
        # Lookahead on the frequency so dose positions don't get consumed.
        # Without this, Humira's "80mg ... every 2 weeks" wins over the real
        # maintenance "40mg every 2 weeks" because the first match swallows
        # the freq token.
        dose_pat = re.compile(
            r"([\d.]+\s*mg)(?=\b[^.]{0,80}?\b("
            r"once weekly|weekly|daily|BID|TID|QID|every\s+\d+\s+weeks?"
            r"))",
            re.IGNORECASE,
        )
        matches = dose_pat.findall(sig)
        if matches:
            d, f = matches[-1]
            out["dose"] = f"{d.strip()} {f.lower()}"
        else:
            out["dose"] = sig[:80]

    return out


def _extract_simple(text: str) -> dict:
    """Match the labeled-field format produced by gen_demo_pdfs.py."""
    import re

    out: dict = {}
    patterns = [
        ("drug_name", r"(?i)drug[: ]+(\S+(?: \S+)?)"),
        ("drug_ndc", r"NDC[: ]+(\d{4,5}-\d{3,4}-\d{1,2})"),
        ("dose", r"(?i)dose[: ]+([\d.]+\s*\w+)"),
        ("icd10", r"ICD-?10[: ]+([A-Z]\d{2}(?:\.\d+)?)"),
        ("member_id", r"Member ID:\s+(\S+)"),
        ("patient_name", r"Name:\s+(.+?)(?:\n|$)"),
        ("patient_ssn", r"SSN:?\s+(\d{3}-\d{2}-\d{4}|\d{9})"),
    ]
    for key, pat in patterns:
        m = re.search(pat, text)
        if m:
            out[key] = m.group(1).strip(",.")
    return out


def _stub_for_size(size: int) -> dict:
    return {
        "drug_name": "Lisinopril" if size % 2 == 0 else "Metformin",
        "drug_ndc": "00093-5050-01" if size % 2 == 0 else "00093-1059-01",
        "dose": "10mg daily" if size % 2 == 0 else "500mg BID",
        "icd10": "I10" if size % 2 == 0 else "E11.9",
        "raw_text": f"<stub for {size}-byte PDF>",
    }
