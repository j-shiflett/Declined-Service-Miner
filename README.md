# Declined Service Miner (Open Source)

A dead-simple **dealership data mining** tool that turns **declined service** exports into a prioritized callback list.

- Input: CSV exports (RO headers + declined line items)
- Output: callback list CSV + a lightweight HTML report
- Designed so **RO + declined lines are required**, and **phone/email are optional**.

Keywords: declined service, service drive, RO analysis, dealership data mining, service advisor, retention.

## Why

Declined services are often “free money left on the table”. This tool helps a store:
- identify the biggest opportunities
- prioritize callbacks
- standardize follow-up

## Quick start

## Desktop app (Windows release, Mac dev)

This repo includes a Vue + Electron desktop app intended for **non-technical** dealership users.

Run it in dev:

```bash
pnpm install
pnpm --filter @dsm/desktop dev
```

Build a Windows installer (later):

```bash
pnpm --filter @dsm/desktop dist
```


### 1) Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Run (two-file mode)

```bash
# after: pip install -e .

dsm analyze \
  --ro-csv samples/ro_headers.sample.csv \
  --lines-csv samples/declined_lines.sample.csv \
  --out-dir out
```

Alternative:

```bash
python -m dsm analyze \
  --ro-csv samples/ro_headers.sample.csv \
  --lines-csv samples/declined_lines.sample.csv \
  --out-dir out
```

### 3) Outputs

- `out/callback_list.csv`
- `out/report.html`

## CSV format

See:
- `docs/CSV_FORMAT.md`
- `samples/ro_headers.sample.csv`
- `samples/declined_lines.sample.csv`

## Roadmap

- Add outcome tracking (attempts, reached, scheduled)
- Add category/safety weighting
- Add simple web UI

## License

MIT
