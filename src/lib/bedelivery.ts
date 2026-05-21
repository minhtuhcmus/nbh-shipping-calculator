export function estimateBeFee(distanceKm: number): number {
  if (distanceKm <= 2) return 14000
  return 14000 + Math.ceil(distanceKm - 2) * 4500
}
