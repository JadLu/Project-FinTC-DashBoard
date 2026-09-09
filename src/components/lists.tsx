// src/components/lists.tsx — compact list renderers shared by the dashboard and the detail pages.
import { AlertTriangle, FileCheck2, Gavel, ShieldAlert } from 'lucide-react'
import DecisionBadge from './DecisionBadge'
import { EmptyState, RiskBadge } from './ui'
import { formatDate, formatTime, initials, journeyLabel } from '../lib/format'
import type { Case, Conflict, Event, Step } from '../types'

export function CaseList({ items, showDate = false, onOpen }: { items: Case[]; showDate?: boolean; onOpen?: (caseId: string) => void }) {
  if (!items.length) return <EmptyState />
  return (
    <div className="compact-list">
      {items.map(item => (
        <button className="compact-row compact-button" key={item.case_id} onClick={() => onOpen?.(item.case_id)}>
          <div className="case-avatar">{initials(item.subject?.full_name || '?')}</div>
          <div className="row-main">
            <strong>{item.subject?.full_name || item.case_id}</strong>
            <span>{journeyLabel(item.journey_type)} · {item.case_id}</span>
          </div>
          {showDate ? <span className="date">{formatDate(item.contract_end_date)}</span> : <RiskBadge risk={item.risk_level} />}
        </button>
      ))}
    </div>
  )
}

export function StepList({ items }: { items: Step[] }) {
  if (!items.length) return <EmptyState />
  return (
    <div className="compact-list">
      {items.map(item => (
        <div className="compact-row" key={item.id}>
          <div className="tiny-icon"><FileCheck2 size={15} /></div>
          <div className="row-main">
            <strong>{item.step_name}</strong>
            <span>{item.case_id} · {item.owner?.full_name || item.owner_role}</span>
          </div>
          <span className="date">{formatDate(item.due_date)}</span>
        </div>
      ))}
    </div>
  )
}

export function ConflictList({ conflicts }: { conflicts: Conflict[] }) {
  if (!conflicts.length) return <EmptyState />
  return (
    <div className="compact-list">
      {conflicts.map(item => (
        <div className="compact-row" key={item.id}>
          <div className="tiny-icon coral"><AlertTriangle size={15} /></div>
          <div className="row-main">
            <strong>{item.description}</strong>
            <span>{item.case_id} · Ouvert le {formatDate(item.opened_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DecisionFeed({ events, onOpen }: { events: Event[]; onOpen: (caseId: string) => void }) {
  if (!events.length) return <EmptyState text="Aucune décision enregistrée" />
  return (
    <div className="compact-list">
      {events.map(event => (
        <button className="compact-row compact-button" key={event.id} onClick={() => onOpen(event.case_id)}>
          <div className="tiny-icon"><Gavel size={15} /></div>
          <div className="row-main">
            <strong>{event.case_id}</strong>
            <span>{event.actor} · {formatTime(event.created_at)}</span>
          </div>
          <DecisionBadge decision={event.decision} />
        </button>
      ))}
    </div>
  )
}

export function BlockReasons({ rows }: { rows: [string, number][] }) {
  if (!rows.length) return <EmptyState text="Aucun blocage" />
  return (
    <div className="compact-list">
      {rows.map(([reason, count]) => (
        <div className="compact-row" key={reason}>
          <div className="tiny-icon coral"><ShieldAlert size={15} /></div>
          <div className="row-main">
            <strong>{reason === 'Non précisé' ? 'Non précisé' : <DecisionBadge decision={reason} />}</strong>
            <span>{count} dossier{count > 1 ? 's' : ''} bloqué{count > 1 ? 's' : ''}</span>
          </div>
          <span className="count-pill">{count}</span>
        </div>
      ))}
    </div>
  )
}

/** Horizontal bar used by the KPI and AI-analysis pages. */
export function BarRow({ label, value, total, tone = '' }: { label: string; value: number; total: number; tone?: string }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="bar-row">
      <div className="bar-top"><span>{label}</span><b>{value}</b></div>
      <div className="bar-track"><div className={`bar-fill ${tone}`} style={{ width: `${percent}%` }} /></div>
    </div>
  )
}
