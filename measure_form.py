#!/usr/bin/env python3
"""Lists every blank (underscores) and checkbox on a court form PDF with its position,
to help re-measure the field map when the court revises Form 4-17a.

    pip install pdfplumber
    python3 scripts/measure_form.py forms/4-17a_2026-01.pdf

Output columns: page, top, x0, x1, text  (points; top measured from the top of the page)
Copy the values into a new forms/<form>_<revision>.map.json.
"""
import sys
import pdfplumber

path = sys.argv[1] if len(sys.argv) > 1 else 'forms/4-17a_2026-01.pdf'
with pdfplumber.open(path) as pdf:
    for pi, page in enumerate(pdf.pages):
        for w in page.extract_words():
            t = w['text']
            if '__' in t or t in ('□', '☐'):
                print(f"{pi}\t{w['top']:.1f}\t{w['x0']:.1f}\t{w['x1']:.1f}\t{t[:40]}")
