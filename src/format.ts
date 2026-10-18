import { da } from './i18n/da'

export type SpeedUnit = 'kpm' | 'kps'

/** Speed in the unit the profile prefers: whole keystrokes per minute, or per second with 2 decimals. */
export function formatSpeed(kpm: number, unit: SpeedUnit): string {
  return unit === 'kps' ? (kpm / 60).toFixed(2).replace('.', ',') : String(Math.round(kpm))
}

export function formatSpeedDiff(diffKpm: number, unit: SpeedUnit): string {
  const text = formatSpeed(Math.abs(diffKpm), unit)
  return diffKpm < 0 ? `-${text}` : `+${text}`
}

export const speedUnitLabel = (unit: SpeedUnit) => da.speedUnits[unit]

export const pct = (v: number) => `${Math.floor(v * 100)} %`
