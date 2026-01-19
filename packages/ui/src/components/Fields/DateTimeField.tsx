import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface DateTimeFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
}

export function DateTimeField({
  name,
  label,
  register,
  error,
  required
}: DateTimeFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={name}
        type="datetime-local"
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...register(name, {
          required: required ? `${label} is required` : false
        })}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
