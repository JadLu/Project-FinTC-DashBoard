// src/pages/Conflicts.tsx
import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ListCard, PageHeader, StatusBadge, type ListCardRow } from '../components/ui'
import { formatDate } from '../lib/format'
import type { Case, Conflict } from '../types'

type Filter = 'all' | 'OPEN' | 'RESOLVED'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'OPEN', label: 'Ouverts' },
  { key: 'RESOLVED', label: 'Résolus' },
]

export default function Conflicts({ conflicts, cases, onOpen }: { conflicts: Conflict[]; cases: Case[]; onOpen: (caseId: string) => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const visible = useMemo(() => (filter === 'all' ? conflicts : conflicts.filter(item => item.status === filter)), [conflicts, filter])

  const rows: ListCardRow[] = visible.map(item => {
    const caseItem = cases.find(entry => entry.case_id === item.case_id)
    return {
      key: String(item.id),
      icon: <AlertTriangle size={17} />,
      tone: item.status === 'OPEN' ? 'red' : 'green',
      title: item.description,
      subtitle: `${item.case_id}${caseItem?.subject ? ` · ${caseItem.subject.full_name}` : ''} · Ouvert le ${formatDate(item.opened_at)}`,
      search: item.status,
      aside: <StatusBadge status={item.status} />,
      onClick: () => onOpen(item.case_id),
    }
  })

  return (
    <>
      <PageHeader
        title="Conflits"
        subtitle="Incohérences détectées entre les dossiers, les contrats et la paie."
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
      <ListCard rows={rows} emptyText="Aucun conflit signalé" />
    </>
  )
}
