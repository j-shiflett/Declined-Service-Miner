<script setup lang="ts">
import { analyze, parseCsv, type DeclinedLine, type Opportunity, type RoHeader } from '@dsm/core'
import { onMounted, ref } from 'vue'

const roCsv = ref<string>('')
const linesCsv = ref<string>('')
const combinedCsv = ref<string>('')

type Dealer = { id: number; name: string; createdAt: string }

const baseDir = ref<string>('')
const dealers = ref<Dealer[]>([])
const dealerName = ref('')
const selectedDealerId = ref<number | null>(null)

const results = ref<Opportunity[] | null>(null)
const error = ref<string | null>(null)

function onFile(e: Event, set: (v: string) => void) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => set(String(reader.result ?? ''))
  reader.readAsText(file)
}

async function refreshDealers() {
  dealers.value = await window.dsm.listDealers()
  if (dealers.value.length && selectedDealerId.value === null) {
    selectedDealerId.value = dealers.value[0].id
  }
}

async function createDealer() {
  error.value = null
  try {
    const d = await window.dsm.createDealer(dealerName.value)
    dealerName.value = ''
    await refreshDealers()
    selectedDealerId.value = d.id
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
}

onMounted(async () => {
  try {
    baseDir.value = await window.dsm.getBaseDir()
    await refreshDealers()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})

function run() {
  error.value = null
  results.value = null
  try {
    let roRows: RoHeader[] = []
    let lineRows: DeclinedLine[] = []

    if (combinedCsv.value.trim()) {
      // naive combined mode: require columns for both
      const rows = parseCsv<any>(combinedCsv.value)
      roRows = rows.map((r) => ({
        ro_number: r.ro_number,
        ro_date: r.ro_date,
        advisor: r.advisor,
        vin: r.vin,
        mileage: r.mileage,
        customer_name: r.customer_name,
        phone: r.phone,
        email: r.email,
      }))
      lineRows = rows.map((r) => ({
        ro_number: r.ro_number,
        line_desc: r.line_desc,
        declined_amount: r.declined_amount,
        declined_category: r.declined_category,
      }))
    } else {
      if (!roCsv.value.trim() || !linesCsv.value.trim()) {
        throw new Error('Provide either a combined CSV, or both RO headers + declined lines CSV files.')
      }
      roRows = parseCsv<RoHeader>(roCsv.value)
      lineRows = parseCsv<DeclinedLine>(linesCsv.value)
    }

    results.value = analyze(roRows, lineRows)
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
}
</script>

<template>
  <div style="padding: 18px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
    <h2 style="margin: 0">Declined Service Miner</h2>
    <p style="color:#666; margin-top: 6px">Import RO exports and generate a prioritized callback list.</p>

    <div style="margin-top: 12px; border: 1px solid #ddd; padding: 12px">
      <h3 style="margin-top:0">Dealership setup</h3>
      <div style="display:flex; gap: 12px; flex-wrap: wrap; align-items: center">
        <div>
          <div style="font-size: 12px; color:#666">Local data folder</div>
          <code>{{ baseDir || '(loading...)' }}</code>
        </div>

        <div style="flex: 1"></div>

        <label>
          Dealership:
          <select v-model.number="selectedDealerId">
            <option v-for="d in dealers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </label>

        <button @click="refreshDealers">Refresh</button>
      </div>

      <div style="display:flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap">
        <input v-model="dealerName" placeholder="Add new dealership name" style="min-width: 260px" />
        <button @click="createDealer" :disabled="!dealerName.trim()">Add dealership</button>
      </div>

      <p v-if="!dealers.length" style="color:#c00; margin-top: 10px">
        No dealerships yet. Add one above to get started.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px">
      <div style="border: 1px solid #ddd; padding: 12px">
        <h3>Option A: Two files</h3>
        <div>
          <label>RO headers CSV: <input type="file" accept=".csv" @change="(e) => onFile(e, (v) => (roCsv.value = v))" /></label>
        </div>
        <div style="margin-top: 8px">
          <label>Declined lines CSV: <input type="file" accept=".csv" @change="(e) => onFile(e, (v) => (linesCsv.value = v))" /></label>
        </div>
      </div>

      <div style="border: 1px solid #ddd; padding: 12px">
        <h3>Option B: Combined file</h3>
        <div>
          <label>Combined CSV: <input type="file" accept=".csv" @change="(e) => onFile(e, (v) => (combinedCsv.value = v))" /></label>
        </div>
        <p style="color:#666; font-size: 12px; margin-top: 8px">
          Combined CSV must include both header fields (ro_number, ro_date) and line fields (line_desc, declined_amount).
        </p>
      </div>
    </div>

    <div style="margin-top: 12px">
      <button @click="run" :disabled="!selectedDealerId">Run</button>
    </div>

    <p v-if="error" style="color:#c00">{{ error }}</p>

    <div v-if="results" style="margin-top: 16px">
      <h3>Top opportunities</h3>
      <table style="border-collapse: collapse; width: 100%">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding: 6px">RO #</th>
            <th style="border:1px solid #ddd; padding: 6px">Date</th>
            <th style="border:1px solid #ddd; padding: 6px">Advisor</th>
            <th style="border:1px solid #ddd; padding: 6px">Customer</th>
            <th style="border:1px solid #ddd; padding: 6px">Phone</th>
            <th style="border:1px solid #ddd; padding: 6px">Declined $</th>
            <th style="border:1px solid #ddd; padding: 6px">Categories</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in results.slice(0, 200)" :key="r.ro_number">
            <td style="border:1px solid #ddd; padding: 6px"><code>{{ r.ro_number }}</code></td>
            <td style="border:1px solid #ddd; padding: 6px">{{ r.ro_date }}</td>
            <td style="border:1px solid #ddd; padding: 6px">{{ r.advisor || '' }}</td>
            <td style="border:1px solid #ddd; padding: 6px">{{ r.customer_name || '' }}</td>
            <td style="border:1px solid #ddd; padding: 6px">{{ r.phone || '' }}</td>
            <td style="border:1px solid #ddd; padding: 6px">${{ r.declined_total.toFixed(2) }}</td>
            <td style="border:1px solid #ddd; padding: 6px">{{ r.top_categories }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
