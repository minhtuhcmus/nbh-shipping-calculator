import { useEffect, useRef } from 'react'
import goongjs, { type Map as GoongMap, Marker } from '@goongmaps/goong-js'
import '@goongmaps/goong-js/dist/goong-js.css'

// Goong's own vector tile style requires the "Maps" product to be enabled on the API key
// (separate from Places/Direction, which this project's key doesn't have). OSM raster tiles
// need no key and work with any Goong plan, so they're used as the base map here instead.
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

interface Props {
  from: { lat: number; lng: number }
  to: { lat: number; lng: number }
  /** [lng, lat] pairs describing the road route; falls back to a straight line when absent */
  routeCoordinates: [number, number][] | null
}

const ROUTE_SOURCE_ID = 'route'
const ROUTE_LAYER_ID = 'route-line'

export function RouteMap({ from, to, routeCoordinates }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GoongMap | null>(null)
  const markersRef = useRef<Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const map = new goongjs.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [from.lng, from.lat],
      zoom: 12,
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function draw() {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = [
        new goongjs.Marker({ color: '#2563eb' }).setLngLat([from.lng, from.lat]).addTo(map!),
        new goongjs.Marker({ color: '#dc2626' }).setLngLat([to.lng, to.lat]).addTo(map!),
      ]

      const line: [number, number][] =
        routeCoordinates && routeCoordinates.length > 1
          ? routeCoordinates
          : [
              [from.lng, from.lat],
              [to.lng, to.lat],
            ]

      const geojson = {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'LineString' as const, coordinates: line },
      }

      const source = map!.getSource(ROUTE_SOURCE_ID)
      if (source) {
        source.setData(geojson)
      } else {
        map!.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson })
        map!.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#2563eb', 'line-width': 4 },
        })
      }

      const bounds = new goongjs.LngLatBounds()
      line.forEach((c) => bounds.extend(c))
      map!.fitBounds(bounds, { padding: 48, duration: 0 })
    }

    if (map.loaded()) draw()
    else map.once('load', draw)
  }, [from, to, routeCoordinates])

  return <div ref={containerRef} className="w-full h-72 rounded-xl overflow-hidden border border-gray-200" />
}
