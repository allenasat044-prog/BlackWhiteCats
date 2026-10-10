import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtBytes(n: number | null | undefined): string {
  if (n === null || n === undefined) return "n/a";
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let v = Math.abs(n), i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${n < 0 ? "-" : ""}${i === 0 ? v.toFixed(0) : v.toFixed(2)} ${units[i]}`;
}

export function fmtDuration(sec: number): string {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
