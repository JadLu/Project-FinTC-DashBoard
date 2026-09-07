// src/hooks/useValidateStep.ts
import { useCallback, useState } from 'react'
import { validateStep, type ValidatePayload, type ValidateResponse } from '../api'

interface UseValidateStep {
  submit: (payload: ValidatePayload) => Promise<ValidateResponse | null>
  loading: boolean
  error: string | null
}

export function useValidateStep(): UseValidateStep {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (payload: ValidatePayload): Promise<ValidateResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await validateStep(payload)
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
