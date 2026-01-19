import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useTranslation } from '@/i18n'
import styles from './Pagination.module.css'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange
}: PaginationProps) {
  const { t, language } = useTranslation()
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  const perPageText = language === 'ru' ? 'на стр.' : 'per page'

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        {t('showing')} {startItem}-{endItem} {t('of')} {total} {t('results')}
      </div>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={limit}
          onChange={e => onLimitChange(Number(e.target.value))}
        >
          <option value={10}>10 {perPageText}</option>
          <option value={20}>20 {perPageText}</option>
          <option value={50}>50 {perPageText}</option>
          <option value={100}>100 {perPageText}</option>
        </select>

        <div className={styles.buttons}>
          <button
            className={styles.button}
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className={styles.button}
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </button>

          <span className={styles.pageInfo}>
            {t('page')} {page} {t('pageOf')} {totalPages}
          </span>

          <button
            className={styles.button}
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className={styles.button}
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
