const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatStamp(iso: string) {
  const [date, time = ""] = iso.split("T");
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${time}`;
}

export function formatAxis(iso: string) {
  const [date, time = ""] = iso.split("T");
  return `${date.slice(8)} ${time}`;
}

export function formatClock(iso: string) {
  return iso.split("T")[1] ?? iso;
}

export function formatWindow(start: string, end: string) {
  return `${formatStamp(start)} – ${formatStamp(end)}`;
}

export function formatDay(iso: string) {
  const [date] = iso.split("T");
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}

export function formatRange(start: string, end: string) {
  return `${formatDay(start)} – ${formatDay(end)} ${end.slice(0, 4)}`;
}

export function formatPct(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 0) {
  return value.toLocaleString("en-ZA", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function titleCase(value: string) {
  return value.replaceAll("_", " ");
}
