export {}

declare global {
  interface Window {
    dsm: {
      getBaseDir: () => Promise<string>
      listDealers: () => Promise<Array<{ id: number; name: string; createdAt: string }>>
      createDealer: (name: string) => Promise<{ id: number; name: string; createdAt: string }>
    }
  }
}
