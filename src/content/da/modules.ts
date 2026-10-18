// The learning path. Each module adds a few keys; the order can be changed freely here.

export interface Module {
  id: number
  /** Keys introduced in this module (lowercase letters or punctuation). */
  newKeys: string[]
  /** True from the module where Shift (and thus capital letters) is introduced. */
  introducesShift?: boolean
}

export const MODULES: Module[] = [
  { id: 1, newKeys: ['f', 'j', 'd', 'k', 'e', 'r', 'u', 'i'] },
  { id: 2, newKeys: ['s', 'l', 'w', 'o'] },
  { id: 3, newKeys: ['g', 'h', 't', 'y'] },
  { id: 4, newKeys: ['a', 'æ', 'ø'], introducesShift: true },
  { id: 5, newKeys: ['n', 'm', 'v', 'b', 'c'] },
  { id: 6, newKeys: ['p', 'å', 'q'] },
  { id: 7, newKeys: ['x', 'z', ',', '.', '-'] },
]

export function getModule(id: number): Module {
  const m = MODULES.find((m) => m.id === id)
  if (!m) throw new Error(`Unknown module ${id}`)
  return m
}

/** All keys learned up to and including the given module. */
export function allowedKeys(moduleId: number): Set<string> {
  const keys = new Set<string>()
  for (const m of MODULES) {
    if (m.id > moduleId) break
    m.newKeys.forEach((k) => keys.add(k))
  }
  return keys
}

export function shiftAllowed(moduleId: number): boolean {
  return MODULES.some((m) => m.id <= moduleId && m.introducesShift)
}
