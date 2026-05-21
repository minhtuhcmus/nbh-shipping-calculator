export function estimateGrabFee(distanceKm: number): number {
  if (distanceKm <= 2) return 15000
  return 15000 + Math.ceil(distanceKm - 2) * 5000
}
