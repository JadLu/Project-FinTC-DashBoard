// src/hooks/useEncadrants.ts
import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../supabase'
import { demoPeople } from '../data'

export interface Encadrant {
  id: number
  person_ref: string
  full_name: string
  email: string
}

const demoEncadrants: Encadrant[] = demoPeople
  .filter(person => person.role === 'encadrant')
  .map(({ id, person_ref, full_name, email }) => ({ id, person_ref, full_name, email }))

interface UseEncadrants {
  encadrants: Encadrant[]
  loading: boolean
}

/** Encadrants available for assignment on the manager's "Fixer objectifs" step. */
export function useEncadrants(): UseEncadrants {
  const [encadrants, setEncadrants] = useState<Encadrant[]>(demoEncadrants)
  const [loading, setLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!hasSupabaseConfig) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('personnes')
      .select('id, person_ref, full_name, email')
      .eq('role', 'encadrant')
      .order('full_name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setEncadrants(data as Encadrant[])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return { encadrants, loading }
}
