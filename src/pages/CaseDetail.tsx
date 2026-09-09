// src/pages/CaseDetail.tsx
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import StepRow from '../components/StepRow'
import DecisionBadge from '../components/DecisionBadge'
import { DetailsList } from '../components/DetailsFields'
import { EmptyState, RiskBadge, SectionCard, StatusBadge } from '../components/ui'
import { ConflictList } from '../components/lists'
import { formatDate, formatTime, initials, journeyLabel } from '../lib/format'
import type { Case, Conflict, Event, Step } from '../types'

function Timeline({ events }: { events: Event[] }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!events.length) return <EmptyState text="Aucun événement" />
  return (
    <div className="timeline">
      {[...events].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).map(event => {
        const hasDetails = event.details && Object.keys(event.details).length > 0
        return (
          <div className="timeline-item" key={event.id}>
            <span className="timeline-dot" />
            <div>
              <div className="timeline-top"><strong>{event.event_type}</strong><small>{formatTime(event.created_at)}</small></div>
              {event.decision && <div className="timeline-decision"><DecisionBadge decision={event.decision} /></div>}
              <p>{event.note || 'Événement enregistré'}</p>
              <span className="timeline-actor">{event.actor}</span>
              {hasDetails && (
                <button className="timeline-toggle" onClick={() => setOpen(open === event.id ? null : event.id)}>
                  {open === event.id ? 'Masquer les détails' : 'Voir les détails'}
                </button>
              )}
              {open === event.id && <DetailsList details={event.details} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CaseDetail({ selectedCase, steps, events, conflicts, actor, onValidated, onBack }: {
  selectedCase: Case
  steps: Step[]
  events: Event[]
  conflicts: Conflict[]
  actor: string
  onValidated: () => void
  onBack: () => void
}) {
  const caseSteps = steps.filter(step => step.case_id === selectedCase.case_id)
  const top = caseSteps.filter(step => !step.parent_step_id)

  return (
    <>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}><ArrowLeft size={14} /> Dossiers / {selectedCase.case_id}</button>
        <div className="detail-title">
          <div className="case-avatar large">{initials(selectedCase.subject?.full_name || '?')}</div>
          <div>
            <h1>{selectedCase.subject?.full_name}</h1>
            <p>{journeyLabel(selectedCase.journey_type)} · {selectedCase.case_id}</p>
          </div>
          <StatusBadge status={selectedCase.status} />
          <RiskBadge risk={selectedCase.risk_level} />
        </div>
        <div className="detail-meta">
          <span><b>Début</b>{formatDate(selectedCase.start_date)}</span>
          <span><b>Fin de contrat</b>{formatDate(selectedCase.contract_end_date)}</span>
          <span><b>Étapes</b>{caseSteps.filter(step => step.status === 'VALIDATED').length}/{caseSteps.length} validées</span>
          <span><b>Encadrant</b>{selectedCase.encadrant?.full_name || '— non assigné —'}</span>
        </div>
      </div>
      <div className="detail-grid">
        <SectionCard title="Parcours de validation" eyebrow="Étapes du dossier">
          <div className="step-tree">
            {top.length ? top.map(step => (
              <div key={step.id}>
                <StepRow step={step} actor={actor} journeyType={selectedCase.journey_type} onValidateSuccess={onValidated} />
                {caseSteps.filter(child => child.parent_step_id === step.id).map(child => (
                  <StepRow key={child.id} step={child} actor={actor} journeyType={selectedCase.journey_type} onValidateSuccess={onValidated} nested />
                ))}
              </div>
            )) : <EmptyState />}
          </div>
        </SectionCard>
        <div className="side-stack">
          <SectionCard title="Chronologie" eyebrow="Dernières activités">
            <Timeline events={events.filter(event => event.case_id === selectedCase.case_id)} />
          </SectionCard>
          <SectionCard title="Conflits" eyebrow="Signalements">
            <ConflictList conflicts={conflicts.filter(item => item.case_id === selectedCase.case_id)} />
          </SectionCard>
        </div>
      </div>
    </>
  )
}
