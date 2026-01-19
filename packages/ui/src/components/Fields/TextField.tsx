import type { UseFormRegister } from 'react-hook-form'
import styles from './Fields.module.css'

interface TextFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
  placeholder?: string
}

export function TextField({
  name,
  label,
  register,
  error,
  required,
  placeholder
}: TextFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={name}
        type="text"
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        placeholder={placeholder || `Enter ${label}`}
        {...register(name, { required: required ? `${label} is required` : false })}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
