/** Format an integer point balance with thousands separators, e.g. 128450 → "128,450". */
export function formatPoints(n: number): string {
  return n.toLocaleString("en-US");
}
