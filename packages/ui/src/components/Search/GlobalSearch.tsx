import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTranslation } from '@/i18n'
import { SearchHighlight } from './SearchHighlight'
import styles from './GlobalSearch.module.css'

interface FlatResult {
  model: string
  record: Record<string, unknown>
  matchedField?: string
  primaryValue: string
  secondaryValue: string
  idValue: string | number
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { schema } = useSchema()
  const { t } = useTranslation()
  const { results, isLoading, totalCount } = useGlobalSearch(query, schema)

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  // Register Ctrl+K / Cmd+K to open
  useKeyboardShortcuts(useMemo(() => [
    { key: 'ctrl+k', handler: open, description: t('openSearch') },
    { key: 'cmd+k', handler: open }
  ], [open, t]))

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Flatten results for keyboard navigation
  const flatResults = useMemo<FlatResult[]>(() => {
    const items: FlatResult[] = []
    if (!schema) return items

    results.forEach((searchResults, modelName) => {
      const model = schema.models.find(m => m.name === modelName)
      if (!model) return

      const idField = model.fields.find(f => f.isId)
      const scalarFields = model.fields.filter(f => f.type !== 'relation' && !f.isId)
      const primaryField = scalarFields[0]
      const secondaryField = scalarFields[1]

      searchResults.forEach(sr => {
        const idValue = idField ? sr.record[idField.name] as string | number : ''
        const primaryValue = primaryField ? String(sr.record[primaryField.name] ?? '') : String(idValue)
        const secondaryValue = secondaryField ? String(sr.record[secondaryField.name] ?? '') : ''

        items.push({
          model: modelName,
          record: sr.record,
          matchedField: sr.matchedField,
          primaryValue,
          secondaryValue,
          idValue
        })
      })
    })

    return items
  }, [results, schema])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [flatResults.length])

  const navigateToResult = useCallback((item: FlatResult) => {
    navigate(`/models/${item.model.toLowerCase()}/${item.idValue}`)
    close()
  }, [navigate, close])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          navigateToResult(flatResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return
    const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    selectedEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!isOpen) return null

  // Build grouped display
  const groupedModels: string[] = []
  const seen = new Set<string>()
  flatResults.forEach(r => {
    if (!seen.has(r.model)) {
      seen.add(r.model)
      groupedModels.push(r.model)
    }
  })

  let globalIndex = 0

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.panel} onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchAllModels')}
          />
          <span className={styles.kbdHint}>
            <kbd className={styles.kbd}>Esc</kbd>
          </span>
        </div>

        <div className={styles.resultsList} ref={resultsRef}>
          {isLoading && (
            <div className={styles.loading}>{t('loading')}</div>
          )}

          {!isLoading && query.length >= 2 && totalCount === 0 && (
            <div className={styles.empty}>{t('noSearchResults')}</div>
          )}

          {!isLoading && query.length < 2 && (
            <div className={styles.empty}>{t('typeToSearch')}</div>
          )}

          {!isLoading && groupedModels.map(modelName => {
            const modelResults = flatResults.filter(r => r.model === modelName)
            return (
              <div key={modelName}>
                <div className={styles.groupHeader}>{modelName}</div>
                {modelResults.map(item => {
                  const idx = globalIndex++
                  return (
                    <div
                      key={`${item.model}-${item.idValue}`}
                      data-index={idx}
                      className={`${styles.resultItem} ${idx === selectedIndex ? styles.selected : ''}`}
                      onClick={() => navigateToResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className={styles.modelBadge}>{item.model}</span>
                      <div className={styles.resultContent}>
                        <span className={styles.resultPrimary}>
                          <SearchHighlight text={item.primaryValue} query={query} />
                        </span>
                        {item.secondaryValue && (
                          <span className={styles.resultSecondary}>
                            <SearchHighlight text={item.secondaryValue} query={query} />
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerHints}>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>↑↓</kbd> {t('shortcutNavigate')}
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>↵</kbd> {t('shortcutView')}
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.kbd}>Esc</kbd> {t('pressEscToClose')}
            </span>
          </div>
          {totalCount > 0 && (
            <span>{totalCount} {t('results')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
