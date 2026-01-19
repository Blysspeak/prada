import { useCallback, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useSettings } from '@/providers/SettingsProvider'
import styles from './AnimatedThemeToggler.module.css'

interface AnimatedThemeTogglerProps {
  duration?: number
  className?: string
}

export function AnimatedThemeToggler({
  duration = 400,
  className
}: AnimatedThemeTogglerProps) {
  const { settings, updateSettings } = useSettings()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Get actual displayed theme (resolve 'system' to actual value)
  const getActualTheme = () => {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return settings.theme
  }

  const isDark = getActualTheme() === 'dark'

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const currentActual = getActualTheme()
    const newTheme = currentActual === 'dark' ? 'light' : 'dark'

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback for browsers without support
      updateSettings({ theme: newTheme })
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        updateSettings({ theme: newTheme })
      })
    }).ready

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }, [settings.theme, duration, updateSettings])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={`${styles.button} ${className || ''}`}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
