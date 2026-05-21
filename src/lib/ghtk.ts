import type { ResolvedAddress } from './goong'

const TOKEN = import.meta.env.VITE_GHTK_TOKEN as string
const BASE = '/api/ghtk/services/shipment'

export async function fetchGhtkFee(
  from: ResolvedAddress,
  to: ResolvedAddress,
  weightGrams: number,
  valuVnd: number,
): Promise<number | null> {
  const params = new URLSearchParams({
    token: TOKEN,
    pick_province: from.province,
    pick_district: from.district,
    province: to.province,
    district: to.district,
    weight: String(weightGrams),
    value: String(valuVnd),
    transport: 'road',
  })
  const res = await fetch(`${BASE}/fee?${params}`)
  const data = await res.json()
  return data.fee?.ship_fee_only ?? null
}
