import { useState, useEffect, useRef, useCallback } from 'react'
import type { PradaField } from '@/types'
import styles from './InlineEditor.module.css'

interface InlineEditorProps {
  field: PradaField
  value: unknown
  onSave: (value: unknown) => void
  onCancel: () => void
}

function useClickOutside(
  ref: React.RefObject<HTMLDivElement | null>,
  fieldType: string,
  onSave: (value: unknown) => void
) {
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      const form = ref.current.querySelector('input, select, textarea') as HTMLInputElement | null
      if (form) {
        if (fieldType === 'boolean') {
          onSave(form.checked)
        } else if (fieldType === 'number') {
          onSave(form.value === '' ? null : Number(form.value))
        } else {
          onSave(form.value)
        }
      }
    }
  }, [ref, fieldType, onSave])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])
}

export function InlineEditor({ field, value, onSave, onCancel }: InlineEditorProps) {
  switch (field.type) {
    case 'boolean':
      return <BooleanEditor value={value} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
    case 'number':
      return <NumberEditor value={value} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
    case 'date':
      return <DateEditor value={value} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
    case 'json':
      return <JsonEditor value={value} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
    case 'enum':
      return <EnumEditor value={value} field={field} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
    default:
      return <TextEditor value={value} fieldType={field.type} onSave={onSave} onCancel={onCancel} />
  }
}

interface EditorBaseProps {
  value: unknown
  fieldType: string
  onSave: (value: unknown) => void
  onCancel: () => void
}

function TextEditor({ value, fieldType, onSave, onCancel }: EditorBaseProps) {
  const [text, setText] = useState(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSave(text) }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <input ref={inputRef} type="text" className={styles.input} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} />
    </div>
  )
}

function NumberEditor({ value, fieldType, onSave, onCancel }: EditorBaseProps) {
  const [num, setNum] = useState(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSave(num === '' ? null : Number(num)) }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <input ref={inputRef} type="number" className={styles.input} value={num} onChange={e => setNum(e.target.value)} onKeyDown={handleKeyDown} />
    </div>
  )
}

function BooleanEditor({ value, fieldType, onSave, onCancel }: EditorBaseProps) {
  const [checked, setChecked] = useState(Boolean(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked)
    onSave(e.target.checked)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <input ref={inputRef} type="checkbox" className={styles.checkbox} checked={checked} onChange={handleChange} onKeyDown={handleKeyDown} />
    </div>
  )
}

function DateEditor({ value, fieldType, onSave, onCancel }: EditorBaseProps) {
  const formatDate = (v: unknown): string => {
    if (!v) return ''
    try {
      const d = new Date(v as string)
      return d.toISOString().slice(0, 16)
    } catch { return '' }
  }

  const [date, setDate] = useState(formatDate(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSave(date ? new Date(date).toISOString() : null) }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <input ref={inputRef} type="datetime-local" className={styles.input} value={date} onChange={e => setDate(e.target.value)} onKeyDown={handleKeyDown} />
    </div>
  )
}

function JsonEditor({ value, fieldType, onSave, onCancel }: EditorBaseProps) {
  const [text, setText] = useState(value != null ? JSON.stringify(value, null, 2) : '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      try { onSave(JSON.parse(text)) } catch { onSave(text) }
    }
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <textarea ref={textareaRef} className={styles.textarea} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} />
    </div>
  )
}

interface EnumEditorProps extends EditorBaseProps {
  field: PradaField
}

function EnumEditor({ value, field, fieldType, onSave, onCancel }: EnumEditorProps) {
  const selectRef = useRef<HTMLSelectElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useClickOutside(wrapperRef, fieldType, onSave)

  useEffect(() => { selectRef.current?.focus() }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSave(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel() }
  }

  return (
    <div ref={wrapperRef} className={styles.editor}>
      <select ref={selectRef} className={styles.select} value={value != null ? String(value) : ''} onChange={handleChange} onKeyDown={handleKeyDown}>
        {(field.enumValues ?? []).map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  )
}
