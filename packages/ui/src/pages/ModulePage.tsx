import { useState, useEffect } from 'react'

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

export function ModulePage({ apiPath }: { apiPath: string }) {
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${baseUrl}${apiPath}`, { credentials: 'include' })
      .then(res => res.text())
      .then(setHtml)
      .catch(() => setHtml('<p>Failed to load page</p>'))
      .finally(() => setLoading(false))
  }, [apiPath])

  if (loading) {
    return <div style={{ padding: 24, color: '#64748b' }}>Loading...</div>
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
