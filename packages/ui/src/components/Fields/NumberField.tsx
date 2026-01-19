import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface NumberFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
  min?: number
  max?: number
}

export function NumberField({
  name,
  label,
  register,
  error,
  required,
  min,
  max
}: NumberFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={name}
        type="number"
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        min={min}
        max={max}
        {...register(name, {
          required: required ? `${label} is required` : false,
          valueAsNumber: true
        })}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
