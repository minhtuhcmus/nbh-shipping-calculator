import type { ResolvedAddress } from './goong'

const TOKEN = import.meta.env.VITE_AHAMOVE_TOKEN as string
const BASE = '/api/ahamove/v1'

export async function fetchAhamoveFee(
  from: ResolvedAddress,
  to: ResolvedAddress,
): Promise<number | null> {
  const path = JSON.stringify([
    { address: from.description, lat: from.lat, lng: from.lng },
    { address: to.description, lat: to.lat, lng: to.lng },
  ])
  const params = new URLSearchParams({
    token: TOKEN,
    order_time: String(Math.floor(Date.now() / 1000)),
    path,
    service_id: 'SGN-EXPRESS',
  })
  const res = await fetch(`${BASE}/order/estimated_fee?${params}`)
  const data = await res.json()
  return data.total_price ?? null
}
