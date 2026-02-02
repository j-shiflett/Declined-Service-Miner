import csv
import dataclasses
import datetime as dt
import os
import re
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Optional

from jinja2 import Template


MONEY_RE = re.compile(r"[^0-9.\-]")


def parse_money(v: Any) -> float:
  if v is None:
    return 0.0
  s = str(v).strip()
  if not s:
    return 0.0
  s = MONEY_RE.sub("", s)
  try:
    return float(s)
  except ValueError:
    return 0.0


def read_csv_rows(path: str) -> List[Dict[str, str]]:
  with open(path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    return [dict(r) for r in reader]


@dataclasses.dataclass
class Opportunity:
  ro_number: str
  ro_date: str
  advisor: Optional[str]
  vin: Optional[str]
  mileage: Optional[str]
  customer_name: Optional[str]
  phone: Optional[str]
  email: Optional[str]
  declined_total: float
  line_count: int
  top_categories: str


def analyze(ro_rows: List[Dict[str, str]], line_rows: List[Dict[str, str]]) -> List[Opportunity]:
  ro_by_number: Dict[str, Dict[str, str]] = {r.get("ro_number", "").strip(): r for r in ro_rows if r.get("ro_number")}

  lines_by_ro: Dict[str, List[Dict[str, str]]] = defaultdict(list)
  for r in line_rows:
    key = (r.get("ro_number") or "").strip()
    if key:
      lines_by_ro[key].append(r)

  out: List[Opportunity] = []

  for ro_number, ro in ro_by_number.items():
    lines = lines_by_ro.get(ro_number, [])
    if not lines:
      continue

    total = sum(parse_money(l.get("declined_amount")) for l in lines)
    if total <= 0:
      continue

    cats: Dict[str, float] = defaultdict(float)
    for l in lines:
      c = (l.get("declined_category") or "").strip() or "uncategorized"
      cats[c] += parse_money(l.get("declined_amount"))

    top_categories = "; ".join([k for k, _ in sorted(cats.items(), key=lambda kv: kv[1], reverse=True)[:3]])

    out.append(
      Opportunity(
        ro_number=ro_number,
        ro_date=(ro.get("ro_date") or "").strip(),
        advisor=(ro.get("advisor") or "").strip() or None,
        vin=(ro.get("vin") or "").strip() or None,
        mileage=(ro.get("mileage") or "").strip() or None,
        customer_name=(ro.get("customer_name") or "").strip() or None,
        phone=(ro.get("phone") or "").strip() or None,
        email=(ro.get("email") or "").strip() or None,
        declined_total=total,
        line_count=len(lines),
        top_categories=top_categories,
      )
    )

  out.sort(key=lambda o: o.declined_total, reverse=True)
  return out


def write_callback_csv(path: str, rows: List[Opportunity]) -> None:
  os.makedirs(os.path.dirname(path), exist_ok=True)
  with open(path, "w", newline="", encoding="utf-8") as f:
    fieldnames = [
      "ro_number",
      "ro_date",
      "advisor",
      "customer_name",
      "phone",
      "email",
      "declined_total",
      "line_count",
      "top_categories",
    ]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for r in rows:
      w.writerow(
        {
          "ro_number": r.ro_number,
          "ro_date": r.ro_date,
          "advisor": r.advisor or "",
          "customer_name": r.customer_name or "",
          "phone": r.phone or "",
          "email": r.email or "",
          "declined_total": f"{r.declined_total:.2f}",
          "line_count": r.line_count,
          "top_categories": r.top_categories,
        }
      )


def write_html_report(path: str, rows: List[Opportunity]) -> None:
  os.makedirs(os.path.dirname(path), exist_ok=True)
  tpl_path = os.path.join(os.path.dirname(__file__), "report_template.html.j2")
  with open(tpl_path, "r", encoding="utf-8") as f:
    tpl = Template(f.read())

  html = tpl.render(generated_at=dt.datetime.now(dt.timezone.utc).isoformat(), rows=rows[:200])
  with open(path, "w", encoding="utf-8") as f:
    f.write(html)
