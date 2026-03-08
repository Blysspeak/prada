import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileJson } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { exportToCSV, exportToJSON } from '@/lib/export'
import type { PradaModel } from '@/types'
import styles from './ExportButton.module.css'

interface ExportButtonProps {
  data: Record<string, unknown>[]
  model: PradaModel
}

export function ExportButton({ data, model }: ExportButtonProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    exportToCSV(data, model.fields, `${model.name}_${timestamp}`)
    setIsOpen(false)
  }

  const handleExportJSON = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    exportToJSON(data, `${model.name}_${timestamp}`)
    setIsOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.exportButton}
        onClick={() => setIsOpen(!isOpen)}
        title={t('export')}
        type="button"
      >
        <Download size={18} />
        {t('export')}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownItem} onClick={handleExportCSV} type="button">
            <FileSpreadsheet size={16} />
            {t('exportCSV')}
          </button>
          <button className={styles.dropdownItem} onClick={handleExportJSON} type="button">
            <FileJson size={16} />
            {t('exportJSON')}
          </button>
        </div>
      )}
    </div>
  )
}
