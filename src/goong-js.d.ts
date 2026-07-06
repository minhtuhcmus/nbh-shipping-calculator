declare module '@goongmaps/goong-js' {
  export type LngLatLike = [number, number]

  export class LngLatBounds {
    extend(lngLat: LngLatLike): this
  }

  export class Marker {
    constructor(options?: { color?: string })
    setLngLat(lngLat: LngLatLike): this
    addTo(map: Map): this
    remove(): this
  }

  export class Map {
    constructor(options: {
      container: HTMLElement | string
      style: string | Record<string, unknown>
      center: LngLatLike
      zoom: number
    })
    remove(): void
    loaded(): boolean
    once(event: string, handler: () => void): void
    getSource(id: string): { setData(data: unknown): void } | undefined
    addSource(id: string, source: unknown): void
    addLayer(layer: unknown): void
    fitBounds(bounds: LngLatBounds, options?: { padding?: number; duration?: number }): void
  }

  const goongjs: {
    accessToken: string
    Map: typeof Map
    Marker: typeof Marker
    LngLatBounds: typeof LngLatBounds
  }

  export default goongjs
}
