import argparse
import os

from .analyze import analyze, read_csv_rows, write_callback_csv, write_html_report


def cmd_analyze(args: argparse.Namespace) -> int:
  ro_rows = read_csv_rows(args.ro_csv)
  line_rows = read_csv_rows(args.lines_csv)

  rows = analyze(ro_rows, line_rows)

  out_dir = args.out_dir
  os.makedirs(out_dir, exist_ok=True)

  callback_path = os.path.join(out_dir, "callback_list.csv")
  report_path = os.path.join(out_dir, "report.html")

  write_callback_csv(callback_path, rows)
  write_html_report(report_path, rows)

  print(f"Wrote: {callback_path}")
  print(f"Wrote: {report_path}")
  print(f"Rows: {len(rows)}")
  return 0


def main() -> None:
  p = argparse.ArgumentParser(prog="dsm", description="Declined Service Miner")
  sub = p.add_subparsers(dest="cmd", required=True)

  a = sub.add_parser("analyze", help="Analyze RO + declined lines CSV exports")
  a.add_argument("--ro-csv", required=True, help="RO headers CSV")
  a.add_argument("--lines-csv", required=True, help="Declined line items CSV")
  a.add_argument("--out-dir", default="out", help="Output directory")
  a.set_defaults(func=cmd_analyze)

  args = p.parse_args()
  raise SystemExit(args.func(args))
