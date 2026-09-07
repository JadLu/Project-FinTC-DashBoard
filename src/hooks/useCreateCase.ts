// src/hooks/useCreateCase.ts
import { useCallback, useState } from 'react'
import { createCase, type CreateCasePayload, type CreateCaseResponse } from '../api'

interface UseCreateCase {
  submit: (payload: CreateCasePayload) => Promise<CreateCaseResponse | null>
  loading: boolean
  error: string | null
}

export function useCreateCase(): UseCreateCase {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (payload: CreateCasePayload): Promise<CreateCaseResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await createCase(payload)
      if (!response.ok) {
        setError(response.error || 'Unknown error')
        return null
      }
      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { submit, loading, error }
}
