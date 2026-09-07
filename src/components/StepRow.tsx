// src/components/StepRow.tsx
import { ChevronRight } from 'lucide-react'
import DecisionPanel from './DecisionPanel'
import DecisionBadge from './DecisionBadge'

export interface StepRowStep {
  id: number
  step_name: string
  due_date: string
  status: string
  case_id: string
  owner_role: string
  decision?: string | null
  owner?: { full_name: string } | null
}

interface StepRowProps {
  step: StepRowStep
  actor: string
  journeyType: string
  onValidateSuccess: () => void
  nested?: boolean
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value))
    : '—'

export default function StepRow({ step, actor, journeyType, onValidateSuccess, nested = false }: StepRowProps) {
  const actionable = step.status === 'PENDING' || step.status === 'OVERDUE'

  return (
    <div className={`step-row ${nested ? 'nested' : ''}`}>
      <div className="step-name">
        <span className="step-marker">{nested ? '↳' : <ChevronRight size={14} />}</span>
        <span>{step.step_name}</span>
      </div>
      <span className="owner-chip">{step.owner?.full_name || step.owner_role}</span>
      <span className={step.status === 'OVERDUE' ? 'date overdue' : 'date'}>{formatDate(step.due_date)}</span>
      <span className={`badge status-${step.status.toLowerCase()}`}>
        <span className="badge-dot" />
        {step.status}
      </span>
      <DecisionBadge decision={step.decision} />

      {actionable && (
        <div className="step-actions">
          <DecisionPanel
            step={{ id: step.id, case_id: step.case_id, owner_role: step.owner_role }}
            actor={actor}
            journeyType={journeyType}
            onSuccess={onValidateSuccess}
          />
        </div>
      )}
    </div>
  )
}
