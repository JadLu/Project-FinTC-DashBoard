// src/components/ui.tsx — shared presentational primitives for the smartRH shell.
import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronRight, CircleAlert, Search, X, type LucideIcon } from 'lucide-react'

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge status-${status.toLowerCase()}`}><span className="badge-dot" />{status}</span>
}

export function RiskBadge({ risk }: { risk: string }) {
  return <span className={`badge risk-${risk.toLowerCase()}`}>{risk}</span>
}

export function EmptyState({ text = 'Aucun élément à afficher' }: { text?: string }) {
  return <div className="empty-state"><Check size={17} />{text}</div>
}

export function SectionCard({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="section-card">
      <div className="section-head">
        <div><p className="eyebrow">{eyebrow || 'Suivi opérationnel'}</p><h2>{title}</h2></div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: string }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${tone}`}><Icon size={18} /></div>
      <div><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div></div>
    </div>
  )
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast">
      <CircleAlert size={18} /><span>{message}</span>
      <button onClick={onClose} aria-label="Fermer"><X size={15} /></button>
    </div>
  )
}

/** Eyebrow / title / subtitle block at the top of every page. */
export function PageHeader({ eyebrow = 'smartRH · Opérations', title, subtitle, action }: {
  eyebrow?: string
  title: ReactNode
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="page-head">
      <div className="page-head-row">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && <p className="subtle">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

export interface ListCardRow {
  key: string
  icon: ReactNode
  /** Optional tone for the icon tile: amber | red | green | violet. */
  tone?: string
  title: string
  subtitle?: string
  aside?: ReactNode
  onClick?: () => void
  /** Free text the card's search box matches against. */
  search?: string
}

/**
 * The standard "N élément(s) + search + rows" card used by Alertes, Dossiers,
 * Parcours, Conflits and Documents. Filtering is handled here so every list
 * page behaves the same way.
 */
export function ListCard({ rows, caption = 'Recherche et consultation', placeholder = 'Rechercher...', emptyText = 'Aucun élément à afficher', head }: {
  rows: ListCardRow[]
  caption?: string
  placeholder?: string
  emptyText?: string
  head?: ReactNode
}) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(row => `${row.title} ${row.subtitle || ''} ${row.search || ''}`.toLowerCase().includes(needle))
  }, [rows, query])

  return (
    <section className="list-card">
      <div className="list-card-head">
        <div>
          <h2>{visible.length} élément(s)</h2>
          <p>{caption}</p>
        </div>
        {head}
        <label className="mini-search">
          <Search size={15} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
        </label>
      </div>
      {visible.length ? (
        <div className="list-rows">
          {visible.map(row => {
            const inner = (
              <>
                <span className={`list-row-icon ${row.tone || ''}`}>{row.icon}</span>
                <span className="list-row-main">
                  <strong>{row.title}</strong>
                  {row.subtitle && <span>{row.subtitle}</span>}
                </span>
                <span className="list-row-aside">
                  {row.aside}
                  {row.onClick && <ChevronRight size={18} className="list-row-chevron" />}
                </span>
              </>
            )
            return row.onClick
              ? <button className="list-row" key={row.key} onClick={row.onClick}>{inner}</button>
              : <div className="list-row" key={row.key}>{inner}</div>
          })}
        </div>
      ) : (
        <div className="list-empty"><Search size={22} />{query ? `Aucun résultat pour « ${query} »` : emptyText}</div>
      )}
    </section>
  )
}
