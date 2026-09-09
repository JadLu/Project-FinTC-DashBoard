// src/pages/Analysis.tsx — what the Fusion automation did, and where the risk sits.
import { AlertTriangle, Bell, Bot, Sparkles, TrendingUp } from 'lucide-react'
import { KpiCard, ListCard, PageHeader, SectionCard, type ListCardRow } from '../components/ui'
import { BarRow } from '../components/lists'
import { formatTime, journeyLabel } from '../lib/format'
import type { Case, Event, Step } from '../types'

const AI_EVENTS = ['REMINDER_SENT', 'ESCALATED']

export default function Analysis({ events, cases, steps, onOpen }: {
  events: Event[]
  cases: Case[]
  steps: Step[]
  onOpen: (caseId: string) => void
}) {
  const aiEvents = [...events]
    .filter(event => AI_EVENTS.includes(event.event_type) || event.actor.toLowerCase().includes('fusion'))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  const reminders = events.filter(event => event.event_type === 'REMINDER_SENT').length
  const escalations = events.filter(event => event.event_type === 'ESCALATED').length
  const highRisk = cases.filter(item => item.risk_level === 'HIGH').length
  const overdue = steps.filter(step => step.status === 'OVERDUE').length
  const lateRate = steps.length ? `${Math.round((overdue / steps.length) * 100)}%` : '—'

  const risks = (['HIGH', 'MEDIUM', 'LOW'] as const).map(level => ({
    level, count: cases.filter(item => item.risk_level === level).length,
  }))
  const journeys = (['probation', 'renewal', 'offboarding'] as const).map(journey => ({
    journey, count: cases.filter(item => item.journey_type === journey).length,
  }))

  const rows: ListCardRow[] = aiEvents.map(event => ({
    key: String(event.id),
    icon: event.event_type === 'ESCALATED' ? <AlertTriangle size={17} /> : <Bell size={17} />,
    tone: event.event_type === 'ESCALATED' ? 'red' : 'violet',
    title: event.note || event.event_type,
    subtitle: `${event.case_id} · ${event.actor} · ${formatTime(event.created_at)}`,
    search: event.event_type,
    onClick: () => onOpen(event.case_id),
  }))

  return (
    <>
      <PageHeader
        title="Analyse IA"
        subtitle="Les actions automatiques de Fusion et la lecture du risque sur le portefeuille."
      />
      <div className="stat-grid">
        <KpiCard label="Rappels automatiques" value={reminders} icon={Bell} tone="mint" />
        <KpiCard label="Escalades déclenchées" value={escalations} icon={AlertTriangle} tone="coral" />
        <KpiCard label="Dossiers à risque élevé" value={highRisk} icon={TrendingUp} tone="violet" />
        <KpiCard label="Taux d'étapes en retard" value={lateRate} icon={Sparkles} tone="amber" />
      </div>
      <div className="section-grid" style={{ marginBottom: 16 }}>
        <SectionCard title="Répartition du risque" eyebrow="Lecture du portefeuille">
          <div className="compact-list">
            {risks.map(item => (
              <BarRow
                key={item.level}
                label={item.level}
                value={item.count}
                total={cases.length}
                tone={item.level === 'HIGH' ? 'red' : item.level === 'MEDIUM' ? 'amber' : 'green'}
              />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Dossiers par parcours" eyebrow="Volume">
          <div className="compact-list">
            {journeys.map(item => (
              <BarRow key={item.journey} label={journeyLabel(item.journey)} value={item.count} total={cases.length} tone="blue" />
            ))}
          </div>
        </SectionCard>
      </div>
      <ListCard
        rows={rows}
        caption="Journal des actions automatiques"
        emptyText="Aucune action automatique enregistrée"
        head={<span className="chip accent"><Bot size={13} /> Fusion AI</span>}
      />
    </>
  )
}
