import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface JsonFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: string
}

export function JsonField({
  name,
  label,
  register,
  error
}: JsonFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <textarea
        id={name}
        className={`${styles.textarea} ${error ? styles.inputError : ''}`}
        rows={4}
        placeholder="Enter valid JSON"
        {...register(name, {
          validate: value => {
            if (!value) return true
            try {
              JSON.parse(value as string)
              return true
            } catch {
              return 'Invalid JSON format'
            }
          }
        })}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
