import type { ResolvedAddress } from './goong'

const TOKEN = import.meta.env.VITE_GHN_TOKEN as string
const SHOP_ID = import.meta.env.VITE_GHN_SHOP_ID as string
const BASE = '/api/ghn/shiip/public-api'

interface GhnDistrict {
  DistrictID: number
  DistrictName: string
  ProvinceID: number
}

interface GhnWard {
  WardCode: string
  WardName: string
}

const districtCache = new Map<string, GhnDistrict[]>()
const wardCache = new Map<number, GhnWard[]>()

async function getDistricts(): Promise<GhnDistrict[]> {
  if (districtCache.has('all')) return districtCache.get('all')!
  const res = await fetch(`${BASE}/master-data/district`, {
    headers: { Token: TOKEN },
  })
  const data = await res.json()
  const list: GhnDistrict[] = data.data ?? []
  districtCache.set('all', list)
  return list
}

async function getWards(districtId: number): Promise<GhnWard[]> {
  if (wardCache.has(districtId)) return wardCache.get(districtId)!
  const res = await fetch(`${BASE}/master-data/ward?district_id=${districtId}`, {
    headers: { Token: TOKEN },
  })
  const data = await res.json()
  const list: GhnWard[] = data.data ?? []
  wardCache.set(districtId, list)
  return list
}

function normalize(s: string) {
  return s.toLowerCase().trim()
}

async function resolveGhnCodes(addr: ResolvedAddress): Promise<{
  districtId: number
  wardCode: string
} | null> {
  const districts = await getDistricts()
  const district = districts.find(
    (d) =>
      normalize(d.DistrictName).includes(normalize(addr.district)) ||
      normalize(addr.district).includes(normalize(d.DistrictName)),
  )
  if (!district) return null

  const wards = await getWards(district.DistrictID)
  const ward = wards.find(
    (w) =>
      normalize(w.WardName).includes(normalize(addr.ward)) ||
      normalize(addr.ward).includes(normalize(w.WardName)),
  )
  if (!ward) return null

  return { districtId: district.DistrictID, wardCode: ward.WardCode }
}

export interface GhnResult {
  express: number | null
  standard: number | null
}

export async function fetchGhnFee(
  from: ResolvedAddress,
  to: ResolvedAddress,
  weightGrams: number,
): Promise<GhnResult> {
  const [fromCodes, toCodes] = await Promise.all([
    resolveGhnCodes(from),
    resolveGhnCodes(to),
  ])
  if (!fromCodes || !toCodes) return { express: null, standard: null }

  const fetchFee = async (serviceTypeId: number): Promise<number | null> => {
    try {
      const res = await fetch(`${BASE}/v2/shipping-order/preview`, {
        method: 'POST',
        headers: {
          Token: TOKEN,
          ShopId: SHOP_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_district_id: fromCodes.districtId,
          from_ward_code: fromCodes.wardCode,
          to_district_id: toCodes.districtId,
          to_ward_code: toCodes.wardCode,
          weight: weightGrams,
          service_type_id: serviceTypeId,
        }),
      })
      const data = await res.json()
      return data.data?.total_fee ?? null
    } catch {
      return null
    }
  }

  const [express, standard] = await Promise.all([fetchFee(2), fetchFee(5)])
  return { express, standard }
}
