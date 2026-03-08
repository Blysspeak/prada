import { useState, useRef, useEffect, useCallback } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import { ChevronDown, X } from 'lucide-react'
import { useRelationOptions } from '@/hooks/useRelationOptions'
import { useTranslation } from '@/i18n'
import fieldStyles from './Fields.module.css'
import styles from './RelationField.module.css'

interface RelationFieldProps {
  name: string
  label: string
  relatedModelName: string
  register: UseFormRegister<Record<string, unknown>>
  error?: string
  required?: boolean
  defaultValue?: unknown
  onChange?: (value: unknown) => void
}

export function RelationField({
  name,
  label,
  relatedModelName,
  register,
  error,
  required,
  defaultValue,
  onChange
}: RelationFieldProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | number | null>(
    defaultValue != null ? (defaultValue as string | number) : null
  )
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const { options, isLoading } = useRelationOptions(relatedModelName, debouncedSearch)

  // Register the hidden field with react-hook-form
  const { ref: registerRef, ...registerRest } = register(name, {
    required: required ? `${label} is required` : false,
    valueAsNumber: true
  })

  // Debounce search
  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 300)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchText])

  // Set initial label from options when they load
  useEffect(() => {
    if (selectedId != null && !selectedLabel && options.length > 0) {
      const match = options.find(o => String(o.id) === String(selectedId))
      if (match) {
        setSelectedLabel(match.label)
      }
    }
  }, [options, selectedId, selectedLabel])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((id: string | number, optLabel: string) => {
    setSelectedId(id)
    setSelectedLabel(optLabel)
    setIsOpen(false)
    setSearchText('')
    onChange?.(id)

    // Update the hidden input value
    const hiddenInput = wrapperRef.current?.querySelector(`input[name="${name}"]`) as HTMLInputElement
    if (hiddenInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(hiddenInput, String(id))
      hiddenInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, [name, onChange])

  const handleClear = useCallback(() => {
    setSelectedId(null)
    setSelectedLabel('')
    setSearchText('')
    onChange?.(null)

    const hiddenInput = wrapperRef.current?.querySelector(`input[name="${name}"]`) as HTMLInputElement
    if (hiddenInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set
      nativeInputValueSetter?.call(hiddenInput, '')
      hiddenInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, [name, onChange])

  const displayValue = isOpen ? searchText : (selectedLabel || (selectedId != null ? `#${selectedId}` : ''))

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={`${name}-search`} className={fieldStyles.label}>
        {label}
        {required && <span className={fieldStyles.required}>*</span>}
      </label>

      <div className={styles.wrapper} ref={wrapperRef}>
        {/* Hidden input for react-hook-form */}
        <input
          type="hidden"
          defaultValue={defaultValue != null ? String(defaultValue) : ''}
          ref={registerRef}
          {...registerRest}
        />

        {/* Visible search/display input */}
        <div className={styles.inputWrapper}>
          <input
            ref={searchInputRef}
            id={`${name}-search`}
            type="text"
            className={`${styles.searchInput} ${error ? styles.searchInputError : ''}`}
            placeholder={t('selectRelation')}
            value={displayValue}
            onChange={e => {
              setSearchText(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              setIsOpen(true)
              if (selectedId != null) {
                setSearchText('')
              }
            }}
            autoComplete="off"
          />
          {selectedId != null && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          )}
          <span className={styles.dropdownIcon}>
            <ChevronDown size={16} />
          </span>
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            {isLoading ? (
              <div className={styles.loading}>{t('loading')}</div>
            ) : options.length === 0 ? (
              <div className={styles.noOptions}>{t('noOptionsFound')}</div>
            ) : (
              options.map(option => (
                <div
                  key={option.id}
                  className={`${styles.option} ${String(option.id) === String(selectedId) ? styles.optionHighlighted : ''}`}
                  onClick={() => handleSelect(option.id, option.label)}
                >
                  <span>{option.label}</span>
                  <span className={styles.optionId}>#{option.id}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {error && <span className={fieldStyles.error}>{error}</span>}
    </div>
  )
}
