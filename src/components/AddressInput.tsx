import { useEffect, useRef, useState } from 'react'
import { autocomplete, resolvePlaceId, type GoongSuggestion, type ResolvedAddress } from '../lib/goong'

interface Props {
  label: string
  placeholder?: string
  onSelect: (addr: ResolvedAddress) => void
}

export function AddressInput({ label, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GoongSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 3 || selected === query) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await autocomplete(query)
        setSuggestions(results)
        setOpen(results.length > 0)
        setActiveIndex(-1)
        setError('')
      } catch {
        setError('Could not load suggestions')
      }
    }, 300)
  }, [query, selected])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function pick(suggestion: GoongSuggestion) {
    setQuery(suggestion.description)
    setSelected(suggestion.description)
    setOpen(false)
    setSuggestions([])
    try {
      const resolved = await resolvePlaceId(suggestion.place_id, suggestion.description)
      onSelect(resolved)
    } catch {
      setError('Could not resolve address')
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      pick(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder ?? 'Nhập địa chỉ...'}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              onMouseDown={() => pick(s)}
              className={`px-4 py-2.5 text-sm cursor-pointer ${
                i === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
