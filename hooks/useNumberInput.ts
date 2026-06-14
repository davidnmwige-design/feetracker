import { useState, useCallback } from 'react'

interface NumberInputState {
  inputValue: string
  numericValue: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  set: (n: number) => void
}

export function useNumberInput(initial: number): NumberInputState {
  const [inputValue, setInputValue] = useState(initial === 0 ? '' : String(initial))

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || raw === '-') {
      setInputValue(raw)
      return
    }
    // Remove leading zeros (e.g. "007" → "7") but keep "0" and "0.x"
    const cleaned = raw.replace(/^0+(?=[1-9])/, '')
    setInputValue(cleaned)
  }, [])

  // On blur, normalize empty → '0'
  const onBlur = useCallback(() => {
    setInputValue(prev => (prev === '' || prev === '-' ? '0' : prev))
  }, [])

  const set = useCallback((n: number) => {
    setInputValue(n === 0 ? '' : String(n))
  }, [])

  const numericValue = inputValue === '' || inputValue === '-' ? 0 : Number(inputValue)

  return { inputValue, numericValue, onChange, onBlur, set }
}
