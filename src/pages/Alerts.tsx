// src/pages/Alerts.tsx — the échéances & événements watchlist (Alertes & Notifications).
import { useMemo, useState } from 'react'
import { AlertTriangle, Bell, ShieldAlert } from 'lucide-react'
import { ListCard, PageHeader, StatusBadge, type ListCardRow } from '../components/ui'
import { formatDate } from '../lib/format'
import type { Case, Step } from '../types'

type Filter = 'all' | 'OVERDUE' | 'PENDING' | 'BLOCKED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'OVERDUE', label: 'En retard' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'BLOCKED', label: 'Bloquées' },
]

const iconFor = (status: string) => {
  if (status === 'OVERDUE') return { icon: <AlertTriangle size={17} />, tone: 'red' }
  if (status === 'BLOCKED') return { icon: <ShieldAlert size={17} />, tone: 'red' }
  return { icon: <Bell size={17} />, tone: '' }
}

export default function Alerts({ steps, cases, onOpen }: { steps: Step[]; cases: Case[]; onOpen: (caseId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all')

  // Anything not yet validated is still worth watching.
  const watched = useMemo(() => steps.filter(step => step.status !== 'VALIDATED'), [steps])
  const visible = useMemo(() => (filter === 'all' ? watched : watched.filter(step => step.status === filter)), [watched, filter])

  const rows: ListCardRow[] = visible.map(step => {
    const { icon, tone } = iconFor(step.status)
    const caseItem = cases.find(item => item.case_id === step.case_id)
    return {
      key: String(step.id),
      icon,
      tone,
      title: step.step_name,
      subtitle: `Échéance : ${formatDate(step.due_date)}`,
      search: `${step.case_id} ${step.owner?.full_name || step.owner_role} ${caseItem?.subject?.full_name || ''}`,
      aside: <StatusBadge status={step.status} />,
      onClick: () => onOpen(step.case_id),
    }
  })

  return (
    <>
      <PageHeader
        title="Alertes & Notifications"
        subtitle="Centralisez les échéances et événements à surveiller."
        action={
          <div className="segmented">
            {FILTERS.map(item => (
              <button key={item.key} className={filter === item.key ? 'active' : undefined} onClick={() => setFilter(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      <ListCard rows={rows} emptyText="Aucune alerte pour ce filtre" />
    </>
  )
}
