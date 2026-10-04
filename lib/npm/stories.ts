import type { ChartPoint } from "@/lib/types/npm";

function finite(values: (number | null | undefined)[]) {
  return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

export function windowPoints(points: ChartPoint[], start?: string, end?: string) {
  if (!start || !end) return points;
  const inside = points.filter((point) => point.t >= start && point.t <= end);
  return inside.length ? inside : points;
}

export function lowest(points: ChartPoint[], key: keyof ChartPoint) {
  const values = finite(points.map((point) => (typeof point[key] === "number" ? (point[key] as number) : null)));
  return values.length ? Math.min(...values) : null;
}

export function highest(points: ChartPoint[], key: keyof ChartPoint) {
  const values = finite(points.map((point) => (typeof point[key] === "number" ? (point[key] as number) : null)));
  return values.length ? Math.max(...values) : null;
}
