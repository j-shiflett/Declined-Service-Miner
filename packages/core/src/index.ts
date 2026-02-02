import Papa from 'papaparse'

export type RoHeader = {
  ro_number: string
  ro_date: string
  advisor?: string
  vin?: string
  mileage?: string
  customer_name?: string
  phone?: string
  email?: string
}

export type DeclinedLine = {
  ro_number: string
  line_desc: string
  declined_amount: string
  declined_category?: string
}

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

const MONEY_RE = /[^0-9.\-]/g

export function parseMoney(v: unknown): number {
  if (v === null || v === undefined) return 0
  const s0 = String(v).trim()
  if (!s0) return 0
  const s = s0.replace(MONEY_RE, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function parseCsv<T extends Record<string, any>>(csvText: string): T[] {
  const res = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  if (res.errors?.length) {
    throw new Error(res.errors[0].message)
  }
  return (res.data as any[]).map((r) => {
    const out: any = {}
    for (const [k, v] of Object.entries(r)) out[String(k).trim()] = typeof v === 'string' ? v.trim() : v
    return out
  }) as T[]
}

export function analyze(roRows: RoHeader[], lineRows: DeclinedLine[]): Opportunity[] {
  const roByNumber = new Map<string, RoHeader>()
  for (const r of roRows) {
    const key = (r.ro_number ?? '').trim()
    if (key) roByNumber.set(key, r)
  }

  const linesByRo = new Map<string, DeclinedLine[]>()
  for (const l of lineRows) {
    const key = (l.ro_number ?? '').trim()
    if (!key) continue
    const arr = linesByRo.get(key) ?? []
    arr.push(l)
    linesByRo.set(key, arr)
  }

  const out: Opportunity[] = []

  for (const [roNumber, ro] of roByNumber.entries()) {
    const lines = linesByRo.get(roNumber) ?? []
    if (!lines.length) continue

    const total = lines.reduce((sum, l) => sum + parseMoney(l.declined_amount), 0)
    if (total <= 0) continue

    const cats = new Map<string, number>()
    for (const l of lines) {
      const cat = (l.declined_category ?? '').trim() || 'uncategorized'
      cats.set(cat, (cats.get(cat) ?? 0) + parseMoney(l.declined_amount))
    }

    const topCategories = [...cats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k)
      .join('; ')

    out.push({
      ro_number: roNumber,
      ro_date: (ro.ro_date ?? '').trim(),
      advisor: ro.advisor?.trim() || undefined,
      customer_name: ro.customer_name?.trim() || undefined,
      phone: ro.phone?.trim() || undefined,
      email: ro.email?.trim() || undefined,
      declined_total: total,
      line_count: lines.length,
      top_categories: topCategories,
    })
  }

  out.sort((a, b) => b.declined_total - a.declined_total)
  return out
}
