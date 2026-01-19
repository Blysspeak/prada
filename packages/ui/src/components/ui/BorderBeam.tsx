import { cn } from '@/lib/utils'
import styles from './BorderBeam.module.css'

interface BorderBeamProps {
  size?: number
  duration?: number
  colorFrom?: string
  colorTo?: string
  className?: string
  borderWidth?: number
}

export function BorderBeam({
  className,
  size = 80,
  duration = 8,
  colorFrom = '#8B5CF6',
  colorTo = '#06B6D4',
  borderWidth = 2,
}: BorderBeamProps) {
  return (
    <div
      className={cn(styles.container, className)}
      style={{
        '--beam-size': `${size}px`,
        '--beam-duration': `${duration}s`,
        '--beam-color-from': colorFrom,
        '--beam-color-to': colorTo,
        '--beam-width': `${borderWidth}px`,
      } as React.CSSProperties}
    >
      <div className={styles.beam} />
    </div>
  )
}
