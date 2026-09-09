// src/pages/Tasks.tsx
import { useMemo, useState } from 'react'
import { Activity } from 'lucide-react'
import DecisionBadge from '../components/DecisionBadge'
import DecisionPanel from '../components/DecisionPanel'
import { EmptyState, PageHeader, StatusBadge } from '../components/ui'
import { formatDate, groupStepsByCase, isUrgent } from '../lib/format'
import type { Case, Step } from '../types'

interface TaskCaseGroupProps {
  sectionKey: string
  caseItem: Case
  caseSteps: Step[]
  actor: string
  expandedKey: string | null
  setExpandedKey: (key: string | null) => void
  onValidated: (message?: string) => void
}

function TaskCaseGroup({ sectionKey, caseItem, caseSteps, actor, expandedKey, setExpandedKey, onValidated }: TaskCaseGroupProps) {
  const sortedSteps = [...caseSteps].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const groupKey = `${sectionKey}-${caseItem.case_id}`
  const isExpanded = expandedKey === groupKey
  const nextStep = sortedSteps[0]
  const hasOverdue = sortedSteps.some(step => step.status === 'OVERDUE')

  return (
    <div>
      <button className="task-item compact-button" onClick={() => setExpandedKey(isExpanded ? null : groupKey)} style={{ cursor: 'pointer' }}>
        <div className="task-row">
          <div>
            <strong>{caseItem.subject?.full_name || caseItem.case_id}</strong>
            <span>{caseItem.case_id}{caseItem.subject?.person_ref ? ` · ${caseItem.subject.person_ref}` : ''}</span>
          </div>
          <div><span className="muted">{sortedSteps.length} étape{sortedSteps.length > 1 ? 's' : ''}</span></div>
          <div className={hasOverdue ? 'date overdue' : 'date'}>{formatDate(nextStep.due_date)}<small>{hasOverdue ? 'En retard' : 'À venir'}</small></div>
          <StatusBadge status={hasOverdue ? 'OVERDUE' : 'PENDING'} />
        </div>
      </button>
      {isExpanded && (
        <div className="nested-steps">
          {sortedSteps.map(step => (
            <div className="task-item nested" key={step.id}>
              <div className="task-row">
                <div className="task-step">{step.step_name}</div>
                <div className={step.status === 'OVERDUE' ? 'date overdue' : 'date'}>{formatDate(step.due_date)}<small>{step.status === 'OVERDUE' ? 'En retard' : 'À venir'}</small></div>
                <StatusBadge status={step.status} />
                <div className="task-decision">{step.decision ? <DecisionBadge decision={step.decision} /> : <span className="muted">—</span>}</div>
              </div>
              <div className="task-panel">
                <DecisionPanel
                  step={{ id: step.id, case_id: step.case_id, owner_role: step.owner_role, step_name: step.step_name }}
                  actor={actor}
                  journeyType={caseItem.journey_type || ''}
                  onSuccess={onValidated}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tasks({ actor, steps, cases, onValidated }: {
  actor: string
  steps: Step[]
  cases: Case[]
  onValidated: (message?: string) => void
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const caseFor = (caseId: string) => cases.find(item => item.case_id === caseId)

  const urgentSteps = useMemo(() => steps.filter(step => isUrgent(step.due_date)), [steps])
  const laterSteps = useMemo(() => steps.filter(step => !isUrgent(step.due_date)), [steps])
  const urgentGroups = useMemo(() => groupStepsByCase(urgentSteps), [urgentSteps])
  const laterGroups = useMemo(() => groupStepsByCase(laterSteps), [laterSteps])

  return (
    <>
      <PageHeader
        eyebrow="Mon espace de travail"
        title={<>Tâches <span className="count-pill">{urgentSteps.length}</span></>}
        subtitle="Les étapes qui attendent votre validation."
      />
      <section className="table-card">
        <div className="table-toolbar">
          <div><strong>À traiter maintenant</strong><span>Priorisées par échéance</span></div>
          <span className="chip filter-chip"><Activity size={14} /> {actor}</span>
        </div>
        <div className="task-table">
          <div className="task-header"><span>Dossier</span><span>Tâches en attente</span><span>Prochaine échéance</span><span>Statut</span></div>
          {urgentGroups.length ? urgentGroups.map(([caseId, caseSteps]) => {
            const caseItem = caseFor(caseId)
            if (!caseItem) return null
            return <TaskCaseGroup key={caseId} sectionKey="urgent" caseItem={caseItem} caseSteps={caseSteps} actor={actor} expandedKey={expandedKey} setExpandedKey={setExpandedKey} onValidated={onValidated} />
          }) : <EmptyState text="Aucune tâche urgente pour cet acteur" />}
        </div>
      </section>
      {laterGroups.length > 0 && (
        <section className="table-card upcoming">
          <div className="table-toolbar">
            <div><strong>À venir</strong><span>Échéances au-delà de 7 jours</span></div>
            <span className="count-pill muted-pill">À venir ({laterSteps.length})</span>
          </div>
          <div className="task-table">
            <div className="task-header"><span>Dossier</span><span>Tâches en attente</span><span>Prochaine échéance</span><span>Statut</span></div>
            {laterGroups.map(([caseId, caseSteps]) => {
              const caseItem = caseFor(caseId)
              if (!caseItem) return null
              return <TaskCaseGroup key={caseId} sectionKey="later" caseItem={caseItem} caseSteps={caseSteps} actor={actor} expandedKey={expandedKey} setExpandedKey={setExpandedKey} onValidated={onValidated} />
            })}
          </div>
        </section>
      )}
    </>
  )
}
