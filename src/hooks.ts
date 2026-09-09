import { useCallback, useEffect, useRef, useState } from 'react'
import { hasSupabaseConfig, supabase } from './supabase'
import { demoCases, demoConflicts, demoEvents, demoPeople, demoRiskAnalysis, demoSteps } from './data'
import type { Case, Conflict, Event, Person, RiskAnalysis, Step } from './types'

export function useData<T>(table: string, fallback: T[]) {
  const [data, setData] = useState<T[]>(fallback)
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const refetch = useCallback(async () => {
    if (!hasSupabaseConfig) return
    setLoading(true)
    const { data: rows, error } = await supabase.from(table).select('*')
    if (!error && rows) setData(rows as T[])
    setLoading(false)
  }, [table])
  useEffect(() => { void refetch() }, [refetch])
  return { data, loading, refetch, setData }
}
export const useCases = () => useData<Case>('hr_cases', demoCases)
export const useSteps = () => useData<Step>('hr_steps', demoSteps)
export const useEvents = () => useData<Event>('hr_events', demoEvents)
export const usePeople = () => useData<Person>('personnes', demoPeople)
export const useConflicts = () => useData<Conflict>('hr_conflicts', demoConflicts)
/** Risk reports written by Fusion Phase 4; newest run drives the Analyse IA page. */
export const useRiskAnalysis = () => useData<RiskAnalysis>('hr_risk_analysis', demoRiskAnalysis)

function applyDemoFallback(
  personId: number | undefined,
  setCases: (cases: Case[]) => void,
  setSteps: (steps: Step[]) => void,
) {
  const ownedSteps = demoSteps.filter(step => step.status === 'PENDING' && step.owner_person_id === personId)
  const ownedCaseIds = new Set(ownedSteps.map(step => step.case_id))
  setCases(demoCases.filter(item => ownedCaseIds.has(item.case_id)))
  setSteps(ownedSteps)
}

/**
 * "My Tasks" for any role: filters hr_steps by owner_person_id FIRST (the actor's own
 * pending steps), then joins up to hr_cases + the stagiaire's personnes row so each case
 * group can still show the subject's name — without pulling in steps owned by other roles.
 */
export function useManagerTasks(personId: number | undefined) {
  const [cases, setCases] = useState<Case[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(hasSupabaseConfig && personId != null)

  const refetch = useCallback(async () => {
    if (!hasSupabaseConfig || personId == null) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hr_steps')
        .select(`
          id, step_name, due_date, status, decision, owner_role, owner_person_id, case_id,
          hr_cases!inner(
            *,
            personnes!hr_cases_subject_person_id_fkey(id, person_ref, full_name, email)
          )
        `)
        .eq('owner_person_id', personId)
        .eq('status', 'PENDING')
        .order('due_date')

      if (!error && data) {
        // Flatten: each row is one step owned by this actor, carrying its parent case.
        const rows = data as any[]
        const allSteps: Step[] = []
        const uniqueCases: Map<string, Case> = new Map()

        for (const row of rows) {
          const { hr_cases: caseRow, ...stepData } = row
          allSteps.push(stepData as Step)

          if (caseRow && !uniqueCases.has(caseRow.case_id)) {
            const { personnes, ...caseFields } = caseRow
            uniqueCases.set(caseRow.case_id, { ...caseFields, subject: personnes } as Case)
          }
        }

        setCases(Array.from(uniqueCases.values()))
        setSteps(allSteps)
      } else {
        applyDemoFallback(personId, setCases, setSteps)
      }
    } catch {
      applyDemoFallback(personId, setCases, setSteps)
    }
    setLoading(false)
  }, [personId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { cases, steps, loading, refetch }
}

/**
 * Keeps the dashboard in sync when another actor changes the data:
 *  - Supabase Realtime on the workflow tables (instant; needs the tables added to
 *    the `supabase_realtime` publication in the Supabase dashboard)
 *  - a slow interval + refetch-on-focus as a fallback when Realtime is not enabled
 * `refetch` must be stable (wrap it in useCallback).
 */
export function useAutoSync(refetch: () => void | Promise<unknown>, intervalMs = 20000) {
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useEffect(() => {
    if (!hasSupabaseConfig) return
    const run = () => { void refetchRef.current() }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const debounced = () => {
      clearTimeout(debounce)
      debounce = setTimeout(run, 400)
    }

    const channel = supabase
      .channel('hr-workflow-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_steps' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_cases' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_events' }, debounced)
      .subscribe()

    // Phase 4's report table lives on its own channel: it is optional in the
    // `supabase_realtime` publication, and a failure here must not take down the
    // sync for the three tables above. The interval below covers it regardless.
    const analysisChannel = supabase
      .channel('hr-risk-analysis-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_risk_analysis' }, debounced)
      .subscribe()

    const onVisible = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', run)

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') run()
    }, intervalMs)

    return () => {
      clearTimeout(debounce)
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', run)
      void supabase.removeChannel(channel)
      void supabase.removeChannel(analysisChannel)
    }
  }, [intervalMs])
}
