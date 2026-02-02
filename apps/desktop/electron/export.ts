import fs from 'fs'
import path from 'path'

export type Opportunity = {
  ro_number: string
  ro_date: string
  advisor?: string
  customer_name?: string
  phone?: string
  email?: string
  declined_total: number
  line_count: number
  top_categories: string
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = typeof v === 'string' ? v : String(v)
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (/[\n",]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function opportunitiesToCsv(rows: Opportunity[]): string {
  const cols = [
    'ro_number',
    'ro_date',
    'advisor',
    'customer_name',
    'phone',
    'email',
    'declined_total',
    'line_count',
    'top_categories'
  ]
  const lines: string[] = []
  lines.push(cols.join(','))
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.ro_number),
        csvEscape(r.ro_date),
        csvEscape(r.advisor ?? ''),
        csvEscape(r.customer_name ?? ''),
        csvEscape(r.phone ?? ''),
        csvEscape(r.email ?? ''),
        csvEscape(r.declined_total.toFixed(2)),
        csvEscape(r.line_count),
        csvEscape(r.top_categories ?? '')
      ].join(',')
    )
  }
  return lines.join('\n') + '\n'
}

export function opportunitiesToHtml(rows: Opportunity[], meta: { dealerName: string; generatedAt: string }): string {
  const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const tr = rows
    .slice(0, 500)
    .map(
      (r) => `<tr>
  <td><code>${esc(r.ro_number)}</code></td>
  <td>${esc(r.ro_date)}</td>
  <td>${esc(r.advisor)}</td>
  <td>${esc(r.customer_name)}</td>
  <td>${esc(r.phone)}</td>
  <td>${esc(r.email)}</td>
  <td>$${esc(r.declined_total.toFixed(2))}</td>
  <td>${esc(r.line_count)}</td>
  <td>${esc(r.top_categories)}</td>
</tr>`
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Declined Service Miner Report</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background: #f6f6f6; text-align: left; }
    code { background: #f1f1f1; padding: 2px 4px; }
  </style>
</head>
<body>
  <h2>Declined Service Miner</h2>
  <p><strong>Dealer:</strong> ${esc(meta.dealerName)}</p>
  <p><strong>Generated:</strong> <code>${esc(meta.generatedAt)}</code></p>

  <h3>Top opportunities</h3>
  <table>
    <thead>
      <tr>
        <th>RO #</th>
        <th>Date</th>
        <th>Advisor</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Declined $</th>
        <th>Lines</th>
        <th>Categories</th>
      </tr>
    </thead>
    <tbody>
      ${tr}
    </tbody>
  </table>

  <p style="color:#666; font-size: 12px; margin-top: 16px">
    Generated locally. Handle customer data carefully.
  </p>
</body>
</html>`
}

export function writeRunFiles(opts: {
  dir: string
  rows: Opportunity[]
  dealerName: string
}) {
  fs.mkdirSync(opts.dir, { recursive: true })
  const generatedAt = new Date().toISOString()
  fs.writeFileSync(path.join(opts.dir, 'callback_list.csv'), opportunitiesToCsv(opts.rows), 'utf-8')
  fs.writeFileSync(path.join(opts.dir, 'report.html'), opportunitiesToHtml(opts.rows, { dealerName: opts.dealerName, generatedAt }), 'utf-8')
  fs.writeFileSync(path.join(opts.dir, 'meta.json'), JSON.stringify({ dealerName: opts.dealerName, generatedAt }, null, 2) + '\n', 'utf-8')
}
