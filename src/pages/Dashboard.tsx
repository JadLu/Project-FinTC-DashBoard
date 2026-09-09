// src/pages/Dashboard.tsx
import { Activity, AlertTriangle, BarChart3, Bell, Clock3, Gavel, ShieldAlert } from 'lucide-react'
import { KpiCard, PageHeader, RiskBadge, SectionCard } from '../components/ui'
import { BlockReasons, CaseList, ConflictList, DecisionFeed, StepList } from '../components/lists'
import { TERMINAL_DECISIONS, formatLongDate } from '../lib/format'
import type { Case, Conflict, Event, Person, Step } from '../types'

interface DashboardProps {
  cases: Case[]
  steps: Step[]
  events: Event[]
  conflicts: Conflict[]
  actorPerson?: Person
  onOpen: (caseId: string) => void
}

export default function Dashboard({ cases, steps, events, conflicts, actorPerson, onOpen }: DashboardProps) {
  const today = new Date()
  const in7 = new Date(today.getTime() + 7 * 86400000)
  const in14 = new Date(today.getTime() + 14 * 86400000)

  const deadlines = steps.filter(step => ['PENDING', 'OVERDUE'].includes(step.status) && new Date(step.due_date) <= in7).length
  const closureDays = cases.filter(item => item.status === 'CLOSED' && item.closed_at)
    .map(item => (new Date(item.closed_at!).getTime() - new Date(item.created_at).getTime()) / 86400000)
  const average = closureDays.length ? `${(closureDays.reduce((a, b) => a + b, 0) / closureDays.length).toFixed(1)}j` : '—'
  const probation = cases.filter(item => item.journey_type === 'probation'
    && steps.some(step => step.case_id === item.case_id && step.status === 'PENDING' && new Date(step.due_date) <= in7))
  const evaluations = steps.filter(step => step.step_name.toLowerCase().includes('valuation') && step.status === 'PENDING')
  const departures = cases.filter(item => item.journey_type === 'offboarding' && item.status === 'OPEN')
  const contracts = cases.filter(item => item.contract_end_date && new Date(item.contract_end_date) >= today && new Date(item.contract_end_date) <= in14)
  const terminalDecisions = steps.filter(step => step.decision && TERMINAL_DECISIONS.includes(step.decision)).length
  const recentDecisions = [...events].filter(event => event.decision)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 10)
  const blockReasons = Object.entries(steps.filter(step => step.status === 'BLOCKED').reduce<Record<string, number>>((acc, step) => {
    const key = step.decision || 'Non précisé'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1])

  const firstName = (actorPerson?.full_name || '').split(' ')[0]

  return (
    <>
      <PageHeader
        eyebrow={`Vue d'ensemble · ${formatLongDate(today.toISOString())}`}
        title={<>Bonjour{firstName ? `, ${firstName}` : ''} <span className="title-dot">•</span></>}
        subtitle="Voici ce qui mérite votre attention aujourd'hui."
        action={<div className="live-indicator"><span /> Actualisé à l'instant</div>}
      />
      <div className="kpi-grid">
        <KpiCard label="Processus suivis" value={cases.length} icon={BarChart3} tone="blue" />
        <KpiCard label="Échéances détectées" value={deadlines} icon={Clock3} tone="amber" />
        <KpiCard label="Rappels envoyés" value={events.filter(event => event.event_type === 'REMINDER_SENT').length} icon={Bell} tone="mint" />
        <KpiCard label="Escalades déclenchées" value={events.filter(event => event.event_type === 'ESCALATED').length} icon={AlertTriangle} tone="coral" />
        <KpiCard label="Dossiers bloqués" value={cases.filter(item => item.status === 'BLOCKED').length} icon={ShieldAlert} tone="violet" />
        <KpiCard label="Décisions terminales" value={terminalDecisions} icon={Gavel} tone="slate" />
        <KpiCard label="Clôture moyenne" value={average} icon={Activity} tone="slate" />
      </div>
      <div className="section-grid">
        <SectionCard title="Périodes d'essai proches de l'échéance" eyebrow="À surveiller"><CaseList items={probation} onOpen={onOpen} /></SectionCard>
        <SectionCard title="Évaluations en attente" eyebrow="Action requise"><StepList items={evaluations} /></SectionCard>
        <SectionCard title="Décisions récentes" eyebrow="Journal des décisions"><DecisionFeed events={recentDecisions} onOpen={onOpen} /></SectionCard>
        <SectionCard title="Blocages par motif" eyebrow="Pourquoi les dossiers sont bloqués"><BlockReasons rows={blockReasons} /></SectionCard>
        <SectionCard title="Départs en cours" eyebrow="Opérations"><CaseList items={departures} onOpen={onOpen} /></SectionCard>
        <SectionCard title="Conflits ouverts" eyebrow="Attention"><ConflictList conflicts={conflicts.filter(item => item.status === 'OPEN')} /></SectionCard>
        <SectionCard title="Contrats à échéance" eyebrow="Prochains 14 jours"><CaseList items={contracts} showDate onOpen={onOpen} /></SectionCard>
        <SectionCard title="Niveau de risque par dossier" eyebrow="Portefeuille">
          <div className="risk-list">
            {[...cases]
              .sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.risk_level] - { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.risk_level]))
              .map(item => (
                <button className="risk-row compact-button" key={item.case_id} onClick={() => onOpen(item.case_id)}>
                  <div><strong>{item.case_id}</strong><span>{item.subject?.full_name}</span></div>
                  <RiskBadge risk={item.risk_level} />
                </button>
              ))}
          </div>
        </SectionCard>
      </div>
    </>
  )
}
