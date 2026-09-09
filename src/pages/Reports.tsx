// src/pages/Reports.tsx — the KPI read-out over hr_cases / hr_steps / hr_events.
import { Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, Clock3, Gavel, ShieldAlert } from 'lucide-react'
import { KpiCard, PageHeader, SectionCard } from '../components/ui'
import { BarRow, BlockReasons } from '../components/lists'
import { TERMINAL_DECISIONS, journeyLabel } from '../lib/format'
import type { Case, Event, Step } from '../types'

export default function Reports({ cases, steps, events }: { cases: Case[]; steps: Step[]; events: Event[] }) {
  const today = new Date()
  const in7 = new Date(today.getTime() + 7 * 86400000)

  const closureDays = cases.filter(item => item.status === 'CLOSED' && item.closed_at)
    .map(item => (new Date(item.closed_at!).getTime() - new Date(item.created_at).getTime()) / 86400000)
  const average = closureDays.length ? `${(closureDays.reduce((a, b) => a + b, 0) / closureDays.length).toFixed(1)}j` : '—'
  const validated = steps.filter(step => step.status === 'VALIDATED').length
  const completion = steps.length ? `${Math.round((validated / steps.length) * 100)}%` : '—'
  const deadlines = steps.filter(step => ['PENDING', 'OVERDUE'].includes(step.status) && new Date(step.due_date) <= in7).length

  const statuses = (['PENDING', 'OVERDUE', 'BLOCKED', 'VALIDATED'] as const).map(status => ({
    status, count: steps.filter(step => step.status === status).length,
  }))
  const journeys = (['probation', 'renewal', 'offboarding'] as const).map(journey => ({
    journey, count: cases.filter(item => item.journey_type === journey).length,
  }))
  const blockReasons = Object.entries(steps.filter(step => step.status === 'BLOCKED').reduce<Record<string, number>>((acc, step) => {
    const key = step.decision || 'Non précisé'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1])

  const byOwner = Object.entries(steps.reduce<Record<string, number>>((acc, step) => {
    acc[step.owner_role] = (acc[step.owner_role] || 0) + 1
    return acc
  }, {})).sort((a, b) => b[1] - a[1])

  return (
    <>
      <PageHeader title="Rapports & KPI" subtitle="Indicateurs consolidés sur l'ensemble des parcours RH." />
      <div className="kpi-grid">
        <KpiCard label="Processus suivis" value={cases.length} icon={BarChart3} tone="blue" />
        <KpiCard label="Échéances < 7 jours" value={deadlines} icon={Clock3} tone="amber" />
        <KpiCard label="Étapes validées" value={completion} icon={CheckCircle2} tone="mint" />
        <KpiCard label="Rappels envoyés" value={events.filter(event => event.event_type === 'REMINDER_SENT').length} icon={Bell} tone="slate" />
        <KpiCard label="Escalades" value={events.filter(event => event.event_type === 'ESCALATED').length} icon={AlertTriangle} tone="coral" />
        <KpiCard label="Décisions terminales" value={steps.filter(step => step.decision && TERMINAL_DECISIONS.includes(step.decision)).length} icon={Gavel} tone="violet" />
        <KpiCard label="Clôture moyenne" value={average} icon={Activity} tone="slate" />
      </div>
      <div className="section-grid">
        <SectionCard title="Étapes par statut" eyebrow="Avancement">
          <div className="compact-list">
            {statuses.map(item => (
              <BarRow
                key={item.status}
                label={item.status}
                value={item.count}
                total={steps.length}
                tone={item.status === 'VALIDATED' ? 'green' : item.status === 'OVERDUE' ? 'red' : item.status === 'BLOCKED' ? 'red' : 'amber'}
              />
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Dossiers par parcours" eyebrow="Répartition">
          <div className="compact-list">
            {journeys.map(item => <BarRow key={item.journey} label={journeyLabel(item.journey)} value={item.count} total={cases.length} tone="blue" />)}
          </div>
        </SectionCard>
        <SectionCard title="Charge par rôle" eyebrow="Qui porte les étapes">
          <div className="compact-list">
            {byOwner.map(([role, count]) => <BarRow key={role} label={role} value={count} total={steps.length} />)}
          </div>
        </SectionCard>
        <SectionCard title="Blocages par motif" eyebrow="Causes">
          <BlockReasons rows={blockReasons} />
        </SectionCard>
      </div>
      <p className="subtle" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldAlert size={14} /> Les indicateurs sont calculés en direct à partir de hr_cases, hr_steps et hr_events.
      </p>
    </>
  )
}
