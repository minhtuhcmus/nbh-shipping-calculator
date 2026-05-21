import type { ResolvedAddress } from './goong'

const API_KEY = import.meta.env.VITE_LALAMOVE_API_KEY as string
const API_SECRET = import.meta.env.VITE_LALAMOVE_API_SECRET as string
const BASE = '/api/lalamove'

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function fetchQuote(
  from: ResolvedAddress,
  to: ResolvedAddress,
  serviceType: 'MOTORCYCLE' | 'VAN',
): Promise<number | null> {
  const timestamp = String(Date.now())
  const body = JSON.stringify({
    serviceType,
    language: 'vi_VN',
    stops: [
      { coordinates: { lat: String(from.lat), lng: String(from.lng) }, address: from.description },
      { coordinates: { lat: String(to.lat), lng: String(to.lng) }, address: to.description },
    ],
    item: { quantity: '1', weight: 'LESS_THAN_3_KG' },
  })

  const rawSignature = `POST\n/v3/quotations\n${timestamp}\n${body}`
  const signature = await hmacSha256(API_SECRET, rawSignature)
  const token = `${API_KEY}:${timestamp}:${signature}`

  const res = await fetch(`${BASE}/v3/quotations`, {
    method: 'POST',
    headers: {
      Authorization: `hmac ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  })
  const data = await res.json()
  const fee = data.data?.priceBreakdown?.totalExcludePriorityFee
  return fee != null ? Number(fee) : null
}

export interface LalamoveResult {
  motorcycle: number | null
  van: number | null
}

export async function fetchLalamoveFee(
  from: ResolvedAddress,
  to: ResolvedAddress,
): Promise<LalamoveResult> {
  const [motorcycle, van] = await Promise.all([
    fetchQuote(from, to, 'MOTORCYCLE').catch(() => null),
    fetchQuote(from, to, 'VAN').catch(() => null),
  ])
  return { motorcycle, van }
}
