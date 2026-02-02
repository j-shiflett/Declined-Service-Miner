export {}

declare global {
  interface Window {
    dsm: {
      getBaseDir: () => Promise<string>
      listDealers: () => Promise<Array<{ id: number; name: string; createdAt: string }>>
      createDealer: (name: string) => Promise<{ id: number; name: string; createdAt: string }>

      saveRun: (dealerId: number, rows: any[]) => Promise<{ runDir: string; callbackCsv: string; reportHtml: string }>

      getOutcome: (dealerId: number, roNumber: string) => Promise<any>
      setOutcome: (dealerId: number, roNumber: string, status: string, notes?: string, nextFollowUp?: string) => Promise<any>

      getMapping: (dealerId: number, kind: 'ro' | 'lines' | 'combined') => Promise<Record<string, string> | null>
      setMapping: (dealerId: number, kind: 'ro' | 'lines' | 'combined', mapping: Record<string, string>) => Promise<Record<string, string> | null>
    }
  }
}
