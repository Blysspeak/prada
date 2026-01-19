import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface EnumFieldProps {
  name: string
  label: string
  values: string[]
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
}

export function EnumField({
  name,
  label,
  values,
  register,
  error,
  required
}: EnumFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <select
        id={name}
        className={`${styles.select} ${error ? styles.inputError : ''}`}
        {...register(name, {
          required: required ? `${label} is required` : false
        })}
      >
        <option value="">Select {label}</option>
        {values.map(value => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
