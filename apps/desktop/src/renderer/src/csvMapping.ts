export type Mapping = Record<string, string>

export function headersOf(csvText: string): string[] {
  const firstLine = csvText.split(/\r?\n/).find((l) => l.trim().length)
  if (!firstLine) return []
  // naive split - good enough for header row in most exports
  return firstLine
    .split(',')
    .map((s) => s.trim().replace(/^"|"$/g, ''))
    .filter(Boolean)
}

export function applyMapping(rows: any[], mapping: Mapping): any[] {
  // mapping: canonicalField -> csvHeaderName
  return rows.map((r) => {
    const out: any = {}
    for (const [canon, src] of Object.entries(mapping)) {
      out[canon] = r[src]
    }
    return out
  })
}

export function missingRequired(mapping: Mapping, required: string[]): string[] {
  const missing: string[] = []
  for (const k of required) {
    if (!mapping[k]) missing.push(k)
  }
  return missing
}
