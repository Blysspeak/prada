import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface BooleanFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
}

export function BooleanField({ name, label, register }: BooleanFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          {...register(name)}
        />
        <span className={styles.checkboxText}>{label}</span>
      </label>
    </div>
  )
}
