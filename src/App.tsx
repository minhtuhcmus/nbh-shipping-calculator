import { useState } from 'react'
import { AddressInput } from './components/AddressInput'
import { FeeTable } from './components/FeeTable'
import { type ProviderRowData } from './components/ProviderRow'
import { getDistanceKm, type ResolvedAddress } from './lib/goong'
import { fetchGhnFee } from './lib/ghn'
import { fetchGhtkFee } from './lib/ghtk'
import { fetchAhamoveFee } from './lib/ahamove'
import { fetchLalamoveFee } from './lib/lalamove'
import { estimateGrabFee } from './lib/grabexpress'
import { estimateBeFee } from './lib/bedelivery'

type CalcState = 'idle' | 'loading' | 'done'

const LOADING_ROWS: ProviderRowData[] = [
  { provider: 'GHN', service: 'Express', eta: '1–2 ngày', fee: null, estimated: false, status: 'loading' },
  { provider: 'GHN', service: 'Standard', eta: '2–3 ngày', fee: null, estimated: false, status: 'loading' },
  { provider: 'GHTK', service: 'Economy', eta: '3–5 ngày', fee: null, estimated: false, status: 'loading' },
  { provider: 'Ahamove', service: 'Instant', eta: '2–4 giờ', fee: null, estimated: false, status: 'loading' },
  { provider: 'Lalamove', service: 'Motorbike', eta: 'Trong ngày', fee: null, estimated: false, status: 'loading' },
  { provider: 'Lalamove', service: 'Van', eta: 'Trong ngày', fee: null, estimated: false, status: 'loading' },
  { provider: 'GrabExpress', service: 'Express', eta: '2 giờ', fee: null, estimated: true, status: 'loading' },
  { provider: 'beDelivery', service: 'Express', eta: '2 giờ', fee: null, estimated: true, status: 'loading' },
]

export default function App() {
  const [from, setFrom] = useState<ResolvedAddress | null>(null)
  const [to, setTo] = useState<ResolvedAddress | null>(null)
  const [weight, setWeight] = useState(500)
  const [value, setValue] = useState(300000)
  const [calcState, setCalcState] = useState<CalcState>('idle')
  const [rows, setRows] = useState<ProviderRowData[]>([])

  const canCalculate = from !== null && to !== null

  async function calculate() {
    if (!from || !to) return
    setCalcState('loading')
    setRows(LOADING_ROWS)

    const timeout = (ms: number) =>
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))

    const race = <T,>(p: Promise<T>) => Promise.race([p, timeout(8000)])

    const results = await Promise.allSettled([
      race(fetchGhnFee(from, to, weight)),
      race(fetchGhtkFee(from, to, weight, value)),
      race(fetchAhamoveFee(from, to)),
      race(fetchLalamoveFee(from, to)),
      race(getDistanceKm(from, to)),
    ])

    const ghn = results[0].status === 'fulfilled' ? results[0].value : null
    const ghtkFee = results[1].status === 'fulfilled' ? results[1].value : null
    const ahamoveFee = results[2].status === 'fulfilled' ? results[2].value : null
    const lalamove = results[3].status === 'fulfilled' ? results[3].value : null
    const distKm = results[4].status === 'fulfilled' ? results[4].value : 0

    const newRows: ProviderRowData[] = [
      {
        provider: 'GHN',
        service: 'Express',
        eta: '1–2 ngày',
        fee: ghn?.express ?? null,
        estimated: false,
        status: ghn?.express != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'GHN',
        service: 'Standard',
        eta: '2–3 ngày',
        fee: ghn?.standard ?? null,
        estimated: false,
        status: ghn?.standard != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'GHTK',
        service: 'Economy',
        eta: '3–5 ngày',
        fee: ghtkFee,
        estimated: false,
        status: ghtkFee != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'Ahamove',
        service: 'Instant',
        eta: '2–4 giờ',
        fee: ahamoveFee,
        estimated: false,
        status: ahamoveFee != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'Lalamove',
        service: 'Motorbike',
        eta: 'Trong ngày',
        fee: lalamove?.motorcycle ?? null,
        estimated: false,
        status: lalamove?.motorcycle != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'Lalamove',
        service: 'Van',
        eta: 'Trong ngày',
        fee: lalamove?.van ?? null,
        estimated: false,
        status: lalamove?.van != null ? 'ok' : 'unavailable',
      },
      {
        provider: 'GrabExpress',
        service: 'Express',
        eta: '2 giờ',
        fee: estimateGrabFee(distKm),
        estimated: true,
        status: 'ok',
      },
      {
        provider: 'beDelivery',
        service: 'Express',
        eta: '2 giờ',
        fee: estimateBeFee(distKm),
        estimated: true,
        status: 'ok',
      },
    ]

    setRows(newRows)
    setCalcState('done')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">So sánh phí giao hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">GHN · GHTK · Ahamove · Lalamove · GrabExpress · beDelivery</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Address row */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <AddressInput label="Địa chỉ lấy hàng" placeholder="Nhập địa chỉ người gửi..." onSelect={setFrom} />
            <AddressInput label="Địa chỉ giao hàng" placeholder="Nhập địa chỉ người nhận..." onSelect={setTo} />
          </div>

          {/* Parcel details + button */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cân nặng (gram)
              </label>
              <input
                type="number"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Math.max(1, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị hàng (VND)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={value}
                onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={calculate}
              disabled={!canCalculate || calcState === 'loading'}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {calcState === 'loading' ? 'Đang tính...' : 'Tính phí'}
            </button>
          </div>
        </div>

        {/* Results */}
        {(calcState === 'loading' || calcState === 'done') && rows.length > 0 && (
          <FeeTable rows={rows} />
        )}
      </main>
    </div>
  )
}
