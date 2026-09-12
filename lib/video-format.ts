import type { VideoDisciplineName } from "@/types/video";

export function videoDisciplineLabel(value: VideoDisciplineName | string) {
  return value === "VIDEO_EDITING" ? "Video Editing" : "Cinematography";
}

export function videoDisciplineLine(values: Array<VideoDisciplineName | string>) {
  return values.map(videoDisciplineLabel).join(" · ");
}

export function videoYear(date?: string) {
  return date ? date.slice(0, 4) : undefined;
}

export function runtimeToIso8601(runtime?: string) {
  if (!runtime) return undefined;
  const parts = runtime.trim().split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return undefined;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds >= 60) return undefined;
    return `PT${minutes ? `${minutes}M` : ""}${seconds ? `${seconds}S` : "0S"}`;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes >= 60 || seconds >= 60) return undefined;
    return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds ? `${seconds}S` : "0S"}`;
  }
  return undefined;
}
