// Streaks and daily/weekly activity, computed from profile.history. All days are local time.

import type { Attempt } from '../storage/profiles'

const DAY_MS = 86_400_000

/** A whole number per local calendar day, so consecutive days differ by exactly 1 (DST-safe). */
export function dayIndex(ts: number): number {
  const d = new Date(ts)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS
}

export interface Streak {
  /** Consecutive days up to today, or up to yesterday if today has no attempt yet. */
  current: number
  best: number
  /** True when today already counts. */
  today: boolean
}

/**
 * A day counts when it has at least one finished attempt. A missed day resets the streak, but
 * today isn't missed until it is over, so a streak from yesterday is still alive.
 */
export function streak(history: Attempt[], now = Date.now()): Streak {
  const days = [...new Set(history.map((a) => dayIndex(a.at)))].sort((a, b) => a - b)
  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  const todayIdx = dayIndex(now)
  const last = days[days.length - 1]
  const alive = last === todayIdx || last === todayIdx - 1
  return { current: alive ? run : 0, best, today: last === todayIdx }
}

export interface Activity {
  /** Every key pressed, right or wrong. */
  keystrokes: number
  /** Finished attempts of any kind. */
  attempts: number
  minutes: number
}

export const keystrokesOf = (a: Attempt) => a.correct + a.errors

export function activity(history: Attempt[], from: number, to = Infinity): Activity {
  const items = history.filter((a) => a.at >= from && a.at < to)
  return {
    keystrokes: items.reduce((s, a) => s + keystrokesOf(a), 0),
    attempts: items.length,
    minutes: items.reduce((s, a) => s + a.durationMs, 0) / 60_000,
  }
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** The week starts on Monday, as in Denmark. */
export function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const sinceMonday = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - sinceMonday).getTime()
}

export const today = (history: Attempt[], now = Date.now()) => activity(history, startOfDay(now))
export const thisWeek = (history: Attempt[], now = Date.now()) => activity(history, startOfWeek(now))

export const totalKeystrokes = (history: Attempt[]) => history.reduce((s, a) => s + keystrokesOf(a), 0)
