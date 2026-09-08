import { useCallback, useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from './supabase'
import { demoCases, demoConflicts, demoEvents, demoPeople, demoSteps } from './data'
import type { Case, Conflict, Event, Person, Step } from './types'

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
