import { useState } from 'react'
import { Columns3, ChevronUp, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { PradaField } from '@/types'
import type { ColumnConfigReturn } from '@/hooks/useColumnConfig'
import styles from './ColumnPicker.module.css'

interface ColumnPickerProps {
  fields: PradaField[]
  columnConfig: ColumnConfigReturn
}

export function ColumnPicker({ fields, columnConfig }: ColumnPickerProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  const scalarFields = fields.filter(f => f.type !== 'relation')
  const allFieldNames = scalarFields.map(f => f.name)

  // For the full list (including hidden), apply order but show all
  const allInOrder = [...scalarFields]
  if (columnConfig.config.order.length > 0) {
    allInOrder.sort((a, b) => {
      const aIdx = columnConfig.config.order.indexOf(a.name)
      const bIdx = columnConfig.config.order.indexOf(b.name)
      const aOrder = aIdx === -1 ? columnConfig.config.order.length : aIdx
      const bOrder = bIdx === -1 ? columnConfig.config.order.length : bIdx
      return aOrder - bOrder
    })
  }

  const handleToggle = (fieldName: string) => {
    columnConfig.toggleColumnWithAllFields(fieldName, allFieldNames)
  }

  const handleMoveUp = (index: number) => {
    const names = allInOrder.map(f => f.name)
    if (index <= 0) return
    const temp = names[index]
    names[index] = names[index - 1]
    names[index - 1] = temp
    columnConfig.reorderColumns(names)
  }

  const handleMoveDown = (index: number) => {
    const names = allInOrder.map(f => f.name)
    if (index >= names.length - 1) return
    const temp = names[index]
    names[index] = names[index + 1]
    names[index + 1] = temp
    columnConfig.reorderColumns(names)
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.toggleButton} ${open ? styles.active : ''}`}
        onClick={() => setOpen(!open)}
        title={t('showHideColumns')}
      >
        <Columns3 size={18} />
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>{t('columns')}</span>
              <button className={styles.resetButton} onClick={() => columnConfig.resetColumns()}>
                {t('resetColumns')}
              </button>
            </div>
            <div className={styles.fieldList}>
              {allInOrder.map((field, index) => (
                <div key={field.name} className={styles.fieldItem}>
                  <input
                    type="checkbox"
                    className={styles.fieldCheckbox}
                    checked={columnConfig.isColumnVisible(field.name)}
                    onChange={() => handleToggle(field.name)}
                    id={`col-${field.name}`}
                  />
                  <label className={styles.fieldLabel} htmlFor={`col-${field.name}`}>
                    {field.name}
                  </label>
                  <div className={styles.fieldActions}>
                    <button
                      className={styles.moveButton}
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title={t('moveUp')}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className={styles.moveButton}
                      onClick={() => handleMoveDown(index)}
                      disabled={index === allInOrder.length - 1}
                      title={t('moveDown')}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
