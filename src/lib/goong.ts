const API_KEY = import.meta.env.VITE_GOONG_API_KEY as string
const BASE = 'https://rsapi.goong.io'

export interface GoongSuggestion {
  place_id: string
  description: string
}

export interface ResolvedAddress {
  placeId: string
  description: string
  lat: number
  lng: number
  province: string
  district: string
  ward: string
}

export async function autocomplete(input: string): Promise<GoongSuggestion[]> {
  const url = `${BASE}/Place/AutoComplete?api_key=${API_KEY}&input=${encodeURIComponent(input)}`
  const res = await fetch(url)
  const data = await res.json()
  return (data.predictions ?? []).map((p: { place_id: string; description: string }) => ({
    place_id: p.place_id,
    description: p.description,
  }))
}

export async function resolvePlaceId(placeId: string, description: string): Promise<ResolvedAddress> {
  const url = `${BASE}/Place/Detail?api_key=${API_KEY}&place_id=${placeId}`
  const res = await fetch(url)
  const data = await res.json()
  const loc = data.result?.geometry?.location
  const components: { long_name: string; types: string[] }[] = data.result?.address_components ?? []

  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? ''

  return {
    placeId,
    description,
    lat: loc?.lat ?? 0,
    lng: loc?.lng ?? 0,
    province: get('administrative_area_level_1'),
    district: get('administrative_area_level_2'),
    ward: get('administrative_area_level_3'),
  }
}

export async function getDistanceKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<number> {
  const origins = `${origin.lat},${origin.lng}`
  const destinations = `${destination.lat},${destination.lng}`
  const url = `${BASE}/DistanceMatrix?api_key=${API_KEY}&origins=${origins}&destinations=${destinations}`
  const res = await fetch(url)
  const data = await res.json()
  const meters: number = data.rows?.[0]?.elements?.[0]?.distance?.value ?? 0
  return meters / 1000
}

export interface RouteResult {
  distanceKm: number
  /** [lng, lat] pairs, in path order, ready to feed a GeoJSON LineString */
  coordinates: [number, number][]
}

function decodePolyline(encoded: string): [number, number][] {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: [number, number][] = []

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let b: number
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coordinates.push([lng * 1e-5, lat * 1e-5])
  }

  return coordinates
}

export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult | null> {
  const url = `${BASE}/Direction?api_key=${API_KEY}&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&vehicle=bike`
  const res = await fetch(url)
  const data = await res.json()
  const route = data.routes?.[0]
  const points: string | undefined = route?.overview_polyline?.points
  if (!points) return null

  const meters: number = route.legs?.[0]?.distance?.value ?? 0
  return {
    distanceKm: meters / 1000,
    coordinates: decodePolyline(points),
  }
}
