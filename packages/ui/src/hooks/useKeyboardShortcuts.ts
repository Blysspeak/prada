import { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createElement } from 'react'

export interface Shortcut {
  key: string         // e.g., 'ctrl+n', 'escape', '/', '?'
  handler: () => void
  description?: string
}

function parseShortcut(shortcutStr: string) {
  const parts = shortcutStr.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const ctrl = parts.includes('ctrl')
  const meta = parts.includes('cmd') || parts.includes('meta')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')
  return { key, ctrl, meta, shift, alt }
}

function matchesShortcut(event: KeyboardEvent, shortcutStr: string): boolean {
  const parsed = parseShortcut(shortcutStr)
  const eventKey = event.key.toLowerCase()

  // Match the key
  if (parsed.key === 'escape' && eventKey !== 'escape') return false
  if (parsed.key !== 'escape' && eventKey !== parsed.key) return false

  // For shortcuts with ctrl or cmd, require the modifier
  if (parsed.ctrl && !event.ctrlKey) return false
  if (parsed.meta && !event.metaKey) return false
  if (parsed.shift && !event.shiftKey) return false
  if (parsed.alt && !event.altKey) return false

  // For simple key shortcuts (no modifiers), make sure no modifiers are pressed
  if (!parsed.ctrl && !parsed.meta && !parsed.shift && !parsed.alt) {
    if (event.ctrlKey || event.metaKey || event.altKey) return false
  }

  return true
}

function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if ((active as HTMLElement).isContentEditable) return true
  return false
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const { register, unregister } = useShortcutRegistry()

  useEffect(() => {
    register(shortcuts)
    return () => unregister(shortcuts)
  }, [shortcuts, register, unregister])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Allow escape even when in inputs
      const inInput = isInputFocused()

      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut.key)) {
          // Skip non-escape, non-modifier shortcuts when in input
          const parsed = parseShortcut(shortcut.key)
          const hasModifier = parsed.ctrl || parsed.meta || parsed.alt
          if (inInput && shortcut.key.toLowerCase() !== 'escape' && !hasModifier) continue

          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}

// Context for collecting all registered shortcuts
interface ShortcutRegistryContextType {
  shortcuts: Shortcut[]
  register: (shortcuts: Shortcut[]) => void
  unregister: (shortcuts: Shortcut[]) => void
}

const ShortcutRegistryContext = createContext<ShortcutRegistryContextType>({
  shortcuts: [],
  register: () => {},
  unregister: () => {}
})

export function ShortcutRegistryProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])

  const register = useCallback((newShortcuts: Shortcut[]) => {
    setShortcuts(prev => [...prev, ...newShortcuts])
  }, [])

  const unregister = useCallback((toRemove: Shortcut[]) => {
    setShortcuts(prev => prev.filter(s => !toRemove.includes(s)))
  }, [])

  return createElement(
    ShortcutRegistryContext.Provider,
    { value: { shortcuts, register, unregister } },
    children
  )
}

export function useShortcutRegistry() {
  return useContext(ShortcutRegistryContext)
}

export function useRegisteredShortcuts() {
  const { shortcuts } = useContext(ShortcutRegistryContext)
  return { shortcuts }
}
