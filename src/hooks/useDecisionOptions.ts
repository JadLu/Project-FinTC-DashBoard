// src/hooks/useDecisionOptions.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasSupabaseConfig, supabase } from '../supabase'
import { demoDecisionOptions } from '../data'
import type { DecisionAction, DecisionOption } from '../types'

/**
 * Loads the decision_options rows for a single owner role.
 * `forAction('validate' | 'block')` narrows them to the buttons an actor pressed.
 */
export function useDecisionOptions(ownerRole: string | undefined) {
  const [options, setOptions] = useState<DecisionOption[]>(
    () => demoDecisionOptions.filter(option => option.owner_role === ownerRole),
  )
  const [loading, setLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!ownerRole) { setOptions([]); return }
    if (!hasSupabaseConfig) {
      setOptions(demoDecisionOptions.filter(option => option.owner_role === ownerRole))
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('decision_options')
      .select('*')
      .eq('owner_role', ownerRole)
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled) return
        const fallback = demoDecisionOptions.filter(option => option.owner_role === ownerRole)
        setOptions(!error && data && data.length ? (data as DecisionOption[]) : fallback)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [ownerRole])

  const forAction = useCallback(
    (action: DecisionAction) =>
      [...options]
        .filter(option => option.action === action)
        .sort((a, b) => a.sort_order - b.sort_order),
    [options],
  )

  return { options, forAction, loading }
}

// Shared across every DecisionBadge so the full table is fetched only once.
let allOptionsPromise: Promise<DecisionOption[]> | null = null
const loadAllOptions = (): Promise<DecisionOption[]> => {
  if (!hasSupabaseConfig) return Promise.resolve(demoDecisionOptions)
  if (!allOptionsPromise) {
    allOptionsPromise = (async () => {
      const { data, error } = await supabase.from('decision_options').select('*')
      return !error && data && data.length ? (data as DecisionOption[]) : demoDecisionOptions
    })()
  }
  return allOptionsPromise
}

/**
 * All decision_options across every role, plus a `labelFor(decision)` lookup used
 * to render decision badges (falls back to the raw decision code).
 */
export function useDecisionLabels() {
  const [rows, setRows] = useState<DecisionOption[]>(demoDecisionOptions)

  useEffect(() => {
    let cancelled = false
    loadAllOptions().then(data => { if (!cancelled) setRows(data) })
    return () => { cancelled = true }
  }, [])

  const map = useMemo(() => {
    const m = new Map<string, DecisionOption>()
    for (const row of rows) if (!m.has(row.decision)) m.set(row.decision, row)
    return m
  }, [rows])

  const labelFor = useCallback((decision?: string | null) => {
    if (!decision) return ''
    return map.get(decision)?.label_fr ?? decision
  }, [map])

  const isTerminal = useCallback(
    (decision?: string | null) => (decision ? map.get(decision)?.is_terminal ?? false : false),
    [map],
  )

  return { labelFor, isTerminal, rows }
}
