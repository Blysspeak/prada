interface SearchHighlightProps {
  text: string
  query: string
}

export function SearchHighlight({ text, query }: SearchHighlightProps) {
  if (!query || query.length < 2) return <>{text}</>

  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return <>{text}</>

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return (
    <>
      {before}
      <mark style={{ background: 'var(--primary)', color: 'white', borderRadius: '2px', padding: '0 1px' }}>
        {match}
      </mark>
      {after}
    </>
  )
}
