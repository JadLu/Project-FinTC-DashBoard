// src/pages/Analysis.tsx — what the Fusion automation did, and where the risk sits.
import { AlertTriangle, Bell, Bot, ChevronRight, Sparkles, TrendingUp } from 'lucide-react'
import { KpiCard, ListCard, PageHeader, SectionCard, type ListCardRow } from '../components/ui'
import { BarRow } from '../components/lists'
import { formatTime, journeyLabel } from '../lib/format'
import type { Case, Event, RiskAnalysis, RiskLevel, Step } from '../types'

const AI_EVENTS = ['REMINDER_SENT', 'ESCALATED', 'RISK_ASSESSED']

const RISK_TONE: Record<RiskLevel, string> = { HIGH: 'red', MEDIUM: 'amber', LOW: 'green' }

export default function Analysis({ events, cases, steps, analysis, onOpen }: {
  events: Event[]
  cases: Case[]
  steps: Step[]
  /** Newest hr_risk_analysis run written by Fusion Phase 4, when one exists. */
  analysis?: RiskAnalysis
  onOpen: (caseId: string) => void
}) {
  const aiEvents = [...events]
    .filter(event => AI_EVENTS.includes(event.event_type) || event.actor.toLowerCase().includes('fusion'))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  const reminders = events.filter(event => event.event_type === 'REMINDER_SENT').length
  const escalations = events.filter(event => event.event_type === 'ESCALATED').length

  // The agent's own numbers win when Phase 4 has run; otherwise fall back to
  // deriving them client-side so the page still reads correctly on a cold DB.
  const kpis = analysis?.kpis
  const highRisk = kpis?.high ?? cases.filter(item => item.risk_level === 'HIGH').length
  const overdue = kpis?.overdue_steps ?? steps.filter(step => step.status === 'OVERDUE').length
  const lateRate = steps.length ? `${Math.round((steps.filter(step => step.status === 'OVERDUE').length / steps.length) * 100)}%` : '—'

  const riskTotal = kpis ? kpis.high + kpis.medium + kpis.low : cases.length
  const risks = (['HIGH', 'MEDIUM', 'LOW'] as const).map(level => ({
    level,
    count: kpis
      ? { HIGH: kpis.high, MEDIUM: kpis.medium, LOW: kpis.low }[level]
      : cases.filter(item => item.risk_level === level).length,
  }))
  const journeys = (['probation', 'renewal', 'offboarding'] as const).map(journey => ({
    journey, count: cases.filter(item => item.journey_type === journey).length,
  }))

  const prioritized = analysis?.prioritized || []

  const rows: ListCardRow[] = aiEvents.map(event => ({
    key: String(event.id),
    icon: event.event_type === 'ESCALATED'
      ? <AlertTriangle size={17} />
      : event.event_type === 'RISK_ASSESSED' ? <Bot size={17} /> : <Bell size={17} />,
    tone: event.event_type === 'ESCALATED' ? 'red' : event.event_type === 'RISK_ASSESSED' ? 'amber' : 'violet',
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
        <KpiCard
          label={kpis ? 'Étapes en retard' : "Taux d'étapes en retard"}
          value={kpis ? overdue : lateRate}
          icon={Sparkles}
          tone="amber"
        />
      </div>

      {analysis && (
        <div style={{ marginBottom: 16 }}>
          <SectionCard
            title="Synthèse de l'agent"
            eyebrow="Analyse IA"
            action={<span className="chip accent"><Bot size={13} /> {analysis.model || 'Fusion AI'}</span>}
          >
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>
              {analysis.summary || "L'agent n'a pas produit de synthèse pour cette exécution."}
            </p>
            <p className="eyebrow" style={{ marginTop: 14, marginBottom: 0 }}>
              Exécutée le {formatTime(analysis.generated_at)}
              {analysis.case_count != null && ` · ${analysis.case_count} dossier(s) analysé(s)`}
            </p>
          </SectionCard>
        </div>
      )}

      <div className="section-grid" style={{ marginBottom: 16 }}>
        <SectionCard title="Répartition du risque" eyebrow={kpis ? 'Évaluée par l’IA' : 'Lecture du portefeuille'}>
          <div className="compact-list">
            {risks.map(item => (
              <BarRow
                key={item.level}
                label={item.level}
                value={item.count}
                total={riskTotal}
                tone={RISK_TONE[item.level]}
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

      {prioritized.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionCard
            title="Dossiers priorisés par l'IA"
            eyebrow="Le plus urgent en premier"
            action={<span className="chip accent"><Bot size={13} /> {prioritized.length} dossier(s)</span>}
          >
            <div style={{ display: 'grid', gap: 10 }}>
              {prioritized.map(item => (
                <button
                  key={item.case_id}
                  onClick={() => onOpen(item.case_id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                    border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px',
                    background: 'var(--surface)', font: 'inherit', color: 'inherit',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <span className={`badge risk-${item.risk_level.toLowerCase()}`}>{item.risk_level}</span>
                    <strong style={{ fontSize: 13.5, color: 'var(--text)' }}>{item.case_id}</strong>
                    <ChevronRight size={15} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
                  </span>
                  {item.reasons?.length > 0 && (
                    <ul style={{ margin: '0 0 8px', paddingLeft: 17, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6 }}>
                      {item.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                    </ul>
                  )}
                  {item.recommended_action && (
                    <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.55, color: 'var(--accent)', fontWeight: 600 }}>
                      → {item.recommended_action}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      <ListCard
        rows={rows}
        caption="Journal des actions automatiques"
        emptyText="Aucune action automatique enregistrée"
        head={<span className="chip accent"><Bot size={13} /> Fusion AI</span>}
      />
    </>
  )
}
