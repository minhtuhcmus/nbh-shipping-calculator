import { useEffect, useState } from 'react'
import { AddressInput } from './components/AddressInput'
import { autocomplete, resolvePlaceId, getDistanceKm, type ResolvedAddress } from './lib/goong'

const FROM_ADDRESS_QUERY = '45 Đường Số 29, Khu phố 1, An Khánh, Hồ Chí Minh 70000, Việt Nam'
const DEFAULT_BASE_FEE = 20000
const DEFAULT_PER_KM_FEE = 5000

type CalcState = 'idle' | 'loading' | 'done'

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + ' ₫'
}

export default function App() {
  const [from, setFrom] = useState<ResolvedAddress | null>(null)
  const [fromError, setFromError] = useState('')
  const [to, setTo] = useState<ResolvedAddress | null>(null)
  const [baseFee, setBaseFee] = useState(DEFAULT_BASE_FEE)
  const [perKmFee, setPerKmFee] = useState(DEFAULT_PER_KM_FEE)
  const [calcState, setCalcState] = useState<CalcState>('idle')
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [fee, setFee] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function resolveFrom() {
      try {
        const suggestions = await autocomplete(FROM_ADDRESS_QUERY)
        if (suggestions.length === 0) throw new Error('no suggestions')
        const resolved = await resolvePlaceId(suggestions[0].place_id, suggestions[0].description)
        if (!cancelled) setFrom(resolved)
      } catch {
        if (!cancelled) setFromError('Không thể xác định địa chỉ lấy hàng cố định')
      }
    }
    resolveFrom()
    return () => {
      cancelled = true
    }
  }, [])

  const canCalculate = from !== null && to !== null

  async function calculate() {
    if (!from || !to) return
    setCalcState('loading')
    setError('')
    try {
      const km = await getDistanceKm(from, to)
      setDistanceKm(km)
      setFee(Math.round(baseFee + km * perKmFee))
      setCalcState('done')
    } catch {
      setError('Không thể tính khoảng cách giữa hai địa chỉ')
      setCalcState('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Tính phí giao hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Phí ship = Phí cơ bản + (Số km × Đơn giá/km)</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ lấy hàng</label>
              <input
                type="text"
                value={from?.description ?? FROM_ADDRESS_QUERY}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-100 text-gray-500"
              />
              {fromError && <p className="text-xs text-red-500 mt-1">{fromError}</p>}
            </div>
            <AddressInput label="Địa chỉ giao hàng" placeholder="Nhập địa chỉ người nhận..." onSelect={setTo} />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phí cơ bản (VND)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={baseFee}
                onChange={(e) => setBaseFee(Math.max(0, Number(e.target.value)))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá mỗi km (VND)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={perKmFee}
                onChange={(e) => setPerKmFee(Math.max(0, Number(e.target.value)))}
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

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {calcState === 'done' && fee !== null && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-1">
            <p className="text-sm text-gray-500">Khoảng cách: {distanceKm?.toFixed(1)} km</p>
            <p className="text-lg font-semibold text-gray-900">Phí ship: {formatVnd(fee)}</p>
          </div>
        )}
      </main>
    </div>
  )
}
